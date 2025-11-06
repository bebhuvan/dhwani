# Dhwani Archive.org Works Fetcher - Complete Usage Guide

## Quick Start

```bash
# Run the enhanced fetcher (requires internet access)
node fetch-archive-works-enhanced.js

# Review the candidates
ls -l potential-candidates/

# Preview a candidate
cat potential-candidates/some-work.md
```

## Overview

This tool automatically discovers and catalogs Indian public domain works from three major Archive.org collections:
- Cornell University Library
- University of California Libraries
- University of Toronto Library

## Key Features

### 🔍 Intelligent Search
- **Multi-query system**: Searches using 10+ optimized queries
- **Priority-based**: Focuses on high-priority works first (Sanskrit, Vedic, classics)
- **Smart filtering**: Excludes false positives (Indiana, West Indies, etc.)

### ✅ Public Domain Verification
- Checks license URLs
- Verifies copyright status fields
- Analyzes publication dates (pre-1924 = public domain)
- Reviews rights statements
- Assigns confidence levels (high/medium/low)

### 📚 Multiple Editions
- Automatically finds alternative editions of the same work
- Includes different years, publishers, and translations
- Provides up to 5 editions per work

### 📝 Scholarly Descriptions
- Generates comprehensive descriptions from metadata
- Adds historical context based on publication date
- Includes subject matter analysis
- Mentions language availability

### 🎯 Duplicate Detection
- Compares against 686 existing Dhwani works
- Checks both identifiers and titles
- Prevents redundant additions

## Running the Fetcher

### Prerequisites
- Node.js v14 or higher
- Internet connection
- Sufficient disk space for candidates

### Basic Execution

```bash
node fetch-archive-works-enhanced.js
```

The script will:
1. Load existing works (686 currently)
2. Search each collection with multiple queries
3. Process items by priority (high → medium → low)
4. Verify public domain status
5. Find alternative editions
6. Generate markdown files
7. Print detailed summary

### Configuration

Edit `fetch-archive-works-enhanced.js` to customize:

```javascript
const CONFIG = {
  candidatesDir: './potential-candidates',     // Output directory
  existingWorksDir: './src/content/works',     // Existing works
  maxItemsPerQuery: 100,                       // Items per query
  maxItemsTotal: 500,                          // Total limit
  rateLimitDelay: 500,                         // Delay between items (ms)
  queryDelay: 2000,                            // Delay between queries (ms)
  retryAttempts: 3,                            // Retry on failure
  retryDelay: 2000,                            // Delay before retry (ms)
};
```

### Search Queries

Current queries (priority-based):

**High Priority:**
- `India AND Sanskrit`
- `India AND "public domain"`
- `India AND (Vedic OR Hindu OR Buddhist)`
- `India AND (Mahabharata OR Ramayana OR Upanishad)`

**Medium Priority:**
- `India AND (Hindi OR Bengali OR Tamil OR Telugu)`
- `India AND (ancient OR classical OR medieval)`
- `India AND (literature OR poetry OR drama)`
- `Mughal OR Akbar OR "Indian history"`

**Low Priority:**
- `Indian AND philosophy`
- `Indian AND music`

## Understanding the Output

### File Structure

Each candidate is saved as a markdown file with YAML frontmatter:

```markdown
---
title: "Work Title"
author: ["Author Name"]
year: 1895
language: ["English", "Sanskrit"]
genre: ["History", "Philosophy", "Religion"]
description: "Comprehensive scholarly description..."
sources:
  - name: "Internet Archive (Cornell)"
    url: "https://archive.org/details/identifier"
    type: "other"
references:
  - name: "Wikipedia search: Work Title"
    url: "https://en.wikipedia.org/wiki/..."
    type: "wikipedia"
_public_domain_status: "true"
_public_domain_reason: "Published in 1895 (before 1924)"
_public_domain_confidence: "high"
_needs_review: true
---

# Work Title

[Content sections...]
```

### Public Domain Status Indicators

| Indicator | Meaning | Action Required |
|-----------|---------|-----------------|
| ✓ Public Domain | Likely in public domain | Basic review |
| ⚠ Uncertain | Status unclear | Manual verification needed |
| ✗ Likely Copyright | Probably copyrighted | Do not publish without verification |

### Confidence Levels

- **High**: Strong evidence from multiple indicators
- **Medium**: Some evidence but inconclusive
- **Low**: Insufficient information

## Review Process

### Step 1: Initial Triage

