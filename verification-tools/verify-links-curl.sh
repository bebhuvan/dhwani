#!/bin/bash

# Archive.org Links Verification using curl
# More reliable than Node.js HTTP requests for large batches

echo "🔍 Archive.org Links Verification Tool"
echo "========================================"
echo ""

# Extract URLs from reports
echo "📚 Extracting URLs from verification reports..."

# Get script directory and project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Create temp file for URLs
URLS_FILE=$(mktemp)
RESULTS_FILE=$(mktemp)

# Extract from all markdown/text reports (absolute URLs with https://)
grep -ohE 'https://archive\.org/[a-zA-Z0-9/_.-]+' \
  "$PROJECT_DIR"/BATCH_2_VERIFICATION_REPORT.md \
  "$PROJECT_DIR"/BATCH_3_FINAL_SPRINT.txt \
  "$PROJECT_DIR"/FINAL_VERIFICATION_SUMMARY.md \
  "$PROJECT_DIR"/MASTER_PROGRESS_REPORT.md 2>/dev/null | \
  sort -u > "$URLS_FILE"

# Also get relative URLs (without https://) and make them absolute
grep -ohE 'archive\.org/[a-zA-Z0-9/_.-]+' \
  "$PROJECT_DIR"/BATCH_2_VERIFICATION_REPORT.md \
  "$PROJECT_DIR"/BATCH_3_FINAL_SPRINT.txt \
  "$PROJECT_DIR"/FINAL_VERIFICATION_SUMMARY.md \
  "$PROJECT_DIR"/MASTER_PROGRESS_REPORT.md 2>/dev/null | \
  grep -v '^https://' | \
  sed 's|^|https://|' | \
  sort -u >> "$URLS_FILE"

# Remove duplicates
sort -u "$URLS_FILE" -o "$URLS_FILE"

TOTAL=$(wc -l < "$URLS_FILE")
echo "✨ Found $TOTAL unique URLs to verify"
echo ""

# Counters
SUCCESSFUL=0
FAILED=0
REDIRECTED=0
CURRENT=0

# Results arrays
declare -a SUCCESS_URLS
declare -a FAILED_URLS
declare -a REDIRECT_URLS

echo "🔍 Verifying URLs..."
echo ""

# Verify each URL
while IFS= read -r url; do
  CURRENT=$((CURRENT + 1))

  # Clean URL (remove trailing punctuation)
  url=$(echo "$url" | sed 's/[,;.)\]]\+$//')

  # Get HTTP status code with redirects
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "$url" 2>&1)

  if [[ "$HTTP_CODE" == "200" ]]; then
    printf "[%3d/%3d] ✓ %s %s\n" "$CURRENT" "$TOTAL" "$HTTP_CODE" "$url"
    SUCCESSFUL=$((SUCCESSFUL + 1))
    SUCCESS_URLS+=("$url|$HTTP_CODE")
  elif [[ "$HTTP_CODE" =~ ^30[0-9]$ ]]; then
    printf "[%3d/%3d] → %s %s\n" "$CURRENT" "$TOTAL" "$HTTP_CODE" "$url"
    REDIRECTED=$((REDIRECTED + 1))
    REDIRECT_URLS+=("$url|$HTTP_CODE")
    SUCCESSFUL=$((SUCCESSFUL + 1))
  else
    printf "[%3d/%3d] ✗ %s %s\n" "$CURRENT" "$TOTAL" "$HTTP_CODE" "$url"
    FAILED=$((FAILED + 1))
    FAILED_URLS+=("$url|$HTTP_CODE")
  fi

  # Small delay to avoid rate limiting
  sleep 0.5

done < "$URLS_FILE"

echo ""
echo "═══════════════════════════════════════"
echo "      VERIFICATION COMPLETE"
echo "═══════════════════════════════════════"
echo "Total URLs:     $TOTAL"
echo "Successful:     $SUCCESSFUL ($(awk "BEGIN {printf \"%.1f\", ($SUCCESSFUL/$TOTAL)*100}")%)"
echo "Failed:         $FAILED"
echo "Redirected:     $REDIRECTED"
echo "═══════════════════════════════════════"
echo ""

# Generate markdown report
REPORT_FILE="$PROJECT_DIR/URL_VERIFICATION_CURL_REPORT.md"

cat > "$REPORT_FILE" << EOF
# ARCHIVE.ORG LINKS VERIFICATION REPORT (CURL)

**Date:** $(date -I)
**Total URLs Tested:** $TOTAL
**Successful:** $SUCCESSFUL ($(awk "BEGIN {printf \"%.1f\", ($SUCCESSFUL/$TOTAL)*100}")%)
**Failed:** $FAILED
**Redirected:** $REDIRECTED

---

## 📊 STATUS CODE SUMMARY

- **200 (OK):** $SUCCESSFUL URLs
- **Failed/Error:** $FAILED URLs
- **Redirected:** $REDIRECTED URLs

---

## ✅ SUCCESSFUL URLS ($SUCCESSFUL)

EOF

# Add successful URLs
for entry in "${SUCCESS_URLS[@]}"; do
  url="${entry%|*}"
  code="${entry#*|}"
  echo "- \`$code\` $url" >> "$REPORT_FILE"
done

cat >> "$REPORT_FILE" << EOF

---

## ❌ FAILED URLS ($FAILED)

EOF

# Add failed URLs
if [ $FAILED -eq 0 ]; then
  echo "None - all URLs verified successfully!" >> "$REPORT_FILE"
else
  for entry in "${FAILED_URLS[@]}"; do
    url="${entry%|*}"
    code="${entry#*|}"
    echo "- \`$code\` $url" >> "$REPORT_FILE"
  done
fi

cat >> "$REPORT_FILE" << EOF

---

## 🔄 REDIRECTED URLS ($REDIRECTED)

EOF

# Add redirected URLs
if [ $REDIRECTED -eq 0 ]; then
  echo "No redirects detected" >> "$REPORT_FILE"
else
  for entry in "${REDIRECT_URLS[@]}"; do
    url="${entry%|*}"
    code="${entry#*|}"
    echo "- \`$code\` $url" >> "$REPORT_FILE"
  done
fi

cat >> "$REPORT_FILE" << EOF

---

## 📋 RECOMMENDATIONS

### Overall Assessment
- **Success Rate:** $(awk "BEGIN {printf \"%.1f\", ($SUCCESSFUL/$TOTAL)*100}")%
- **Recommended Action:** $(if [ $FAILED -eq 0 ]; then echo "✅ All links verified - proceed with adding to work files"; else echo "⚠️  Review failed links before proceeding"; fi)

$(if [ $FAILED -gt 0 ]; then cat << RECOMMENDATIONS
### Failed Links Analysis
$FAILED URLs failed verification. Possible reasons:
- Temporary Archive.org unavailability
- Incorrect identifiers
- Items may have been removed or made private
- Network timeout issues

**Recommended Actions:**
1. Retry failed URLs manually
2. Search Archive.org for alternative editions
3. Verify identifier correctness
RECOMMENDATIONS
fi)

---

**Report Generated:** $(date)
**Verification Method:** curl with 10-second timeout
**Tool:** verify-links-curl.sh v1.0
EOF

echo "📄 Report saved to: $REPORT_FILE"
echo ""

# Cleanup
rm "$URLS_FILE"

# Exit with error if any failed
if [ $FAILED -gt 0 ]; then
  exit 1
else
  exit 0
fi
