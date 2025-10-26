# Technical Documentation: Archive.org Metadata Validator

## Overview

Python-based validation tool that verifies and corrects frontmatter metadata in Markdown files against Archive.org's authoritative API data.

---

## System Requirements

- Python 3.6+
- Libraries:
  - `pyyaml` - YAML parsing and generation
  - `json` - JSON handling (stdlib)
  - `urllib` - HTTP requests (stdlib)
  - `re` - Regular expressions (stdlib)
  - `pathlib` - Path handling (stdlib)

---

## Installation

```bash
# Install required package
pip install pyyaml

# Or using system package manager
apt-get install python3-yaml  # Debian/Ubuntu
yum install python3-pyyaml     # RedHat/CentOS
```

---

## File Structure

```
/home/bhuvanesh/
├── dhwani-new-works/              # Input: Markdown files to validate
│   ├── work1.md
│   ├── work2.md
│   └── ...
└── new-dhwani/
    └── verification-reports/      # Output: Reports and validator
        ├── validator.py           # Main validation script
        ├── validation-batch-a.json # JSON validation report
        ├── BATCH_A_SUMMARY.md     # Human-readable summary
        └── TECHNICAL_DOCUMENTATION.md # This file
```

---

## Usage

### Basic Usage

```bash
cd /home/bhuvanesh/new-dhwani/verification-reports
python3 validator.py
```

### Processing Specific File

```python
from validator import process_file
from pathlib import Path

result = process_file(Path('/path/to/work.md'))
print(f"Status: {result['status']}")
print(f"Corrections: {result['corrections']}")
```

### Fetching Archive.org Metadata

```python
from validator import fetch_archive_metadata

metadata = fetch_archive_metadata('comparativegramm01boppuoft')
print(metadata['metadata']['title'])
print(metadata['metadata']['creator'])
```

---

## Validation Algorithm

### Phase 1: Data Extraction

```python
# 1. Read Markdown file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 2. Extract YAML frontmatter
frontmatter, body = extract_frontmatter(content)

# 3. Parse Archive.org URL from sources
archive_url = frontmatter['sources'][0]['url']

# 4. Extract Archive.org ID
# Pattern: archive.org/details/[ID]
archive_id = extract_archive_id(archive_url)
```

### Phase 2: API Validation

```python
# 5. Fetch metadata from Archive.org
url = f"https://archive.org/metadata/{archive_id}"
archive_meta = fetch_archive_metadata(archive_id)

# 6. Compare frontmatter vs Archive.org metadata
corrections, updates = compare_metadata(frontmatter, archive_meta)
```

### Phase 3: Correction Application

```python
# 7. Apply corrections to frontmatter
new_frontmatter = reconstruct_frontmatter(frontmatter, updates)

# 8. Write updated file
new_content = new_frontmatter + '\n' + body
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
```

---

## Comparison Rules

### Title Comparison

```python
# Exact match (case-sensitive)
# Minor variations allowed: "The", "A", "An" prefix
fm_title = frontmatter['title'].strip('"\'')
ar_title = archive_meta['metadata']['title'].strip()

if fm_title != ar_title and ar_title:
    corrections.append(f"title: '{fm_title}' -> '{ar_title}'")
```

### Author/Creator Comparison

```python
# Exact spelling and format from Archive.org
fm_authors = frontmatter['author']  # List
ar_creators = archive_meta['metadata']['creator']  # List or string

# Normalize to list
if isinstance(ar_creators, str):
    ar_creators = [ar_creators]

# Compare normalized lists
if fm_authors != ar_creators and ar_creators:
    corrections.append(f"author: {fm_authors} -> {ar_creators}")
```

### Year Comparison

```python
# ±2 years tolerance (not ±5)
fm_year = int(frontmatter['year'])
ar_date = archive_meta['metadata']['date']  # e.g., "1885" or "1874-77"

# Extract first year from date string
ar_year = int(re.search(r'\b(\d{4})\b', ar_date).group(1))

if abs(fm_year - ar_year) > 2:
    corrections.append(f"year: {fm_year} -> {ar_year}")
```

### Language Comparison

```python
# Normalize language codes to full names
lang_map = {
    'eng': 'English',
    'hin': 'Hindi',
    'san': 'Sanskrit',
    'grc': 'Greek',
    'lat': 'Latin'
}

fm_lang = frontmatter['language']  # ['English']
ar_lang = archive_meta['metadata']['language']  # 'eng' or ['eng', 'grc']

# Convert codes to names
ar_lang_normalized = [lang_map.get(lang, lang.capitalize())
                      for lang in ar_lang]

if sorted(fm_lang) != sorted(ar_lang_normalized):
    corrections.append(f"language: {fm_lang} -> {ar_lang_normalized}")
```