```bash
# List all candidates
ls -l potential-candidates/

# Count by status
grep -r "_public_domain_status: \"true\"" potential-candidates/ | wc -l
grep -r "_public_domain_status: \"uncertain\"" potential-candidates/ | wc -l
```

### Step 2: Verify Public Domain

For ⚠ **uncertain** works:

1. Check Archive.org directly:
   - Look for license information
   - Check copyright page scans
   - Review publication details

2. Calculate copyright term:
   - India: Life + 60 years
   - US: Published before 1924 = public domain
   - Published 1924-1963: check renewal

3. Research author:
   - When did they die?
   - Are their works in public domain?

### Step 3: Enhance Descriptions

Good descriptions should:
- Explain the work's significance
- Provide historical context
- Mention key themes/contents
- Note the author's background
- Reference scholarly reception

**Example enhancement:**

Before:
```
This work by Radhakrishnan covers Indian philosophy. Published in 1923.
```

After:
```
Sarvepalli Radhakrishnan's groundbreaking survey of Indian philosophy represents
the first comprehensive presentation of Indian philosophical systems by an Indian
scholar for Western audiences. Published in 1923 during his professorship at
Calcutta University, the work systematically examines Vedic thought, Upanishadic
philosophy, Buddhism, Jainism, and the six orthodox darshanas (Nyaya, Vaisheshika,
Samkhya, Yoga, Mimamsa, Vedanta), demonstrating their logical rigor and
contemporary relevance...
```

### Step 4: Add Metadata

Enhance each work:

```yaml
# Add appropriate collections
collections: ['sanskrit-literature', 'indian-philosophy', 'classical-literature']

# Improve tags
tags: ["Vedanta", "Upanishads", "Advaita", "Shankaracharya", "Indian Philosophy"]

# Add more references
references:
  - name: "Wikipedia: [Work Title]"
    url: "https://en.wikipedia.org/wiki/..."
    type: "wikipedia"
  - name: "Open Library"
    url: "https://openlibrary.org/search?q=..."
    type: "other"
  - name: "Author biography"
    url: "..."
    type: "wikipedia"
```

### Step 5: Move to Main Collection

```bash
# After review and enhancement
mv potential-candidates/approved-work.md src/content/works/

# Build and test
npm run dev
```

## Statistics Output

The script provides detailed statistics:

```
═══════════════════════════════════════════════════════════════
📊 SUMMARY
═══════════════════════════════════════════════════════════════

Overall Statistics:
   Total items processed:     500
   Total items found:         847
   Already exists:            142
   Not relevant to India:     298
   Not public domain:         45
   Errors:                    12
   ✓ New candidates saved:    350

By Collection:
   Cornell: 120 added (350 found)
   University of California: 145 added (300 found)
   University of Toronto: 85 added (197 found)

By Priority:
   High:   200
   Medium: 120
   Low:    30
```

## Troubleshooting

### Problem: No results found

**Solutions:**
1. Check internet connectivity
2. Verify Archive.org is accessible
3. Try with fewer queries:
   ```javascript
   const SEARCH_QUERIES = [
     { query: 'India AND Sanskrit', priority: 'high' }
   ];
   ```

### Problem: Too many false positives

**Solutions:**
1. Increase relevance threshold in `isRelevantToIndia()`
2. Add more exclude keywords:
   ```javascript
   const excludeKeywords = [
     'indiana', 'west indies', 'american indian',
     'indians baseball', 'indian ocean' // your additions
   ];
   ```

### Problem: Network errors

**Solutions:**
1. Increase retry attempts:
   ```javascript
   const CONFIG = {
     retryAttempts: 5,
     retryDelay: 3000,
   };
   ```

2. Increase delays:
   ```javascript
   const CONFIG = {
     rateLimitDelay: 1000,  // 1 second
     queryDelay: 5000,      // 5 seconds
   };
   ```

### Problem: Rate limiting from Archive.org

**Solution:**
```javascript
const CONFIG = {
  rateLimitDelay: 2000,  // 2 seconds between items
  queryDelay: 10000,     // 10 seconds between queries
  maxItemsPerQuery: 50,  // Reduce batch size
};
```

## Advanced Usage

### Custom Collections

Add your own collections:

```javascript
const COLLECTIONS = [
  {
    name: 'British Library',
    id: 'britishlibrary',
    description: 'British Library digitization'
  },
  {
    name: 'Library of Congress',
    id: 'library_of_congress',
    description: 'LOC collection'
  }
];
```

### Filtering by Date Range

