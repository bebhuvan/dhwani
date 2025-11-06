#!/bin/bash

# Wrapper script to run add-historical-context.js with API key

API_KEY="$1"

if [ -z "$API_KEY" ]; then
    echo "Usage: ./run-add-context.sh YOUR_API_KEY"
    exit 1
fi

export ANTHROPIC_API_KEY="$API_KEY"

echo "============================================================"
echo "         Adding Historical Context to Descriptions          "
echo "============================================================"
echo ""

node add-historical-context.js
