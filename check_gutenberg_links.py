#!/usr/bin/env python3
"""
Script to check all Gutenberg links in the Dhwani repository.
This script extracts Gutenberg URLs from work files and tests if they're accessible.
"""

import os
import re
import yaml
import requests
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict
import time

def extract_gutenberg_links(works_dir: str) -> Dict[str, List[Dict]]:
    """
    Extract all Gutenberg links from work files.

    Returns a dictionary mapping file paths to list of Gutenberg sources.
    """
    gutenberg_links = {}

    for file_path in Path(works_dir).rglob("*.md"):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract YAML front matter
            match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
            if not match:
                continue

            yaml_content = match.group(1)
            try:
                data = yaml.safe_load(yaml_content)
            except yaml.YAMLError:
                continue

            # Check for Gutenberg links in sources
            if 'sources' in data and isinstance(data['sources'], list):
                gutenberg_sources = []
                for source in data['sources']:
                    if isinstance(source, dict) and 'url' in source:
                        url = source['url']
                        if 'gutenberg.org' in url.lower():
                            gutenberg_sources.append({
                                'name': source.get('name', 'Unknown'),
                                'url': url
                            })

                if gutenberg_sources:
                    gutenberg_links[str(file_path)] = {
                        'title': data.get('title', 'Unknown'),
                        'author': data.get('author', 'Unknown'),
                        'sources': gutenberg_sources
                    }
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            continue

    return gutenberg_links

def check_url(url: str, timeout: int = 10) -> Tuple[bool, str, int]:
    """
    Check if a URL is accessible.

    Returns:
        Tuple of (is_accessible, status_message, status_code)
    """
    try:
        # Use HEAD request first (faster)
        response = requests.head(url, timeout=timeout, allow_redirects=True)

        # Some servers don't support HEAD, try GET if HEAD fails
        if response.status_code == 405:
            response = requests.get(url, timeout=timeout, allow_redirects=True, stream=True)
            response.close()

        if response.status_code == 200:
            return True, "OK", response.status_code
        elif 300 <= response.status_code < 400:
            return True, f"Redirect (to {response.url})", response.status_code
        else:
            return False, f"HTTP {response.status_code}", response.status_code

    except requests.exceptions.Timeout:
        return False, "Timeout", 0
    except requests.exceptions.ConnectionError:
        return False, "Connection Error", 0
    except requests.exceptions.TooManyRedirects:
        return False, "Too Many Redirects", 0
    except Exception as e:
        return False, f"Error: {str(e)}", 0

