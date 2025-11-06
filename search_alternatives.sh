#!/bin/bash

# Script to search for alternative Archive.org links
echo "🔍 Searching Archive.org for: $1"
echo "================================"
echo ""

# URL encode the search term
SEARCH_TERM=$(echo "$1" | sed 's/ /+/g')

# Search Archive.org
echo "Search URL: https://archive.org/search?query=${SEARCH_TERM}"
echo ""
echo "To find alternatives:"
echo "1. Visit the URL above"
echo "2. Look for items with titles matching the work"
echo "3. Check if they're accessible (not restricted)"
echo "4. Copy the /details/[identifier] URL"
echo ""

