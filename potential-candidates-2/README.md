# Dhwani Archive.org Fetch System

Automated system to discover, download, and convert historical Indian literature from Archive.org.

---

## 🎯 Purpose

This system helps systematically fetch the ~450 recommended works identified in `RECOMMENDED_WORKS_TO_ADD.md` from Archive.org. It uses multiple search strategies and download methods to maximize success rate.

**Target**: 60-70% success rate (270-315 works downloaded)

---

## 📁 Directory Structure

```
potential-candidates-2/
├── downloads/           # Raw downloaded files (.txt, .pdf, etc.)
├── metadata/           # JSON metadata for each work
├── processed/          # Converted markdown files (ready for review)
├── logs/              # Progress logs, errors, state tracking
│
├── config.py          # Configuration and priority lists
├── utils.py           # Utility functions
│
├── 1_search_discover.py      # Step 1: Search Archive.org
├── 2_download_works.py       # Step 2: Download found works
├── 3_convert_to_markdown.py  # Step 3: Convert to markdown
│
├── run_fetch_pipeline.py     # Master orchestrator
├── requirements.txt          # Python dependencies
├── FETCH_STRATEGY.md        # Detailed strategy document
└── README.md                # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# Optional: For PDF extraction
pip install pdfplumber pypdf

# Optional: For EPUB extraction
pip install ebooklib beautifulsoup4

# Optional: For progress bars
pip install tqdm colorama
```

### 2. Run the Complete Pipeline

```bash
# Run all 3 steps automatically
python run_fetch_pipeline.py
```

### 3. Run Individual Steps

```bash
# Step 1: Search and discover
python run_fetch_pipeline.py --step 1

# Step 2: Download works
python run_fetch_pipeline.py --step 2

# Step 3: Convert to markdown
python run_fetch_pipeline.py --step 3
```

### 4. Skip Steps

```bash
# Run pipeline but skip step 1 (if already searched)
python run_fetch_pipeline.py --skip 1

# Skip multiple steps
python run_fetch_pipeline.py --skip 1 2
```

---

## 📋 What Each Step Does

### Step 1: Search & Discover (`1_search_discover.py`)

**Purpose**: Find works on Archive.org using multiple search strategies

**Strategies**:
1. Direct title/author search
2. Fuzzy title matching
3. Author + language search
4. Subject-based filtering
5. Collection browsing

**Output**:
- `metadata/*.json` - Metadata for found works
- `metadata/discovery_summary.json` - Overall statistics

**Duration**: ~30-60 minutes (depending on number of works)

### Step 2: Download (`2_download_works.py`)

**Purpose**: Download text content from discovered works

**Download Methods** (tried in order):
1. Plain text (`.txt`, `_djvu.txt`) - Fastest
2. PDF with text extraction - Most reliable
3. EPUB conversion - Good structure
4. HTML extraction - Fallback

**Features**:
- Automatic fallback if method fails
- Quality verification (minimum length, OCR quality)
- Resume capability (tracks progress)
- Rate limiting (Archive.org friendly)

**Output**:
- `downloads/*.txt` - Extracted text files
- `downloads/*_info.json` - Download metadata

**Duration**: ~2-4 hours (depending on number of works and file sizes)

### Step 3: Convert to Markdown (`3_convert_to_markdown.py`)

**Purpose**: Convert plain text to markdown with frontmatter

**Features**:
- Generates YAML frontmatter from metadata
- Includes quality score
- Adds source attribution
- Marks as "candidate" for review

**Output**:
- `processed/*.md` - Ready-to-review markdown files

**Duration**: ~5-10 minutes

---

## 🎛️ Configuration

### Edit `config.py` to customize:

**Priority Works**:
- `PRIORITY_1_WORKS` - Highest priority (women authors, Kannada, scientific)
- `PRIORITY_2_WORKS` - Medium priority (regional classics, folk, Sufi)

**Download Settings**:
- `MIN_TEXT_LENGTH` - Minimum characters (default: 1000)
- `MAX_FILE_SIZE_MB` - Skip large files (default: 500 MB)
- `RATE_LIMIT_DELAY` - Seconds between requests (default: 2.0)

**Quality Thresholds**:
- `MIN_QUALITY_SCORE` - Accept if >= this (default: 0.3)
- `FUZZY_MATCH_THRESHOLD` - Title matching (default: 80%)

---

## 📊 Monitoring Progress

### Check Logs

```bash
# View progress log
tail -f logs/progress.log

# View errors
cat logs/errors.log
```

### Check Statistics

```bash
# View statistics
cat logs/statistics.json
```

### Check State

```bash
# View download state
cat logs/download_state.json
```

---

## 🔧 Troubleshooting

### Problem: Script fails with import errors

**Solution**: Install missing dependencies
```bash
pip install requests pyyaml pdfplumber beautifulsoup4
```

