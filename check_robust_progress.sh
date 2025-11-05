#!/bin/bash
echo "📊 Enhanced Verification Progress"
echo "=================================="
echo ""
echo "⏱️  Started: $(date)"
echo ""
echo "📈 Recent Activity:"
echo ""
tail -20 robust-verification.log | grep "📖 Checking:" | tail -5
echo ""
echo "💾 Current process status:"
ps aux | grep "[n]ode verify_links_robust" | awk '{print "   CPU: " $3 "% | Memory: " $4 "% | Runtime: " $10}'
echo ""
echo "📁 Report status:"
if ls verification-reports/*robust*2025-11-05* 2>/dev/null; then
    echo "✅ Reports generated!"
else
    echo "⏳ Still processing..."
fi
echo ""
echo "Run this script anytime to check progress: ./check_robust_progress.sh"
