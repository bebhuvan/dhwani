#!/bin/bash

echo "⏳ Waiting for link validation to complete..."
echo ""

# Wait for validation process to finish
while pgrep -f "validate-links.cjs" > /dev/null; do
  # Show progress
  FILES_DONE=$(grep -c "📄" /tmp/link-validation-output.log 2>/dev/null || echo "0")
  echo -ne "\r🔍 Validated: $FILES_DONE/189 files..."
  sleep 5
done

echo ""
echo ""
echo "✅ Validation complete!"
echo ""
echo "🔧 Starting automatic link fix..."
echo ""

# Run the link fixer
cd "/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani"
node fix-invalid-links.cjs

echo ""
echo "✅ All done!"
