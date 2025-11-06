# Dhwani Link Fixing Guide

Generated: November 5, 2025

## Summary of Issues

- **Total Problematic Links:** 362 (13.8% of all links)
- **Broken Links (404):** 180
- **Irrelevant Links:** 154
- **Soft-404s:** 4
- **Other Errors:** 24

## Priority Levels

### 🔴 CRITICAL (Fix First) - 180 Broken Links

These return HTTP 404 and must be fixed or removed.

**Top 10 Works Needing Attention:**

1. **Charaka Saṃhitā** (7 issues: 4 broken, 3 irrelevant)
2. **Nagananda** (7 issues: 3 broken, 3 irrelevant, 1 other)
3. **Āndhra Mahābhāratamu** (6 issues: 3 broken, 3 irrelevant)
4. **Dasbodh** (6 issues: 3 broken, 3 irrelevant)
5. **Vikramārjuna Vijaya** (6 issues: 3 broken, 3 irrelevant)
6. **Sarala Mahābhārata** (6 issues: 3 broken, 3 irrelevant)
7. **Adhyātma Rāmāyaṇaṃ Kilipattu** (5 issues: 3 broken, 2 irrelevant)
8. **Amarakośa** (5 issues: 4 broken, 1 irrelevant)
9. **Caurapancashika** (5 issues: 1 broken, 4 irrelevant)
10. **Ratnavali** (5 issues: 3 broken, 2 irrelevant)

###🟡 MEDIUM (Review & Decide) - 154 Irrelevant Links

These work (HTTP 200) but have low content relevance (0-20% match).

**Note:** Some may be false positives:
- Wikipedia general topic pages (e.g., "Ayurveda" for Charaka Samhita)
- Wikisource original language texts
- General reference pages

**Action:** Manual review needed to determine if they should stay or be replaced.

### 🟠 LOW (Quick Fixes) - 28 Other Issues

- 4 soft-404s (pages that return 200 but show "not available")
- 24 other errors (connection issues, forbidden, etc.)

---

## Broken Link Patterns & Fixes

### Pattern 1: Archive.org DLI Links (Most Common)

**Broken Pattern:**
```
https://archive.org/details/in.ernet.dli.2015.XXXXX
https://archive.org/details/dli.ernet.XXXXX
https://archive.org/details/dli.ministry.XXXXX
```

**Why They're Broken:**
The Digital Library of India collections were reorganized or made private on Archive.org.

**How to Fix:**
1. Search Archive.org for the work title: `https://archive.org/search?query=[work title]`
2. Look for alternative uploads (often by different users)
3. Check if DLI content is available on other platforms:
   - https://www.new.dli.ernet.in/
   - University digital libraries
   - Google Books
4. If no alternative found, remove the link and note it

**Example Fix:**
```markdown
# Before (BROKEN):
- name: "Internet Archive (DLI Collection)"
  url: "https://archive.org/details/dli.ernet.2906"
  type: "source"

# After (if alternative found):
- name: "Internet Archive"
  url: "https://archive.org/details/charaka-samhita-alternative-upload"
  type: "source"

# After (if NO alternative found):
# Remove the entire source entry
```

### Pattern 2: Archive.org Specific Item Links

**Broken Pattern:**
```
https://archive.org/details/charaka-samhita-dash
https://archive.org/details/amarakosha-amarasimha
https://archive.org/details/AcharnagSutraofMahavirEnglish
```

**Why They're Broken:**
Specific items removed, made private, or renamed.

**How to Fix:**
1. Search Archive.org: `site:archive.org "[work title]" [author]`
2. Try variations of the identifier
3. Check Archive.org's Wayback Machine for the original URL
4. Look for the same edition on other platforms

### Pattern 3: Wikipedia Redirects/Deletions

**Broken Pattern:**
```
https://en.wikipedia.org/wiki/Indica_(Al-Biruni)
https://en.wikipedia.org/wiki/Telugu_Mahabharatam
https://en.wikipedia.org/wiki/Caurapancashika
```

**Why They're Broken:**
- Page merged into another article
- Page deleted as "not notable"
- Page renamed with different encoding

**How to Fix:**
1. Search Wikipedia for the topic
2. Check if article was merged (look at talk/history pages)
3. Update to new URL if redirected
4. If deleted and not merged, remove or replace with alternative reference

**Quick Test:**
Visit the broken URL - Wikipedia often shows where the page was moved/merged.

### Pattern 4: Regional Wikisource (Malayalam, Telugu, etc.)

**Broken Pattern:**
```
https://ml.wikisource.org/wiki/അധ്യാത്മരാമായണം_കിളിപ്പാട്ട്
https://te.wikisource.org/wiki/ఆంధ్ర_మహాభారతము
```

**Why They're Broken:**
- Character encoding issues in URLs
- Pages moved or deleted
- Wikisource project reorganization

**How to Fix:**
1. Go to the Wikisource main page for that language
2. Use the internal search function
3. If found, copy the new URL
4. If not found, remove link or find alternative

---

## Step-by-Step Fixing Workflow

### Step 1: Start with High-Priority Works

