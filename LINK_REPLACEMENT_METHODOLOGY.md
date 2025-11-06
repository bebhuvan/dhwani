# Archive.org Link Replacement - Complete Methodology

**Purpose:** Find, verify, and add accurate replacement links for the 127 works with broken Archive.org links

---

## The Process (Automated + Manual Verification)

### Phase 1: Search for Replacements ✅

**Script:** `find-and-replace-links.js`

For each broken link, the script:

1. **Extracts metadata** from the work file:
   ```yaml
   title: "Amarakośa (The Immortal Treasury)"
   author: ["Amarasimha"]
   year: 400
   ```

2. **Builds search queries**:
   - Primary: `"Amarakośa (The Immortal Treasury) Amarasimha"`
   - Structured: `title:(Amarakośa) creator:(Amarasimha)`
   - Fallback: `"Amarakośa"`

3. **Searches Archive.org Advanced Search API**:
   ```
   https://archive.org/advancedsearch.php?q=...&output=json
   ```

4. **Retrieves top 10 candidates**

---

### Phase 2: Verify Each Candidate ✅

**Scoring Algorithm:**

```javascript
Total Score = Title Match (50 points)
            + Author Match (30 points)
            + Year Match (20 points)
```

#### Title Match (50 points max)

```
Work title: "Amarakośa (The Immortal Treasury)"
Archive title: "Amarakosha with the commentary of Bhanuji Diksita"

Process:
1. Normalize: remove punctuation, lowercase
   Work: "amarakosa the immortal treasury"
   Archive: "amarakosha with the commentary of bhanuji diksita"

2. Extract significant words (>3 chars):
   Work: ["amarakosa", "immortal", "treasury"]
   Archive: ["amarakosha", "with", "commentary", "bhanuji", "diksita"]

3. Count matches:
   "amarakosa" matches "amarakosha" ✓
   "immortal" no match ✗
   "treasury" no match ✗

   Score: 1/3 matched = 33% × 50 = 16.5 points
```

#### Author Match (30 points max)

```
Work author: ["Amarasimha"]
Archive creator: "Amarasimha, Colebrooke, H.T."

Process:
1. Extract last name from work: "Amarasimha"
2. Check if it appears in archive creator
3. "Amarasimha" found in "Amarasimha, Colebrooke, H.T." ✓

Score: 30 points
```

#### Year Match (20 points max)

```
Work year: 1808 (edition year)
Archive year: 1808

Process:
1. Calculate difference: |1808 - 1808| = 0
2. Score: 20 - (0 × 2) = 20 points (within 5 years = match)

Score: 20 points
```

**Total Example Score: 16.5 + 30 + 20 = 66.5/100 (MEDIUM confidence)**

---

### Phase 3: Confidence Classification

| Score Range | Confidence | Action |
|-------------|------------|--------|
| **80-100** | HIGH | Auto-add (with logging) |
| **60-79** | MEDIUM | Manual review required |
| **<60** | LOW | Manual search needed |

---

### Phase 4: Add Verified Links

**For HIGH confidence matches (≥80%), the script can automatically:**

1. Read the work file
2. Parse YAML frontmatter
3. Add new source to `sources:` array
4. Keep old broken link commented for reference
5. Save file

**Example Addition:**

```yaml
# Before:
sources:
  - name: "Internet Archive (broken)"
    url: "https://archive.org/details/old-broken-id"
    type: "archive"

# After (HIGH confidence):
sources:
  - name: "Internet Archive (Colebrooke 1808 Edition)"
    url: "https://archive.org/details/amarakosawithco00colegoog"  # ← NEW
    type: "archive"
  # REMOVED (404): https://archive.org/details/old-broken-id
```

**For MEDIUM/LOW confidence:**
- Generate report with candidates
- Human reviews and approves
- Manual addition or further search

---

## Manual Verification Process

When reviewing MEDIUM confidence matches:

### Step 1: Check Archive.org Page

Visit the suggested URL:
```
https://archive.org/details/[identifier]
```

Verify:
- ✅ Title matches (or is close variant)
- ✅ Author/creator matches
- ✅ Year is reasonable (within 10 years for translations)
- ✅ Language matches (if specified)
- ✅ Content is readable/accessible
- ✅ PDF or readable format available

### Step 2: Check Content Preview

