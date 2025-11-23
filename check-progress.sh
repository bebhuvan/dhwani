#!/bin/bash
echo "=== DHWANI ENHANCEMENT PROGRESS ==="
echo ""
if [ -f /tmp/enhancement-output.log ]; then
  # Count completed works
  COMPLETED=$(grep -c "File updated successfully" /tmp/enhancement-output.log)
  FLAGGED=$(grep -c "FLAGGED FOR EXCLUSION" /tmp/enhancement-output.log)
  ERRORS=$(grep -c "ERROR:" /tmp/enhancement-output.log)
  
  echo "✅ Completed: $COMPLETED/188"
  echo "⚠️  Flagged: $FLAGGED"
  echo "❌ Errors: $ERRORS"
  echo ""
  echo "Last 15 lines:"
  echo "---"
  tail -15 /tmp/enhancement-output.log
else
  echo "Log file not found yet"
fi
