#!/usr/bin/env python3
"""
Analyze reference links in the Dhwani repository to identify improvement opportunities.
"""

import yaml
from pathlib import Path
from collections import defaultdict, Counter
from urllib.parse import urlparse
import re

def extract_references_data(works_dir: str) -> dict:
    """Extract all reference link data from work files."""
    works_path = Path(works_dir)

    all_references = []
    works_with_refs = {}
    domain_counter = Counter()
    ref_count_distribution = Counter()

    for md_file in works_path.rglob('*.md'):
        try:
            content = md_file.read_text(encoding='utf-8')

            # Extract frontmatter
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    frontmatter = parts[1]
                    data = yaml.safe_load(frontmatter)

                    if data and 'references' in data and data['references']:
                        refs = data['references']
                        ref_count = len(refs)
                        ref_count_distribution[ref_count] += 1

                        work_title = data.get('title', md_file.stem)
                        works_with_refs[md_file.relative_to(works_path)] = {
                            'title': work_title,
                            'ref_count': ref_count,
                            'references': refs
                        }

                        for ref in refs:
                            if isinstance(ref, dict) and 'url' in ref:
                                url = ref['url']
                                domain = urlparse(url).netloc
                                domain_counter[domain] += 1
                                all_references.append({
                                    'work': work_title,
                                    'file': str(md_file.relative_to(works_path)),
                                    'url': url,
                                    'domain': domain,
                                    'name': ref.get('name', '')
                                })
        except Exception as e:
            print(f"Error processing {md_file}: {e}")
            continue

    return {
        'all_references': all_references,
        'works_with_refs': works_with_refs,
        'domain_counter': domain_counter,
        'ref_count_distribution': ref_count_distribution
    }

def find_minimal_references(works_with_refs: dict, threshold: int = 2) -> list:
    """Find works with minimal reference links."""
    minimal = []

    for file_path, data in works_with_refs.items():
        if data['ref_count'] <= threshold:
            minimal.append({
                'file': str(file_path),
                'title': data['title'],
                'ref_count': data['ref_count'],
                'current_refs': data['references']
            })

    return sorted(minimal, key=lambda x: x['ref_count'])

def categorize_by_domain(domain_counter: Counter) -> dict:
    """Categorize reference domains by type."""
    categories = {
        'Wikipedia': [],
        'Academic/Educational': [],
        'Government/Cultural': [],
        'Libraries/Archives': [],
        'Commercial': [],
        'Other': []
    }

    for domain, count in domain_counter.items():
        if 'wikipedia' in domain.lower():
            categories['Wikipedia'].append((domain, count))
        elif any(x in domain.lower() for x in ['edu', 'ac.', 'university', 'britannica', 'academia']):
            categories['Academic/Educational'].append((domain, count))
        elif any(x in domain.lower() for x in ['.gov', 'library', 'archive', 'museum']):
            categories['Government/Cultural'].append((domain, count))
        elif any(x in domain.lower() for x in ['gutenberg', 'archive.org', 'books.google']):
            categories['Libraries/Archives'].append((domain, count))
        elif any(x in domain.lower() for x in ['.com', 'amazon', 'goodreads']):
            categories['Commercial'].append((domain, count))
        else:
            categories['Other'].append((domain, count))

    return categories

def check_wikipedia_coverage(works_with_refs: dict) -> dict:
    """Check which works have Wikipedia references."""
    with_wikipedia = []
    without_wikipedia = []

    for file_path, data in works_with_refs.items():
        has_wiki = False
        for ref in data['references']:
            if isinstance(ref, dict) and 'url' in ref:
                if 'wikipedia' in ref['url'].lower():
                    has_wiki = True
                    break

        work_info = {
            'file': str(file_path),
            'title': data['title'],
            'ref_count': data['ref_count']
        }

        if has_wiki:
            with_wikipedia.append(work_info)
        else:
            without_wikipedia.append(work_info)

    return {
        'with_wikipedia': with_wikipedia,
        'without_wikipedia': without_wikipedia
    }

