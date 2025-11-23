# Dhwani Work Generator Guide

## Overview

This guide explains how to add new works to the Dhwani digital library using the automated work generator scripts.

## Available Scripts

### 1. `create-work-enhanced.cjs` (Recommended)

The enhanced version fetches actual content from URLs to prevent hallucinations and includes comprehensive validation.

**Features:**
- ✅ Fetches actual content from Archive.org, Wikipedia, and Open Library
- ✅ Prevents hallucinations by using only source material
- ✅ Automatic duplicate detection
- ✅ YAML formatting validation
- ✅ Comprehensive error handling
- ✅ Generates both frontmatter and scholarly body content
- ✅ Adds proper Claude disclaimer

### 2. `create-new-work.cjs` (Basic)

A simpler version that generates content without fetching URLs (higher hallucination risk).

## Requirements

1. **API Key**: Set your Anthropic API key:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

2. **Node.js**: Ensure you have Node.js installed with the required dependencies:
   ```bash
   npm install
   ```

## Usage

### Basic Usage

```bash
node create-work-enhanced.cjs --archive <archive_url> --wiki <wiki_url> --openlib <openlib_url>
```

### Examples

**Example 1: With all three links**
```bash
node create-work-enhanced.cjs \
  --archive https://archive.org/details/historyofancient00basu \
  --wiki https://en.wikipedia.org/wiki/R._C._Dutt \
  --openlib https://openlibrary.org/works/OL123456W
```

**Example 2: With Archive.org and Wikipedia only**
```bash
node create-work-enhanced.cjs \
  --archive https://archive.org/details/some-work \
  --wiki https://en.wikipedia.org/wiki/Author_Name
```

**Example 3: Archive.org link only**
```bash
node create-work-enhanced.cjs \
  --archive https://archive.org/details/some-work
```

## What the Script Does

### Step 1: URL Fetching
The script fetches content from the provided URLs:
- Archive.org metadata and description
- Wikipedia article content
- Open Library work information

### Step 2: Duplicate Detection
Before generating content, it checks existing works for:
- Similar titles (normalized, case-insensitive)
- Matching authors
- Warns if potential duplicates found

### Step 3: Content Generation
Using Claude, it generates:
- **Frontmatter description**: 200-300 word scholarly paragraph
- **Body content**: Comprehensive markdown with sections:
  - Overview
  - About the Author
  - The Work / Structure and Contents
  - Significance / Historical Context
  - Digital Access

### Step 4: Validation
The script performs multiple checks:
- YAML formatting validation
- Special character escaping
- Required fields verification
- Hallucination detection (looks for [VERIFY] tags)
- Date range validation

### Step 5: File Creation
Creates a markdown file in `src/content/works/` with:
- Proper filename (normalized from title + author)
- Complete frontmatter
- Scholarly body content
- Claude disclaimer

## Output

### Success Output
```
✅ Content generated successfully

📖 Title: A History of Ancient India
👤 Author: R. C. Dutt
📅 Year: 1893

🔍 Checking for duplicates...
✅ No duplicates found

✅ Work created: a-history-of-ancient-india-r-c-dutt.md
```

### With Warnings
```
╔════════════════════════════════════════════════════════════╗
║                    VERIFICATION WARNINGS                   ║
╚════════════════════════════════════════════════════════════╝
⚠️  Description contains [VERIFY] tags - needs manual verification
⚠️  Publication year not found in sources
```

### With Duplicates Found
```
⚠️  POTENTIAL DUPLICATES FOUND:
══════════════════════════════════════════════════════════════
1. a-history-of-ancient-india-dutt.md
   Title: A History of Ancient India
   Author: Romesh Chunder Dutt

══════════════════════════════════════════════════════════════

⚠️  Warning: This work may already exist in the database.
   Please review the duplicates before proceeding.
```

## Work Structure

### Frontmatter Format
```yaml
---
title: 'Work Title'
author:
- Author Name
year: 1900
language:
- English
genre:
- Historical Literature
- Indology
description: |
  Comprehensive scholarly paragraph (200-300 words) covering:
  - Work's significance and contribution
  - Historical/cultural context
  - Author's background and credentials
  - Key themes and content areas
  - NO marketing language or superlatives
collections:
- historical-works
- classical-literature
sources:
- name: 'Internet Archive'
  url: https://archive.org/details/...
  type: other
- name: 'Project Gutenberg'
  url: https://www.gutenberg.org/ebooks/...
  type: other
references:
- name: 'Wikipedia: Author Name'
  url: https://en.wikipedia.org/wiki/...
  type: wikipedia
- name: 'Open Library: Work Title'
  url: https://openlibrary.org/works/...
  type: other
featured: false
publishDate: 2025-11-16
---
```