### Problem: Downloads fail with timeout

**Solution**: Increase timeout in `config.py`
```python
REQUEST_TIMEOUT = 60  # Increase from 30 to 60 seconds
```

### Problem: OCR quality is poor

**Solution**: Adjust quality threshold in `config.py`
```python
MIN_QUALITY_SCORE = 0.2  # Lower threshold (more lenient)
```

### Problem: Script stops mid-execution

**Solution**: Resume from state file (automatic)
```bash
# Just re-run the pipeline - it will resume where it left off
python run_fetch_pipeline.py
```

### Problem: Want to re-download a work

**Solution**: Remove from state file
```bash
# Edit logs/download_state.json
# Remove work_id from "succeeded" or "failed" list
```

---

## 📝 Output Format

### Markdown Files (`processed/*.md`)

Each markdown file includes:

```yaml
---
title: "Work Title"
author:
  - "Author Name"
year: YYYY
language:
  - "Language"
genre:
  - "Genre/Subject"
source: "Archive.org"
archive_id: "identifier"
archive_url: "https://archive.org/details/identifier"
download_date: "YYYY-MM-DD"
quality_score: 0.XX
text_length: NNNN
status: "candidate"
needs_review: true
category: "category_name"
---

# Work Title

[Full text content...]

---

*Downloaded from Archive.org*
*Archive.org ID: [identifier](https://archive.org/details/identifier)*
*Download date: YYYY-MM-DD*
*Quality score: 0.XX*

**Note**: This is a candidate work. Requires human review.
```

---

## ✅ Review Process

After the pipeline completes:

### 1. Review Processed Files

```bash
# List all processed markdown files
ls processed/

# Check a random sample
head -50 processed/some_work.md
```

### 2. Verify Quality

Check for:
- ✅ Correct title and author
- ✅ Text is readable (not gibberish)
- ✅ Language is correct
- ✅ No major OCR errors
- ✅ Complete work (not truncated)

### 3. Quality Scores

- **0.8-1.0**: Excellent - likely perfect OCR
- **0.5-0.8**: Good - minor issues
- **0.3-0.5**: Acceptable - needs review
- **< 0.3**: Poor - not automatically downloaded

### 4. Move to Main Repository

```bash
# After review, move approved works to main repository
cp processed/approved_work.md ../src/content/works/
```

---

## 📈 Expected Results

Based on the strategy:

**Priority 1** (~15 works):
- Women authors: 5 works
- Kannada classics: 3 works
- Scientific works: 5 works
- Malayalam: 2 works

**Estimated Success Rates**:
- Search & discover: 70% (10-11 works found)
- Download: 60% (6-7 works downloaded)
- Quality threshold: 80% (5-6 high-quality works)

**Final Output**: 5-6 high-quality candidate works from Priority 1

**Priority 2** (~10 works):
- Regional classics: 5 works
- Sufi poetry: 3 works
- Tamil classics: 2 works

**Estimated**: 4-5 high-quality works

**Total from initial run**: 10-12 high-quality candidate works

---

## 🔄 Iterative Improvement

After first run:

1. **Analyze failures** in `logs/errors.log`
2. **Adjust search strategies** in `config.py`
3. **Add more works** to priority lists
4. **Re-run** with `--skip 1` if you just want to re-download

---

## 🤝 Archive.org Best Practices

We follow these principles:

- ✅ Respect rate limits (2 second delay)
- ✅ Use reasonable timeouts
- ✅ Identify ourselves in User-Agent
- ✅ Only download what we need
- ✅ Verify public domain status
- ✅ Attribute properly in markdown

---

## 🐛 Reporting Issues

If you encounter issues:

1. Check `logs/errors.log`
2. Check `logs/progress.log`
3. Verify internet connection
4. Try running individual steps
5. Check Archive.org is accessible

---

## 📚 Additional Resources

- **Strategy Document**: See `FETCH_STRATEGY.md` for detailed strategy
- **Recommendations**: See `RECOMMENDED_WORKS_TO_ADD.md` for full list
- **Archive.org API**: https://archive.org/services/docs/api/
- **Archive.org Search**: https://archive.org/advancedsearch.php

---

## 🎓 Learning & Experimentation

This system is designed to be:
- **Modular**: Run steps independently
- **Resumable**: Can stop and restart anytime
- **Configurable**: Easy to adjust priorities and thresholds
- **Transparent**: Logs everything for learning

Feel free to:
- Modify search strategies
- Adjust quality thresholds
- Add new download methods
- Experiment with different priority lists

---

**Created for**: Dhwani Project
**Purpose**: Systematic acquisition of public domain Indian literature
**Approach**: Multi-strategy search with fallback downloads
**Goal**: Build comprehensive digital library of Indian cultural heritage
