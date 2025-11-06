#!/bin/bash

# Complete workflow: Wait for generation, then polish

API_KEY="$1"

if [ -z "$API_KEY" ]; then
    echo "Usage: ./complete-workflow.sh YOUR_API_KEY"
    exit 1
fi

export ANTHROPIC_API_KEY="$API_KEY"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         Automated Description Generation + Polish            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

FINAL_DIR="/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/final-set2"
EXPECTED_COUNT=84

# Monitor generation progress
echo "⏳ Waiting for description generation to complete..."
echo "   Expected: $EXPECTED_COUNT files"
echo ""

while true; do
    CURRENT_COUNT=$(ls "$FINAL_DIR"/*.md 2>/dev/null | wc -l)
    PERCENT=$((CURRENT_COUNT * 100 / EXPECTED_COUNT))

    printf "\r   Progress: %d/%d (%d%%)  " "$CURRENT_COUNT" "$EXPECTED_COUNT" "$PERCENT"

    if [ "$CURRENT_COUNT" -ge "$EXPECTED_COUNT" ]; then
        echo ""
        echo ""
        echo "✅ Description generation complete!"
        break
    fi

    sleep 10
done

echo ""
echo "⏳ Waiting 5 seconds for files to finalize..."
sleep 5

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              Starting Polish Pass (Second Pass)              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

node polish-descriptions.js

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ALL PROCESSING COMPLETE                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Final Summary:"
echo "   • Set 1: 10 works (unique-works/)"
echo "   • Set 2: 84 works (final-set2/)"
echo "   • Total: 94 publication-ready works"
echo ""
echo "📁 Next steps:"
echo "   1. Review samples in final-set2/"
echo "   2. Copy to production:"
echo "      cp unique-works/*.md src/content/works/"
echo "      cp final-set2/*.md src/content/works/"
echo "   3. Build and deploy!"
echo ""
