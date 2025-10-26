#!/usr/bin/env python3
"""
Archive.org Metadata Validator & Fixer
Validates and corrects frontmatter metadata against Archive.org API
"""

import json
import re
import time
import urllib.request
import urllib.error
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# File list for Batch A
BATCH_A_FILES = [
    "1-bhikshu-pratimoksha-2-bhikshuna-pratimoksha-3-mahabagga-4-chullabagga-sanskrityan.md",
    "1-bhikshu-pratimoksha-2-bhikshuna-pratimoksha-3-mahabagga-4-chullabagga-sanskrityan-rahul.md",
    "a-comparative-grammar-of-the-sanskrit-zend-greek-latin-lithuanian-gothic-german-and-slavonic-languages-bopp.md",
    "a-compendium-of-the-comparative-grammar-of-the-indo-european-sanskrit-greek-and-latin-languages-schleicher.md",
    "a-concordance-to-the-greek-testament-according-to-the-texts-of-westcott-and-hort-tischendorf-and-the-english-revisers-moulton.md",
    "a-higher-sanskrit-grammar-for-the-use-of-schools-and-colleges-kale.md",
    "a-higher-sanskrit-grammar-for-the-use-of-schools-and-colleges-kale-m-r.md",
    "a-history-of-architecture-in-all-countries-from-the-earliest-times-to-the-present-day-fergusson.md",
    "american-architect-and-architecture-unknown.md",
    "an-alphabetical-list-of-jaina-mss-belonging-to-government-in-the-oriental-library-of-the-asiatic-society-of-bengal-asiatic-society-calcutta.md",
    "an-avesta-grammar-in-comparison-with-sanskrit-jackson.md",
    "a-new-hindustani-english-dictionary-fallon-s.md",
    "annual-address-delivered-to-the-asiatic-society-of-bengal-caluctta-2nd-february-1898-hoernle.md",
    "art-manufactures-of-india-mukharji.md",
    "a-sanskrit-grammar-including-both-the-classical-language-and-the-older-dialects-of-veda-and-brahmana-william-dwight-whitney.md",
    "a-sanskrit-manual-for-high-schools-antoine.md",
    "a-sanskrit-manual-for-high-schools-antoine-robert-1914.md",
    "ashtanga-sangraha-athridev-gupta-1.md",
    "ashtanga-sangraha-athridev-gupta-2.md",
    "atharvaveda-saunaka-visha-bandhu-1.md"
]

BASE_DIR = Path("/home/bhuvanesh/dhwani-new-works")
REPORT_DIR = Path("/home/bhuvanesh/new-dhwani/verification-reports")


def extract_frontmatter(content: str) -> Tuple[Optional[Dict], str]:
    """Extract YAML frontmatter from markdown content."""
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)

    if not match:
        return None, content

    frontmatter_str = match.group(1)
    body = match.group(2)

    # Parse YAML frontmatter
    try:
        frontmatter = yaml.safe_load(frontmatter_str)
        return frontmatter, body
    except Exception as e:
        print(f"  YAML parse error: {e}")
        return None, content


def extract_archive_id(url: str) -> Optional[str]:
    """Extract Archive.org ID from URL."""
    pattern = r'archive\.org/details/([^/\s]+)'
    match = re.search(pattern, url)
    return match.group(1) if match else None


def fetch_archive_metadata(archive_id: str) -> Optional[Dict]:
    """Fetch metadata from Archive.org API."""
    url = f"https://archive.org/metadata/{archive_id}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = response.read()
            return json.loads(data)
    except Exception as e:
        print(f"  Error fetching metadata for {archive_id}: {e}")
        return None


def normalize_author(author: Any) -> List[str]:
    """Normalize author field to list of strings."""
    if isinstance(author, str):
        return [author]
    elif isinstance(author, list):
        return author
    return []


def compare_metadata(frontmatter: Dict, archive_meta: Dict) -> Tuple[List[str], Dict]:
    """Compare frontmatter with Archive.org metadata and return corrections."""
    corrections = []
    updates = {}

    metadata = archive_meta.get('metadata', {})

    # Compare title
    fm_title = frontmatter.get('title', '').strip('"\'')
    ar_title = metadata.get('title', '').strip()
    if fm_title != ar_title and ar_title:
        corrections.append(f"title: '{fm_title}' -> '{ar_title}'")
        updates['title'] = ar_title

    # Compare author/creator
    fm_authors = normalize_author(frontmatter.get('author', []))
    ar_creators = metadata.get('creator', [])
    if isinstance(ar_creators, str):
        ar_creators = [ar_creators]

    # Normalize author strings
    fm_authors_norm = [a.strip().strip('"\'') for a in fm_authors]
    ar_creators_norm = [c.strip() for c in ar_creators]

    if fm_authors_norm != ar_creators_norm and ar_creators_norm:
        corrections.append(f"author: {fm_authors_norm} -> {ar_creators_norm}")
        updates['author'] = ar_creators_norm

    # Compare year (within ±2 years tolerance)
    fm_year = frontmatter.get('year')
    ar_date = metadata.get('date', '')

    # Extract year from date
    ar_year = None
    if ar_date:
        year_match = re.search(r'\b(\d{4})\b', str(ar_date))
        if year_match:
            ar_year = int(year_match.group(1))

    if fm_year and ar_year:
        fm_year_int = int(fm_year)
        if abs(fm_year_int - ar_year) > 2:
            corrections.append(f"year: {fm_year} -> {ar_year}")
            updates['year'] = ar_year

    # Compare language
    fm_lang = frontmatter.get('language', [])
    if isinstance(fm_lang, str):
        fm_lang = [fm_lang]
    fm_lang_norm = [l.strip().strip('"\'').lower() for l in fm_lang]

    ar_lang = metadata.get('language', [])
    if isinstance(ar_lang, str):
        ar_lang = [ar_lang]
    ar_lang_norm = [l.strip().lower() for l in ar_lang]

    # Language code mapping
    lang_map = {
        'eng': 'English',
        'hin': 'Hindi',
        'san': 'Sanskrit',
        'grc': 'Greek',
        'lat': 'Latin'
    }

    # Normalize archive.org language codes
    ar_lang_normalized = []
    for lang in ar_lang_norm:
        if lang in lang_map:
            ar_lang_normalized.append(lang_map[lang])
        else:
            ar_lang_normalized.append(lang.capitalize())

    # Compare (case-insensitive)
    if sorted(fm_lang_norm) != sorted(ar_lang_norm) and ar_lang_normalized:
        corrections.append(f"language: {fm_lang} -> {ar_lang_normalized}")
        updates['language'] = ar_lang_normalized

    # Check subject/genre
    fm_genre = frontmatter.get('genre', [])
    if isinstance(fm_genre, str):
        fm_genre = [fm_genre]

    ar_subject = metadata.get('subject', [])
    if isinstance(ar_subject, str):
        ar_subject = [ar_subject]

    # Note: We don't auto-update genre/subject as it might be editorially curated
    # Just flag if very different

    return corrections, updates


