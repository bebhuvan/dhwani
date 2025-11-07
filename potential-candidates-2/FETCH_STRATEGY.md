# Archive.org Fetch Strategy for Dhwani

**Goal**: Systematically fetch 400-500 recommended works from Archive.org and store as markdown files

---

## 🏗️ Folder Structure

```
potential-candidates-2/
├── downloads/          # Raw downloaded files (txt, pdf, epub, etc.)
├── metadata/           # JSON metadata for each work
├── processed/          # Converted markdown files ready for review
├── logs/              # Download logs, errors, progress tracking
└── FETCH_STRATEGY.md  # This file
```

---

## 🎯 Multi-Strategy Approach

We'll use **5 parallel strategies** to maximize success rate:

### Strategy 1: Direct Title/Author Search
- Search Archive.org API for specific titles from recommendations
- Best for: Well-known classical works
- Success rate: ~60-70% (many works available)

### Strategy 2: Collection-Based Discovery
- Search within specific Archive.org collections:
  - `indiacollection`
  - `sanskrit`
  - `inlibrary` (In-Library only but many PD)
  - `opensource`
  - `gutenberg`
- Best for: Discovering variations and editions
- Success rate: ~40-50% (quality varies)

### Strategy 3: Subject/Topic Filtering
- Search by subjects: "Hindi literature", "Kannada poetry", "Sanskrit drama"
- Combined with date filters (pre-1929 for PD)
- Best for: Broad coverage of categories
- Success rate: ~30-40% (noise in results)

### Strategy 4: Language + Date Range Search
- Target specific languages with year filters
- Example: `language:Kannada AND date:[1000 TO 1929]`
- Best for: Regional language gap filling
- Success rate: ~50-60%

### Strategy 5: Creator/Author Search
- Search by known authors from recommendations
- Example: "Akka Mahadevi", "Basavanna", "Kalidasa"
- Best for: Author-specific collections
- Success rate: ~70-80% (famous authors)

---

## 📥 Download Methods (Fallback Chain)

For each work, try methods in this order:

### Method 1: Plain Text (Fastest)
1. Check for `_djvu.txt` (OCR from DjVu)
2. Check for `_text.txt` (plain text)
3. **Pros**: Fast, small files, ready to use
4. **Cons**: OCR errors, formatting issues

### Method 2: Text-Embedded PDF
1. Download PDF with text layer
2. Extract using `pdftotext` or `pypdf2`
3. **Pros**: Better formatting, verifiable
4. **Cons**: Larger files, extraction needed

### Method 3: EPUB/HTML
1. Download EPUB or HTML version
2. Extract text content
3. **Pros**: Good structure, metadata
4. **Cons**: Not always available

### Method 4: OCR from Images
1. Download page images
2. Run OCR if needed
3. **Pros**: Last resort, gets everything
4. **Cons**: Slow, requires OCR engine

---

## 🛡️ Robustness Features

### 1. Progress Tracking
- **State file**: `logs/download_state.json`
- Tracks: attempted, succeeded, failed, skipped
- Resume from interruption

### 2. Error Handling
- Retry logic: 3 attempts with exponential backoff
- Network timeout: 30 seconds
- Rate limiting: 1 request per 2 seconds (Archive.org friendly)
- Log all errors with context

### 3. Duplicate Detection
- Check against existing repository works
- Use title similarity matching (fuzzy)
- Track Archive.org identifiers

### 4. Quality Verification
- Minimum text length check (1000 characters)
- Encoding validation (UTF-8)
- Language detection (verify matches metadata)
- OCR quality score (if applicable)

### 5. Metadata Preservation
- Save complete Archive.org metadata
- Track: identifier, title, creator, date, language, subjects
- Useful for later YAML frontmatter generation

---

## 🔄 Workflow

### Phase 1: Discovery (Search & Catalog)
```
For each work in recommendations:
  1. Search Archive.org API
  2. Rank results by relevance
  3. Save metadata to metadata/
  4. Add to download queue
  5. Log progress
```

### Phase 2: Download (Fetch Content)
```
For each queued item:
  1. Check if already downloaded (resume)
  2. Try download methods in order (fallback chain)
  3. Verify download quality
  4. Save to downloads/
  5. Update state file
```

