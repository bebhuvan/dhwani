#!/usr/bin/env python3
"""
Find specific reference improvements using targeted searches and direct URL verification.
"""

import yaml
from pathlib import Path
import requests
import time
from urllib.parse import quote

def verify_url(url: str, timeout: int = 10) -> bool:
    """Verify if a URL is accessible."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        response = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        return response.status_code == 200
    except Exception:
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            return response.status_code == 200
        except Exception:
            return False

def find_wikipedia_by_direct_url(search_terms: list[str]) -> tuple[bool, str]:
    """Try direct Wikipedia URLs based on common patterns."""
    for term in search_terms:
        # Convert to Wikipedia URL format (spaces to underscores, proper capitalization)
        wiki_term = term.replace(' ', '_')
        url = f"https://en.wikipedia.org/wiki/{quote(wiki_term)}"

        print(f"    Trying: {url}")
        if verify_url(url):
            return True, url
        time.sleep(0.3)

    return False, ""

# Notable authors and subjects that should have Wikipedia articles
NOTABLE_ITEMS = {
    # Format: file_substring -> (type, [wikipedia_search_terms], description)

    'akbar-the-great-mogul': {
        'type': 'subject',
        'search_terms': ['Akbar'],
        'description': 'Mughal Emperor Akbar'
    },

    'dayananda-saraswati': {
        'type': 'author',
        'search_terms': ['Dayananda_Saraswati', 'Swami_Dayananda_Saraswati'],
        'description': 'Swami Dayananda Saraswati'
    },

    'satyarth-prakash': {
        'type': 'work',
        'search_terms': ['Satyarth_Prakash'],
        'description': 'Satyarth Prakash'
    },

    'vedic-mythology-macdonell': {
        'type': 'author',
        'search_terms': ['Arthur_Anthony_Macdonell'],
        'description': 'Arthur Anthony Macdonell'
    },

    'monier-williams': {
        'type': 'author',
        'search_terms': ['Monier_Monier-Williams'],
        'description': 'Monier Monier-Williams'
    },

    'islam-in-india': {
        'type': 'subject',
        'search_terms': ['Islam_in_India'],
        'description': 'Islam in India'
    },

    'mahabharata': {
        'type': 'work',
        'search_terms': ['Mahabharata'],
        'description': 'The Mahabharata'
    },

    'ramayana': {
        'type': 'work',
        'search_terms': ['Ramayana', 'Valmiki'],
        'description': 'The Ramayana'
    },

    'upanishad': {
        'type': 'work',
        'search_terms': ['Upanishads', 'Isha_Upanishad', 'Kena_Upanishad', 'Mundaka_Upanishad'],
        'description': 'Upanishads'
    },

    'bhagavata-purana': {
        'type': 'work',
        'search_terms': ['Bhagavata_Purana'],
        'description': 'Bhagavata Purana'
    },

    'sanskrit-grammar': {
        'type': 'subject',
        'search_terms': ['Sanskrit_grammar', 'Panini'],
        'description': 'Sanskrit grammar'
    },

    'panchatantra': {
        'type': 'work',
        'search_terms': ['Panchatantra'],
        'description': 'Panchatantra'
    },

    'vedas': {
        'type': 'work',
        'search_terms': ['Vedas', 'Rigveda'],
        'description': 'The Vedas'
    },

    'fergusson': {
        'type': 'author',
        'search_terms': ['James_Fergusson_(architectural_historian)'],
        'description': 'James Fergusson'
    },

    'aryabhata': {
        'type': 'author',
        'search_terms': ['Aryabhata', 'Aryabhatiya'],
        'description': 'Aryabhata'
    },

    'charaka': {
        'type': 'subject',
        'search_terms': ['Charaka', 'Charaka_Samhita'],
        'description': 'Charaka Samhita (Ayurveda)'
    },

    'sushruta': {
        'type': 'subject',
        'search_terms': ['Sushruta', 'Sushruta_Samhita'],
        'description': 'Sushruta Samhita'
    },

    'arthashastra': {
        'type': 'work',
        'search_terms': ['Arthashastra', 'Chanakya', 'Kautilya'],
        'description': 'Arthashastra'
    },

    'kalidasa': {
        'type': 'author',
        'search_terms': ['Kalidasa'],
        'description': 'Kalidasa'
    },

    'tagore': {
        'type': 'author',
        'search_terms': ['Rabindranath_Tagore'],
        'description': 'Rabindranath Tagore'
    },

    'gandhi': {
        'type': 'author',
        'search_terms': ['Mahatma_Gandhi', 'Mohandas_Karamchand_Gandhi'],
        'description': 'Mahatma Gandhi'
    },

    'vivekananda': {
        'type': 'author',
        'search_terms': ['Swami_Vivekananda'],
        'description': 'Swami Vivekananda'
    },

    'buddha': {
        'type': 'subject',
        'search_terms': ['Gautama_Buddha', 'Buddhism'],
        'description': 'Buddha / Buddhism'
    },

    'mahavira': {
        'type': 'author',
        'search_terms': ['Mahavira'],
        'description': 'Mahavira'
    }
}

def extract_all_works(works_dir: str) -> list:
    """Extract all works from the repository."""
    works_path = Path(works_dir)
    all_works = []

    for md_file in works_path.rglob('*.md'):
        try:
            content = md_file.read_text(encoding='utf-8')

            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    frontmatter = parts[1]
                    data = yaml.safe_load(frontmatter)

                    if data and 'references' in data and data['references']:
                        refs = data['references']

                        # Check if it has Wikipedia already
                        has_wikipedia = any(
                            isinstance(ref, dict) and 'url' in ref and 'wikipedia' in ref['url'].lower()
                            for ref in refs
                        )

                        all_works.append({
                            'file': str(md_file.relative_to(works_path)),
                            'file_stem': md_file.stem,
                            'title': data.get('title', md_file.stem),
                            'author': data.get('author', ['Unknown']),
                            'ref_count': len(refs),
                            'has_wikipedia': has_wikipedia,
                            'current_refs': refs
                        })
        except Exception as e:
            continue

    return all_works

def find_targeted_improvements(works_dir: str, output_file: str):
    """Find improvements for notable works using targeted searches."""

    print("Extracting all works...")
    all_works = extract_all_works(works_dir)

    print(f"Found {len(all_works)} works total")
    print("\nSearching for notable subjects/authors with Wikipedia coverage...\n")

    improvements_found = []

    for file_pattern, info in NOTABLE_ITEMS.items():
        print(f"\n[{info['description']}]")

        # Find works matching this pattern
        matching_works = [w for w in all_works if file_pattern in w['file_stem'].lower()]

        if not matching_works:
            print(f"  No works found matching pattern '{file_pattern}'")
            continue

        # Try to find Wikipedia URL
        print(f"  Found {len(matching_works)} matching work(s)")
        found, wiki_url = find_wikipedia_by_direct_url(info['search_terms'])

        if found:
            print(f"  ✓ Found Wikipedia: {wiki_url}")

            # Add this improvement to all matching works that don't have it
            for work in matching_works:
                # Check if this specific URL is already in references
                has_this_url = any(
                    isinstance(ref, dict) and 'url' in ref and ref['url'] == wiki_url
                    for ref in work['current_refs']
                )

                if not has_this_url:
                    improvements_found.append({
                        'work': work['title'],
                        'file': work['file'],
                        'current_refs': work['ref_count'],
                        'has_wikipedia': work['has_wikipedia'],
                        'suggestion': {
                            'type': info['type'],
                            'name': f"Wikipedia: {info['description']}",
                            'url': wiki_url,
                            'verified': True
                        }
                    })
                    print(f"  → Adding to: {work['title'][:60]}")
        else:
            print(f"  ✗ No Wikipedia article found")

    # Write report
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Verified Reference Improvements - High-Value Additions\n\n")
        f.write(f"Analysis Date: 2025-11-06\n\n")

        f.write("## Summary\n\n")
        f.write(f"- Works with verified improvements: {len(improvements_found)}\n")
        f.write(f"- All URLs verified as working (HTTP 200)\n")
        f.write(f"- Focus: Notable authors, works, and subjects with authoritative Wikipedia coverage\n\n")

        if improvements_found:
            f.write("## Recommended Additions\n\n")
            f.write("These are high-quality, verified Wikipedia articles that should be added as references.\n\n")

            for i, improvement in enumerate(improvements_found, 1):
                f.write(f"### {i}. {improvement['work']}\n\n")
                f.write(f"- **File**: `{improvement['file']}`\n")
                f.write(f"- **Current references**: {improvement['current_refs']}\n")
                f.write(f"- **Has Wikipedia**: {'Yes' if improvement['has_wikipedia'] else 'No'}\n\n")

                f.write(f"**ADD THIS REFERENCE:**\n\n")
                suggestion = improvement['suggestion']
                f.write(f"```yaml\n")
                f.write(f"- name: '{suggestion['name']}'\n")
                f.write(f"  url: {suggestion['url']}\n")
                f.write(f"  type: wikipedia\n")
                f.write(f"```\n\n")

                f.write("---\n\n")
        else:
            f.write("## No Improvements Found\n\n")
            f.write("All targeted searches did not yield new references.\n\n")

    print(f"\n✅ Report generated: {output_file}")
    print(f"📊 Found {len(improvements_found)} verified improvements")

if __name__ == '__main__':
    works_dir = './src/content/works'
    output_file = 'VERIFIED_REFERENCE_IMPROVEMENTS.md'

    find_targeted_improvements(works_dir, output_file)
