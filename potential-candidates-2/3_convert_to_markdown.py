#!/usr/bin/env python3
"""
Step 3: Convert downloaded texts to markdown format

Converts plain text files to markdown with frontmatter metadata.
"""

import json
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime

from config import *
from utils import *

logger = setup_logging(PROGRESS_LOG)

def create_frontmatter(metadata: Dict, download_info: Dict) -> str:
    """Create YAML frontmatter from metadata."""
    # Extract information
    work = metadata.get('work', {})
    search_result = metadata.get('search_result', {})

    title = search_result.get('title', work.get('title', 'Unknown Title'))
    creators = search_result.get('creator', work.get('author', 'Unknown'))

    # Handle creators (can be string or list)
    if isinstance(creators, str):
        authors = [creators]
    elif isinstance(creators, list):
        authors = creators
    else:
        authors = [work.get('author', 'Unknown')]

    # Clean author names
    authors = [a.strip() for a in authors if a and a.strip()]
    if not authors:
        authors = ['Unknown']

    # Year
    date_str = search_result.get('date', '')
    year = parse_year_from_date(date_str)
    if not year and work.get('year_range'):
        year = work['year_range'][0]

    # Language
    language = search_result.get('language', work.get('language', 'Unknown'))
    if isinstance(language, list):
        languages = language
    else:
        languages = [language] if language else ['Unknown']

    # Subjects/genres
    subjects = search_result.get('subject', [])
    if isinstance(subjects, str):
        subjects = [subjects]

    # Archive info
    identifier = search_result.get('identifier', '')
    archive_url = f"https://archive.org/details/{identifier}" if identifier else ''

    # Build frontmatter
    frontmatter = "---\n"
    frontmatter += f"title: \"{title}\"\n"

    # Authors
    frontmatter += "author:\n"
    for author in authors[:5]:  # Limit to 5 authors
        frontmatter += f"  - \"{author}\"\n"

    # Year
    if year:
        frontmatter += f"year: {year}\n"

    # Language
    frontmatter += "language:\n"
    for lang in languages[:3]:  # Limit to 3 languages
        frontmatter += f"  - \"{lang}\"\n"

    # Genre/subject
    if subjects:
        frontmatter += "genre:\n"
        for subject in subjects[:5]:  # Limit to 5 subjects
            frontmatter += f"  - \"{subject}\"\n"

    # Source information
    frontmatter += "source: \"Archive.org\"\n"
    frontmatter += f"archive_id: \"{identifier}\"\n"
    frontmatter += f"archive_url: \"{archive_url}\"\n"

    # Download metadata
    frontmatter += f"download_date: \"{download_info.get('download_date', datetime.now().isoformat())}\"\n"
    frontmatter += f"quality_score: {download_info.get('quality_score', 0.0):.2f}\n"
    frontmatter += f"text_length: {download_info.get('text_length', 0)}\n"

    # Status
    frontmatter += "status: \"candidate\"\n"
    frontmatter += "needs_review: true\n"

    # Category
    category = work.get('category', 'unknown')
    frontmatter += f"category: \"{category}\"\n"

    frontmatter += "---\n"

    return frontmatter

def create_markdown_content(text: str, metadata: Dict, download_info: Dict) -> str:
    """Create complete markdown file content."""
    # Frontmatter
    content = create_frontmatter(metadata, download_info)
    content += "\n"

    # Title
    title = metadata.get('search_result', {}).get('title', 'Unknown Work')
    content += f"# {title}\n\n"

    # Main text
    content += text
    content += "\n\n"

    # Footer
    content += "---\n\n"
    content += "*Downloaded from Archive.org*\n"

    identifier = download_info.get('identifier', '')
    if identifier:
        content += f"*Archive.org ID: [{identifier}](https://archive.org/details/{identifier})*\n"

    content += f"*Download date: {download_info.get('download_date', 'Unknown')}*\n"
    content += f"*Quality score: {download_info.get('quality_score', 0.0):.2f}*\n\n"

    content += "**Note**: This is a candidate work downloaded automatically. "
    content += "It requires human review before being added to the main Dhwani repository.\n"

    return content

def convert_work(work_id: str) -> bool:
    """Convert a downloaded work to markdown."""
    # Find text file
    text_file = DOWNLOADS_DIR / f"{work_id}.txt"
    if not text_file.exists():
        logger.warning(f"Text file not found: {text_file.name}")
        return False

    # Find info file
    info_file = DOWNLOADS_DIR / f"{work_id}_info.json"
    if not info_file.exists():
        logger.warning(f"Info file not found: {info_file.name}")
        return False

    # Find metadata file
    metadata_files = list(METADATA_DIR.glob(f"{work_id}_*.json"))
    if not metadata_files:
        logger.warning(f"Metadata file not found for: {work_id}")
        return False

    metadata_file = metadata_files[0]

    try:
        # Load files
        with open(text_file, 'r', encoding='utf-8') as f:
            text = f.read()

        download_info = load_metadata(info_file)
        metadata = load_metadata(metadata_file)

        if not download_info or not metadata:
            logger.error(f"Could not load metadata for: {work_id}")
            return False

        # Create markdown
        markdown_content = create_markdown_content(text, metadata, download_info)

        # Save markdown
        output_file = PROCESSED_DIR / f"{work_id}.md"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(markdown_content)

        logger.info(f"✓ Converted to markdown: {output_file.name}")

        # Update statistics
        update_statistics(STATS_FILE, 'conversions_succeeded', 1)

        return True

    except Exception as e:
        logger.error(f"Conversion failed for {work_id}: {e}")
        update_statistics(STATS_FILE, 'conversions_failed', 1)
        return False

def convert_all_works():
    """Convert all downloaded works to markdown."""
    # Get all text files
    text_files = list(DOWNLOADS_DIR.glob("*.txt"))

    logger.info(f"Found {len(text_files)} text files to convert")

    converted = 0
    failed = 0

    for i, text_file in enumerate(text_files, 1):
        work_id = text_file.stem

        logger.info(f"\n[{i}/{len(text_files)}] Converting: {work_id}")

        # Check if already converted
        output_file = PROCESSED_DIR / f"{work_id}.md"
        if output_file.exists():
            logger.info(f"Already converted, skipping...")
            converted += 1
            continue

        success = convert_work(work_id)

        if success:
            converted += 1
        else:
            failed += 1

    return converted, failed

def main():
    """Main conversion process."""
    logger.info("="*80)
    logger.info("MARKDOWN CONVERSION PROCESS STARTED")
    logger.info("="*80)

    # Ensure directories exist
    ensure_directory(PROCESSED_DIR)

    # Convert works
    converted, failed = convert_all_works()

    logger.info("\n" + "="*80)
    logger.info("CONVERSION COMPLETE")
    logger.info("="*80)
    logger.info(f"Converted: {converted}")
    logger.info(f"Failed: {failed}")
    logger.info(f"Success rate: {converted/(converted+failed)*100:.1f}%" if (converted+failed) > 0 else "N/A")
    logger.info(f"\nMarkdown files saved to: {PROCESSED_DIR}")

if __name__ == '__main__':
    main()