def reconstruct_frontmatter(frontmatter: Dict, updates: Dict) -> str:
    """Reconstruct YAML frontmatter with updates."""
    # Apply updates
    for key, value in updates.items():
        frontmatter[key] = value

    # Use YAML to dump frontmatter
    yaml_content = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True, sort_keys=False)
    return f"---\n{yaml_content}---"


def process_file(file_path: Path) -> Dict:
    """Process a single file and return validation result."""
    result = {
        'file': file_path.name,
        'status': 'error',
        'corrections': [],
        'archive_id': None,
        'archive_metadata': None,
        'issues': []
    }

    print(f"\nProcessing: {file_path.name}")

    # Read file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        result['issues'].append(f"Failed to read file: {e}")
        return result

    # Extract frontmatter
    frontmatter, body = extract_frontmatter(content)
    if not frontmatter:
        result['issues'].append("No frontmatter found")
        return result

    # Extract Archive.org URL
    sources = frontmatter.get('sources', [])
    archive_url = None
    for source in sources:
        if isinstance(source, dict):
            url = source.get('url', '')
            if 'archive.org' in url:
                archive_url = url
                break

    if not archive_url:
        result['issues'].append("No Archive.org URL found in sources")
        return result

    # Extract Archive.org ID
    archive_id = extract_archive_id(archive_url)
    if not archive_id:
        result['issues'].append(f"Could not extract Archive.org ID from: {archive_url}")
        return result

    result['archive_id'] = archive_id
    print(f"  Archive.org ID: {archive_id}")

    # Fetch Archive.org metadata
    archive_meta = fetch_archive_metadata(archive_id)
    if not archive_meta:
        result['issues'].append(f"Failed to fetch Archive.org metadata")
        result['status'] = 'needs_review'
        return result

    result['archive_metadata'] = archive_meta.get('metadata', {})

    # Compare metadata
    corrections, updates = compare_metadata(frontmatter, archive_meta)
    result['corrections'] = corrections

    if corrections:
        print(f"  Found {len(corrections)} discrepancies:")
        for correction in corrections:
            print(f"    - {correction}")

        # Update file
        try:
            new_frontmatter = reconstruct_frontmatter(frontmatter, updates)
            new_content = new_frontmatter + '\n' + body

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            print(f"  ✓ File updated with corrections")
            result['status'] = 'validated'
        except Exception as e:
            result['issues'].append(f"Failed to update file: {e}")
            result['status'] = 'needs_review'
    else:
        print(f"  ✓ No corrections needed")
        result['status'] = 'validated'

    return result


def main():
    """Main processing function."""
    print("=" * 80)
    print("Archive.org Metadata Validator & Fixer - Batch A")
    print("=" * 80)

    results = []
    successful = 0
    needs_review = 0

    for filename in BATCH_A_FILES:
        file_path = BASE_DIR / filename

        if not file_path.exists():
            print(f"\n⚠ File not found: {filename}")
            results.append({
                'file': filename,
                'status': 'error',
                'issues': ['File not found'],
                'corrections': [],
                'archive_id': None,
                'archive_metadata': None
            })
            needs_review += 1
            continue

        result = process_file(file_path)
        results.append(result)

        if result['status'] == 'validated':
            successful += 1
        else:
            needs_review += 1

        # Rate limiting - wait 1 second between API calls
        time.sleep(1)

    # Generate report
    report = {
        'batch': 'A',
        'works_processed': len(BATCH_A_FILES),
        'successful': successful,
        'needs_review': needs_review,
        'corrections_made': [
            {'file': r['file'], 'corrections': r['corrections']}
            for r in results if r['corrections']
        ],
        'detailed_results': results
    }

    # Save report
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / 'validation-batch-a.json'

    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total works processed: {len(BATCH_A_FILES)}")
    print(f"Successfully validated: {successful}")
    print(f"Needs review: {needs_review}")
    print(f"\nReport saved to: {report_path}")
    print("=" * 80)


if __name__ == '__main__':
    main()
