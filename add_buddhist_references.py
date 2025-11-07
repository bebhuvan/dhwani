#!/usr/bin/env python3
"""
Add Stanford Encyclopedia Buddhist Philosophy references to 39 Buddhist works.
"""

import yaml
from pathlib import Path
import re

STANFORD_BUDDHIST_REF = {
    'name': 'Stanford Encyclopedia: Buddha and Buddhist Philosophy',
    'url': 'https://plato.stanford.edu/entries/buddha/',
    'type': 'academic'
}

# Files identified in the Stanford report for Buddhist works
BUDDHIST_WORK_FILES = [
    'buddhacharita-ashvaghosa.md',
    'buddhist-india-rhys-davids.md',
    'the-buddhavamsa-and-the-cariya-pitaka.md',
    'buddhist-mahayana-texts.md',
    'beginnings-of-buddhist-art-and-other-essays-in-indian-and-central-asian-archaeology-foucher.md',
    'a-guide-to-nalanda-ghosh.md',
    'asoka-the-buddhist-emperor-of-india-smith.md',
    'buddhist-and-christian-gospels.md',
    'more-jataka-tales-ellen-babbitt.md',
    'the-life-of-buddha-and-the-early-history-of-his-order-bigandet.md',
    'jatakas-tales-of-the-buddha.md',
    'the-path-of-light-a-manual-of-mahayana-buddhism-l-d-barnett.md',
    'vinaya-texts-part-i-the-patimokkha-the-mahavagga-i-iv-translated-from-the-pali-by-t-w-rhys-davids-and-hermann-oldenberg.md',
    'vinaya-texts-part-ii-the-mahavagga-v-x-the-kullavagga-i-iii-translated-from-the-pali-by-t-w-rhys-davids-and-hermann-oldenberg.md',
    'vinaya-texts-part-iii-the-kullavagga-iv-xii-translated-from-the-pali-by-t-w-rhys-davids-and-hermann-oldenberg.md',
    'manual-of-buddhism-narada-maha-thera.md',
    'the-religion-of-the-samurai-kaiten-nukariya.md',
    'buddhism-and-buddhists-in-china-lewis-hodous.md',
    'buddhist-psalms-translated-from-the-japanese-of-shinran-shonin-1173-1262-s-yamabe-and-l-adams-beck.md',
    'the-buddha-s-way-of-virtue-a-translation-of-the-dhammapada-from-the-pali-text-w-d-c-wagiswara-and-k-j-saunders.md',
    'a-buddhist-manual-of-psychological-ethics-or-buddhist-psychology-of-the-abhidhamma-dhammasangani-caroline-a-f-rhys-davids.md',
    'a-record-of-the-buddhist-religion-as-practised-in-india-and-the-malay-archipelago-a-d-671-695-by-i-tsing-j-takakusu.md',
    'a-record-of-buddhistic-kingdoms-being-an-account-by-the-chinese-monk-fa-hien-of-his-travels-in-india-and-ceylon-a-d-399-414-in-search-of-the-buddhist-books-of-discipline-james-legge.md',
    'path-of-purity-visuddhimagga-buddhaghosa-pe-maung-tin.md',
    'buddhacharita-asvaghosha-cowell.md',
    'lectures-on-the-origin-and-growth-of-religion-as-illustrated-by-some-points-in-the-history-of-indian-buddhism-rhys-davids.md',
    'dialogues-of-the-buddha-vol-1-rhys-davids.md',
    'dialogues-of-the-buddha-vol-2-rhys-davids.md',
    'dialogues-of-the-buddha-vol-3-rhys-davids.md',
    'the-questions-of-king-milinda-rhys-davids.md',
    'buddhist-birth-stories-or-jataka-tales-rhys-davids.md',
    'a-catena-of-buddhist-scriptures-from-the-chinese-beal.md',
    'the-buddha-karita-of-asvaghosha-cowell.md',
    'the-romantic-legend-of-sakya-buddha-from-the-chinese-sanskrit-beal.md',
    'buddhist-records-of-the-western-world-translated-from-the-chinese-of-hiuen-tsiang-a-d-629-beal.md',
    'travels-of-fah-hian-and-sung-yun-buddhist-pilgrims-from-china-to-india-400-a-d-and-518-a-d-beal.md',
    'si-yu-ki-buddhist-records-of-the-western-world-translated-from-the-chinese-of-hiuen-tsiang-a-d-629-beal.md',
    'abstract-of-four-lectures-on-buddhist-literature-in-china-delivered-at-university-college-london-in-may-1882-beal.md',
    'texts-from-the-buddhist-canon-commonly-known-as-dhammapada-with-accompanying-narratives-beal.md',
]

def add_reference_to_work(work_path: Path) -> tuple[bool, str]:
    """Add Stanford Buddhist reference to a work file."""
    try:
        content = work_path.read_text(encoding='utf-8')

        if not content.startswith('---'):
            return False, "No YAML frontmatter found"

        parts = content.split('---', 2)
        if len(parts) < 3:
            return False, "Invalid frontmatter structure"

        frontmatter = parts[1]
        body = parts[2]

        # Parse YAML
        data = yaml.safe_load(frontmatter)

        if not data or 'references' not in data:
            return False, "No references section found"

        # Check if Stanford URL already exists
        for ref in data['references']:
            if isinstance(ref, dict) and 'url' in ref:
                if STANFORD_BUDDHIST_REF['url'] in ref['url']:
                    return False, "Stanford URL already exists"

        # Add the new reference
        data['references'].append(STANFORD_BUDDHIST_REF)

        # Write back to file
        new_frontmatter = yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)
        new_content = f"---\n{new_frontmatter}---{body}"

        work_path.write_text(new_content, encoding='utf-8')

        return True, f"Added reference (now {len(data['references'])} total)"

    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    works_dir = Path('./src/content/works')

    print("=" * 70)
    print("ADDING STANFORD ENCYCLOPEDIA REFERENCES TO BUDDHIST WORKS")
    print("=" * 70)
    print(f"\nTarget: {len(BUDDHIST_WORK_FILES)} Buddhist works")
    print(f"Reference: {STANFORD_BUDDHIST_REF['name']}")
    print(f"URL: {STANFORD_BUDDHIST_REF['url']}\n")

    successes = []
    skipped = []
    errors = []

    for i, filename in enumerate(BUDDHIST_WORK_FILES, 1):
        work_path = works_dir / filename

        print(f"[{i}/{len(BUDDHIST_WORK_FILES)}] {filename[:60]}")

        if not work_path.exists():
            print(f"  ✗ File not found")
            errors.append((filename, "File not found"))
            continue

        success, message = add_reference_to_work(work_path)

        if success:
            print(f"  ✓ {message}")
            successes.append(filename)
        else:
            if "already exists" in message:
                print(f"  - Skipped: {message}")
                skipped.append((filename, message))
            else:
                print(f"  ✗ {message}")
                errors.append((filename, message))

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"✓ Successfully added: {len(successes)}")
    print(f"- Skipped (already exists): {len(skipped)}")
    print(f"✗ Errors: {len(errors)}")

    if errors:
        print("\nErrors encountered:")
        for filename, error in errors:
            print(f"  - {filename}: {error}")

    print(f"\n✅ Process complete: {len(successes)} Buddhist works enhanced with Stanford Encyclopedia reference")

if __name__ == '__main__':
    main()
