#!/usr/bin/env python3
"""
Utility functions for Archive.org fetch system.
"""

import json
import logging
import time
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import hashlib

# Setup logging
def setup_logging(log_file: Path, level=logging.INFO):
    """Setup logging configuration."""
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

# State management
def load_state(state_file: Path) -> Dict:
    """Load download state from JSON file."""
    if state_file.exists():
        try:
            with open(state_file, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {'attempted': [], 'succeeded': [], 'failed': [], 'skipped': []}
    return {'attempted': [], 'succeeded': [], 'failed': [], 'skipped': []}

def save_state(state_file: Path, state: Dict):
    """Save download state to JSON file."""
    state_file.parent.mkdir(parents=True, exist_ok=True)
    with open(state_file, 'w') as f:
        json.dump(state, f, indent=2)

# Metadata management
def save_metadata(metadata_file: Path, metadata: Dict):
    """Save Archive.org metadata to JSON file."""
    metadata_file.parent.mkdir(parents=True, exist_ok=True)
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

def load_metadata(metadata_file: Path) -> Optional[Dict]:
    """Load metadata from JSON file."""
    if metadata_file.exists():
        try:
            with open(metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return None
    return None

# Text processing
def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    # Remove excessive whitespace
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    # Remove page numbers (simple pattern)
    text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
    # Remove excessive spaces
    text = re.sub(r' +', ' ', text)
    return text.strip()

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe file system use."""
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(filename) > 200:
        filename = filename[:200]
    return filename

def calculate_quality_score(text: str, metadata: Dict) -> float:
    """Calculate quality score for downloaded text."""
    score = 1.0

    # Penalize if text is too short
    if len(text) < 5000:
        score *= 0.5
    elif len(text) < 10000:
        score *= 0.7

    # Penalize if too many special characters (OCR errors)
    special_char_ratio = len(re.findall(r'[^\w\s\-.,!?;:()\[\]{}\'"]', text)) / max(len(text), 1)
    if special_char_ratio > 0.05:
        score *= 0.6

    # Penalize if too many single characters (OCR artifacts)
    single_chars = len(re.findall(r'\b\w\b', text))
    if single_chars / max(len(text.split()), 1) > 0.1:
        score *= 0.7

    # Bonus if has proper paragraphs
    paragraphs = text.split('\n\n')
    if len(paragraphs) > 10:
        score *= 1.1

    return min(score, 1.0)

# Title matching
def fuzzy_match_title(title1: str, title2: str, threshold: int = 80) -> bool:
    """Check if two titles match using fuzzy string matching."""
    try:
        from fuzzywuzzy import fuzz
        score = fuzz.ratio(title1.lower(), title2.lower())
        return score >= threshold
    except ImportError:
        # Fallback to simple string matching
        return title1.lower() in title2.lower() or title2.lower() in title1.lower()

def normalize_title(title: str) -> str:
    """Normalize title for comparison."""
    # Remove common prefixes/suffixes
    title = re.sub(r'^(the|a|an)\s+', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s+(translated|translation|by|from)\s+.*$', '', title, flags=re.IGNORECASE)
    # Remove punctuation
    title = re.sub(r'[^\w\s]', '', title)
    # Normalize whitespace
    title = ' '.join(title.split())
    return title.lower()

# Archive.org helpers
def build_search_query(work: Dict, strategy: str) -> str:
    """Build Archive.org search query based on strategy."""
    title = work.get('title', '')
    author = work.get('author', '')
    language = work.get('language', '')
    year_range = work.get('year_range', [])

    if strategy == 'direct_title':
        query = f'title:"{title}"'
        if author and author != 'Various' and author != 'Unknown':
            query += f' AND creator:"{author}"'
        return query

    elif strategy == 'fuzzy_title':
        # Search for title words separately
        title_words = title.split()[:3]  # First 3 words
        query = ' AND '.join([f'title:{word}' for word in title_words if len(word) > 3])
        if author and author != 'Various' and author != 'Unknown':
            query += f' AND creator:{author}'
        return query

    elif strategy == 'author_language':
        if author and author != 'Various' and author != 'Unknown':
            query = f'creator:"{author}"'
            if language:
                query += f' AND language:{language}'
            return query
        return ''

    elif strategy == 'subject_filter':
        if language:
            query = f'subject:"{language} literature"'
            if year_range:
                query += f' AND date:[{year_range[0]} TO {year_range[1]}]'
            return query
        return ''

    return ''

def generate_identifier(work: Dict) -> str:
    """Generate unique identifier for a work."""
    title = work.get('title', 'untitled')
    author = work.get('author', 'unknown')
    language = work.get('language', 'unknown')

    text = f"{title}_{author}_{language}".lower()
    # Create hash
    return hashlib.md5(text.encode()).hexdigest()[:12]

# Progress tracking
def log_progress(log_file: Path, message: str):
    """Log progress message."""
    log_file.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, 'a') as f:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        f.write(f"[{timestamp}] {message}\n")

def update_statistics(stats_file: Path, stat_type: str, increment: int = 1):
    """Update statistics JSON file."""
    stats_file.parent.mkdir(parents=True, exist_ok=True)

    if stats_file.exists():
        with open(stats_file, 'r') as f:
            stats = json.load(f)
    else:
        stats = {
            'total_recommended': 0,
            'searches_attempted': 0,
            'works_found': 0,
            'downloads_attempted': 0,
            'downloads_succeeded': 0,
            'downloads_failed': 0,
            'conversions_succeeded': 0,
            'conversions_failed': 0,
            'total_quality_score': 0.0,
            'last_updated': None
        }

    stats[stat_type] = stats.get(stat_type, 0) + increment
    stats['last_updated'] = datetime.now().isoformat()

    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2)

# Retry decorator
def retry_on_failure(max_retries: int = 3, delay: float = 2.0):
    """Decorator for retrying function on failure."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt < max_retries - 1:
                        time.sleep(delay * (attempt + 1))
                        continue
                    else:
                        raise e
        return wrapper
    return decorator

# File operations
def ensure_directory(directory: Path):
    """Ensure directory exists."""
    directory.mkdir(parents=True, exist_ok=True)

def get_file_hash(file_path: Path) -> str:
    """Get MD5 hash of file."""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

# Date helpers
def is_public_domain(year: int, current_year: int = 2024) -> bool:
    """Check if work is likely in public domain."""
    # Simple heuristic: published before 1929 in US, or author died >70 years ago
    if year and year < 1929:
        return True
    # Conservative: assume not PD if recent
    return False

def parse_year_from_date(date_str: str) -> Optional[int]:
    """Parse year from various date string formats."""
    if not date_str:
        return None

    # Try to extract 4-digit year
    match = re.search(r'\b(1\d{3}|2\d{3})\b', str(date_str))
    if match:
        return int(match.group(1))

    return None
