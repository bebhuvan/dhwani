#!/bin/bash
# Script to find all invalid collection/source/reference values

cd "/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/"

echo "Finding all validation errors..."
for i in {1..20}; do
    echo "=== Attempt $i ==="
    timeout 10 npm run dev 2>&1 | grep -A2 "Invalid enum value" | grep "received" | sed "s/.*received '//" | sed "s/'$//" | head -1

    # If no error found, break
    if [ $? -ne 0 ]; then
        echo "No more errors found!"
        break
    fi
done
