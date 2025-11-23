# Testing Batches Processing Plan

## Summary

- **Total Candidates**: 200 works across 8 batches
- **Existing Dhwani Works**: 757 works  
- **Processing Script**: `verify-testing-batches.cjs` (created and tested)

## Test Results (3 sample works)

✅ **All verification checks working correctly:**

1. **Duplicate Detection**: All 3 tested works are unique (not in existing 757 works)
2. **Public Domain Verification**: All 3 are public domain (published 1919-1921)
3. **Indian Works Verification**: All 3 verified as genuinely Indian works
   - Scores: 8, 12, and 15 (all passing threshold of 5)
   - Keywords found: India, Sanskrit, Tamil, Bhagavata, Purana, etc.
4. **Link Verification**: All existing links verified as working
5. **Archive.org Search**: Search URLs generated for finding additional editions

## What the Script Does

For each of the 200 candidate works, it will:

### 1. Duplicate Check
- Compares against all 757 existing Dhwani works
- Checks by Archive.org identifier, title+author, and similarity score
- **Rejects** duplicates automatically

### 2. Public Domain Verification  
- Checks publication year
- Pre-1929: ✅ PUBLIC DOMAIN (high confidence)
- 1929-1964: ⚠️  NEEDS REVIEW (may be PD if copyright not renewed)
- Post-1964: ❌ LIKELY NOT PD
- **Rejects** works likely still under copyright

### 3. Indian Works Verification
- Scans title, author, description, genre for Indian keywords
- Positive indicators: India, Sanskrit, Tamil, Telugu, Hindi, Ayurveda, etc.
- Negative indicators: Further India (Southeast Asia), Burma, Thailand, etc.
- **Rejects** works scoring below 5 points

### 4. Link Verification
- Tests all Archive.org, Wikipedia, and other links
- Flags broken links
- Identifies Wikipedia "search pages" vs actual articles
- Reports all issues for manual review

### 5. Archive.org Additional Editions
- Generates search URLs for finding alternative editions
- Can be used to manually find and add additional sources

### 6. Description Quality (Optional)
- Can generate improved scholarly descriptions via Claude API
- Current works already have descriptions (may not need regeneration)
- Note: API integration needs minor debugging

## Estimated Processing Time

- 200 works × ~3 seconds per work = ~10 minutes
- With API calls: 200 works × ~5 seconds = ~17 minutes
- API rate limiting: May extend to 25-30 minutes total

## Expected Outcomes

Based on the sample test, we expect:

- **~180-190 works** to pass all checks (verified)
- **~5-10 works** to be duplicates (already in Dhwani)
- **~0-5 works** to fail public domain check
- **~0-5 works** to fail Indian relevance check
- **Some works** will have link issues requiring manual fixing

## Output

The script will create:

1. **verification-report.json** - Detailed JSON report with all checks
2. **Console output** - Real-time progress for each work
3. **Categorized results**:
   - `verified`: Works passing all checks
   - `duplicates`: Works already in Dhwani  
   - `rejected`: Works failing PD or Indian relevance checks
   - `errors`: Any processing errors

## Next Steps (Awaiting Your Approval)

### Option A: Full Automated Run
Run the script on all 200 works with current settings (~25-30 min processing time)

### Option B: Batch-by-Batch
Process one batch at a time (25 works each) for incremental review

### Option C: Modified Approach
Make any adjustments to verification criteria before running

## Current State

✅ Script created and tested
✅ All core verification functions working
✅ Duplicate detection validated
⚠️  Claude API description generation (optional, can fix if needed)

**Ready to proceed when you approve!**