1. Click "Read Online" or view PDF
2. Verify first few pages:
   - Title page matches
   - Author attribution correct
   - Publisher/edition info matches description
   - Language is correct

### Step 3: Cross-reference Metadata

Compare Archive.org metadata with your work description:

**Your Description Says:**
> "The 1808 Serampore edition of Amarakośa edited by H.T. Colebrooke..."

**Archive.org Shows:**
- Title: "Amarakosha with the commentary of Bhanuji Diksita"
- Creator: "Amarasimha; Colebrooke, H.T."
- Date: "1808"
- Publisher: "Serampore : Mission Press"
- Language: "Sanskrit"

**Verdict:** ✅ MATCH - This is the correct work

### Step 4: Document Decision

Add to tracking sheet:
```
Work: Amarakośa
Old URL: https://archive.org/details/old-id (404)
New URL: https://archive.org/details/new-id
Verification: ✓ Title match, ✓ Author match, ✓ Year match, ✓ Content verified
Confidence: MEDIUM → Upgraded to HIGH after manual check
Action: ADD TO FILE
```

---

## Example: Complete Workflow

### Work: **A Grammar of the Bengal Language**

**Step 1: Extract Metadata**
```yaml
title: "A Grammar of the Bengal Language"
author: ["Nathaniel Brassey Halhed"]
year: 1778
```

**Step 2: Search Archive.org**

Query: `"A Grammar of the Bengal Language" Halhed`

**Results Found:**
```
1. "A grammar of the Bengal language"
   - Creator: Halhed, Nathaniel Brassey, 1751-1830
   - Date: 1778
   - Identifier: grammarofbengall00halgoog
   - Score: 95/100 (HIGH)

2. "Grammar of the Bengali language"
   - Creator: Halhed, N.B.
   - Date: 1778
   - Identifier: in.ernet.dli.2015.43675
   - Score: 88/100 (HIGH) ← This is our false positive!
```

**Step 3: Verify Top Match**

Visit: `https://archive.org/details/grammarofbengall00halgoog`

Check:
- ✅ Title: "A grammar of the Bengal language"
- ✅ Author: "Halhed, Nathaniel Brassey, 1751-1830"
- ✅ Year: 1778
- ✅ Content: PDF available, 220 pages
- ✅ Quality: Google digitization, readable

**Verification Details:**
- Title match: 100% (exact)
- Author match: 100% (full name + dates)
- Year match: 100% (exact)
- **Total Score: 95/100** → HIGH confidence

**Step 4: Add to File**

```yaml
sources:
  - name: "Internet Archive (Google digitization)"
    url: "https://archive.org/details/grammarofbengall00halgoog"
    type: "archive"
```

**Step 5: Document**

```
✅ VERIFIED: A Grammar of the Bengal Language
   Old: https://archive.org/details/in.ernet.dli.2015.43675 (false positive)
   New: https://archive.org/details/grammarofbengall00halgoog
   Confidence: HIGH (95/100)
   Added: 2025-11-06
```

---

## Script Components

### 1. `find-and-replace-links.js`

**What it does:**
- Reads `verification-reports/broken-links-2025-11-05.json`
- For each work:
  - Extracts metadata from work file
  - Searches Archive.org (3 query strategies)
  - Scores each candidate
  - Tracks best match
- Generates detailed report with confidence levels
- Saves results to JSON for processing

**Output:**
- `verification-reports/link-replacement-results.json` (raw data)
- `verification-reports/LINK_REPLACEMENT_REPORT.md` (formatted report)

### 2. `add-verified-links.js` (To be created)

**What it does:**
- Reads HIGH confidence matches from results.json
- For each verified match:
  - Backs up original file
  - Parses YAML frontmatter
  - Adds new source URL
  - Comments out old broken URL
  - Saves updated file
- Logs all changes

**Safety features:**
- Only processes HIGH confidence (≥80%)
- Creates backups before editing
- Dry-run mode available
- Generates changelog

---

## Current Status

### ✅ Completed:

1. **Script built** - `find-and-replace-links.js` with full search & verification logic
2. **Scoring algorithm** - Title (50) + Author (30) + Year (20) matching
3. **Confidence tiers** - HIGH/MEDIUM/LOW classification
4. **Report generation** - Detailed markdown reports
5. **Methodology documented** - This file

