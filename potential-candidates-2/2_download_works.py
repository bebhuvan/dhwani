#!/usr/bin/env python3
"""
Step 2: Download works from Archive.org

Downloads text content from discovered works using fallback methods.
"""

import requests
import json
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import sys

from config import *
from utils import *

logger = setup_logging(PROGRESS_LOG)

class ArchiveDownloader:
    """Download works from Archive.org."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Dhwani-Fetch/1.0 (Educational Project)'
        })

    def get_download_options(self, identifier: str, metadata: Dict) -> List[Dict]:
        """Get available download options for an item."""
        files = metadata.get('files', [])
        options = []

        for file_info in files:
            name = file_info.get('name', '')
            format_type = file_info.get('format', '')
            size = file_info.get('size', '0')

            # Convert size to MB
            try:
                size_mb = int(size) / (1024 * 1024)
            except:
                size_mb = 0

            # Skip large files
            if size_mb > MAX_FILE_SIZE_MB:
                continue

            # Prioritize text formats
            priority = 100

            if '_djvu.txt' in name:
                priority = 1  # Highest priority
            elif name.endswith('.txt'):
                priority = 2
            elif 'Text PDF' in format_type or name.endswith('.pdf'):
                priority = 3
            elif name.endswith('.epub'):
                priority = 4
            elif name.endswith('.html') or name.endswith('.htm'):
                priority = 5
            else:
                continue  # Skip other formats

            options.append({
                'name': name,
                'format': format_type,
                'size_mb': size_mb,
                'priority': priority,
                'url': f"{ARCHIVE_API_BASE}/download/{identifier}/{name}"
            })

        # Sort by priority
        options.sort(key=lambda x: x['priority'])
        return options

    @retry_on_failure(max_retries=MAX_RETRIES, delay=RETRY_DELAY)
    def download_file(self, url: str, output_path: Path) -> bool:
        """Download a file from URL."""
        logger.info(f"Downloading: {url}")

        try:
            response = self.session.get(url, timeout=REQUEST_TIMEOUT, stream=True)
            response.raise_for_status()

            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            logger.info(f"Downloaded: {output_path.name} ({output_path.stat().st_size / 1024:.1f} KB)")
            return True

        except Exception as e:
            logger.error(f"Download failed: {e}")
            if output_path.exists():
                output_path.unlink()
            return False

    def extract_text_from_file(self, file_path: Path) -> Optional[str]:
        """Extract text from downloaded file."""
        if not file_path.exists():
            return None

        suffix = file_path.suffix.lower()

        try:
            # Plain text
            if suffix == '.txt':
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()

            # PDF (requires pdfplumber or pypdf2)
            elif suffix == '.pdf':
                try:
                    import pdfplumber
                    text = []
                    with pdfplumber.open(file_path) as pdf:
                        for page in pdf.pages[:500]:  # Limit to 500 pages
                            page_text = page.extract_text()
                            if page_text:
                                text.append(page_text)
                    return '\n\n'.join(text)
                except ImportError:
                    logger.warning("pdfplumber not available, trying pypdf2")
                    try:
                        from pypdf import PdfReader
                        reader = PdfReader(file_path)
                        text = []
                        for page in reader.pages[:500]:
                            text.append(page.extract_text())
                        return '\n\n'.join(text)
                    except:
                        logger.error("PDF extraction failed - install pdfplumber or pypdf")
                        return None

            # EPUB
            elif suffix == '.epub':
                try:
                    import ebooklib
                    from ebooklib import epub
                    from bs4 import BeautifulSoup

                    book = epub.read_epub(file_path)
                    text = []

                    for item in book.get_items():
                        if item.get_type() == ebooklib.ITEM_DOCUMENT:
                            soup = BeautifulSoup(item.get_content(), 'html.parser')
                            text.append(soup.get_text())

                    return '\n\n'.join(text)
                except ImportError:
                    logger.error("ebooklib not available for EPUB extraction")
                    return None

            # HTML
            elif suffix in ['.html', '.htm']:
                try:
                    from bs4 import BeautifulSoup

                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        soup = BeautifulSoup(f.read(), 'html.parser')
                        # Remove scripts and styles
                        for script in soup(["script", "style"]):
                            script.decompose()
                        return soup.get_text()
                except ImportError:
                    logger.error("BeautifulSoup not available for HTML extraction")
                    return None

        except Exception as e:
            logger.error(f"Text extraction failed for {file_path.name}: {e}")
            return None

        return None

    def download_work(self, work_id: str, metadata_file: Path) -> Optional[Tuple[str, Dict]]:
        """Download a work and extract text."""
        # Load metadata
        metadata = load_metadata(metadata_file)
        if not metadata:
            logger.error(f"Could not load metadata: {metadata_file}")
            return None

        identifier = metadata.get('search_result', {}).get('identifier')
        if not identifier:
            logger.error(f"No identifier in metadata: {metadata_file}")
            return None

        detailed_metadata = metadata.get('detailed_metadata', {})

        # Get download options
        options = self.get_download_options(identifier, detailed_metadata)

        if not options:
            logger.warning(f"No suitable download options for {identifier}")
            return None

        logger.info(f"Found {len(options)} download options")

        # Try each option until success
        for i, option in enumerate(options[:3], 1):  # Try top 3 options
            logger.info(f"Trying option {i}/{min(3, len(options))}: {option['name']} ({option['size_mb']:.1f} MB)")

            # Download file
            download_path = DOWNLOADS_DIR / f"{work_id}_{sanitize_filename(option['name'])}"

            if download_path.exists():
                logger.info(f"File already exists: {download_path.name}")
            else:
                success = self.download_file(option['url'], download_path)

                if not success:
                    logger.warning(f"Download failed, trying next option...")
                    time.sleep(RATE_LIMIT_DELAY)
                    continue

                time.sleep(RATE_LIMIT_DELAY)

            # Extract text
            text = self.extract_text_from_file(download_path)

            if text and len(text) > MIN_TEXT_LENGTH:
                logger.info(f"Successfully extracted {len(text)} characters")

                # Clean text
                text = clean_text(text)

                # Calculate quality score
                quality = calculate_quality_score(text, metadata)
                logger.info(f"Quality score: {quality:.2f}")

                if quality >= MIN_QUALITY_SCORE:
                    return text, {
                        'identifier': identifier,
                        'download_option': option,
                        'text_length': len(text),
                        'quality_score': quality,
                        'download_date': datetime.now().isoformat()
                    }
                else:
                    logger.warning(f"Quality score too low ({quality:.2f}), trying next option...")
            else:
                logger.warning(f"Extracted text too short or failed, trying next option...")

        logger.error(f"All download options failed for {identifier}")
        return None

def download_discovered_works():
    """Download all discovered works."""
    downloader = ArchiveDownloader()

    # Get all metadata files
    metadata_files = list(METADATA_DIR.glob("*.json"))
    # Exclude summary file
    metadata_files = [f for f in metadata_files if f.name != 'discovery_summary.json']

    logger.info(f"Found {len(metadata_files)} works to download")

    state = load_state(STATE_FILE)
    succeeded = set(state.get('succeeded', []))
    failed = set(state.get('failed', []))

    for i, metadata_file in enumerate(metadata_files, 1):
        work_id = metadata_file.stem.split('_')[0]  # Extract work_id from filename

        logger.info(f"\n{'='*60}")
        logger.info(f"[{i}/{len(metadata_files)}] Processing: {metadata_file.name}")

        # Skip if already processed
        if work_id in succeeded:
            logger.info(f"Already downloaded successfully, skipping...")
            continue

        if work_id in failed:
            logger.info(f"Previously failed, skipping...")
            continue

        try:
            result = downloader.download_work(work_id, metadata_file)

            if result:
                text, download_info = result

                # Save text
                text_file = DOWNLOADS_DIR / f"{work_id}.txt"
                with open(text_file, 'w', encoding='utf-8') as f:
                    f.write(text)

                # Save download info
                info_file = DOWNLOADS_DIR / f"{work_id}_info.json"
                save_metadata(info_file, download_info)

                logger.info(f"✓ Success: Saved to {text_file.name}")

                succeeded.add(work_id)
                state['succeeded'] = list(succeeded)
                save_state(STATE_FILE, state)

                update_statistics(STATS_FILE, 'downloads_succeeded', 1)

            else:
                logger.error(f"✗ Failed to download: {work_id}")

                failed.add(work_id)
                state['failed'] = list(failed)
                save_state(STATE_FILE, state)

                update_statistics(STATS_FILE, 'downloads_failed', 1)

            update_statistics(STATS_FILE, 'downloads_attempted', 1)

        except Exception as e:
            logger.error(f"Error processing {metadata_file.name}: {e}")
            failed.add(work_id)
            state['failed'] = list(failed)
            save_state(STATE_FILE, state)
            continue

def main():
    """Main download process."""
    logger.info("="*80)
    logger.info("ARCHIVE.ORG DOWNLOAD PROCESS STARTED")
    logger.info("="*80)

    # Ensure directories exist
    for directory in [DOWNLOADS_DIR, LOGS_DIR]:
        ensure_directory(directory)

    # Download works
    download_discovered_works()

    # Print summary
    state = load_state(STATE_FILE)
    succeeded = len(state.get('succeeded', []))
    failed = len(state.get('failed', []))

    logger.info("\n" + "="*80)
    logger.info("DOWNLOAD COMPLETE")
    logger.info("="*80)
    logger.info(f"Succeeded: {succeeded}")
    logger.info(f"Failed: {failed}")
    logger.info(f"Success rate: {succeeded/(succeeded+failed)*100:.1f}%" if (succeeded+failed) > 0 else "N/A")

if __name__ == '__main__':
    main()
