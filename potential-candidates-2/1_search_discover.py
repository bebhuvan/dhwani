#!/usr/bin/env python3
"""
Step 1: Search and discover works on Archive.org

This script searches Archive.org for recommended works using multiple strategies.
Saves metadata for found works.
"""

import requests
import json
import time
from pathlib import Path
from typing import List, Dict, Optional
import sys

# Import local modules
from config import *
from utils import *

logger = setup_logging(PROGRESS_LOG)

class ArchiveSearcher:
    """Search Archive.org for works."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Dhwani-Fetch/1.0 (Educational Project)'
        })

    @retry_on_failure(max_retries=MAX_RETRIES, delay=RETRY_DELAY)
    def search_archive(self, query: str, rows: int = 50) -> List[Dict]:
        """Search Archive.org using their API."""
        url = f"{ARCHIVE_API_BASE}/advancedsearch.php"

        params = {
            'q': query,
            'fl[]': ['identifier', 'title', 'creator', 'date', 'language',
                     'subject', 'description', 'downloads', 'format'],
            'rows': rows,
            'page': 1,
            'output': 'json'
            # Note: Don't use 'mediatype': 'texts' - it breaks search results
        }

        logger.info(f"Searching Archive.org: {query}")

        response = self.session.get(url, params=params, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        data = response.json()
        docs = data.get('response', {}).get('docs', [])

        logger.info(f"Found {len(docs)} results")
        return docs

    def get_metadata(self, identifier: str) -> Optional[Dict]:
        """Get detailed metadata for an item."""
        url = f"{ARCHIVE_API_BASE}/metadata/{identifier}"

        try:
            response = self.session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get metadata for {identifier}: {e}")
            return None

    def search_work(self, work: Dict, strategies: List[str]) -> List[Dict]:
        """Search for a specific work using multiple strategies."""
        all_results = []

        for strategy in strategies:
            logger.info(f"Trying strategy: {strategy} for '{work['title']}'")

            query = build_search_query(work, strategy)
            if not query:
                logger.warning(f"Could not build query for strategy {strategy}")
                continue

            # Add mediatype filter to query string (NOT as URL parameter)
            query += ' AND mediatype:texts'

            try:
                results = self.search_archive(query, rows=20)
                all_results.extend(results)

                # Rate limiting
                time.sleep(RATE_LIMIT_DELAY)

            except Exception as e:
                logger.error(f"Search failed for {strategy}: {e}")
                continue

        # Remove duplicates based on identifier
        unique_results = {}
        for result in all_results:
            identifier = result.get('identifier')
            if identifier and identifier not in unique_results:
                unique_results[identifier] = result

        return list(unique_results.values())

    def rank_results(self, results: List[Dict], work: Dict) -> List[Dict]:
        """Rank search results by relevance."""
        target_title = normalize_title(work.get('title', ''))
        target_author = work.get('author', '').lower()

        scored_results = []

        for result in results:
            score = 0

            # Title match
            result_title = normalize_title(result.get('title', ''))
            if fuzzy_match_title(target_title, result_title, threshold=FUZZY_MATCH_THRESHOLD):
                score += 50
            elif target_title in result_title or result_title in target_title:
                score += 30

            # Author match
            result_creator = str(result.get('creator', '')).lower()
            if target_author and target_author != 'unknown' and target_author != 'various':
                if target_author in result_creator:
                    score += 30

            # Language match
            target_lang = work.get('language', '').lower()
            result_lang = str(result.get('language', '')).lower()
            if target_lang and target_lang in result_lang:
                score += 20

            # Prefer items with more downloads (popularity indicator)
            downloads = result.get('downloads', 0)
            if downloads:
                score += min(int(downloads) // 100, 10)

            # Prefer items with better formats
            formats = result.get('format', [])
            if isinstance(formats, list):
                if 'DjVu' in formats:
                    score += 5
                if 'Text PDF' in formats:
                    score += 5

            scored_results.append((score, result))

        # Sort by score descending
        scored_results.sort(key=lambda x: x[0], reverse=True)

        return [result for score, result in scored_results]

def discover_works(priority_works: List[Dict]) -> Dict[str, List[Dict]]:
    """Discover works on Archive.org."""
    searcher = ArchiveSearcher()
    discovered = {}

    state = load_state(STATE_FILE)
    attempted_ids = set(state.get('attempted', []))

    strategies = ['direct_title', 'fuzzy_title', 'author_language']

    for i, work in enumerate(priority_works, 1):
        work_id = generate_identifier(work)

        logger.info(f"\n{'='*60}")
        logger.info(f"[{i}/{len(priority_works)}] Searching: {work['title']}")
        logger.info(f"Author: {work.get('author')}, Language: {work.get('language')}")

        # Skip if already attempted
        if work_id in attempted_ids:
            logger.info(f"Already attempted, skipping...")
            continue

        try:
            # Search using multiple strategies
            results = searcher.search_work(work, strategies)

            if results:
                # Rank results
                ranked_results = searcher.rank_results(results, work)

                logger.info(f"Found {len(ranked_results)} potential matches")

                # Save top results
                discovered[work_id] = {
                    'original_work': work,
                    'results': ranked_results[:10],  # Top 10 results
                    'search_date': datetime.now().isoformat()
                }

                # Save metadata for top result
                if ranked_results:
                    top_result = ranked_results[0]
                    identifier = top_result.get('identifier')

                    if identifier:
                        detailed_metadata = searcher.get_metadata(identifier)

                        if detailed_metadata:
                            metadata_file = METADATA_DIR / f"{work_id}_{identifier}.json"
                            save_metadata(metadata_file, {
                                'work': work,
                                'search_result': top_result,
                                'detailed_metadata': detailed_metadata
                            })
                            logger.info(f"Saved metadata: {metadata_file.name}")

                        time.sleep(RATE_LIMIT_DELAY)

                update_statistics(STATS_FILE, 'works_found', 1)
            else:
                logger.warning(f"No results found for: {work['title']}")

            # Update state
            attempted_ids.add(work_id)
            state['attempted'] = list(attempted_ids)
            save_state(STATE_FILE, state)

            update_statistics(STATS_FILE, 'searches_attempted', 1)

        except Exception as e:
            logger.error(f"Error searching for {work['title']}: {e}")
            continue

    return discovered

def main():
    """Main discovery process."""
    logger.info("="*80)
    logger.info("ARCHIVE.ORG DISCOVERY PROCESS STARTED")
    logger.info("="*80)

    # Ensure directories exist
    for directory in [METADATA_DIR, LOGS_DIR]:
        ensure_directory(directory)

    # Combine priority lists
    all_priority_works = PRIORITY_1_WORKS + PRIORITY_2_WORKS

    logger.info(f"\nTotal works to search: {len(all_priority_works)}")
    logger.info(f"Priority 1: {len(PRIORITY_1_WORKS)} works")
    logger.info(f"Priority 2: {len(PRIORITY_2_WORKS)} works")

    # Update statistics
    update_statistics(STATS_FILE, 'total_recommended', len(all_priority_works))

    # Discover works
    discovered = discover_works(all_priority_works)

    # Save discovery summary
    summary_file = METADATA_DIR / "discovery_summary.json"
    summary = {
        'total_searched': len(all_priority_works),
        'total_found': len(discovered),
        'discovery_date': datetime.now().isoformat(),
        'works_by_category': {}
    }

    # Categorize discoveries
    for work_id, data in discovered.items():
        category = data['original_work'].get('category', 'unknown')
        if category not in summary['works_by_category']:
            summary['works_by_category'][category] = 0
        summary['works_by_category'][category] += 1

    save_metadata(summary_file, summary)

    logger.info("\n" + "="*80)
    logger.info("DISCOVERY COMPLETE")
    logger.info("="*80)
    logger.info(f"Works searched: {len(all_priority_works)}")
    logger.info(f"Works found: {len(discovered)}")
    logger.info(f"Success rate: {len(discovered)/len(all_priority_works)*100:.1f}%")
    logger.info(f"\nResults saved to: {METADATA_DIR}")

    # Print category breakdown
    logger.info("\nBy category:")
    for category, count in summary['works_by_category'].items():
        logger.info(f"  {category}: {count} works")

if __name__ == '__main__':
    main()
