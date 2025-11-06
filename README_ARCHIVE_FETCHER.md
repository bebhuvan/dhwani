# Archive.org Indian Works Fetcher

## Overview

This tool automatically fetches Indian public domain works from Archive.org collections and saves them as candidate works for Dhwani.

## Features

✅ **Automatic Collection Searching**: Searches three major Archive.org collections:
- Cornell University Library
- University of California Libraries
- University of Toronto Library

✅ **Public Domain Verification**: Checks multiple indicators:
- License URLs
- Copyright status fields
- Publication dates (pre-1924 works)
- Rights statements

✅ **Multiple Editions**: Automatically finds alternative editions of the same work

✅ **Scholarly Descriptions**: Generates comprehensive descriptions with contextual information

✅ **Duplicate Detection**: Compares against existing works to avoid duplicates

## Installation

1. Ensure you have Node.js installed (v14 or higher)
2. Navigate to the dhwani directory
3. No additional dependencies required (uses Node.js built-ins)

## Usage

### Basic Usage

```bash
node fetch-archive-works.js
```

This will:
1. Search all three collections for Indian works
2. Verify public domain status
3. Find alternative editions
4. Generate markdown files in `./potential-candidates/`

### Output

The script creates markdown files with:
- Complete metadata (title, author, year, language, genres)
- Scholarly descriptions
- Public domain status verification
- Multiple source links (when available)
- Tags and categorization
- Review checklist

## Configuration

You can modify the search behavior by editing these constants in the script:

```javascript
// Collections to search
const COLLECTIONS = [
  { name: 'Cornell', id: 'cornell' },
  { name: 'University of California', id: 'university_of_california_libraries' },
  { name: 'University of Toronto', id: 'university_of_toronto' }
];

// Search queries
const queries = [
  'India',
  'Sanskrit OR Hindi OR Bengali OR Tamil',
  'Vedic OR Hindu OR Buddhist OR Mughal',
  'Ramayana OR Mahabharata OR Upanishad'
];
```

## Search Queries

The script searches for works using intelligent keyword matching:

### Primary Keywords
- India, Indian, Hindustan, Bharat
- Major languages: Sanskrit, Hindi, Bengali, Tamil, Telugu, etc.
- Religious/cultural: Vedic, Hindu, Buddhist, Mughal
- Geographic: Delhi, Bombay, Calcutta, Bengal, Punjab, etc.
- Literary: Ramayana, Mahabharata, Upanishad, Veda

### Filtering

Works are included if they:
1. Match Indian keywords in title, author, subject, or description
2. Are likely in the public domain
3. Are not already in the Dhwani collection

## Public Domain Verification

The script checks multiple indicators:

| Indicator | Status |
|-----------|--------|
| Published before 1924 | ✓ Public Domain |
| License URL contains "publicdomain" | ✓ Public Domain |
| Copyright status: NOT_IN_COPYRIGHT | ✓ Public Domain |
| Rights statement includes "public domain" | ✓ Public Domain |
| Otherwise | ⚠ Needs Manual Verification |

## Output Format

Each candidate work includes:

```yaml
---
title: "Work Title"
author: ["Author Name"]
year: 1895
language: ["English", "Sanskrit"]
genre: ["History", "Philosophy"]
description: "Comprehensive scholarly description..."
sources:
  - name: "Internet Archive (Cornell)"
    url: "https://archive.org/details/identifier"
    type: "other"
  - name: "Internet Archive (Alternative edition - 1892)"
    url: "https://archive.org/details/alternative-id"
    type: "other"
_public_domain_status: "true"
_public_domain_reason: "Published in 1895 (before 1924)"
_needs_review: true
---

# Work Title

## Overview
[Comprehensive description]

## Public Domain Status
**Status**: ✓ Public Domain
**Reason**: Published in 1895 (before 1924)

## Available Editions
- [Internet Archive (Cornell)](https://archive.org/details/identifier)
- [Internet Archive (Alternative edition - 1892)](https://archive.org/details/alternative-id)

## Review Checklist
1. Verify public domain status
2. Enhance the description with scholarly content
3. Add relevant collections and tags
4. Add more reference links
5. Review and edit all metadata
```

## Rate Limiting

The script includes automatic rate limiting:
- 0.5 seconds between items
- 1 second between queries

This prevents overwhelming Archive.org's servers and ensures reliable operation.

## Next Steps

After running the script:

1. **Review Candidates**: Check `./potential-candidates/` directory
2. **Verify Public Domain**: Manually verify uncertain works
3. **Enhance Descriptions**: Improve descriptions using AI or manual research
4. **Add References**: Find and add Wikipedia, Open Library links
5. **Categorize**: Assign to appropriate collections
6. **Move to Main**: Copy approved works to `src/content/works/`

## Example Workflow

```bash
# 1. Run the fetcher
node fetch-archive-works.js

# 2. Review output
cd potential-candidates
ls -l

# 3. Manually review and enhance each work
# Edit files, verify public domain status, enhance descriptions

# 4. Move approved works
mv approved-work.md ../src/content/works/

# 5. Build and preview
npm run dev
```

## Troubleshooting

### No Results Found

- Check internet connectivity
- Verify Archive.org is accessible
- Try running with fewer collections first
- Check search query specificity

### Too Many False Positives

- Adjust `isRelevantToIndia()` function
- Add more specific keywords
- Filter by language or subject

### Slow Performance

- Reduce number of queries
- Decrease `rows` parameter (default: 100)
- Increase rate limiting delays

## Advanced Usage

### Search Specific Collections Only

Edit the COLLECTIONS array to include only desired collections:

```javascript
const COLLECTIONS = [
  { name: 'Cornell', id: 'cornell' }
];
```

### Custom Search Queries

Add your own queries:

```javascript
const queries = [
  'Tagore OR Premchand',
  'Indus Valley Civilization',
  'Indian Independence Movement'
];
```

### Export to CSV

You can modify the script to export metadata to CSV for bulk processing.

## Statistics Tracking

The script tracks:
- Total items found
- Already existing works (duplicates avoided)
- Non-relevant items filtered
- New candidates saved

Example output:
```
============================================================
SUMMARY
============================================================
Total items found:      847
Already exists:         142
Not relevant to India:  298
New candidates saved:   407
```

## Contributing

To improve the fetcher:

1. Add more search collections
2. Enhance public domain verification
3. Improve description generation
4. Add more metadata fields
5. Integrate with Claude API for better descriptions

## License

This tool is part of the Dhwani project and shares the same license.

## Support

For issues or questions:
1. Check existing documentation
2. Review the code comments
3. Open an issue on GitHub
4. Contact the project maintainer

---

**Note**: Always verify public domain status before publishing works. When in doubt, err on the side of caution and conduct additional research.
