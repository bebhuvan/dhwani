#!/bin/bash

echo "🔄 DHWANI COMPLETE LINK WORKFLOW"
echo "================================="
echo ""

# Step 1: Wait for validation to complete
echo "⏳ Step 1: Waiting for link validation..."
while pgrep -f "validate-links.cjs" > /dev/null; do
  FILES_DONE=$(grep -c "📄" /tmp/link-validation-output.log 2>/dev/null || echo "0")
  echo -ne "\r   🔍 Validated: $FILES_DONE/189 files..."
  sleep 5
done
echo ""
echo "✅ Validation complete!"
echo ""

# Step 2: Run link cleanup
echo "⏳ Step 2: Removing invalid links..."
cd "/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani"
node fix-invalid-links.cjs
echo ""

# Step 3: Find good links
echo "⏳ Step 3: Finding verified good alternative sources..."
echo "   (This will take ~30 minutes for comprehensive search)"
echo ""
node find-good-links.cjs
echo ""

# Step 4: Summary
echo "================================="
echo "✅ COMPLETE WORKFLOW FINISHED!"
echo "================================="
echo ""
echo "📊 Results:"
echo "  1. Invalid links removed (see link-validation-report.json)"
echo "  2. Backups saved (see link-fix-backup/)"
echo "  3. Good links found (see good-links-found.json)"
echo ""
echo "Next: Review good-links-found.json and add them to works"
echo ""
