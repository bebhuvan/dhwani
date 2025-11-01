#!/usr/bin/env python3
"""
Batch B Multi-API Reference Hunter
Processes works 21-40 and fetches comprehensive references from multiple APIs
"""

import os
import json
import time
import requests
from ruamel.yaml import YAML
from typing import Dict, List, Any, Optional
from pathlib import Path
import re
import io

# Configuration
BATCH_B_FILES = [
    "atharvaveda-saunaka-visha-bandhu-2.md",
    "bhartiya-jyotish-vigyan-ravindra-kumar-dubey.md",
    "bhartiya-shasan-and-rajniti-jain-pukhraj.md",
    "buddhist-art-in-india-grünwedel.md",
    "contributions-of-sanskrit-inscriptions-to-lexicography-tewari.md",
    "contributions-of-sanskrit-inscriptions-to-lexicography-tewari-s-p-1944.md",
    "critical-word-index-of-the-bhagavadgita-divanji.md",
    "critical-word-index-of-the-bhagavadgita-divanji-prahlad-c.md",
    "epic-mythology-hopkins.md",
    "gandhi-azad-and-nationalism-shakir.md",
    "history-of-aurangzib-based-on-original-sources-jadunath-sarkar.md",
    "indian-home-rule-reprinted-with-a-new-foreword-by-the-author-gandhi.md",
    "kabir-granthavali-gupta-mataprasad.md",
    "kabir-granthavali-gupta.md",
    "kabir-granthawali-kabir.md",
    "kāñcippurāṇam-civañāṇa-muṉivar-active-18th-century.md",
    "kāñcippurāṇam-civañāna-munivar.md",
    "kashidasi-mahabharat-কশদস-মহভরত-kashiram-das.md",
    "kautilya-arthasastra-vidhyalankara.md",
    "kautilya-arthasastra-vidhyalankara-pranath.md"
]

