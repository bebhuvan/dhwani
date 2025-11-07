#!/usr/bin/env python3
"""
Add Stanford Encyclopedia Buddhist Philosophy references to remaining Buddhist works.
"""

import yaml
from pathlib import Path

STANFORD_BUDDHIST_REF = {
    'name': 'Stanford Encyclopedia: Buddha and Buddhist Philosophy',
    'url': 'https://plato.stanford.edu/entries/buddha/',
    'type': 'academic'
}

def has_stanford_ref(references: list) -> bool:
    """Check if Stanford Buddhist ref already exists."""
    for ref in references:
        if isinstance(ref, dict) and 'url' in ref:
            if STANFORD_BUDDHIST_REF['url'] in ref['url']:
                return True
    return False

def is_buddhist_work(data: dict) -> bool:
    """Determine if a work is Buddhist-related."""
    # Check title
    title = data.get('title', '').lower()
    if 'buddha' in title or 'buddhist' in title or 'jataka' in title:
        return True

    # Check genre
    genres = data.get('genre', [])
    if isinstance(genres, list):
        for genre in genres:
            if isinstance(genre, str) and 'buddhist' in genre.lower():
                return True

    return False

def add_reference_to_work(work_path: Path) -> tuple[bool, str]:
    """Add Stanford Buddhist reference to a work file."""
    try:
        content = work_path.read_text(encoding='utf-8')

        if not content.startswith('---'):
            return False, "No YAML frontmatter"

        parts = content.split('---', 2)
        if len(parts) < 3:
            return False, "Invalid frontmatter"

        frontmatter = parts[1]
        body = parts[2]

        data = yaml.safe_load(frontmatter)

        if not data or 'references' not in data:
            return False, "No references section"

        # Check if it's a Buddhist work
        if not is_buddhist_work(data):
            return False, "Not a Buddhist work"

        # Check if Stanford URL already exists
        if has_stanford_ref(data['references']):
            return False, "Already has Stanford ref"

        # Add the new reference
        data['references'].append(STANFORD_BUDDHIST_REF)

        # Write back
        new_frontmatter = yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)
        new_content = f"---\n{new_frontmatter}---{body}"

        work_path.write_text(new_content, encoding='utf-8')

        return True, f"Added ({len(data['references'])} total refs)"

    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    works_dir = Path('./src/content/works')

    print("=" * 70)
    print("ADDING STANFORD REFERENCES TO REMAINING BUDDHIST WORKS")
    print("=" * 70)
    print()

    added = []
    skipped = []
    errors = []

    all_md_files = sorted(works_dir.glob('*.md'))

    for work_path in all_md_files:
        success, message = add_reference_to_work(work_path)

        if success:
            print(f"✓ {work_path.name[:60]}")
            print(f"  {message}")
            added.append(work_path.name)
        elif "Not a Buddhist work" not in message and "Already has Stanford" not in message:
            # Only report actual errors, not non-Buddhist works
            if "No references section" not in message:  # Skip works without references
                print(f"✗ {work_path.name[:60]}: {message}")
                errors.append((work_path.name, message))

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"✓ Added to {len(added)} works")
    if errors:
        print(f"✗ Errors: {len(errors)}")

    if added:
        print(f"\n✅ Successfully added Stanford Encyclopedia references to {len(added)} Buddhist works")

if __name__ == '__main__':
    main()
