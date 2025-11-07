#!/usr/bin/env python3
"""
Add all 45 verified Wikipedia references from the improvement report.
"""

import yaml
from pathlib import Path
import re

# Mapping of files to Wikipedia references (parsed from VERIFIED_REFERENCE_IMPROVEMENTS.md)
WIKIPEDIA_ADDITIONS = [
    ('akbar-the-great-mogul-1542-1605-smith.md', 'Wikipedia: Mughal Emperor Akbar', 'https://en.wikipedia.org/wiki/Akbar'),
    ('an-english-translation-of-the-satyarth-prakash-literally-expose-of-right-sense-of-vedic-religion-of-maharshi-swami-dayanand-saraswati-the-luther-of-india-being-a-guide-to-vedic-hermeneutics-dayananda-sarasvati.md', 'Wikipedia: Satyarth Prakash', 'https://en.wikipedia.org/wiki/Satyarth_Prakash'),
    ('nalopkhyanam-story-of-nala-an-episode-of-the-mahbhrata-the-sanskrit-text-with-a-copious-vocabulary-and-an-improved-version-of-dean-milmans-translation-1819-1899-sir-monier-monier-williams.md', 'Wikipedia: Monier Monier-Williams', 'https://en.wikipedia.org/wiki/Monier_Monier-Williams'),
    ('islam-in-india-qanun-i-islam-jafar-sharif.md', 'Wikipedia: Islam in India', 'https://en.wikipedia.org/wiki/Islam_in_India'),
    ('andhra-mahabharatamu-nannaya-telugu.md', 'Wikipedia: The Mahabharata', 'https://en.wikipedia.org/wiki/Mahabharata'),
    ('sarala-mahabharata-odia-sarala-dasa.md', 'Wikipedia: The Mahabharata', 'https://en.wikipedia.org/wiki/Mahabharata'),
    ('adhyatma-ramayanam-kilippattu-ezhuthachan-malayalam.md', 'Wikipedia: The Ramayana', 'https://en.wikipedia.org/wiki/Ramayana'),
    ('kamba-ramayanam.md', 'Wikipedia: The Ramayana', 'https://en.wikipedia.org/wiki/Ramayana'),
    ('chandogya-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('shvetashvatara-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('brihadaranyaka-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('kena-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('upanishads-sri-sankara-commentary-isa-kena-mundaka-sitarama-sastri.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('taittriya-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('mandukya-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('taittiriya-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('katha-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('prashna-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('aitareya-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('swetashvatara-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('isha-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('mundaka-upanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('the-philosophy-of-the-upanishads-and-ancient-indian-metaphysics-as-exhibited-in-a-series-of-articles-contributed-to-the-calcutta-review-1851-1895-archibald-edward-gough.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('kenopanishad.md', 'Wikipedia: Upanishads', 'https://en.wikipedia.org/wiki/Upanishads'),
    ('a-study-of-the-bhagavata-purana-sinha.md', 'Wikipedia: Bhagavata Purana', 'https://en.wikipedia.org/wiki/Bhagavata_Purana'),
    ('a-higher-sanskrit-grammar-for-the-use-of-schools-and-colleges-kale.md', 'Wikipedia: Sanskrit grammar', 'https://en.wikipedia.org/wiki/Sanskrit_grammar'),
    ('a-sanskrit-grammar-for-beginners-macdonell.md', 'Wikipedia: Sanskrit grammar', 'https://en.wikipedia.org/wiki/Sanskrit_grammar'),
    ('a-higher-sanskrit-grammar-for-the-use-of-schools-and-colleges-kale-m-r.md', 'Wikipedia: Sanskrit grammar', 'https://en.wikipedia.org/wiki/Sanskrit_grammar'),
    ('a-sanskrit-grammar-including-both-the-classical-language-and-the-older-dialects-of-veda-and-brahmana-william-dwight-whitney.md', 'Wikipedia: Sanskrit grammar', 'https://en.wikipedia.org/wiki/Sanskrit_grammar'),
    ('aryabhatiya-aryabhata.md', 'Wikipedia: Aryabhatiya', 'https://en.wikipedia.org/wiki/Aryabhatiya'),
    ('charaka-samhita-ayurveda.md', 'Wikipedia: Charaka Samhita', 'https://en.wikipedia.org/wiki/Charaka_Samhita'),
    ('charaka-samhita-ayurveda-english-translation.md', 'Wikipedia: Charaka Samhita', 'https://en.wikipedia.org/wiki/Charaka_Samhita'),
    ('sushruta-samhita-sushruta.md', 'Wikipedia: Sushruta Samhita', 'https://en.wikipedia.org/wiki/Sushruta_Samhita'),
    ('arthashastra-kautilya.md', 'Wikipedia: Arthashastra', 'https://en.wikipedia.org/wiki/Arthashastra'),
    ('shakuntala-kalidasa-jones.md', 'Wikipedia: Kalidasa', 'https://en.wikipedia.org/wiki/Kalidasa'),
    ('abhijnana-shakuntalam-kalidasa.md', 'Wikipedia: Kalidasa', 'https://en.wikipedia.org/wiki/Kalidasa'),
    ('meghaduta-kalidasa.md', 'Wikipedia: Kalidasa', 'https://en.wikipedia.org/wiki/Kalidasa'),
    ('gitanjali-song-offerings-rabindranath-tagore.md', 'Wikipedia: Rabindranath Tagore', 'https://en.wikipedia.org/wiki/Rabindranath_Tagore'),
    ('gitanjali-tagore-rabindranath.md', 'Wikipedia: Rabindranath Tagore', 'https://en.wikipedia.org/wiki/Rabindranath_Tagore'),
    ('gora-tagore.md', 'Wikipedia: Rabindranath Tagore', 'https://en.wikipedia.org/wiki/Rabindranath_Tagore'),
    ('the-home-and-the-world-tagore-rabindranath.md', 'Wikipedia: Rabindranath Tagore', 'https://en.wikipedia.org/wiki/Rabindranath_Tagore'),
    ('nationalism-rabindranath-tagore.md', 'Wikipedia: Rabindranath Tagore', 'https://en.wikipedia.org/wiki/Rabindranath_Tagore'),
    ('sadhana-the-realisation-of-life-rabindranath-tagore.md', 'Wikipedia: Rabindranath Tagore', 'https://en.wikipedia.org/wiki/Rabindranath_Tagore'),
    ('the-gardener-tagore-rabindranath.md', 'Wikipedia: Rabindranath Tagore', 'https://en.wikipedia.org/wiki/Rabindranath_Tagore'),
    ('hind-swaraj-indian-home-rule-gandhi.md', 'Wikipedia: Mahatma Gandhi', 'https://en.wikipedia.org/wiki/Mahatma_Gandhi'),
    ('raja-yoga-swami-vivekananda.md', 'Wikipedia: Swami Vivekananda', 'https://en.wikipedia.org/wiki/Swami_Vivekananda'),
]

def add_wikipedia_reference(work_path: Path, name: str, url: str) -> tuple[bool, str]:
    """Add Wikipedia reference to a work file."""
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

        # Check if this Wikipedia URL already exists
        for ref in data['references']:
            if isinstance(ref, dict) and 'url' in ref:
                if url in ref['url']:
                    return False, "Wikipedia URL already exists"

        # Add the new reference
        new_ref = {
            'name': name,
            'url': url,
            'type': 'wikipedia'
        }
        data['references'].append(new_ref)

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
    print("ADDING 45 VERIFIED WIKIPEDIA REFERENCES")
    print("=" * 70)
    print()

    successes = []
    skipped = []
    errors = []

    for i, (filename, name, url) in enumerate(WIKIPEDIA_ADDITIONS, 1):
        work_path = works_dir / filename

        print(f"[{i}/{len(WIKIPEDIA_ADDITIONS)}] {filename[:60]}")

        if not work_path.exists():
            print(f"  ✗ File not found")
            errors.append((filename, "File not found"))
            continue

        success, message = add_wikipedia_reference(work_path, name, url)

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

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"✓ Successfully added: {len(successes)}")
    print(f"- Skipped (already exists): {len(skipped)}")
    print(f"✗ Errors: {len(errors)}")

    if errors and not any("already exists" in err[1] for err in errors):
        print("\nErrors encountered:")
        for filename, error in errors:
            if "already exists" not in error:
                print(f"  - {filename[:60]}: {error}")

    print(f"\n✅ Process complete: {len(successes)} works enhanced with Wikipedia references")

if __name__ == '__main__':
    main()