### Phase 3: Conversion (To Markdown)
```
For each downloaded file:
  1. Extract text content
  2. Clean and normalize
  3. Convert to markdown
  4. Add basic frontmatter (from metadata)
  5. Save to processed/
  6. Log conversion status
```

### Phase 4: Review (Manual Quality Check)
```
Human review of processed/:
  1. Check accuracy
  2. Fix OCR errors if critical
  3. Verify attribution
  4. Move to main repository or discard
```

---

## 🎨 Markdown Format Template

```markdown
---
title: "Work Title from Archive.org"
author:
  - "Author Name"
year: YYYY
language:
  - "Original Language"
source: "Archive.org"
archive_id: "archive-identifier"
download_date: "YYYY-MM-DD"
quality_score: 0.XX
needs_review: true
original_url: "https://archive.org/details/identifier"
---

# [Work Title]

[Extracted text content...]

---

*Downloaded from Archive.org on YYYY-MM-DD*
*Archive.org identifier: [identifier]*
*This is a candidate work - requires review before adding to main repository*
```

---

## 🔍 Search Query Examples

### By Title
```
title:"Akka Mahadevi Vachanas" OR title:"Vachanas Akka Mahadevi"
```

### By Author
```
creator:"Kalidasa" AND language:Sanskrit
```

### By Subject
```
subject:"Kannada Literature" AND date:[1000 TO 1929]
```

### By Collection
```
collection:indiacollection AND language:Tamil AND mediatype:texts
```

### Combined
```
(title:"Sangita Ratnakara" OR creator:"Sharngadeva")
AND language:Sanskrit
AND date:[1200 TO 1300]
```

---

## 📊 Priority Queues

### Priority 1 (High Value - Download First)
- Women authors (Akka Mahadevi, Lal Ded, etc.)
- Kannada classics (biggest gap)
- Scientific works (Sangita Ratnakara, astronomy/math)
- Malayalam classics

### Priority 2 (Medium Value)
- Odia literature
- Tamil classics not yet in repo
- Sufi poetry
- Folk literature

### Priority 3 (Nice to Have)
- Additional editions of existing works
- Translations
- Commentaries
- Reference works

---

## ⚠️ Edge Cases to Handle

1. **Multiple Editions**: Choose best quality, note alternatives
2. **Translations vs Originals**: Prefer originals, note translation info
3. **Incomplete OCR**: Flag for manual review
4. **Wrong Attribution**: Verify against metadata
5. **Modern Reprints**: Check original publication date
6. **Collections vs Individual Works**: Extract individual works
7. **Non-PD Works**: Skip, log for manual verification

---

## 📈 Success Metrics

Track in `logs/statistics.json`:
- Total works in recommendations: ~450
- Successfully found on Archive.org: X
- Successfully downloaded: Y
- Successfully converted: Z
- Quality score average: A
- Failed searches: F
- Failed downloads: D

**Target**: 60-70% success rate (270-315 works)

---

## 🔧 Tools & Dependencies

**Required Python packages:**
```
pip install internetarchive requests beautifulsoup4 pdfplumber pypdf2
pip install markdown python-magic langdetect fuzzywuzzy python-Levenshtein
```

**Optional but helpful:**
```
pip install tqdm colorama  # Progress bars and colored output
```

**Command-line tools:**
```
apt-get install pdftotext tesseract-ocr  # Text extraction
```

---

## 🚀 Execution Plan

### Week 1: Setup & Testing
- Set up environment
- Test Archive.org API access
- Test download methods on 10 sample works
- Verify markdown conversion quality

### Week 2: Priority 1 (100 works)
- Women authors
- Kannada classics
- Scientific works
- Quality verification

### Week 3: Priority 2 (100 works)
- Regional classics
- Folk literature
- Medieval poetry

### Week 4: Priority 3 & Cleanup
- Remaining works
- Quality improvements
- Documentation
- Handoff for review

---

## 📝 Notes

- Archive.org API rate limit: Be respectful, 1-2 req/sec
- Some works may need manual download (restricted access)
- OCR quality varies - always verify
- Metadata sometimes incorrect - cross-reference
- Some languages may need special character handling

---

**Next Steps**: Run the automated scripts, monitor progress, review outputs
