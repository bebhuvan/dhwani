#!/usr/bin/env python3
"""
Configuration for Archive.org fetch system.
"""

import os
from pathlib import Path

# Directory structure
BASE_DIR = Path(__file__).parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
METADATA_DIR = BASE_DIR / "metadata"
PROCESSED_DIR = BASE_DIR / "processed"
LOGS_DIR = BASE_DIR / "logs"

# State files
STATE_FILE = LOGS_DIR / "download_state.json"
STATS_FILE = LOGS_DIR / "statistics.json"
ERROR_LOG = LOGS_DIR / "errors.log"
PROGRESS_LOG = LOGS_DIR / "progress.log"

# Archive.org settings
ARCHIVE_API_BASE = "https://archive.org"
RATE_LIMIT_DELAY = 2.0  # seconds between requests
REQUEST_TIMEOUT = 30  # seconds
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

# Download settings
MIN_TEXT_LENGTH = 1000  # minimum characters for valid text
PREFERRED_FORMATS = ['txt', 'pdf', 'epub', 'html', 'djvu']
MAX_FILE_SIZE_MB = 500  # skip files larger than this

# Quality thresholds
MIN_QUALITY_SCORE = 0.3  # 0-1 scale
FUZZY_MATCH_THRESHOLD = 80  # for title matching (0-100)

# Priority works to download first (from recommendations)
PRIORITY_1_WORKS = [
    # Women Authors (Highest Priority)
    {
        'title': 'Akka Mahadevi Vachanas',
        'author': 'Akka Mahadevi',
        'language': 'Kannada',
        'year_range': [1100, 1200],
        'category': 'women_author'
    },
    {
        'title': 'Lal Ded',
        'author': 'Lalleshwari',
        'language': 'Kashmiri',
        'year_range': [1300, 1400],
        'category': 'women_author'
    },
    {
        'title': 'Habba Khatoon',
        'author': 'Habba Khatoon',
        'language': 'Kashmiri',
        'year_range': [1500, 1600],
        'category': 'women_author'
    },
    {
        'title': 'Therigatha',
        'author': 'Various',
        'language': 'Pali',
        'year_range': [-500, -400],
        'category': 'women_author'
    },
    {
        'title': 'Andal',
        'author': 'Andal',
        'language': 'Tamil',
        'year_range': [700, 800],
        'category': 'women_author'
    },

    # Kannada Classics (Major Gap)
    {
        'title': 'Kavirajamarga',
        'author': 'Amoghavarsha',
        'language': 'Kannada',
        'year_range': [800, 900],
        'category': 'kannada_classic'
    },
    {
        'title': 'Basavanna Vachanas',
        'author': 'Basavanna',
        'language': 'Kannada',
        'year_range': [1100, 1200],
        'category': 'kannada_classic'
    },
    {
        'title': 'Allama Prabhu Vachanas',
        'author': 'Allama Prabhu',
        'language': 'Kannada',
        'year_range': [1100, 1200],
        'category': 'kannada_classic'
    },

    # Scientific Works (Major Gap)
    {
        'title': 'Sangita Ratnakara',
        'author': 'Sharngadeva',
        'language': 'Sanskrit',
        'year_range': [1200, 1300],
        'category': 'scientific'
    },
    {
        'title': 'Brihat Samhita',
        'author': 'Varahamihira',
        'language': 'Sanskrit',
        'year_range': [500, 600],
        'category': 'scientific'
    },
    {
        'title': 'Brihaddeshi',
        'author': 'Matanga',
        'language': 'Sanskrit',
        'year_range': [800, 900],
        'category': 'scientific'
    },
    {
        'title': 'Lilavati',
        'author': 'Bhaskara',
        'language': 'Sanskrit',
        'year_range': [1100, 1200],
        'category': 'scientific'
    },
    {
        'title': 'Ashtanga Hridaya',
        'author': 'Vagbhata',
        'language': 'Sanskrit',
        'year_range': [600, 700],
        'category': 'scientific'
    },
]

PRIORITY_2_WORKS = [
    # Malayalam
    {
        'title': 'Lilatilakam',
        'author': 'Unknown',
        'language': 'Malayalam',
        'year_range': [1300, 1400],
        'category': 'regional_classic'
    },
    {
        'title': 'Indulekha',
        'author': 'Chandu Menon',
        'language': 'Malayalam',
        'year_range': [1880, 1900],
        'category': 'regional_classic'
    },

    # Odia
    {
        'title': 'Chha Mana Atha Guntha',
        'author': 'Fakir Mohan Senapati',
        'language': 'Odia',
        'year_range': [1890, 1920],
        'category': 'regional_classic'
    },

    # Tamil
    {
        'title': 'Purananuru',
        'author': 'Various',
        'language': 'Tamil',
        'year_range': [-100, 300],
        'category': 'tamil_sangam'
    },
    {
        'title': 'Periya Puranam',
        'author': 'Sekkizhar',
        'language': 'Tamil',
        'year_range': [1100, 1200],
        'category': 'tamil_classic'
    },

    # Sufi Poetry
    {
        'title': 'Heer Ranjha',
        'author': 'Waris Shah',
        'language': 'Punjabi',
        'year_range': [1760, 1770],
        'category': 'sufi_poetry'
    },
    {
        'title': 'Bulleh Shah Kafis',
        'author': 'Bulleh Shah',
        'language': 'Punjabi',
        'year_range': [1680, 1760],
        'category': 'sufi_poetry'
    },
    {
        'title': 'Shah Abdul Latif Bhittai Risalo',
        'author': 'Shah Abdul Latif Bhittai',
        'language': 'Sindhi',
        'year_range': [1690, 1752],
        'category': 'sufi_poetry'
    },
]

# Search strategies
SEARCH_STRATEGIES = {
    'direct_title': {
        'enabled': True,
        'priority': 1,
        'description': 'Search by exact title and author'
    },
    'fuzzy_title': {
        'enabled': True,
        'priority': 2,
        'description': 'Search with variations and transliterations'
    },
    'author_language': {
        'enabled': True,
        'priority': 3,
        'description': 'Search by author and language'
    },
    'subject_filter': {
        'enabled': True,
        'priority': 4,
        'description': 'Search by subject tags and language'
    },
    'collection_browse': {
        'enabled': True,
        'priority': 5,
        'description': 'Browse relevant collections'
    }
}

# Archive.org collections to search
RELEVANT_COLLECTIONS = [
    'indiacollection',
    'sanskrit',
    'opensource',
    'gutenberg',
    'inlibrary',
    'universallibrary',
    'digitallibraryindia',
]

# Subject tags to search
RELEVANT_SUBJECTS = [
    'Sanskrit literature',
    'Hindi literature',
    'Tamil literature',
    'Kannada literature',
    'Malayalam literature',
    'Telugu literature',
    'Bengali literature',
    'Marathi literature',
    'Gujarati literature',
    'Punjabi literature',
    'Urdu literature',
    'Indian philosophy',
    'Indian drama',
    'Indian poetry',
    'Bhakti literature',
    'Sufi poetry',
    'Ayurveda',
    'Sanskrit music',
    'Indian mathematics',
]