Focus on works with 5+ broken links first:
- Charaka Saṃhitā
- Nagananda
- Āndhra Mahābhāratamu
- Amarakośa
- Etc.

### Step 2: Fix Each Link

For each broken link in a work:

1. **Read the work file:**
   ```bash
   nano src/content/works/[filename].md
   ```

2. **Search for replacement:**
   - Try Archive.org search
   - Try Google: `site:archive.org "[exact work title]"`
   - Try alternative platforms (Gutenberg, Sanchaya, etc.)

3. **Update the URL:**
   - Replace the old URL with new one
   - If no replacement found, remove the entire source/reference entry

4. **Test the new link:**
   ```bash
   curl -I [new-url]  # Should return HTTP 200
   ```

5. **Save and document:**
   - Save the file
   - Note what you changed

### Step 3: Verify Fixes

After fixing a batch of links, re-run verification:
```bash
node verify_links.js  # Basic check
# or
node verify_links_robust.js  # Full check (takes 2 hours)
```

---

## Quick Fixes You Can Do Now

### 1. Remove Completely Broken DLI Links

Many DLI links can simply be removed if the work has other working sources.

**Safe to Remove If:**
- The work has at least 1 other working source link
- The DLI link pattern is `in.ernet.dli` or `dli.ernet`
- No alternative DLI URL can be found

### 2. Fix Wikipedia Redirects

Many Wikipedia links just need the new article name:

**Example:**
- Old: `https://en.wikipedia.org/wiki/Indica_(Al-Biruni)`
- New: Check if merged into `https://en.wikipedia.org/wiki/Al-Biruni` or removed

### 3. Review "Irrelevant" Links

Some flagged as "irrelevant" (0% match) are actually fine:
- General Wikipedia topic pages for context
- Original language Wikisource pages
- Broader subject references

**Review These Manually** - Don't auto-remove based on relevance score alone.

---

## Tools & Resources

### Search Tools Created:
- `./search_alternatives.sh` - Helper to search Archive.org
- `./check_robust_progress.sh` - Monitor verification progress
- `verify_links.js` - Basic link checker
- `verify_links_robust.js` - Enhanced checker with relevance

### Useful External Links:
- **Archive.org Search:** https://archive.org/search.php
- **DLI India:** https://www.new.dli.ernet.in/
- **Sanchaya:** https://sanchaya.net/
- **Wikisource:** https://wikisource.org/

### Verification Reports:
- `verification-reports/broken-links-2025-11-05.md` - All broken links
- `verification-reports/problem-links-robust-2025-11-05.md` - All problems with relevance scores
- `verification-reports/link-verification-robust-2025-11-05.json` - Complete data

---

## Example Fix: Charaka Saṃhitā

Let's walk through fixing the top priority work:

### Current State:
**File:** `src/content/works/charaka-samhita-ayurveda-english-translation.md`

**Broken Links:**
1. `https://archive.org/details/charaka-samhita-text-english-translation-vol-1` (404)
2. `https://archive.org/details/charaka-samhita-dash` (404)
3. `https://archive.org/details/dli.ernet.2906` (404)
4. `https://archive.org/details/charakasamhitasanskritwithenglish` (404)

### Fixing Process:

1. **Search Archive.org:**
   ```
   https://archive.org/search?query=charaka+samhita+english
   ```

2. **Look for working alternatives:**
   - Check upload dates (newer might be more stable)
   - Verify they're not restricted
   - Test the URL before adding

3. **Update the file:**
   - Replace broken URLs with working ones
   - Remove entries with no replacement
   - Keep at least 1-2 working sources

4. **For "irrelevant" links:**
   - Review manually
   - Wikipedia "Ayurveda" reference is probably fine (contextual)
   - Sanskrit Wikisource is the original text (keep it)

---

## Tracking Your Progress

### Create a Fix Log:

```markdown
# Fixes Applied - [Date]

## Charaka Saṃhitā
- ✅ Removed broken DLI link (dli.ernet.2906)
- ✅ Found alternative: https://archive.org/details/[new-id]
- ⏸️  Kept Wikipedia Ayurveda reference (contextual, not irrelevant)

## Amarakośa
- ✅ Removed 4 broken Archive.org links
- ❌ No alternatives found - work now has only 1 source
- 📝 TODO: Search other platforms

...
```

---

## Next Steps

1. **Start with top 5 works** (Charaka Saṃhitā, Nagananda, etc.)
2. **Focus on broken links first** (404s are critical)
3. **Review irrelevant links manually** (many false positives)
4. **Re-verify after each batch** of fixes
5. **Document what you change** for future reference

---

## Questions to Consider

Before removing a link, ask:
1. Is there a working alternative?
2. Does the work have enough other sources?
3. Is this the only link of its type (e.g., only Sanskrit source)?
4. Can I find this content elsewhere?

Before keeping an "irrelevant" link, ask:
1. Does it provide useful context?
2. Is it the original language version?
3. Is the relevance score a false negative?

---

**Remember:** Quality over quantity. It's better to have 2-3 working, relevant links than 10 broken or irrelevant ones.

Good luck with the fixes! 🚀
