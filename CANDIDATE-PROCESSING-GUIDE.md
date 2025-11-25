# Dhwani Candidate Processing Guide

## Overview

This comprehensive system processes, verifies, and organizes potential works for the Dhwani digital library. It includes multiple quality checks, AI-powered verification, and batch organization for manual review.

## What This System Does

### 1. **Multi-Stage Verification**
- ✅ Verifies all works are genuinely India-related
- ✅ Checks for duplicates against 763 existing works
- ✅ Validates Archive.org links
- ✅ Converts Wikipedia/OpenLibrary search URLs to actual article links
- ✅ Generates scholarly descriptions without marketing fluff
- ✅ Quality checks all descriptions
- ✅ Finds alternative archive links for redundancy

### 2. **Quality Control**
Every work goes through rigorous checks:
- Required field validation
- Description quality analysis (no fluff/filler)
- India relevance verification using AI
- Link validity testing
- Duplicate detection with fuzzy matching

### 3. **Batch Organization**
- Organizes verified works into batches of 10
- Creates review checklists for manual verification
- Generates manifests for tracking

## System Components

### Core Scripts

1. **`master-workflow.sh`** - Main orchestration script
   - Runs all processing steps in order
   - Handles errors gracefully
   - Provides progress updates
   - Generates comprehensive logs

2. **`process-potential-candidates.js`** - Initial processing
   - Loads all candidates
   - Performs duplicate detection
   - Basic verification

3. **`fix-candidate-links.js`** - Link fixing
   - Converts search URLs to actual Wikipedia articles
   - Finds proper OpenLibrary work pages
   - Uses Wikipedia and OpenLibrary APIs

4. **`generate-scholarly-descriptions.js`** - Description generation
   - Uses Claude API (Haiku 4) for high-quality descriptions
   - Enforces academic/scholarly tone
   - Removes marketing language
   - Quality scoring system

5. **`comprehensive-verification.js`** - Full verification
   - Required fields check
   - Description quality analysis
   - AI-powered India relevance check
   - Link validation
   - Duplicate detection
   - Generates detailed report

6. **`organize-into-batches.js`** - Batch creation
   - Creates folders of 10 works each
   - Generates review checklists
   - Creates batch manifests

7. **`find-alternative-archive-links.js`** - Redundancy
   - Searches Archive.org for alternative copies
   - Adds backup links to prevent link rot
   - Only runs on verified works

## Quick Start

### Prerequisites

```bash
# Ensure Node.js is installed
node --version  # Should be v14 or higher

# Ensure jq is installed (for JSON processing)
sudo apt-get install jq

# Set API key (if not already in environment)
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Running the Full Workflow

```bash
# Navigate to project directory
cd "/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani"

# Run the master workflow
./master-workflow.sh
```

The workflow will:
1. Show you how many candidates will be processed
2. Ask for confirmation
3. Run all processing steps
4. Generate reports
5. Create organized batches for review

### Running Individual Steps

If you want to run steps individually:

```bash
# Step 1: Initial processing
node process-potential-candidates.js

# Step 2: Fix links
node fix-candidate-links.js potential-candidates

# Step 3: Generate descriptions
node generate-scholarly-descriptions.js potential-candidates

# Step 4: Verify all works
node comprehensive-verification.js

# Step 5: Organize into batches
node organize-into-batches.js potential-candidates

# Step 6: Find alternative links
node find-alternative-archive-links.js verified-batches
```

## Testing on a Sample First

**RECOMMENDED**: Test on a small sample before processing all 1,326 works:

```bash
# Create a test directory
mkdir -p test-candidates