### Body Content Sections

1. **# Title** - Main heading
2. **## Overview** - 2-3 paragraphs introducing the work
3. **## About the Author** - 2-3 paragraphs on author's life
4. **## The Work** - 3-4 paragraphs analyzing content
5. **## Significance** - 2-3 paragraphs on impact
6. **## Digital Access** - 1 paragraph listing access points
7. **Disclaimer** - Claude generation note

## Best Practices

### 1. Always Provide Multiple Sources
More sources = better accuracy and richer content:
```bash
# Good: Multiple sources
node create-work-enhanced.cjs \
  --archive URL1 --wiki URL2 --openlib URL3

# Less ideal: Single source
node create-work-enhanced.cjs --archive URL1
```

### 2. Verify Generated Content
**Always manually review:**
- Publication dates and years
- Author names and biographical details
- Historical facts and contexts
- Any [VERIFY] tags in the output

### 3. Check for Duplicates
The script automatically checks, but you should also:
- Search the works directory manually
- Check for different transliterations of names
- Look for alternate titles

### 4. YAML Special Characters
The script handles these automatically, but be aware of:
- Colons (`:`) in titles
- Quotes (`'` and `"`)
- Square brackets (`[]`)
- Curly braces (`{}`)
- Special characters (`&`, `*`, `#`, etc.)

## Genre Categories

Choose 2-4 appropriate genres:
- Historical Literature
- Literary Criticism
- Philosophy
- Religious Texts
- Classical Literature
- Poetry
- Drama
- Indology
- Reference Works
- Linguistic Works
- Biography
- Travel Literature
- Political Literature

## Collection Categories

Choose 1-3 appropriate collections:
- `classical-literature` - Ancient/classical texts
- `modern-literature` - Modern works (post-1800s)
- `reference-works` - Dictionaries, grammars, encyclopedias
- `linguistic-works` - Language studies, grammars
- `religious-texts` - Religious/spiritual works
- `historical-works` - Historical narratives, chronicles

## Troubleshooting

### Issue: "API key not set"
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Issue: "Could not fetch URL"
- Check if URL is accessible
- Archive.org links should be direct work links
- Wikipedia links should be to article pages

### Issue: "YAML parsing errors"
- Check the generated file manually
- Look for unescaped special characters
- Ensure proper quote matching

### Issue: Too many duplicates
- Review each carefully
- Different editions are acceptable
- Different translations are acceptable
- Exact duplicates should be skipped

## Manual Post-Processing

After generation, you should:

1. **Review factual accuracy**
   - Cross-check dates with sources
   - Verify author information
   - Confirm publication details

2. **Enhance if needed**
   - Add missing Gutenberg links
   - Add additional reference links
   - Expand collections if appropriate

3. **Remove [VERIFY] tags**
   - Research the flagged information
   - Replace with verified facts
   - Or remove if unverifiable

4. **Check descriptions**
   - Ensure no marketing language
   - Verify scholarly tone
   - Confirm factual accuracy

## Example Workflow

```bash
# 1. Set API key (once per session)
export ANTHROPIC_API_KEY="your-key"

# 2. Generate work
node create-work-enhanced.cjs \
  --archive https://archive.org/details/some-work \
  --wiki https://en.wikipedia.org/wiki/Author

# 3. Review output for warnings

# 4. Check the generated file
cat src/content/works/generated-work.md

# 5. Manually verify facts

# 6. Commit if satisfied
git add src/content/works/generated-work.md
git commit -m "Add: New work title by Author"
```

## Notes on Hallucination Prevention

The enhanced script implements multiple safeguards:

1. **Source-based generation**: Only uses fetched content
2. **Low temperature**: Claude runs at 0.2 temperature for factual output
3. **Explicit instructions**: Told to mark uncertain info with [VERIFY]
4. **Validation**: Multiple automated checks
5. **Manual review**: Always required before publishing

**Remember**: The script is a tool to accelerate work creation, but human verification is essential for accuracy.

## Getting Help

If you encounter issues:
1. Check this guide first
2. Review existing works for examples
3. Look at console warnings/errors
4. Verify your URLs are correct and accessible

---

**Happy cataloging!** 📚
