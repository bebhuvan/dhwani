#!/bin/bash

###############################################################################
# Quick Link Tester
# Test URLs before adding them to works
###############################################################################

if [ $# -eq 0 ]; then
    echo "Usage: ./quick_link_test.sh <url>"
    echo "Example: ./quick_link_test.sh https://archive.org/details/some-work"
    exit 1
fi

URL="$1"

echo "🔗 Testing: $URL"
echo "================================"
echo ""

# Test with curl
echo "📡 Sending HTTP request..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}|%{redirect_url}|%{size_download}|%{time_total}" -L --max-time 15 "$URL" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | cut -d'|' -f1)
REDIRECT=$(echo "$RESPONSE" | cut -d'|' -f2)
SIZE=$(echo "$RESPONSE" | cut -d'|' -f3)
TIME=$(echo "$RESPONSE" | cut -d'|' -f4)

echo ""
echo "📊 Results:"
echo "  HTTP Code: $HTTP_CODE"

if [ -n "$REDIRECT" ]; then
    echo "  Redirect: $REDIRECT"
fi

echo "  Size: $SIZE bytes"
echo "  Time: ${TIME}s"
echo ""

# Interpret results
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ SUCCESS - Link is working!"
    echo ""
    echo "Safe to add to work file."
    exit 0
elif [ "$HTTP_CODE" -ge 300 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo "🔄 REDIRECT - Link redirects to another URL"
    echo ""
    echo "⚠️  Consider using the final URL instead: $REDIRECT"
    exit 0
elif [ "$HTTP_CODE" == "404" ]; then
    echo "❌ NOT FOUND - Link is broken (404)"
    echo ""
    echo "⛔ DO NOT add this link!"
    exit 1
elif [ "$HTTP_CODE" == "403" ]; then
    echo "⚠️  FORBIDDEN - Access denied (403)"
    echo ""
    echo "⚠️  Link may be restricted. Check manually."
    exit 1
elif [ "$HTTP_CODE" == "000" ]; then
    echo "❌ CONNECTION FAILED - Could not reach server"
    echo ""
    echo "⛔ DO NOT add this link!"
    exit 1
else
    echo "⚠️  UNKNOWN STATUS - HTTP $HTTP_CODE"
    echo ""
    echo "⚠️  Check manually before adding."
    exit 1
fi