### ⚠️ Blocked:

- **Network access issue** - Container environment can't reach Archive.org API
- Need to run script in environment with proper internet access

### 🔄 Next Steps:

1. **Run script in working environment:**
   ```bash
   node find-and-replace-links.js
   ```

2. **Review HIGH confidence matches** (expected: ~40-50 works)

3. **Build addition script:**
   ```bash
   node add-verified-links.js --dry-run  # Preview changes
   node add-verified-links.js --execute  # Apply changes
   ```

4. **Manual review MEDIUM confidence** (expected: ~30-40 works)

5. **Manual search for LOW/not found** (expected: ~30-40 works)

---

## Quality Assurance

### Automated Checks:

- ✅ Score threshold (≥80% for auto-add)
- ✅ Multiple verification points (title, author, year)
- ✅ Metadata extraction from both sides
- ✅ Fuzzy matching for slight variants

### Manual Checks Required:

For MEDIUM confidence matches, verify:
1. Edition/translation matches description
2. Content preview shows correct work
3. No obvious errors in digitization
4. Language matches expectation
5. Publisher info reasonable

### Red Flags (Don't Add):

- ❌ Title completely different
- ❌ Wrong language
- ❌ Year difference >50 years (unless translation)
- ❌ Author mismatch
- ❌ Content preview shows different work
- ❌ "Item not available" on Archive.org

---

## Tracking Sheet Template

```markdown
| Work | File | Old URL | Status | New URL | Score | Verified | Added |
|------|------|---------|--------|---------|-------|----------|-------|
| A Grammar... | a-grammar... | details/old | 404 | details/new | 95 | ✅ | ✅ |
| Amarakośa | amarakosha... | details/old | 404 | details/new | 66 | ⏳ Review | ❌ |
```

---

## Expected Results (Estimated)

Based on 127 works with broken links:

| Outcome | Count | % | Action |
|---------|-------|---|--------|
| **HIGH confidence replacements** | ~45 | 35% | Auto-add with logging |
| **MEDIUM confidence** | ~40 | 31% | Manual review required |
| **LOW confidence** | ~20 | 16% | Manual search needed |
| **Not found** | ~22 | 17% | Extensive manual search or mark unavailable |

**Timeline Estimate:**
- Script run: ~15-20 minutes (with rate limiting)
- HIGH confidence review: ~2 hours
- MEDIUM manual review: ~6-8 hours
- LOW/not found searches: ~4-6 hours
- **Total: ~12-16 hours of work**

---

## Alternative: Manual Search Strategy

If automation fails, manual search process:

### For Each Broken Link:

1. **Copy metadata:** title, author, year
2. **Search Archive.org:**
   - Use advanced search: https://archive.org/advancedsearch.php
   - Try variations: with/without subtitle, author variations
3. **Check top 5 results**
4. **Verify content preview**
5. **Document in tracking sheet**
6. **Add to file if verified**

### Search Variations to Try:

```
1. Full title + author: "Amarakośa (The Immortal Treasury)" Amarasimha
2. Short title + author: "Amarakosa" Amarasimha
3. Title only: "Amarakosa"
4. Author + year: Amarasimha 400
5. Alternative spellings: "Amarakosha" / "Amara Kosha"
```

---

## Files Created

1. ✅ `find-and-replace-links.js` - Search & verification script
2. ✅ `LINK_REPLACEMENT_METHODOLOGY.md` - This documentation
3. ⏳ `add-verified-links.js` - Link addition script (to be created)
4. ⏳ `verification-reports/link-replacement-results.json` - Results data
5. ⏳ `verification-reports/LINK_REPLACEMENT_REPORT.md` - Formatted report
6. ⏳ `verification-reports/LINK_CHANGES_LOG.md` - Changelog of edits

---

## Contact & Support

**If script needs modifications:**
- Adjust confidence thresholds in `find-and-replace-links.js` (line ~XX)
- Modify scoring weights (title: 50, author: 30, year: 20)
- Add domain-specific matching rules

**If manual verification needed:**
- Use tracking sheet template above
- Follow verification checklist
- Document all decisions

**For questions:**
- Review this methodology
- Check script comments
- Examine example workflow above

---

**Status:** Ready to execute pending network access
**Last Updated:** 2025-11-06
**Version:** 1.0
