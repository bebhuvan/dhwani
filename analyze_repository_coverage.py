#!/usr/bin/env python3
"""
Analyze the Dhwani repository to identify coverage gaps and generate recommendations.
"""

import yaml
from pathlib import Path
from collections import Counter, defaultdict
import re

def analyze_repository(works_dir: str) -> dict:
    """Analyze the repository for coverage patterns."""
    works_path = Path(works_dir)

    analysis = {
        'total_works': 0,
        'by_language': Counter(),
        'by_genre': Counter(),
        'by_century': defaultdict(list),
        'by_author_gender': Counter(),
        'by_region': Counter(),
        'authors': set(),
        'languages': set(),
        'genres': set(),
    }

    for md_file in works_path.rglob('*.md'):
        try:
            content = md_file.read_text(encoding='utf-8')

            if not content.startswith('---'):
                continue

            parts = content.split('---', 2)
            if len(parts) < 3:
                continue

            data = yaml.safe_load(parts[1])
            if not data:
                continue

            analysis['total_works'] += 1

            # Languages
            languages = data.get('language', [])
            if isinstance(languages, list):
                for lang in languages:
                    if lang:
                        analysis['by_language'][lang] += 1
                        analysis['languages'].add(lang)

            # Genres
            genres = data.get('genre', [])
            if isinstance(genres, list):
                for genre in genres:
                    if genre:
                        analysis['by_genre'][genre] += 1
                        analysis['genres'].add(genre)

            # Year/Century
            year = data.get('year')
            if year and isinstance(year, int):
                if year < 0:
                    century = f"{abs(year)//100 + 1} BCE"
                else:
                    century = f"{(year-1)//100 + 1} CE"
                analysis['by_century'][century].append(data.get('title', md_file.stem))

            # Authors
            authors = data.get('author', [])
            if isinstance(authors, list):
                for author in authors:
                    if author and author != 'Unknown' and author != 'Various':
                        analysis['authors'].add(author)

        except Exception as e:
            continue

    return analysis

def identify_gaps(analysis: dict) -> dict:
    """Identify coverage gaps."""
    gaps = {
        'underrepresented_languages': [],
        'missing_genres': [],
        'time_period_gaps': [],
        'regional_gaps': [],
    }

    # Language gaps
    total = analysis['total_works']
    for lang, count in analysis['by_language'].most_common():
        percentage = (count / total) * 100
        if percentage < 5:  # Less than 5% representation
            gaps['underrepresented_languages'].append((lang, count, f"{percentage:.1f}%"))

    # Common missing genres
    present_genres = set(analysis['genres'])
    important_genres = {
        'Drama', 'Poetry', 'Philosophy', 'History', 'Biography',
        'Religious Texts', 'Scientific Treatises', 'Grammar',
        'Art & Architecture', 'Music Theory', 'Mathematics',
        'Astronomy', 'Medicine', 'Law', 'Political Science'
    }

    # Time period analysis
    centuries = sorted(analysis['by_century'].keys())

    return gaps, analysis

def generate_recommendations() -> dict:
    """Generate categorized recommendations for missing works."""

    recommendations = {
        'classical_sanskrit': [],
        'regional_languages': {},
        'modern_literature': [],
        'historical_works': [],
        'scientific_technical': [],
        'philosophical_religious': [],
        'women_authors': [],
        'tribal_folk': [],
    }

    # I'll structure this as a comprehensive list
    return recommendations

def main():
    works_dir = './src/content/works'

    print("=" * 80)
    print("DHWANI REPOSITORY ANALYSIS")
    print("=" * 80)

    analysis = analyze_repository(works_dir)

    print(f"\n📊 CURRENT COVERAGE")
    print(f"Total works: {analysis['total_works']}")

    print(f"\n🌐 TOP 15 LANGUAGES:")
    for lang, count in analysis['by_language'].most_common(15):
        percentage = (count / analysis['total_works']) * 100
        print(f"  {lang:25s}: {count:4d} works ({percentage:5.1f}%)")

    print(f"\n📚 TOP 20 GENRES:")
    for genre, count in analysis['by_genre'].most_common(20):
        percentage = (count / analysis['total_works']) * 100
        print(f"  {genre:35s}: {count:4d} works ({percentage:5.1f}%)")

    print(f"\n📅 WORKS BY CENTURY:")
    for century in sorted(analysis['by_century'].keys()):
        count = len(analysis['by_century'][century])
        print(f"  {century:15s}: {count:4d} works")

    print(f"\n✍️  UNIQUE AUTHORS: {len(analysis['authors'])}")

    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    main()
