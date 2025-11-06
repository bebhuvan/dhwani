# Dhwani Automated Safety System

**Prevents mistakes when fixing links through automated validation and checks**

Generated: November 5, 2025

---

## 🎯 Purpose

This automated system ensures you **never break your Dhwani project** while fixing links. It catches mistakes before they happen through multiple layers of safety checks.

---

## 🛡️ Safety Layers

### Layer 1: Pre-Change Validation
**Prevents you from making changes that would break things**

### Layer 2: Automated Backups
**Can roll back if something goes wrong**

### Layer 3: Link Testing
**Verifies new links work before adding them**

### Layer 4: Post-Change Verification
**Confirms changes improved link health**

---

## 🔧 Tools Created

### 1. **validate_changes.js** - Main Validator
**What it does:**
- ✅ Checks every work has at least 1 source
- ✅ Prevents removing all sources from a work
- ✅ Tests new URLs before accepting changes
- ✅ Detects duplicate URLs
- ✅ Compares changes against baseline
- ✅ Auto-creates backups
- ✅ Generates detailed reports

**How to use:**
```bash
node validate_changes.js
```

**Safety Rules:**
- `MIN_SOURCES_PER_WORK: 1` - Every work needs at least 1 source
- `REQUIRE_WORKING_LINK_TEST: true` - New links must be tested
- `PREVENT_REMOVING_ALL_SOURCES: true` - Can't leave works sourceless
- `AUTO_BACKUP: true` - Automatic backup before validation

**Output:**
- Pass/Fail status
- List of errors (must fix)
- List of warnings (review recommended)
- Change summary (what changed)
- JSON report for tracking

### 2. **safe_fix_workflow.sh** - Interactive Menu
**What it does:**
- 📸 Creates snapshots before changes
- 📊 Shows what changed
- 🔍 Validates all changes
- 🔗 Tests individual URLs
- 📝 Quick-verifies files
- ⏪ Rolls back if needed
- 📈 Compares with baseline
- ▶️ Runs full verification

**How to use:**
```bash
./safe_fix_workflow.sh
```

**Menu Options:**
```
1. Create snapshot (before making changes)
2. Show what changed since last snapshot
3. Validate all changes
4. Test a single URL
5. Quick verify a single file
6. Rollback to last snapshot
7. Compare with baseline
8. Run full link verification
9. Exit
```

### 3. **quick_link_test.sh** - URL Tester
**What it does:**
- 🔗 Tests if a URL works
- ⏱️ Shows response time
- 📊 Shows HTTP status code
- 🔄 Detects redirects
- ✅ Gives clear go/no-go verdict

**How to use:**
```bash
./quick_link_test.sh <url>
```

**Examples:**
```bash
# Test before adding
./quick_link_test.sh "https://archive.org/details/some-work"

# Output if working:
✅ SUCCESS - Link is working!
Safe to add to work file.

# Output if broken:
❌ NOT FOUND - Link is broken (404)
⛔ DO NOT add this link!
```

---

## 📋 Complete Workflow

### BEFORE Making Any Changes

**Step 1:** Create a snapshot
```bash
./safe_fix_workflow.sh
# Choose option 1
```

This creates a backup in `link-fixes-backup/2025-11-05-HHMMSS/`

### WHILE Making Changes

**Step 2:** Test new URLs before adding them
```bash
./quick_link_test.sh "https://new-url-to-test.com"
```

Only add URLs that show `✅ SUCCESS`

**Step 3:** Edit the work file
```bash
nano src/content/works/work-file.md
```

Make your changes (replace URLs, remove broken links, etc.)

### AFTER Making Changes

**Step 4:** Validate your changes
```bash
./safe_fix_workflow.sh
# Choose option 3
```

This runs `validate_changes.js` and shows:
- ❌ **Errors** - Must fix before proceeding
- ⚠️  **Warnings** - Review recommended
- 📝 **Changes** - What you modified

**Step 5:** Review the validation report

