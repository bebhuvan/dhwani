#!/usr/bin/env python3
"""
Script to fix broken Gutenberg .html.images links.

This script removes the .html.images suffix from Gutenberg URLs
since that format is broken (returns 404), while the base URLs work fine.
"""

import os
import re
from pathlib import Path

def fix_gutenberg_links(file_path: str) -> tuple[bool, int]:
    """
    Fix broken .html.images links in a markdown file.

    Returns:
        Tuple of (was_modified, num_fixes)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Replace gutenberg.org URLs ending with .html.images
        pattern = r'(https?://www\.gutenberg\.org/ebooks/\d+)\.html\.images'
        replacement = r'\1'

        content, num_fixes = re.subn(pattern, replacement, content)

        if num_fixes > 0:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, num_fixes

        return False, 0

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False, 0

def main():
    works_dir = "./src/content/works"

    print("=" * 70)
    print("Fix Broken Gutenberg Links")
    print("=" * 70)
    print()
    print(f"Scanning work files in: {works_dir}")
    print()

    total_files = 0
    modified_files = 0
    total_fixes = 0

    for file_path in Path(works_dir).rglob("*.md"):
        total_files += 1
        was_modified, num_fixes = fix_gutenberg_links(str(file_path))

        if was_modified:
            modified_files += 1
            total_fixes += num_fixes
            print(f"✓ Fixed {num_fixes} link(s) in: {file_path.name}")

    print()
    print("=" * 70)
    print("Summary")
    print("=" * 70)
    print(f"Total files scanned:   {total_files}")
    print(f"Files modified:        {modified_files}")
    print(f"Total links fixed:     {total_fixes}")
    print()

    if total_fixes > 0:
        print("✅ All broken .html.images links have been fixed!")
        print("   The base /ebooks/[ID] URLs will work correctly.")
    else:
        print("No broken links found to fix.")

if __name__ == "__main__":
    main()
