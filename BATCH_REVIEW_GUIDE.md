# Dhwani Candidate Batch Review Guide

This guide helps you systematically review and approve candidate works for inclusion in Dhwani.

## Processing Overview

The automated pipeline has processed **163 verified works** into **9 batches** of 20 works each.

### Current Status
- Total Candidates Processed: 180
- Verified & Accepted: 163 (90.56%)
- Rejected: 1 (not Indian-related)
- Errors: 16 (report files without frontmatter)
- Works Needing Review: Check individual batch summaries

## Batch Structure

Each batch folder contains:
```
batch-N/
├── BATCH_SUMMARY.json          # Overview of all works in batch
├── works/                      # Processed markdown files
│   └── work-name.md
└── reports/                    # Individual work reports
    └── work-name.md.report.json
```

## Review Workflow

### Step 1: Review Batch Summary

Open `BATCH_SUMMARY.json` to see:
- Total works in batch
- How many need review
- Quick overview of each work

### Step 2: Check Individual Work Reports

For each work needing review, open its `.report.json` file:

```json
{
  "filename": "work-name.md",
  "title": "Work Title",
  "author": ["Author Name"],
  "year": 1900,
  "indianRelevance": {
    "isIndian": true,
    "score": 25,
    "keywords": ["india", "sanskrit", "hindu"]
  },
  "publicDomain": {
    "status": "PUBLIC_DOMAIN",
    "reason": "Published before 1924",
    "needsReview": false
  },
  "collections": {
    "current": ["jain-texts", "ancient-scriptures"],
    "valid": ["jain-texts"],
    "invalid": ["ancient-scriptures"]
  },
  "references": {
    "current": 5,
    "enriched": 6
  },
  "sources": {
    "count": 2
  },
  "needsReview": true
}
```

### Step 3: Review Checklist

For each work, verify:

#### 1. Indian Relevance
- [ ] Work is genuinely related to India/Indian culture
- [ ] Score > 5 (lower scores need extra scrutiny)
- [ ] Keywords make sense

#### 2. Public Domain Status
- [ ] Status is "PUBLIC_DOMAIN" or verified as safe
- [ ] For "NEEDS_VERIFICATION": manually check author death date
- [ ] For works after 1929: verify copyright status

#### 3. Collections (Fix Invalid Collections)
- [ ] No invalid collections present
- [ ] Valid collections are appropriate for the work

**Common Invalid Collections → Valid Alternatives:**
- `ancient-scriptures` → `ancient-wisdom` or `religious-texts`
- Any collection not in the schema → find closest valid match

#### 4. Sources
- [ ] At least one valid source link (Archive.org, Gutenberg, etc.)
- [ ] URLs are correct and accessible
- [ ] Source type is appropriate: `gutenberg`, `archive`, `sacred`, or `other`

#### 5. References
- [ ] OpenLibrary search link is present (auto-added)
- [ ] Wikipedia links are relevant (if present)
- [ ] Add Wikisource link if applicable

#### 6. Description Quality
- [ ] Description is scholarly and accurate
- [ ] No marketing fluff or excessive praise
- [ ] Properly explains the work's significance
- [ ] Mentions key themes, historical context, influence

#### 7. Metadata Accuracy
- [ ] Title is correct
- [ ] Author attribution is accurate
- [ ] Year is reasonably accurate
- [ ] Languages are correct
- [ ] Genre classifications make sense
- [ ] Tags are relevant

### Step 4: Manual Fixes Needed

Common issues requiring manual intervention:

#### Invalid Collections
Edit the work's `.md` file and replace invalid collections:

```yaml
# Before:
collections: ['jain-texts', 'ancient-scriptures', 'spiritual-texts']

# After:
collections: ['jain-texts', 'ancient-wisdom', 'spiritual-texts']
```

#### Missing Wikipedia/Wikisource Links
Add appropriate reference links:

```yaml
references:
  - name: "Wikipedia: Work Title"
    url: "https://en.wikipedia.org/wiki/Work_Title"
    type: "wikipedia"
  - name: "Wikisource: Work Title"
    url: "https://en.wikisource.org/wiki/Work_Title"
    type: "wikisource"
```

