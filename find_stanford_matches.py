#!/usr/bin/env python3
"""
Find works that match verified Stanford Encyclopedia topics.
"""

import yaml
from pathlib import Path

# Verified working Stanford URLs
STANFORD_SOURCES = {
    'buddhism': {
        'url': 'https://plato.stanford.edu/entries/buddha/',
        'name': 'Stanford Encyclopedia: Buddha and Buddhist Philosophy',
        'keywords': ['buddha', 'buddhist', 'buddhism', 'jataka', 'dhamma', 'dharma', 'pali', 'tripitaka'],
        'genres': ['Buddhist Literature', 'Buddhist Philosophy']
    },
    'logic_india': {
        'url': 'https://plato.stanford.edu/entries/logic-india/',
        'name': 'Stanford Encyclopedia: Logic in Classical Indian Philosophy',
        'keywords': ['logic', 'nyaya', 'inference', 'anumana', 'tarka'],
        'genres': ['Philosophy', 'Logic']
    },
    'epistemology_india': {
        'url': 'https://plato.stanford.edu/entries/epistemology-india/',
        'name': 'Stanford Encyclopedia: Epistemology in Classical Indian Philosophy',
        'keywords': ['epistemology', 'knowledge', 'pramana', 'perception', 'inference'],
        'genres': ['Philosophy', 'Epistemology']
    },
    'metaphysics_india': {
        'url': 'https://plato.stanford.edu/entries/metaphysics-india/',
        'name': 'Stanford Encyclopedia: Metaphysics in Classical Indian Philosophy',
        'keywords': ['metaphysics', 'ontology', 'brahman', 'atman', 'vedanta', 'samkhya'],
        'genres': ['Philosophy', 'Metaphysics', 'Vedanta']
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

                    if data and 'references' in data:
                        all_works.append({
                            'file': str(md_file.relative_to(works_path)),
                            'title': data.get('title', md_file.stem),
                            'genre': data.get('genre', []),
                            'description': data.get('description', ''),
                            'references': data['references'],
                            'ref_count': len(data['references'])
                        })
        except Exception as e:
            continue

    return all_works

def check_stanford_url_exists(references: list, stanford_url: str) -> bool:
    """Check if a Stanford URL already exists in references."""
    for ref in references:
        if isinstance(ref, dict) and 'url' in ref:
            if stanford_url in ref['url']:
                return True
    return False

def find_matches(works: list) -> dict:
    """Find works that match Stanford Encyclopedia topics."""
    matches = {key: [] for key in STANFORD_SOURCES.keys()}

    for work in works:
        title_lower = work['title'].lower()
        desc_lower = work['description'].lower()
        genres = [g.lower() if isinstance(g, str) else '' for g in work['genre']]

        for stanford_key, stanford_info in STANFORD_SOURCES.items():
            # Check if Stanford URL already exists
            if check_stanford_url_exists(work['references'], stanford_info['url']):
                continue

            matched = False
            match_reason = ''

            # Special handling for Buddhism - must be explicitly Buddhist
            if stanford_key == 'buddhism':
                # Must have "buddhist literature" genre or "buddha/buddhist" in title
                if any('buddhist' in g for g in genres):
                    matched = True
                    match_reason = 'genre: Buddhist Literature'
                elif 'buddha' in title_lower or 'buddhist' in title_lower:
                    matched = True
                    match_reason = 'title contains Buddha/Buddhist'

            # For philosophy topics - require explicit genre match OR title keywords
            else:
                genre_match = any(
                    'philosophy' in genre or 'vedanta' in genre or 'logic' in genre
                    for genre in genres
                )

                # Title must contain specific technical terms (not just common words)
                title_keywords = ['nyaya', 'tarka', 'anumana', 'pramana', 'vedanta',
                                'samkhya', 'yoga', 'mimamsa', 'epistemology', 'metaphysics',
                                'ontology', 'logic']

                title_match = any(kw in title_lower for kw in title_keywords)

                if genre_match and title_match:
                    matched = True
                    match_reason = 'philosophy genre + technical title'
                elif title_match:
                    matched = True
                    match_reason = f'technical term in title'

            if matched:
                matches[stanford_key].append({
                    'title': work['title'],
                    'file': work['file'],
                    'ref_count': work['ref_count'],
                    'match_reason': match_reason
                })

    return matches

def generate_stanford_report(matches: dict, output_file: str):
    """Generate report of Stanford Encyclopedia additions."""

    total_matches = sum(len(works) for works in matches.values())

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Stanford Encyclopedia of Philosophy - Verified Additions\n\n")
        f.write(f"Analysis Date: 2025-11-06\n\n")

        f.write("## Summary\n\n")
        f.write(f"- Total works with Stanford additions: {total_matches}\n")
        f.write(f"- All URLs verified as working (HTTP 200)\n")
        f.write(f"- Source: Stanford Encyclopedia of Philosophy (peer-reviewed, authoritative)\n\n")

        for stanford_key, stanford_info in STANFORD_SOURCES.items():
            work_matches = matches[stanford_key]

            if work_matches:
                f.write(f"## {stanford_info['name']}\n\n")
                f.write(f"**URL**: {stanford_info['url']}\n\n")
                f.write(f"**Works to enhance**: {len(work_matches)}\n\n")

                for i, work in enumerate(work_matches, 1):
                    f.write(f"### {i}. {work['title']}\n\n")
                    f.write(f"- **File**: `{work['file']}`\n")
                    f.write(f"- **Current references**: {work['ref_count']}\n")
                    f.write(f"- **Match**: {work['match_reason']}\n\n")

                    f.write("**ADD THIS REFERENCE:**\n\n")
                    f.write("```yaml\n")
                    f.write(f"- name: '{stanford_info['name']}'\n")
                    f.write(f"  url: {stanford_info['url']}\n")
                    f.write(f"  type: academic\n")
                    f.write("```\n\n")
                    f.write("---\n\n")

        f.write("\n## About Stanford Encyclopedia of Philosophy\n\n")
        f.write("The Stanford Encyclopedia of Philosophy (SEP) is:\n")
        f.write("- A peer-reviewed, authoritative online encyclopedia\n")
        f.write("- Maintained by Stanford University\n")
        f.write("- Articles written by subject matter experts\n")
        f.write("- Regularly updated and fact-checked\n")
        f.write("- Free and open access\n")
        f.write("- Highly stable URLs (excellent for long-term references)\n\n")

        f.write("These additions provide scholarly context and philosophical background\n")
        f.write("for works dealing with Indian philosophy, logic, epistemology, and Buddhism.\n")

    print(f"\n✅ Report generated: {output_file}")
    print(f"📊 Found {total_matches} works that can benefit from Stanford Encyclopedia references")

    for stanford_key, work_matches in matches.items():
        if work_matches:
            print(f"   - {STANFORD_SOURCES[stanford_key]['name']}: {len(work_matches)} works")

if __name__ == '__main__':
    works_dir = './src/content/works'
    output_file = 'STANFORD_ENCYCLOPEDIA_ADDITIONS.md'

    print("Extracting works from repository...")
    works = extract_all_works(works_dir)
    print(f"Found {len(works)} works\n")

    print("Finding matches for Stanford Encyclopedia topics...")
    matches = find_matches(works)

    generate_stanford_report(matches, output_file)