BASE_DIR = Path("/home/bhuvanesh/dhwani-new-works")
REPORTS_DIR = Path("/home/bhuvanesh/new-dhwani/verification-reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# API Rate limiting
API_DELAY = 1.0  # 1 second between API calls

class MultiAPIFetcher:
    """Fetches references from multiple APIs with rate limiting"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Dhwani Reference Hunter/1.0 (Educational/Research)'
        })
        self.author_bios = {}

    def rate_limit(self):
        """Enforce rate limiting between API calls"""
        time.sleep(API_DELAY)

    def search_wikipedia(self, query: str, lang: str = 'en') -> Optional[Dict]:
        """Search Wikipedia and get page summary"""
        try:
            self.rate_limit()
            url = f"https://{lang}.wikipedia.org/w/api.php"
            params = {
                'action': 'query',
                'list': 'search',
                'srsearch': query,
                'format': 'json',
                'srlimit': 1
            }
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get('query', {}).get('search'):
                page_title = data['query']['search'][0]['title']

                # Get page extract
                self.rate_limit()
                params2 = {
                    'action': 'query',
                    'titles': page_title,
                    'prop': 'extracts|pageprops',
                    'exintro': True,
                    'explaintext': True,
                    'format': 'json'
                }
                response2 = self.session.get(url, params=params2, timeout=10)
                response2.raise_for_status()
                data2 = response2.json()

                pages = data2.get('query', {}).get('pages', {})
                if pages:
                    page_id = list(pages.keys())[0]
                    page_data = pages[page_id]

                    return {
                        'title': page_title,
                        'url': f"https://{lang}.wikipedia.org/wiki/{page_title.replace(' ', '_')}",
                        'extract': page_data.get('extract', ''),
                        'wikidata_id': page_data.get('pageprops', {}).get('wikibase_item')
                    }
            return None
        except Exception as e:
            print(f"Wikipedia search error for '{query}': {e}", flush=True)
            return None

    def search_wikidata(self, query: str) -> Optional[Dict]:
        """Search Wikidata for entity"""
        try:
            self.rate_limit()
            url = "https://www.wikidata.org/w/api.php"
            params = {
                'action': 'wbsearchentities',
                'search': query,
                'language': 'en',
                'format': 'json',
                'limit': 1
            }
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get('search'):
                entity = data['search'][0]
                q_id = entity.get('id')

                # Get entity details
                self.rate_limit()
                params2 = {
                    'action': 'wbgetentities',
                    'ids': q_id,
                    'format': 'json',
                    'props': 'labels|descriptions|claims'
                }
                response2 = self.session.get(url, params=params2, timeout=10)
                response2.raise_for_status()
                data2 = response2.json()

                entity_data = data2.get('entities', {}).get(q_id, {})

                # Extract birth/death dates if available
                claims = entity_data.get('claims', {})
                birth_date = None
                death_date = None

                if 'P569' in claims:  # date of birth
                    birth_date = self._extract_date(claims['P569'])
                if 'P570' in claims:  # date of death
                    death_date = self._extract_date(claims['P570'])

                return {
                    'q_id': q_id,
                    'url': f"https://www.wikidata.org/wiki/{q_id}",
                    'label': entity_data.get('labels', {}).get('en', {}).get('value', ''),
                    'description': entity_data.get('descriptions', {}).get('en', {}).get('value', ''),
                    'birth': birth_date,
                    'death': death_date
                }
            return None
        except Exception as e:
            print(f"Wikidata search error for '{query}': {e}", flush=True)
            return None

    def _extract_date(self, claim_list: List) -> Optional[str]:
        """Extract year from Wikidata date claim"""
        try:
            if claim_list and len(claim_list) > 0:
                time_value = claim_list[0].get('mainsnak', {}).get('datavalue', {}).get('value', {}).get('time', '')
                # Extract year from format like '+1869-10-02T00:00:00Z'
                match = re.search(r'[+-](\d{4})', time_value)
                if match:
                    return match.group(1)
        except:
            pass
        return None

    def search_openlibrary(self, query: str, search_type: str = 'q') -> Optional[Dict]:
        """Search OpenLibrary for work or author"""
        try:
            self.rate_limit()
            url = "https://openlibrary.org/search.json"
            params = {
                search_type: query,
                'limit': 1
            }
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get('docs'):
                doc = data['docs'][0]
                result = {
                    'title': doc.get('title', ''),
                    'key': doc.get('key', ''),
                }

                if 'author_key' in doc and doc['author_key']:
                    result['author_key'] = doc['author_key'][0]
                    result['author_url'] = f"https://openlibrary.org/authors/{doc['author_key'][0]}"

                if result['key']:
                    result['work_url'] = f"https://openlibrary.org{result['key']}"

                return result
            return None
        except Exception as e:
            print(f"OpenLibrary search error for '{query}': {e}", flush=True)
            return None

    def search_wikisource(self, query: str, lang: str = 'en') -> Optional[Dict]:
        """Check if work is available on Wikisource"""
        try:
            self.rate_limit()
            url = f"https://{lang}.wikisource.org/w/api.php"
            params = {
                'action': 'query',
                'list': 'search',
                'srsearch': query,
                'format': 'json',
                'srlimit': 1
            }
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get('query', {}).get('search'):
                page_title = data['query']['search'][0]['title']
                return {
                    'title': page_title,
                    'url': f"https://{lang}.wikisource.org/wiki/{page_title.replace(' ', '_')}"
                }
            return None
        except Exception as e:
            print(f"Wikisource search error for '{query}': {e}", flush=True)
            return None

    def fetch_comprehensive_references(self, title: str, authors: List[str]) -> List[Dict]:
        """Fetch references from all APIs for a work"""
        references = []

        print(f"\n{'='*60}", flush=True)
        print(f"Fetching references for: {title}", flush=True)
        print(f"Authors: {', '.join(authors)}", flush=True)
        print(f"{'='*60}", flush=True)

        # 1. Wikipedia: Work
        print("  [1/7] Searching Wikipedia for work...", flush=True)
        wiki_work = self.search_wikipedia(title)
        if wiki_work:
            references.append({
                'name': f"Wikipedia: {title[:40]}...",
                'url': wiki_work['url'],
                'type': 'wikipedia'
            })
            print(f"    ✓ Found: {wiki_work['url']}", flush=True)
        else:
            print(f"    ✗ Not found", flush=True)

        # 2. Wikipedia: Author(s)
        author_wiki_data = {}
        for i, author in enumerate(authors[:2], 1):  # Limit to first 2 authors
            print(f"  [{1+i}/7] Searching Wikipedia for author: {author}...", flush=True)
            wiki_author = self.search_wikipedia(author)
            if wiki_author:
                references.append({
                    'name': f"Wikipedia: {author}",
                    'url': wiki_author['url'],
                    'type': 'wikipedia'
                })
                author_wiki_data[author] = wiki_author
                print(f"    ✓ Found: {wiki_author['url']}", flush=True)
            else:
                print(f"    ✗ Not found", flush=True)

        # 3. Wikidata: Work
        print(f"  [3/7] Searching Wikidata for work...", flush=True)
        wikidata_work = self.search_wikidata(title)
        if wikidata_work:
            references.append({
                'name': f"Wikidata: {title[:40]}...",
                'url': wikidata_work['url'],
                'type': 'wikidata'
            })
            print(f"    ✓ Found: {wikidata_work['url']}", flush=True)
        else:
            print(f"    ✗ Not found", flush=True)

        # 4. Wikidata: Author(s)
        author_wikidata = {}
        for author in authors[:2]:
            print(f"  [4/7] Searching Wikidata for author: {author}...", flush=True)
            wikidata_author = self.search_wikidata(author)
            if wikidata_author:
                references.append({
                    'name': f"Wikidata: {author}",
                    'url': wikidata_author['url'],
                    'type': 'wikidata'
                })
                author_wikidata[author] = wikidata_author
                print(f"    ✓ Found: {wikidata_author['url']}", flush=True)

                # Save author bio data
                self.save_author_bio(author, wikidata_author, author_wiki_data.get(author))
            else:
                print(f"    ✗ Not found", flush=True)

        # 5. OpenLibrary: Work
        print(f"  [5/7] Searching OpenLibrary for work...", flush=True)
        ol_work = self.search_openlibrary(title)
        if ol_work and ol_work.get('work_url'):
            references.append({
                'name': f"OpenLibrary: {title[:40]}...",
                'url': ol_work['work_url'],
                'type': 'openlibrary'
            })
            print(f"    ✓ Found: {ol_work['work_url']}", flush=True)
        else:
            print(f"    ✗ Not found", flush=True)

        # 6. OpenLibrary: Author
        for author in authors[:1]:  # Just first author
            print(f"  [6/7] Searching OpenLibrary for author: {author}...", flush=True)
            ol_author = self.search_openlibrary(author, 'author')
            if ol_author and ol_author.get('author_url'):
                references.append({
                    'name': f"OpenLibrary: {author}",
                    'url': ol_author['author_url'],
                    'type': 'openlibrary'
                })
                print(f"    ✓ Found: {ol_author['author_url']}", flush=True)
            else:
                print(f"    ✗ Not found", flush=True)

        # 7. Wikisource: Work
        print(f"  [7/7] Searching Wikisource for work...", flush=True)
        ws_work = self.search_wikisource(title)
        if ws_work:
            references.append({
                'name': f"Wikisource: {title[:40]}...",
                'url': ws_work['url'],
                'type': 'wikisource'
            })
            print(f"    ✓ Found: {ws_work['url']}", flush=True)
        else:
            print(f"    ✗ Not found", flush=True)

        print(f"\n  Total references found: {len(references)}", flush=True)

        return references

    def save_author_bio(self, author: str, wikidata: Optional[Dict], wikipedia: Optional[Dict]):
        """Save author biographical data"""
        if author not in self.author_bios:
            bio_data = {
                'author': author,
                'born': wikidata.get('birth') if wikidata else None,
                'died': wikidata.get('death') if wikidata else None,
                'wikidata_id': wikidata.get('q_id') if wikidata else None,
                'wikidata_description': wikidata.get('description') if wikidata else None,
                'wikipedia_url': wikipedia.get('url') if wikipedia else None,
                'wikipedia_summary': wikipedia.get('extract', '')[:500] if wikipedia else None,
                'biographical_context': ''
            }

            # Build biographical context
            if wikidata:
                bio_data['biographical_context'] = wikidata.get('description', '')

            self.author_bios[author] = bio_data
            print(f"  📝 Saved author bio: {author}", flush=True)

def parse_frontmatter(content: str) -> tuple:
    """Parse YAML frontmatter from markdown content"""
    yaml_parser = YAML()
    yaml_parser.preserve_quotes = True
    yaml_parser.default_flow_style = False

    if content.startswith('---'):
        # Find the second --- delimiter (must be on its own line or start of line)
        lines = content.split('\n')
        end_idx = -1
        for i in range(1, len(lines)):
            stripped = lines[i].strip()
            # Check if line is exactly --- or starts with ---
            if stripped == '---' or stripped.startswith('---#'):
                end_idx = i
                # If it's ---#something, split it
                if stripped.startswith('---#'):
                    lines[i] = '---'
                    # Insert the rest as a new line
                    lines.insert(i+1, stripped[3:])
                break

        if end_idx > 0:
            yaml_lines = lines[1:end_idx]
            body_lines = lines[end_idx+1:]

            yaml_content = '\n'.join(yaml_lines)
            body = '\n'.join(body_lines)

            try:
                frontmatter = yaml_parser.load(yaml_content)
                return frontmatter, body
            except Exception as e:
                print(f"  ⚠️  YAML parsing error: {e}", flush=True)
                print(f"  Attempting manual fix...", flush=True)

                # Try to fix common issues with nested quotes
                fixed_lines = []
                for line in yaml_lines:
                    # Fix description field with nested quotes
                    if line.startswith('description:'):
                        # Extract the value part
                        desc_value = line[12:].strip()
                        if desc_value.startswith('"') and desc_value.endswith('"'):
                            # Replace inner quotes with single quotes
                            inner = desc_value[1:-1]
                            inner = inner.replace('"', "'")
                            fixed_lines.append(f'description: "{inner}"')
                        else:
                            fixed_lines.append(line)
                    else:
                        fixed_lines.append(line)

                yaml_content = '\n'.join(fixed_lines)
                frontmatter = yaml_parser.load(yaml_content)
                return frontmatter, body

    return {}, content

def rebuild_markdown(frontmatter: Dict, body: str) -> str:
    """Rebuild markdown file with updated frontmatter"""
    yaml_parser = YAML()
    yaml_parser.preserve_quotes = True
    yaml_parser.default_flow_style = False
    yaml_parser.width = 4096  # Prevent line wrapping

    # Serialize frontmatter to string
    stream = io.StringIO()
    yaml_parser.dump(frontmatter, stream)
    yaml_content = stream.getvalue()

    return f"---\n{yaml_content}---{body}"

def process_batch_b():
    """Main processing function for Batch B"""
    import sys
    fetcher = MultiAPIFetcher()
    results = []

    print(f"\n{'#'*60}", flush=True)
    print(f"# BATCH B MULTI-API REFERENCE HUNTER", flush=True)
    print(f"# Processing 20 works (Works 21-40)", flush=True)
    print(f"{'#'*60}\n", flush=True)

    for i, filename in enumerate(BATCH_B_FILES, 1):
        filepath = BASE_DIR / filename

        print(f"\n[{i}/20] Processing: {filename}", flush=True)

        if not filepath.exists():
            print(f"  ⚠️  File not found: {filepath}", flush=True)
            continue

        # Read file
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Parse frontmatter
        frontmatter, body = parse_frontmatter(content)

        title = frontmatter.get('title', '')
        authors = frontmatter.get('author', [])
        if isinstance(authors, str):
            authors = [authors]

        # Fetch references
        references = fetcher.fetch_comprehensive_references(title, authors)

        # Check minimum requirement
        if len(references) < 3:
            print(f"  ⚠️  WARNING: Only {len(references)} references found (minimum 3 required)", flush=True)

        # Update frontmatter
        frontmatter['references'] = references

        # Rebuild and save
        new_content = rebuild_markdown(frontmatter, body)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"  ✅ Updated: {filename} ({len(references)} references)", flush=True)

        # Save result
        results.append({
            'file': filename,
            'title': title,
            'authors': authors,
            'references_added': len(references),
            'references': references,
            'author_bio_saved': any(author in fetcher.author_bios for author in authors)
        })

    # Generate reports
    generate_reports(fetcher, results)

    print(f"\n{'#'*60}", flush=True)
    print(f"# BATCH B PROCESSING COMPLETE", flush=True)
    print(f"{'#'*60}\n", flush=True)

def generate_reports(fetcher: MultiAPIFetcher, results: List[Dict]):
    """Generate JSON reports"""

    # Author bios report
    author_bios_report = {
        'batch': 'B',
        'total_authors': len(fetcher.author_bios),
        'authors': fetcher.author_bios
    }

    bios_path = REPORTS_DIR / 'author-bios-batch-b.json'
    with open(bios_path, 'w', encoding='utf-8') as f:
        json.dump(author_bios_report, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Author bios saved: {bios_path}", flush=True)

    # References report
    total_refs = sum(r['references_added'] for r in results)
    avg_refs = total_refs / len(results) if results else 0
    works_with_3plus = sum(1 for r in results if r['references_added'] >= 3)

    references_report = {
        'batch': 'B',
        'works_processed': len(results),
        'total_references_added': total_refs,
        'avg_references_per_work': round(avg_refs, 2),
        'works_with_3plus_refs': works_with_3plus,
        'detailed_results': results
    }

    refs_path = REPORTS_DIR / 'references-batch-b.json'
    with open(refs_path, 'w', encoding='utf-8') as f:
        json.dump(references_report, f, indent=2, ensure_ascii=False)
    print(f"✅ References report saved: {refs_path}", flush=True)

    # Print summary
    print(f"\n{'='*60}", flush=True)
    print(f"SUMMARY:", flush=True)
    print(f"  Works processed: {len(results)}", flush=True)
    print(f"  Total references: {total_refs}", flush=True)
    print(f"  Average per work: {avg_refs:.2f}", flush=True)
    print(f"  Works with 3+ refs: {works_with_3plus}/{len(results)}", flush=True)
    print(f"  Unique authors: {len(fetcher.author_bios)}", flush=True)
    print(f"{'='*60}\n", flush=True)

if __name__ == '__main__':
    process_batch_b()