def generate_opportunities_report(data: dict, output_file: str):
    """Generate a report of reference enhancement opportunities."""

    domain_categories = categorize_by_domain(data['domain_counter'])
    wiki_coverage = check_wikipedia_coverage(data['works_with_refs'])
    minimal_refs = find_minimal_references(data['works_with_refs'], threshold=2)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Reference Links Enhancement Opportunities\n\n")
        f.write(f"Analysis Date: 2025-11-06\n\n")

        # Summary stats
        f.write("## Summary Statistics\n\n")
        f.write(f"- Total works analyzed: {len(data['works_with_refs'])}\n")
        f.write(f"- Total reference links: {len(data['all_references'])}\n")
        f.write(f"- Unique domains: {len(data['domain_counter'])}\n")
        f.write(f"- Works with Wikipedia refs: {len(wiki_coverage['with_wikipedia'])} ({len(wiki_coverage['with_wikipedia'])*100//len(data['works_with_refs'])}%)\n")
        f.write(f"- Works without Wikipedia refs: {len(wiki_coverage['without_wikipedia'])} ({len(wiki_coverage['without_wikipedia'])*100//len(data['works_with_refs'])}%)\n\n")

        # Reference count distribution
        f.write("## Reference Count Distribution\n\n")
        f.write("| Ref Count | Works |\n")
        f.write("|-----------|-------|\n")
        for count in sorted(data['ref_count_distribution'].keys()):
            f.write(f"| {count} | {data['ref_count_distribution'][count]} |\n")
        f.write("\n")

        # Domain categories
        f.write("## Reference Sources by Category\n\n")
        for category, domains in domain_categories.items():
            if domains:
                f.write(f"### {category}\n\n")
                total = sum(count for _, count in domains)
                f.write(f"Total references: {total}\n\n")
                for domain, count in sorted(domains, key=lambda x: x[1], reverse=True)[:10]:
                    f.write(f"- {domain}: {count}\n")
                f.write("\n")

        # Works with minimal references
        f.write("## Works with Minimal References (≤2)\n\n")
        f.write(f"Found {len(minimal_refs)} works with 2 or fewer reference links.\n\n")

        for i, work in enumerate(minimal_refs[:50], 1):  # Show first 50
            f.write(f"### {i}. {work['title']}\n")
            f.write(f"- File: `{work['file']}`\n")
            f.write(f"- Current references: {work['ref_count']}\n")
            f.write(f"- Current refs:\n")
            for ref in work['current_refs']:
                if isinstance(ref, dict):
                    f.write(f"  - {ref.get('name', 'Unnamed')}: {ref.get('url', 'No URL')}\n")
            f.write("\n")

        if len(minimal_refs) > 50:
            f.write(f"\n... and {len(minimal_refs) - 50} more works with minimal references.\n\n")

        # Works without Wikipedia
        f.write("## Enhancement Opportunity: Add Wikipedia References\n\n")
        f.write(f"{len(wiki_coverage['without_wikipedia'])} works ({len(wiki_coverage['without_wikipedia'])*100//len(data['works_with_refs'])}%) don't have Wikipedia references.\n\n")
        f.write("**Recommendation**: Wikipedia is an authoritative, well-maintained source for literary works.\n")
        f.write("Adding Wikipedia references would provide readers with comprehensive background information.\n\n")

        # Sample works without Wikipedia
        f.write("### Sample Works Without Wikipedia (First 30)\n\n")
        for i, work in enumerate(wiki_coverage['without_wikipedia'][:30], 1):
            f.write(f"{i}. **{work['title']}** - {work['ref_count']} refs - `{work['file']}`\n")

        if len(wiki_coverage['without_wikipedia']) > 30:
            f.write(f"\n... and {len(wiki_coverage['without_wikipedia']) - 30} more.\n")

        f.write("\n## Recommended Actions\n\n")
        f.write("1. **Priority 1**: Add Wikipedia links for major works without them\n")
        f.write("   - Focus on well-known works (Ramayana, Mahabharata, major authors)\n")
        f.write("   - Wikipedia provides reliable biographical and literary context\n\n")
        f.write("2. **Priority 2**: Enhance works with only 1 reference\n")
        f.write("   - Add complementary sources (academic, biographical)\n")
        f.write("   - Aim for at least 2-3 quality references per work\n\n")
        f.write("3. **Priority 3**: Add specialized academic sources\n")
        f.write("   - For classical works: Sanskrit Dictionary, academic journals\n")
        f.write("   - For modern works: author biographies, literary criticism\n\n")

    print(f"\n✅ Report generated: {output_file}")
    print(f"\n📊 Key Findings:")
    print(f"   - {len(minimal_refs)} works have ≤2 references")
    print(f"   - {len(wiki_coverage['without_wikipedia'])} works lack Wikipedia references")
    print(f"   - {len(data['domain_counter'])} unique reference domains in use")

if __name__ == '__main__':
    works_dir = './src/content/works'
    output_file = 'REFERENCE_ENHANCEMENT_OPPORTUNITIES.md'

    print("Analyzing reference links...")
    data = extract_references_data(works_dir)

    print(f"Found {len(data['all_references'])} reference links across {len(data['works_with_refs'])} works")

    generate_opportunities_report(data, output_file)
