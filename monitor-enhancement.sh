#!/bin/bash

# Monitor the enhancement process and notify when complete

LOG_FILE="/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/enhance-set2.log"
ENHANCED_DIR="/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/enhanced-set2"
TOTAL_WORKS=85

echo "Monitoring enhancement progress..."
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    if [ -f "$LOG_FILE" ]; then
        # Count files created
        COUNT=$(ls "$ENHANCED_DIR"/*.md 2>/dev/null | wc -l)
        PERCENT=$((COUNT * 100 / TOTAL_WORKS))

        # Get last line from log
        LAST_LINE=$(tail -1 "$LOG_FILE")

        # Clear line and show progress
        echo -ne "\r\033[K"
        echo -ne "Progress: $COUNT/$TOTAL_WORKS ($PERCENT%) | $LAST_LINE"

        # Check if complete
        if grep -q "Enhancement Complete!" "$LOG_FILE"; then
            echo ""
            echo ""
            echo "✅ Enhancement complete!"
            echo ""
            tail -10 "$LOG_FILE"
            echo ""
            echo "Next step: Run description generation"
            echo "  1. Set API key: export ANTHROPIC_API_KEY=your-key"
            echo "  2. Run: node generate-descriptions.js"
            exit 0
        fi
    else
        echo -ne "\r\033[K"
        echo -ne "Waiting for enhancement to start..."
    fi

    sleep 5
done