```javascript
// In fetchFromArchive function, modify query:
const dateFilter = 'AND year:[1800 TO 1923]';
const url = `...&q=collection:${collection}+AND+(${query})+${dateFilter}&...`;
```

### Exporting to CSV

Add after processing:

```javascript
import { writeFileSync } from 'fs';

const csvData = candidates.map(c =>
  `"${c.title}","${c.author}","${c.year}","${c.pdStatus}"`
).join('\n');

writeFileSync('candidates.csv', 'Title,Author,Year,Status\n' + csvData);
```

### Batch Processing by Subject

```javascript
const SUBJECTS = [
  'Sanskrit Drama',
  'Vedic Literature',
  'Buddhist Philosophy',
  'Mughal History'
];

for (const subject of SUBJECTS) {
  // Run fetch with subject-specific query
  await fetchBySubject(subject);
}
```

## Integration with AI Description Enhancement

You can enhance descriptions using Claude API:

```javascript
import Anthropic from '@anthropic-ai/sdk';

async function enhanceDescription(work) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Enhance this description of an Indian literary work:

Title: ${work.title}
Author: ${work.author}
Year: ${work.year}
Current description: ${work.description}

Provide a scholarly, comprehensive description (300-500 words) covering:
- Historical significance
- Key themes and content
- Author's background
- Literary/scholarly context
- Cultural impact`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  return message.content[0].text;
}
```

## Best Practices

### 1. Run Incrementally
Don't try to fetch everything at once:
```javascript
const CONFIG = {
  maxItemsTotal: 100  // Start small
};
```

### 2. Review Frequently
Review candidates after each run before proceeding.

### 3. Document Decisions
Keep notes on why you accepted/rejected works:
```bash
echo "Rejected: Modern translation, still in copyright" >> review-notes.txt
```

### 4. Verify Copyright
When in doubt, DON'T publish. Contact publisher or author's estate.

### 5. Backup Regularly
```bash
cp -r potential-candidates/ potential-candidates-backup-$(date +%Y%m%d)/
```

## Sample Workflow

```bash
# 1. Run fetcher with modest limits
node fetch-archive-works-enhanced.js

# 2. Review summary output
cat fetch-log.txt

# 3. Check for certain public domain works
grep -l "_public_domain_status: \"true\"" potential-candidates/*.md

# 4. Review a few samples
head -50 potential-candidates/some-work.md

# 5. Enhance 5-10 works manually
vim potential-candidates/work1.md
vim potential-candidates/work2.md
# ... etc

# 6. Move approved works
mv potential-candidates/work1.md src/content/works/
mv potential-candidates/work2.md src/content/works/

# 7. Test build
npm run dev

# 8. Commit
git add src/content/works/
git commit -m "Add 10 new works from Archive.org"
git push
```

## Maintenance

### Update Search Queries

Periodically review and update queries based on:
- New collections added to Archive.org
- Better keyword matching
- Reduced false positives
- User feedback

### Monitor Archive.org Changes

Archive.org occasionally updates metadata. Re-run the fetcher periodically to catch:
- New digitizations
- Updated copyright status
- Additional editions

### Community Contributions

Consider accepting contributions:
1. Users can submit works via GitHub issues
2. Review and verify submissions
3. Run through same enhancement process
4. Credit contributors

## Legal Considerations

⚠️ **Important**: This tool helps *identify* potentially public domain works, but YOU are responsible for verifying their status before publishing.

### Due Diligence Checklist

- [ ] Verify publication date
- [ ] Check author's death date
- [ ] Review copyright notices in scanned pages
- [ ] Check for renewals (US works 1924-1963)
- [ ] Consider international copyright
- [ ] Document your verification process
- [ ] When uncertain, seek legal advice

### Liability

The Dhwani project should:
- Display clear copyright status for each work
- Provide source attribution
- Allow copyright holders to request removal
- Maintain records of verification

## Support

For issues:
1. Check this guide
2. Review code comments
3. Check Archive.org documentation
4. Open GitHub issue
5. Contact maintainer

## Future Enhancements

Planned features:
- [ ] AI-powered description enhancement
- [ ] Automatic Wikipedia integration
- [ ] Duplicate detection improvements
- [ ] OCR text extraction
- [ ] Multi-language support
- [ ] Batch export to various formats
- [ ] Integration with Open Library API
- [ ] Automated public domain verification via API

---

**Last Updated**: 2025-11-06
**Version**: 1.0.0
**Maintainer**: Dhwani Project