def generate_report(results: Dict, output_file: str):
    """
    Generate a comprehensive markdown report of link checking results.
    """
    working_links = []
    broken_links = []

    for file_path, data in results.items():
        for source in data['sources']:
            url = source['url']
            is_working, status, code = source['status']

            entry = {
                'file': file_path,
                'title': data['title'],
                'author': data['author'],
                'url': url,
                'status': status,
                'code': code
            }

            if is_working:
                working_links.append(entry)
            else:
                broken_links.append(entry)

    # Generate report
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Gutenberg Link Analysis Report\n\n")
        f.write(f"**Generated on:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        total_links = len(working_links) + len(broken_links)
        f.write(f"- **Total Gutenberg links found:** {total_links}\n")
        f.write(f"- **Working links:** {len(working_links)} ({len(working_links)/total_links*100:.1f}%)\n")
        f.write(f"- **Broken/Inaccessible links:** {len(broken_links)} ({len(broken_links)/total_links*100:.1f}%)\n\n")

        # Broken links section
        if broken_links:
            f.write("## Broken or Inaccessible Links\n\n")
            f.write(f"Found {len(broken_links)} broken or inaccessible links:\n\n")

            for i, entry in enumerate(broken_links, 1):
                f.write(f"### {i}. {entry['title']}\n\n")
                f.write(f"- **Author:** {entry['author']}\n")
                f.write(f"- **URL:** {entry['url']}\n")
                f.write(f"- **Status:** {entry['status']}\n")
                if entry['code'] > 0:
                    f.write(f"- **HTTP Code:** {entry['code']}\n")
                f.write(f"- **File:** `{entry['file']}`\n\n")
        else:
            f.write("## Broken or Inaccessible Links\n\n")
            f.write("✅ All Gutenberg links are working!\n\n")

        # Working links section
        f.write("## Working Links\n\n")
        f.write(f"Found {len(working_links)} working links:\n\n")

        # Group by status for better organization
        status_groups = defaultdict(list)
        for entry in working_links:
            status_groups[entry['status']].append(entry)

        for status, entries in status_groups.items():
            f.write(f"### {status} ({len(entries)} links)\n\n")
            for entry in entries:
                author_str = entry['author']
                if isinstance(author_str, list):
                    author_str = ', '.join(author_str)
                f.write(f"- **{entry['title']}** by {author_str}\n")
                f.write(f"  - URL: {entry['url']}\n")
                f.write(f"  - File: `{entry['file']}`\n\n")

        # Additional statistics
        f.write("## Additional Statistics\n\n")

        # Count unique domains
        domains = set()
        for entry in working_links + broken_links:
            from urllib.parse import urlparse
            parsed = urlparse(entry['url'])
            domains.add(parsed.netloc)

        f.write(f"- **Unique domains:** {len(domains)}\n")
        f.write(f"- **Domains found:** {', '.join(sorted(domains))}\n\n")

        # URL patterns
        f.write("### URL Patterns\n\n")
        ebook_pattern = re.compile(r'/ebooks/(\d+)')
        cache_pattern = re.compile(r'/cache/')
        files_pattern = re.compile(r'/files/')

        ebook_urls = sum(1 for e in working_links + broken_links if ebook_pattern.search(e['url']))
        cache_urls = sum(1 for e in working_links + broken_links if cache_pattern.search(e['url']))
        files_urls = sum(1 for e in working_links + broken_links if files_pattern.search(e['url']))

        f.write(f"- `/ebooks/` format: {ebook_urls}\n")
        f.write(f"- `/cache/` format: {cache_urls}\n")
        f.write(f"- `/files/` format: {files_urls}\n\n")

        f.write("---\n\n")
        f.write("*This report was automatically generated by the Gutenberg link checker script.*\n")

def main():
    works_dir = "./src/content/works"
    output_file = "gutenberg-link-report.md"

    print("=" * 70)
    print("Gutenberg Link Checker for Dhwani")
    print("=" * 70)
    print()

    # Step 1: Extract links
    print("Step 1: Extracting Gutenberg links from work files...")
    gutenberg_links = extract_gutenberg_links(works_dir)

    total_files = len(gutenberg_links)
    total_links = sum(len(data['sources']) for data in gutenberg_links.values())

    print(f"✓ Found {total_links} Gutenberg links in {total_files} files")
    print()

    # Step 2: Check each link
    print("Step 2: Testing each Gutenberg link...")
    print("This may take a few minutes...")
    print()

    results = {}
    checked = 0

    for file_path, data in gutenberg_links.items():
        file_results = {
            'title': data['title'],
            'author': data['author'],
            'sources': []
        }

        for source in data['sources']:
            checked += 1
            url = source['url']
            print(f"[{checked}/{total_links}] Checking: {url[:60]}...")

            is_working, status, code = check_url(url)

            file_results['sources'].append({
                'name': source['name'],
                'url': url,
                'status': (is_working, status, code)
            })

            # Be nice to the server
            time.sleep(0.5)

        results[file_path] = file_results

    print()
    print("✓ Finished checking all links")
    print()

    # Step 3: Generate report
    print("Step 3: Generating report...")
    generate_report(results, output_file)
    print(f"✓ Report saved to: {output_file}")
    print()

    # Print summary
    working = sum(1 for data in results.values()
                  for source in data['sources']
                  if source['status'][0])
    broken = total_links - working

    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"Total links checked: {total_links}")
    print(f"Working links:       {working} ({working/total_links*100:.1f}%)")
    print(f"Broken links:        {broken} ({broken/total_links*100:.1f}%)")
    print()

    if broken > 0:
        print(f"⚠️  Found {broken} broken or inaccessible links")
        print(f"   See {output_file} for details")
    else:
        print("✅ All Gutenberg links are working!")
    print()

if __name__ == "__main__":
    main()
