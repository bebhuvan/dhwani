#!/bin/bash

# Master automation script - runs all cleanup tasks in sequence
# No manual approval needed after starting

API_KEY="$1"

if [ -z "$API_KEY" ]; then
    echo "Usage: ./run-all-cleanup.sh YOUR_API_KEY"
    exit 1
fi

export ANTHROPIC_API_KEY="$API_KEY"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Dhwani Automated Cleanup Pipeline                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "This will run all cleanup tasks automatically:"
echo "  1. Historical context (DONE)"
echo "  2. Title cleanup (DONE)"
echo "  3. Missing body content"
echo "  4. Set 2 descriptions (Pass 1 + Pass 2)"
echo "  5. Remaining short descriptions"
echo "  6. Marketing language removal"
echo "  7. Final audit"
echo ""
echo "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

# Task 3: Missing Body Content
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "TASK 3: Generating Missing Body Content (44 works)"
echo "════════════════════════════════════════════════════════════════"
node fix-missing-content.js
echo "✓ Missing body content complete"

# Task 4: Set 2 Pass 1 (Descriptions)
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "TASK 4a: Set 2 Description Generation (84 works)"
echo "════════════════════════════════════════════════════════════════"
node generate-descriptions.js
echo "✓ Set 2 Pass 1 complete"

# Task 4b: Set 2 Pass 2 (Polish)
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "TASK 4b: Set 2 Description Polish (Remove preambles, enhance)"
echo "════════════════════════════════════════════════════════════════"
node polish-descriptions.js
echo "✓ Set 2 Pass 2 complete"

# Task 5: Enhance remaining short descriptions
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "TASK 5: Enhance Remaining Short Descriptions"
echo "════════════════════════════════════════════════════════════════"
node enhance-short-descriptions.js
echo "✓ Short descriptions enhanced"

# Task 6: Remove marketing language
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "TASK 6: Remove Marketing Language (39 works)"
echo "════════════════════════════════════════════════════════════════"

# Check if script exists, create if not
if [ ! -f "remove-marketing-language.js" ]; then
    echo "⚠ remove-marketing-language.js not found, skipping..."
else
    node remove-marketing-language.js
    echo "✓ Marketing language removed"
fi

# Task 7: Final Audit
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "TASK 7: Running Final Audit"
echo "════════════════════════════════════════════════════════════════"
node audit-existing-works-v2.js

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ALL CLEANUP TASKS COMPLETE!                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary reports:"
echo "  • Enhanced audit: audit-report-v2.json"
echo "  • Set 2 works: final-set2/*.md"
echo ""
echo "View audit summary:"
echo "  cat audit-report-v2.json | jq .summary"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test build: npm run build"
echo "  3. Commit: git add . && git commit"
