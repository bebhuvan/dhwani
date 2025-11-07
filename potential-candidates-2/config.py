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

# Priority works to download first
# MODIFIED: Searching for English translations (1850-2023) instead of original texts
# These works have high probability (60-90%) of being available on Archive.org

PRIORITY_1_WORKS = [
    # Tier 1: Very High Probability (70-90%)
    # Sanskrit Classics - widely translated in colonial era
    {
        'title': 'Shakuntala',
        'author': 'Kalidasa',
        'original_language': 'Sanskrit',
        'search_terms': ['Shakuntala', 'Kalidasa', 'Monier Williams', 'translation'],
        'year_range': [1850, 2023],  # Publication date of translations
        'category': 'sanskrit_drama',
        'search_mode': 'translation'  # Looking for English translations
    },
    {
        'title': 'Meghaduta',
        'author': 'Kalidasa',
        'original_language': 'Sanskrit',
        'search_terms': ['Meghaduta', 'Cloud Messenger', 'Kalidasa'],
        'year_range': [1850, 2023],
        'category': 'sanskrit_poetry',
        'search_mode': 'translation'
    },
    {
        'title': 'Gita Govinda',
        'author': 'Jayadeva',
        'original_language': 'Sanskrit',
        'search_terms': ['Gita Govinda', 'Jayadeva', 'Edwin Arnold'],
        'year_range': [1850, 2023],
        'category': 'sanskrit_poetry',
        'search_mode': 'translation'
    },
    {
        'title': 'Arthashastra',
        'author': 'Kautilya',
        'original_language': 'Sanskrit',
        'search_terms': ['Arthashastra', 'Kautilya', 'Chanakya', 'Shamasastry'],
        'year_range': [1900, 2023],
        'category': 'political_science',
        'search_mode': 'translation'
    },
    {
        'title': 'Yoga Sutras',
        'author': 'Patanjali',
        'original_language': 'Sanskrit',
        'search_terms': ['Yoga Sutras', 'Patanjali', 'aphorisms'],
        'year_range': [1850, 2023],
        'category': 'philosophy',
        'search_mode': 'translation'
    },
    {
        'title': 'Satakas',
        'author': 'Bhartrihari',
        'original_language': 'Sanskrit',
        'search_terms': ['Bhartrihari', 'Satakas', 'centuries', 'translation'],
        'year_range': [1850, 2023],
        'category': 'sanskrit_poetry',
        'search_mode': 'translation'
    },

    # Epics and Religious Texts
    {
        'title': 'Ramcharitmanas',
        'author': 'Tulsidas',
        'original_language': 'Awadhi',
        'search_terms': ['Ramcharitmanas', 'Tulsidas', 'Ramayana'],
        'year_range': [1850, 2023],
        'category': 'religious_epic',
        'search_mode': 'translation'
    },
    {
        'title': 'Mricchakatika',
        'author': 'Sudraka',
        'original_language': 'Sanskrit',
        'search_terms': ['Mricchakatika', 'Little Clay Cart', 'Sudraka'],
        'year_range': [1850, 2023],
        'category': 'sanskrit_drama',
        'search_mode': 'translation'
    },

    # Folk Literature
    {
        'title': 'Panchatantra',
        'author': 'Vishnusharma',
        'original_language': 'Sanskrit',
        'search_terms': ['Panchatantra', 'Panchatatantra', 'Arthur Ryder', 'fables'],
        'year_range': [1850, 2023],
        'category': 'folk_literature',
        'search_mode': 'translation'
    },
    {
        'title': 'Jataka Tales',
        'author': 'Various',
        'original_language': 'Pali',
        'search_terms': ['Jataka', 'tales', 'Buddha', 'birth stories'],
        'year_range': [1850, 2023],
        'category': 'buddhist_literature',
        'search_mode': 'translation'
    },
    {
        'title': 'Hitopadesha',
        'author': 'Narayana',
        'original_language': 'Sanskrit',
        'search_terms': ['Hitopadesha', 'Hitopadesa', 'fables', 'instruction'],
        'year_range': [1850, 2023],
        'category': 'folk_literature',
        'search_mode': 'translation'
    },

    # Devotional Poetry
    {
        'title': 'Kabir Poetry',
        'author': 'Kabir',
        'original_language': 'Hindi',
        'search_terms': ['Kabir', 'songs', 'dohas', 'Tagore'],
        'year_range': [1850, 2023],
        'category': 'bhakti_poetry',
        'search_mode': 'translation'
    },
    {
        'title': 'Mirabai Songs',
        'author': 'Mirabai',
        'original_language': 'Rajasthani',
        'search_terms': ['Mirabai', 'Meera', 'devotional', 'Krishna'],
        'year_range': [1900, 2023],
        'category': 'bhakti_poetry',
        'search_mode': 'translation'
    },
]

PRIORITY_2_WORKS = [
    # Tier 2: Moderate Probability (40-60%)
    # Tamil Classics
    {
        'title': 'Thirukkural',
        'author': 'Thiruvalluvar',
        'original_language': 'Tamil',
        'search_terms': ['Thirukkural', 'Tirukkural', 'Kural', 'Valluvar'],
        'year_range': [1850, 2023],
        'category': 'tamil_wisdom',
        'search_mode': 'translation'
    },
    {
        'title': 'Silappatikaram',
        'author': 'Ilango Adigal',
        'original_language': 'Tamil',
        'search_terms': ['Silappatikaram', 'Shilappadikaram', 'Tamil epic'],
        'year_range': [1900, 2023],
        'category': 'tamil_epic',
        'search_mode': 'translation'
    },

    # Buddhist Texts
    {
        'title': 'Dhammapada',
        'author': 'Various',
        'original_language': 'Pali',
        'search_terms': ['Dhammapada', 'Buddhist', 'sayings', 'Max Muller'],
        'year_range': [1850, 2023],
        'category': 'buddhist_literature',
        'search_mode': 'translation'
    },

    # More Sanskrit Drama
    {
        'title': 'Uttara Rama Charita',
        'author': 'Bhavabhuti',
        'original_language': 'Sanskrit',
        'search_terms': ['Uttara Rama Charita', 'Bhavabhuti', 'Ramayana'],
        'year_range': [1850, 2023],
        'category': 'sanskrit_drama',
        'search_mode': 'translation'
    },
    {
        'title': 'Kadambari',
        'author': 'Bana',
        'original_language': 'Sanskrit',
        'search_terms': ['Kadambari', 'Bana', 'Banabhatta', 'romance'],
        'year_range': [1850, 2023],
        'category': 'sanskrit_prose',
        'search_mode': 'translation'
    },

    # Story Collections
    {
        'title': 'Kathasaritsagara',
        'author': 'Somadeva',
        'original_language': 'Sanskrit',
        'search_terms': ['Kathasaritsagara', 'Ocean of Story', 'Tawney', 'Somadeva'],
        'year_range': [1880, 2023],
        'category': 'story_collection',
        'search_mode': 'translation'
    },
    {
        'title': 'Dasakumaracharita',
        'author': 'Dandin',
        'original_language': 'Sanskrit',
        'search_terms': ['Dasakumaracharita', 'Ten Princes', 'Dandin'],
        'year_range': [1900, 2023],
        'category': 'sanskrit_prose',
        'search_mode': 'translation'
    },

    # Early Modern Works
    {
        'title': 'Anandamath',
        'author': 'Bankim Chandra Chatterjee',
        'original_language': 'Bengali',
        'search_terms': ['Anandamath', 'Bankim Chandra', 'Chatterjee'],
        'year_range': [1880, 2023],
        'category': 'modern_bengali',
        'search_mode': 'translation'
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