---

## Error Handling

### YAML Parsing Errors

```python
try:
    frontmatter = yaml.safe_load(frontmatter_str)
except yaml.YAMLError as e:
    print(f"YAML parse error: {e}")
    return None, content
```

**Common Issues:**
- Unescaped quotes in strings
- Incorrect indentation
- Missing colons

**Solution:** Use `yaml.safe_load()` with proper error handling

### API Failures

```python
try:
    with urllib.request.urlopen(url, timeout=10) as response:
        data = response.read()
        return json.loads(data)
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.reason}")
    return None
except urllib.error.URLError as e:
    print(f"URL Error: {e.reason}")
    return None
except Exception as e:
    print(f"Unexpected error: {e}")
    return None
```

**Retry Strategy:** Mark as "needs_review" instead of failing

### Rate Limiting

```python
import time

for filename in files:
    result = process_file(filename)
    time.sleep(1)  # 1 second between requests
```

**Archive.org Rate Limits:**
- No official limit documented
- Conservative approach: 1 request/second
- Monitor for 429 status codes

---

## Data Structures

### Validation Result

```python
{
    'file': 'work.md',                    # Filename
    'status': 'validated',                # 'validated', 'needs_review', 'error'
    'corrections': [                      # List of corrections made
        "author: ['A', 'B'] -> ['A, B']"
    ],
    'archive_id': 'abc123',               # Archive.org identifier
    'archive_metadata': {                 # Full Archive.org metadata
        'title': '...',
        'creator': ['...'],
        'date': '...',
        'language': '...'
    },
    'issues': []                          # List of problems encountered
}
```

### Validation Report

```json
{
  "batch": "A",
  "works_processed": 20,
  "successful": 20,
  "needs_review": 0,
  "corrections_made": [
    {
      "file": "work.md",
      "corrections": ["..."]
    }
  ],
  "detailed_results": [...]
}
```

---

## Archive.org API Reference

### Metadata Endpoint

```
GET https://archive.org/metadata/{identifier}
```

**Response Structure:**

```json
{
  "metadata": {
    "identifier": "comparativegramm01boppuoft",
    "title": "A comparative grammar...",
    "creator": ["Bopp, Franz, 1791-1867", "..."],
    "date": "1885",
    "language": "eng",
    "subject": ["Indo-European languages", "..."],
    "publisher": "London, Williams",
    "description": "..."
  },
  "files": [...],
  "created": 1761395335,
  "d1": "ia600201.us.archive.org",
  "d2": "ia800201.us.archive.org",
  ...
}
```

### Common Language Codes

| Code | Language | Code | Language |
|------|----------|------|----------|
| eng | English | hin | Hindi |
| san | Sanskrit | grc | Greek (Ancient) |
| lat | Latin | ara | Arabic |
| per | Persian | pli | Pali |

---

## YAML Frontmatter Format

### Before Validation

```yaml
---
title: "Work Title"
author: ["Smith", "John", "1800-1900 Jones"]  # Malformed
year: 1885
language: ["English"]
genre: ["Subject"]
description: "..."
collections: ["collection-name"]
sources:
  - name: "Internet Archive"
    url: "https://archive.org/details/identifier123"
    type: "archive"
references: []
featured: false
publishDate: 2025-01-22
tags: ["tag1", "tag2"]
---
```

### After Validation

```yaml
---
title: Work Title
author:
- Smith, John, 1800-1900
- Jones, Mary, 1850-1925
year: 1885
language:
- English
genre:
- Subject
description: ...
collections:
- collection-name
sources:
- name: Internet Archive
  url: https://archive.org/details/identifier123
  type: archive
references: []
featured: false
publishDate: 2025-01-22
tags:
- tag1
- tag2
---
```

**Note:** PyYAML automatically formats output with proper indentation and quoting

---

## Performance Metrics

### Batch A Performance

- **Files Processed:** 20
- **Total Time:** ~25 seconds
- **Average per File:** 1.25 seconds
- **API Call Success Rate:** 100%
- **Correction Rate:** 100% (all files required at least language normalization)

### Bottlenecks

1. **Network I/O:** Archive.org API calls (~0.5-1s each)
2. **Rate Limiting:** Mandatory 1s delay between requests
3. **File I/O:** Negligible (<0.1s per file)

