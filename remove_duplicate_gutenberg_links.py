#!/usr/bin/env python3
"""
Script to remove duplicate Gutenberg source entries.

After fixing .html.images links, we now have duplicate entries
pointing to the same base URL. This script removes the HTML duplicates.
"""

import os
import re
import yaml
from pathlib import Path
from collections import defaultdict

def remove_duplicate_sources(file_path: str) -> tuple[bool, int]:
    """
    Remove duplicate Gutenberg source entries from a markdown file.

    Returns:
        Tuple of (was_modified, num_removed)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract YAML front matter
        match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if not match:
            return False, 0

        yaml_content = match.group(1)
        rest_content = content[match.end():]

        try:
            data = yaml.safe_load(yaml_content)
        except yaml.YAMLError:
            return False, 0

        # Check for sources
        if 'sources' not in data or not isinstance(data['sources'], list):
            return False, 0

        original_count = len(data['sources'])

        # Track URLs we've seen and remove duplicates
        seen_urls = set()
        unique_sources = []

        for source in data['sources']:
            if isinstance(source, dict) and 'url' in source:
                url = source['url']
                if url not in seen_urls:
                    seen_urls.add(url)
                    unique_sources.append(source)

        num_removed = original_count - len(unique_sources)

        if num_removed > 0:
            data['sources'] = unique_sources

            # Regenerate YAML
            new_yaml = yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)
            new_content = f"---\n{new_yaml}---{rest_content}"

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            return True, num_removed

        return False, 0

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, 0

def main():
    works_dir = "./src/content/works"

    print("=" * 70)
    print("Remove Duplicate Gutenberg Source Links")
    print("=" * 70)
    print()
    print(f"Scanning work files in: {works_dir}")
    print()

    total_files = 0
    modified_files = 0
    total_removed = 0

    for file_path in Path(works_dir).rglob("*.md"):
        total_files += 1
        was_modified, num_removed = remove_duplicate_sources(str(file_path))

        if was_modified:
            modified_files += 1
            total_removed += num_removed
            print(f"✓ Removed {num_removed} duplicate(s) from: {file_path.name}")

    print()
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"Total files scanned:   {total_files}")
    print(f"Files modified:        {modified_files}")
    print(f"Total duplicates removed: {total_removed}")
    print()

    if total_removed > 0:
        print("✅ All duplicate source entries have been removed!")
    else:
        print("No duplicates found.")

if __name__ == "__main__":
    main()
