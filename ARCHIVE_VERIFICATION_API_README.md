# Archive.org Link Verification Using API

## Problem

The server environment has connectivity issues with Archive.org (port 443 blocked), making it impossible to verify Archive.org links directly from this server.

## Solution

This verification script uses the **Archive.org Metadata API** instead of direct web access. The API can verify if an item exists without loading the full webpage.

## How It Works

The script:
1. Scans all work files in `src/content/works/`
2. Extracts Archive.org URLs from the `sources` section
3. Uses the Metadata API: `https://archive.org/metadata/{identifier}`
4. Checks if each item exists and is accessible
5. Generates detailed report with working/broken links
6. Creates a review script for fixing broken links

## Usage

### 1. Run from a machine with Archive.org access

**From your local machine:**
```bash
# Copy the project to your local machine (if not already there)
# Navigate to the project directory
cd /path/to/new-dhwani

# Run the verification script
node verify_archive_links_api.js
```

**With custom settings:**
```bash
# Verify with smaller batches and longer delays
node verify_archive_links_api.js --batch-size=5 --delay=3000

# Options:
#   --batch-size=N    Number of links to check before pause (default: 10)
#   --delay=N         Milliseconds to wait between requests (default: 2000)
```

### 2. Review the results

The script creates two files:

**JSON report:** `archive_verification_YYYY-MM-DD.json`
```json
{
  "working": [
    {
      "file": "some-work.md",
      "url": "https://archive.org/details/identifier",
      "identifier": "identifier",
      "title": "Work Title"
    }
  ],
  "broken": [
    {
      "file": "another-work.md",
      "url": "https://archive.org/details/bad-identifier",
      "identifier": "bad-identifier",
      "error": "Item not found"
    }
  ],
  "total": 180
}
```

**Review script:** `fix_broken_archive_links_YYYY-MM-DD.sh`
- Lists all files with broken links
- Shows which links are broken in each file
- Use as reference for manual fixes

### 3. Fix broken links

For each broken link:

1. **Check the file:**
   ```bash
   # Review the file with broken link
   cat src/content/works/filename.md
   ```

2. **Verify it has other sources:**
   ```bash
   # Make sure the work has at least 1 other working source
   grep -A 5 "sources:" src/content/works/filename.md
   ```

3. **Remove broken link safely:**
   ```bash
   # ONLY if the work has other sources!
   # Use the Edit tool or manual editing
   ```

## Example Output

```
🔍 Archive.org Link Verification using Metadata API

Configuration:
  - Batch size: 10
  - Delay between requests: 2000ms
  - Works directory: /path/to/src/content/works

📂 Scanning work files for Archive.org links...
✅ Found 180 Archive.org links to verify

🚀 Starting verification...

[1/180] Checking in.ernet.dli.2015.31959... ✅ WORKS - A Sanskrit-English Dictionary
[2/180] Checking bad-identifier... ❌ BROKEN - Item not found
[3/180] Checking AmaraKosha... ✅ WORKS - Amarakosha with commentary
...

============================================================
📊 VERIFICATION SUMMARY
============================================================
Total links checked: 180
✅ Working: 165 (92%)
❌ Broken: 15 (8%)
============================================================

📄 Detailed results saved to: archive_verification_2025-11-06.json
📝 Fix script created: fix_broken_archive_links_2025-11-06.sh
```

## API Rate Limiting

Archive.org APIs have rate limits, but they're generally more generous than web scraping:

- **Default settings** (10 links/batch, 2s delay) = ~1800 requests/hour
- Archive.org typically allows ~5000 requests/hour
- If you hit rate limits, increase `--delay` to 3000-5000ms

## Advantages Over Direct Web Access

1. ✅ **Faster:** API responses are smaller (just metadata vs. full HTML)
2. ✅ **More reliable:** APIs are designed for programmatic access
3. ✅ **Better error messages:** API returns specific error codes
4. ✅ **No rendering needed:** Doesn't need to load full webpage
5. ✅ **Official method:** Archive.org endorses API usage

## What Gets Checked

The script verifies:
- ✅ Item exists in Archive.org database
- ✅ Item is publicly accessible (not "dark archive")
- ✅ Item has valid metadata
- ❌ Item is deleted/removed
- ❌ Item is restricted/private
- ❌ Identifier is invalid

## Troubleshooting

**"Cannot find module" error:**
```bash
# Make sure you're in the project directory
cd /path/to/new-dhwani

# Node.js should be installed (check with: node --version)
```

**"ECONNREFUSED" or timeout errors:**
- You're running from a machine that also can't access Archive.org
- Try from your local laptop/desktop
- Check firewall settings

**"Too many requests" error:**
- Increase delay: `--delay=5000`
- Decrease batch size: `--batch-size=5`
- Wait a few minutes and retry

## Next Steps After Verification

1. **Review the JSON report** - See which links are genuinely broken
2. **Check false positives** - Some "broken" items might be temporarily unavailable
3. **Fix broken links** - Remove only confirmed broken links with multiple sources
4. **Update project status** - Document how many Archive.org links are truly broken vs. false positives

## Safety

The script:
- ✅ Never modifies any files
- ✅ Only reads work files
- ✅ Only makes GET requests to Archive.org
- ✅ Respects rate limits with delays
- ✅ Generates reports for manual review

**Always verify a work has other sources before removing any link!**

---

**Created:** 2025-11-06
**Purpose:** Verify Archive.org links using API when direct web access is blocked
**Safe to run:** Yes, read-only operations
**Requires:** Node.js, Archive.org connectivity