#### Alternative Archive Sources
Add backup sources from Archive.org:

```yaml
sources:
  - name: "Internet Archive (Edition 1)"
    url: "https://archive.org/details/identifier1"
    type: "archive"
  - name: "Internet Archive (Edition 2)"
    url: "https://archive.org/details/identifier2"
    type: "archive"
```

#### Description Improvements
If description needs enhancement, rewrite following these principles:
- Start with work's core significance
- Provide historical context
- Explain literary/scholarly importance
- Mention influence and legacy
- Avoid superlatives without substance
- Focus on "what" and "why" not just "this is great"

### Step 5: Approve or Reject

After review:

**To Approve:**
1. Make any necessary edits
2. Move work from `candidate-batches/batch-N/works/` to `src/content/works/`
3. Delete the work from the batch folder
4. Update your tracking (mark as processed)

**To Reject:**
1. Document reason for rejection
2. Move to a `rejected/` folder or delete
3. Update your tracking

## Tools Available

### 1. Link Verification
```bash
node verify_links_robust.js --batch batch-1
```

### 2. Collection Fixer (Coming Soon)
```bash
node fix-collections.js --batch batch-1
```

### 3. Batch Promotion Tool (Coming Soon)
```bash
node promote-batch.js --batch batch-1
```

## Quality Standards

### Descriptions Should:
- Be 150-300 words for major works, 100-150 for minor works
- Include composition date/period
- Explain historical significance
- Mention literary innovations or influence
- Provide cultural context
- Reference key themes or content
- Cite important translations or editions

### Sources Should:
- Include at least one primary archive source
- Prefer multiple sources for redundancy
- Include Gutenberg links when available
- Include Sacred-Texts.com for religious works
- Include Archive.org for backup

### References Should:
- Always include OpenLibrary search (auto-added)
- Include Wikipedia for notable works/authors
- Include Wikisource if text is hosted there
- Include Wikidata for structured data (optional)

## Rejection Criteria

Reject works that:
- Are not genuinely Indian-related (relevance score < 5)
- Have copyright issues (post-1960 with living author)
- Have no accessible sources online
- Are duplicates of existing works in main site
- Have severely inaccurate or misleading descriptions
- Are fragmentary or incomplete manuscripts without scholarly context

## Batch Processing Tips

1. **Work in Order**: Process Batch 1 first, then 2, etc.
2. **Time Budget**: Allocate 5-10 minutes per work needing review
3. **Document Issues**: Keep notes on common problems for future batches
4. **Verify Links**: Spot-check 2-3 source URLs per batch to ensure quality
5. **Take Breaks**: Don't process more than 20-30 works in one sitting

## Next Steps After Review

Once a batch is fully reviewed and approved:

1. Use the promotion tool to move works to main site
2. Run link verification on promoted works
3. Build and test the site locally
4. Verify works appear correctly
5. Commit to git with descriptive message
6. Move to next batch

## Common Issues Reference

| Issue | Solution |
|-------|----------|
| Invalid collection "ancient-scriptures" | Change to "ancient-wisdom" or "religious-texts" |
| Invalid collection "ancient-scriptures" | Change to "ancient-wisdom" |
| Missing OpenLibrary link | Already auto-added |
| Year is negative (BCE) | Keep as-is, it's correct |
| Multiple similar works | Check if they're different editions/translations |
| "NEEDS_VERIFICATION" public domain status | Research author death date manually |
| Empty or minimal description | Enhance using Wikipedia and work content |
| Broken source links | Find alternative sources on Archive.org |

## Resources

- Valid Collections List: See `src/content/config.ts`
- Archive.org Search: https://archive.org/search.php
- Project Gutenberg: https://www.gutenberg.org/
- Sacred Texts: https://www.sacred-texts.com/
- Wikisource: https://en.wikisource.org/

## Questions or Issues?

- Check individual work reports for detailed analysis
- Review processing logs in `processing-logs/` directory
- Consult main site works for formatting examples
- Use verification tools to catch errors

---

**Remember**: Quality over speed. These works represent India's literary heritage and deserve careful, respectful curation.
