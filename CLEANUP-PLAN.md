# Existing Works Cleanup Plan

After Set 2 processing completes, clean up existing 698+ works on the site.

## Issues to Fix

### 1. Clumsy Titles
**Problem:** Titles include cataloging metadata and excessive subtitles
```yaml
# BAD
title: 'A brief history... : $b formerly: 76th Punjabis; 16th Madras Infantry; ...'

# GOOD
title: 'A Brief History of the 3rd Battalion, 1st Punjab Regiment'
```

**Pattern to detect:**
- Contains `$b`, `$a`, `$c` (MARC cataloging codes)
- Excessive colons and semicolons
- Over 100 characters

### 2. Missing Body Content
**Problem:** Works have only frontmatter, no content below `---`

**Pattern to detect:**
- Content after frontmatter is empty or < 50 characters
- No markdown sections (no `##` headers)

### 3. Over-Long Descriptions
**Problem:** Descriptions exceed 350 words

**Target:** 150-300 words ideal, 350 max

## Cleanup Scripts Needed

### Script 1: `audit-existing-works.js`
Scan all 698 works and identify issues:
- Titles with cataloging metadata
- Titles over 100 chars
- Missing body content
- Descriptions over 350 words
- Descriptions under 100 words

Output: JSON report with flagged works

### Script 2: `fix-titles.js`
Clean up titles:
- Remove `$b`, `$a`, `$c` and following text
- Trim to main title only
- Proper title casing
- Keep subtitles only if essential

### Script 3: `fix-missing-content.js`
For works with no body content:
- Use AI to generate 2-3 paragraph overview (500-800 words)
- Include:
  - Historical context
  - Author background
  - Key themes
  - Significance for Indian studies
  - Structure/Contents summary

### Script 4: `condense-descriptions.js`
For over-long descriptions:
- Use AI to condense to 200-280 words
- Keep key information
- Remove redundancy
- Maintain scholarly tone

### Script 5: `enhance-short-descriptions.js`
For under-length descriptions:
- Expand to 200-280 words
- Add context, significance, details

## Workflow

```bash
# 1. Audit (identify issues)
node audit-existing-works.js
# Output: audit-report.json

# 2. Review audit report
cat audit-report.json | jq .summary

# 3. Fix titles (low-risk, fast)
node fix-titles.js
# Review: git diff

# 4. Add missing content (AI-powered)
export ANTHROPIC_API_KEY=your-key
node fix-missing-content.js
# Review samples

# 5. Adjust descriptions
node condense-descriptions.js  # For long ones
node enhance-short-descriptions.js  # For short ones

# 6. Final review
npm run build  # Test build
git diff  # Review all changes
```

## Prioritization

**High Priority:**
1. Missing body content (worst UX issue)
2. Clumsy titles (affects discoverability)

**Medium Priority:**
3. Over-long descriptions (less critical)

**Low Priority:**
4. Short descriptions (only if < 100 words)

## Estimates

- **Audit:** 30 seconds
- **Fix titles:** 1 minute (programmatic)
- **Fix missing content:** ~2-3 hours (AI generation for ~50-100 works)
- **Adjust descriptions:** ~1-2 hours (AI for ~100-200 works)

**Total:** ~4-6 hours including review

## Cost (AI operations)

Assuming ~150 works need AI enhancement:
- Missing content generation: 150 × $0.001 = ~$0.15
- Description adjustments: 150 × $0.0005 = ~$0.08
- **Total: ~$0.25** (using Haiku)

## Success Metrics

After cleanup:
- ✅ 0 works with cataloging metadata in titles
- ✅ 0 works with missing body content
- ✅ 95%+ works with descriptions 150-350 words
- ✅ All works have proper title casing
- ✅ Clean, professional presentation

## Next Steps (After Set 2)

1. Run audit to see scope
2. Build the 5 scripts above
3. Process in phases (titles → content → descriptions)
4. Review and deploy