If validation **PASSED** ✅:
- Your changes are safe
- Continue to next work

If validation **FAILED** ❌:
- Fix the errors shown
- Run validation again
- Or rollback (option 6)

### FINAL STEP

**Step 6:** Run full verification (optional but recommended)
```bash
./safe_fix_workflow.sh
# Choose option 8
```

This runs the full 2-hour link check to confirm everything improved.

---

## 🚨 Error Prevention System

### Prevented Mistake #1: Removing All Sources

**Before (would break):**
```yaml
sources:  # Empty - work has no source!
```

**System catches:**
```
❌ Work Name: Only 0 source(s). Minimum required: 1
```

**Action:** Add at least 1 working source before proceeding

### Prevented Mistake #2: Adding Broken Links

**Before (would add broken link):**
```yaml
sources:
  - name: "New Source"
    url: "https://archive.org/details/does-not-exist"  # 404!
```

**System catches:**
```
⚠️  Work Name: New URL returns 404: https://archive.org/details/does-not-exist
```

**Action:** Find a working alternative or don't add it

### Prevented Mistake #3: Duplicate URLs

**Before (inefficient):**
```yaml
sources:
  - name: "Source 1"
    url: "https://archive.org/details/work"
  - name: "Source 2"
    url: "https://archive.org/details/work"  # Duplicate!
```

**System catches:**
```
⚠️  Work Name: Duplicate URLs found: https://archive.org/details/work
```

**Action:** Remove the duplicate

---

## 📁 Generated Files & Backups

### Automatic Backups
```
link-fixes-backup/
├── 2025-11-05/          # Daily backup (first validation)
├── 2025-11-05-143022/   # Snapshot before changes
├── 2025-11-05-150135/   # Another snapshot
└── ...
```

**Kept permanently** - Safe to review or rollback anytime

### Validation Reports
```
validation-report-2025-11-05.json
```

Contains:
- All errors found
- All warnings
- List of changes
- Files checked
- Pass/fail status

### Snapshot Tracking
```
.last_snapshot
```

Tracks the most recent snapshot for comparison

---

## 🎓 Example: Safe Fixing Workflow

Let's fix "Charaka Saṃhitā" safely:

```bash
# Step 1: Create snapshot
./safe_fix_workflow.sh
# Choose: 1 (Create snapshot)

# Step 2: Find alternative for broken DLI link
# Search Archive.org manually for "Charaka Samhita English"
# Found: https://archive.org/details/charaka-samhita-new-edition

# Step 3: Test the new link
./quick_link_test.sh "https://archive.org/details/charaka-samhita-new-edition"
# Output: ✅ SUCCESS - Link is working!

# Step 4: Edit the file
nano src/content/works/charaka-samhita-ayurveda-english-translation.md

# Replace:
#   url: "https://archive.org/details/dli.ernet.2906"  # Broken
# With:
#   url: "https://archive.org/details/charaka-samhita-new-edition"  # Working

# Save and exit (Ctrl+X, Y, Enter)

# Step 5: Validate changes
./safe_fix_workflow.sh
# Choose: 3 (Validate all changes)

# Output should show:
# ✅ VALIDATION PASSED
# Changes detected: 1 work modified

# Step 6: Verify what changed
./safe_fix_workflow.sh
# Choose: 2 (Show what changed)

# Output: Modified: charaka-samhita-ayurveda-english-translation.md

# Step 7: If happy, continue to next work
# Step 8: If not happy, rollback
./safe_fix_workflow.sh
# Choose: 6 (Rollback)
```

---

## 🔍 Validation Rules Explained

### Rule 1: Minimum Sources
**Why:** Every work needs at least one way to access it.

**Enforced:** Works must have ≥ 1 source link

**Example Error:**
```
❌ Work Name: Only 0 source(s). Minimum required: 1
```

**Fix:** Add at least one working source

### Rule 2: Working Link Test
**Why:** Don't add links that are already broken.