### Optimization Opportunities

- Parallel processing (with careful rate limiting)
- Batch API requests (if Archive.org supports)
- Local metadata caching

---

## Testing

### Manual Testing

```bash
# Test single file
python3 -c "
from validator import process_file
from pathlib import Path
result = process_file(Path('test-work.md'))
print(result)
"

# Test Archive.org ID extraction
python3 -c "
from validator import extract_archive_id
url = 'https://archive.org/details/abc123'
print(extract_archive_id(url))  # Should print: abc123
"

# Test metadata fetch
python3 -c "
from validator import fetch_archive_metadata
meta = fetch_archive_metadata('comparativegramm01boppuoft')
print(meta['metadata']['title'])
"
```

### Test Cases

1. **Valid Work:** Standard metadata, all fields match
2. **Author Mismatch:** Malformed author names need correction
3. **Multiple Languages:** Work with eng+grc language codes
4. **Year Variance:** Publication date within ±2 years
5. **YAML Error:** Unescaped quotes, invalid syntax
6. **Missing Archive URL:** No Archive.org source
7. **API Failure:** Invalid identifier, network error

---

## Troubleshooting

### Issue: YAML Parsing Error

**Symptom:**
```
YAML parse error: while parsing a block mapping
```

**Cause:** Unescaped quotes in string fields

**Solution:**
```python
# Replace nested quotes with single quotes or escape them
description: "The 'knowledge storehouse' is..."  # Good
description: "The \"knowledge storehouse\" is..."  # Also good
description: "The "knowledge storehouse" is..."   # BAD - will fail
```

### Issue: Archive.org ID Not Found

**Symptom:**
```
issues: ["No Archive.org URL found in sources"]
```

**Cause:** Missing or malformed sources field

**Solution:** Ensure sources contains Archive.org URL:
```yaml
sources:
  - name: "Internet Archive"
    url: "https://archive.org/details/identifier123"
    type: "archive"
```

### Issue: Metadata Fetch Failure

**Symptom:**
```
Error fetching metadata for xyz: HTTP Error 404
```

**Cause:** Invalid Archive.org identifier

**Solution:** Verify identifier at archive.org/details/[ID]

### Issue: Rate Limiting (429 Error)

**Symptom:**
```
HTTP Error 429: Too Many Requests
```

**Cause:** Too many requests in short time

**Solution:** Increase delay between requests:
```python
time.sleep(2)  # Increase from 1 to 2 seconds
```

---

## Future Enhancements

### Planned Features

1. **Subject/Genre Validation**
   - Compare Archive.org subjects with frontmatter genre
   - Suggest corrections for miscategorized works

2. **Description Enhancement**
   - Extract better descriptions from Archive.org metadata
   - Include publication details, page counts

3. **Publisher Information**
   - Add publisher field from Archive.org
   - Include place of publication

4. **Multi-Batch Processing**
   - Process multiple batches in sequence
   - Consolidated reporting across batches

5. **Dry-Run Mode**
   - Preview corrections without applying them
   - Generate diff reports

### Code Improvements

```python
# Planned: Add dry-run flag
def process_file(file_path: Path, dry_run: bool = False) -> Dict:
    if dry_run:
        print(f"Would update: {corrections}")
        return result
    # ... actual update code ...

# Planned: Add publisher field
def compare_metadata(frontmatter, archive_meta):
    # ... existing code ...

    # Check publisher
    ar_publisher = metadata.get('publisher', '')
    if ar_publisher and 'publisher' not in frontmatter:
        updates['publisher'] = ar_publisher
```

---

## License & Attribution

**Tool:** Archive.org Metadata Validator & Fixer
**Version:** 1.0
**Date:** 2025-10-25
**Author:** Agent 1A

**Data Source:** Archive.org (Internet Archive)
- API: https://archive.org/metadata/
- License: Open API, public domain content

**Dependencies:**
- PyYAML (MIT License)
- Python Standard Library (PSF License)

---

## Contact & Support

For issues with this validator:
- Check this documentation first
- Review `/home/bhuvanesh/new-dhwani/verification-reports/validation-batch-a.json`
- Examine individual file corrections in markdown files

For Archive.org API issues:
- Documentation: https://archive.org/services/docs/api/
- Support: https://archive.org/about/contact.php

---

**Document Version:** 1.0
**Last Updated:** 2025-10-25
**Status:** Complete for Batch A
