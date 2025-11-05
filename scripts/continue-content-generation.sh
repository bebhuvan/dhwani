#!/bin/bash

# Continue Content Generation Script
# This script helps resume the content generation work after the AI session limit

echo "==================================="
echo "Dhwani Content Generation - Resume"
echo "==================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in Dhwani project directory"
    echo "Please run this from: /home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/"
    exit 1
fi

echo "✅ Project directory confirmed"
echo ""

# Show progress
echo "📊 CURRENT PROGRESS:"
echo "-------------------"
total_works=$(ls src/content/works/*.md | wc -l)
echo "Total works in collection: $total_works"

# Count works with substantial content (more than 30 lines)
works_with_content=0
for file in src/content/works/*.md; do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt 30 ]; then
        works_with_content=$((works_with_content + 1))
    fi
done

echo "Works with substantial content: $works_with_content"
echo "Completion rate: $(echo "scale=1; $works_with_content * 100 / $total_works" | bc)%"
echo ""

# Show what was completed in this session
echo "✅ COMPLETED IN THIS SESSION:"
echo "----------------------------"
echo "BATCH 1: Ancient/Classical Texts (10 works)"
echo "  1. taittiriya-upanishad.md"
echo "  2. ashtadhyayi-panini-grammar.md"
echo "  3. shvetashvatara-upanishad.md"
echo "  4. vaisheshika-sutras-kanada.md"
echo "  5. jaimini-sutras-purva-mimamsa.md"
echo "  6. nyaya-sutras-gautama.md"
echo "  7. patanjali-yoga-sutras.md"
echo "  8. vishnu-purana-wilson.md"
echo "  9. shiva-purana.md"
echo "  10. ramacharitamanasa-tulsidas.md"
echo ""
echo "BATCH 2: High-Priority Works (10 works)"
echo "  11. mimamsa-sutras-jaimini.md"
echo "  12. samkhya-karika-ishvarakrishna.md"
echo "  13. vijnana-bhairava-tantra.md"
echo "  14. shiva-sutras-vasugupta.md"
echo "  15. kularnava-tantra.md"
echo "  16. periya-puranam-sekkizhar.md"
echo "  17. kamba-ramayanam.md"
echo "  18. hitopadesha-narayana.md"
echo "  19. gheranda-samhita-yoga.md"
echo "  20. panchadasi-vidyaranya.md"
echo ""
echo "✨ 20 works completed with high-quality scholarly content!"
echo ""

# Show next steps
echo "🎯 NEXT STEPS:"
echo "-------------"
echo ""
echo "Option 1: Resume with Claude Code (after session reset at 8:30pm)"
echo "  Ask Claude to continue generating content for remaining works"
echo ""
echo "Option 2: View remaining works to process"
echo "  node scripts/identify-minimal-content.js"
echo ""
echo "Option 3: Check categorized priorities"
echo "  cat CATEGORIZED_MINIMAL_WORKS.json | jq '.categories[] | select(.priority == \"HIGH\")'"
echo ""
echo "Option 4: Generate templates for manual processing"
echo "  node scripts/generate-batch-content.js --batch 1 --count 10"
echo ""

echo "📖 For detailed progress and planning, see:"
echo "   - PROGRESS_REPORT.md"
echo "   - CONTENT_GENERATION_PLAN.md"
echo "   - CATEGORIZED_MINIMAL_WORKS.json"
echo ""

echo "==================================="
echo "Ready to continue! 🚀"
echo "==================================="