# Copy 10 random candidates
ls potential-candidates/*.md | head -10 | xargs -I {} cp {} test-candidates/

# Test the workflow
./master-workflow.sh
# (Select 'test-candidates' when prompted)
```

## Output Structure

After processing, you'll have:

```
new-dhwani/
├── verified-batches/
│   ├── batch-001/
│   │   ├── work1.md
│   │   ├── work2.md
│   │   ├── ...
│   │   ├── BATCH-MANIFEST.json
│   │   └── REVIEW-CHECKLIST.md
│   ├── batch-002/
│   │   └── ...
│   └── batch-XXX/
├── verification-report.json
├── candidate-processing-report.json
└── processing-logs/
    └── workflow_YYYYMMDD_HHMMSS.log
```

## Manual Review Process

For each batch:

1. **Open the batch folder** (`verified-batches/batch-XXX/`)

2. **Review the checklist** (`REVIEW-CHECKLIST.md`)

3. **For each work, verify**:
   - [ ] India relevance is genuine
   - [ ] Description is scholarly and accurate
   - [ ] Links work correctly
   - [ ] No duplicates
   - [ ] Metadata is correct

4. **Check off items** as you verify them

5. **Move approved works** to `src/content/works/`

## Verification Report

The `verification-report.json` contains:

```json
{
  "timestamp": "2025-11-08T...",
  "progress": {
    "total": 1326,
    "verified": 1200,
    "duplicates": 50,
    "rejected": 76
  },
  "results": {
    "verified": [...],
    "duplicates": [...],
    "rejected": [...],
    "errors": [...]
  }
}
```

Review this to understand which works failed and why.

## Quality Standards

### Description Requirements
- **Minimum length**: 400 characters
- **Tone**: Scholarly, academic
- **No marketing fluff**: No "groundbreaking", "essential reading", etc.
- **Content**: Historical context, significance, scholarly importance
- **Structure**: 2-4 comprehensive paragraphs

### Link Requirements
- **Archive.org**: Must be valid and accessible
- **Wikipedia**: Actual article links, not search pages
- **OpenLibrary**: Direct work links
- **Alternative sources**: At least 1-3 backup Archive.org links

### India Relevance Criteria
Works must be:
- About Indian history, culture, or society
- Indian language resources (dictionaries, grammars, literature)
- By Indian authors on Indian topics
- Colonial-era works ABOUT India
- Translations of Indian texts

**Not relevant**:
- General world history
- Other Asian countries
- Generic language dictionaries not involving Indian languages

## Troubleshooting

### "API rate limit exceeded"
- The scripts include rate limiting (2 seconds between calls)
- If you hit limits, wait and resume

### "Invalid API response"
- Check your API key is correct
- Ensure you have API credits
- Check internet connection

### "Link verification failed"
- Some Archive.org links may be temporarily down
- The system will note these in the report
- Review manually later

### "Duplicate detected"
- Review both works to determine which is better
- Keep the one with more complete information
- Note in review checklist

## Best Practices

1. **Always test on a sample first** (10-20 works)
2. **Review verification reports** before proceeding
3. **Manual review is essential** - don't skip it
4. **Keep backups** of original candidates
5. **Process in batches** - don't try to review 1,326 works at once
6. **Document decisions** in review checklists
7. **Check alternative links** work before finalizing

## Timeline Estimates

For 1,326 candidates:

- **Initial processing**: ~30 minutes
- **Link fixing**: ~2-3 hours (with rate limiting)
- **Description generation**: ~4-5 hours (2 sec per work)
- **Verification**: ~3-4 hours
- **Batch organization**: ~5 minutes
- **Alternative links**: ~2-3 hours (optional)

**Total automated processing**: ~10-15 hours
**Manual review**: ~20-30 hours (depends on thoroughness)

## Support

If you encounter issues:
1. Check the processing logs in `processing-logs/`
2. Review `verification-report.json` for specific errors
3. Test individual scripts on problem files
4. Ensure all dependencies are installed

## Philosophy

This system embodies your vision for Dhwani:

> *"A country like India, with such a long history and such a deep cultural and literary heritage, deserves a system that respects, preserves, and makes accessible its civilization-defining works."*

Every verification step, every quality check, every piece of metadata is designed to honor that vision. We're not just building a database - we're preserving a heritage.

---

**Generated**: 2025-11-08
**For**: Dhwani - India's Literary Heritage Portal