**Enforced:** New URLs must return HTTP 200-399

**Example Warning:**
```
⚠️  Work Name: New URL returns 404: https://...
```

**Fix:** Find a working alternative

### Rule 3: No Empty Sources
**Why:** Removing all sources leaves work inaccessible.

**Enforced:** Can't remove last source without adding replacement

**Example Error:**
```
❌ Work Name: All sources removed! This would leave the work with no sources.
```

**Fix:** Add new source before removing old one

### Rule 4: No Duplicates
**Why:** Wasteful and confusing.

**Enforced:** Each URL should appear only once per work

**Example Warning:**
```
⚠️  Work Name: Duplicate URLs found: https://...
```

**Fix:** Remove duplicate entries

---

## 📊 Validation Report Format

**validation-report-2025-11-05.json:**
```json
{
  "filesChecked": 698,
  "errors": [],
  "warnings": [],
  "changes": [
    {
      "file": "charaka-samhita-ayurveda-english-translation.md",
      "title": "Charaka Saṃhitā",
      "removedSources": 1,
      "addedSources": 1,
      "totalSources": 4
    }
  ],
  "passed": true
}
```

---

## ⚡ Quick Reference

### Before Every Fix Session
```bash
./safe_fix_workflow.sh  # Create snapshot (option 1)
```

### Before Adding a New URL
```bash
./quick_link_test.sh "URL_HERE"
```

### After Making Changes
```bash
./safe_fix_workflow.sh  # Validate (option 3)
```

### If Something Goes Wrong
```bash
./safe_fix_workflow.sh  # Rollback (option 6)
```

### After Fixing a Batch
```bash
node verify_links.js  # Re-verify all links (~75 min)
```

---

## 🎯 Success Criteria

Your changes are safe if validation shows:

✅ **0 errors**
✅ **Changes detected** (shows you actually fixed something)
✅ **Total sources** for each work ≥ 1
✅ **New URLs tested** and working

---

## 🛟 Emergency Rollback

If you mess up badly:

```bash
# Option 1: Use the workflow menu
./safe_fix_workflow.sh
# Choose: 6 (Rollback)

# Option 2: Manual rollback
SNAPSHOT=$(cat .last_snapshot)
cp -r "$SNAPSHOT"/* src/content/works/

# Option 3: Restore from daily backup
cp -r link-fixes-backup/2025-11-05/* src/content/works/
```

---

## 📈 Tracking Improvements

### Before Fixes (Baseline)
- Working links: 2,240 (85.3%)
- Broken links: 180 (6.9%)
- Irrelevant: 154 (5.9%)

### After Each Fix
```bash
./safe_fix_workflow.sh
# Option 7 (Compare with baseline)
```

Shows if numbers improved!

### Final Verification
```bash
node verify_links_robust.js  # Full check
```

Compare new report with baseline to see total improvement.

---

## 💡 Best Practices

1. **Always create a snapshot first**
2. **Test new URLs before adding**
3. **Fix one work at a time**
4. **Validate after each work**
5. **Don't batch too many changes**
6. **Keep validation reports for tracking**
7. **Run full verification weekly**

---

## 🚀 You're Protected!

With this automated safety system:

❌ **Can't** accidentally remove all sources
❌ **Can't** add broken links without warning
❌ **Can't** lose work (automatic backups)
❌ **Can't** make changes that break validation
✅ **Can** confidently fix links
✅ **Can** rollback if needed
✅ **Can** track all changes
✅ **Can** verify improvements

**Fix with confidence!** The automation has your back.

---

## 📞 Quick Help

**Validation failed?**
- Read the error messages
- Fix the issues listed
- Run validation again

**Want to undo changes?**
- Use rollback (option 6)
- Restores from last snapshot

**Not sure if a URL works?**
- Use `quick_link_test.sh`
- Only add URLs that show ✅

**Want to see what changed?**
- Use show changes (option 2)
- Shows all modified files

---

**Now start fixing links safely!** 🎉
