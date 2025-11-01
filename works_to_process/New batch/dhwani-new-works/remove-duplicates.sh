#!/bin/bash
# Duplicate Removal Script for Dhwani New Works
# Generated: 2025-10-26

echo "=========================================="
echo "Dhwani Duplicate Removal Script"
echo "=========================================="
echo ""

# Create backup directory
BACKUP_DIR="/home/bhuvanesh/dhwani-new-works-duplicates-backup-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"
echo "✓ Created backup directory: $BACKUP_DIR"
echo ""

# Function to remove duplicate and back it up
remove_duplicate() {
    local file="$1"
    local reason="$2"

    if [ -f "$file" ]; then
        echo "Removing: $file"
        echo "  Reason: $reason"
        cp "$file" "$BACKUP_DIR/"
        rm "$file"
        echo "  ✓ Backed up and removed"
        echo ""
    else
        echo "⚠ File not found: $file"
        echo ""
    fi
}

echo "Removing confirmed duplicates..."
echo ""

# 1. Har Dayal - Educational Problem
remove_duplicate "our-educational-problem-dayal-har-1884-1939.md" \
    "Duplicate of our-educational-problem-dayal.md (same Archive ID, fewer refs)"

# 2. Laghu-siddhantakaumudi
remove_duplicate "laghu-siddhantakaumudi-varadarāja-varadarāja-active-17th-century.md" \
    "Duplicate of laghu-siddhantakaumudi-varadarāja-varadarāja.md (same Archive ID, fewer refs)"

# 3. Marma Vijnj-aan - EXACT duplicates
remove_duplicate "marma-vijnj-aan-paathak-raamarakshh-2.md" \
    "Exact duplicate of marma-vijnj-aan-paathak-raamarakshh-1.md (same Archive ID)"

# 4. Mool Ramayana - need to verify
echo "⚠ VERIFY BEFORE REMOVING:"
echo "  - mool-ramayana-ramnathlal-1.md vs mool-ramayana-ramnathlal-2.md"
echo "  (Checking Archive IDs...)"
MOOL1=$(grep -o "archive.org/details/[^\"]*" mool-ramayana-ramnathlal-1.md 2>/dev/null | head -1)
MOOL2=$(grep -o "archive.org/details/[^\"]*" mool-ramayana-ramnathlal-2.md 2>/dev/null | head -1)
if [ "$MOOL1" = "$MOOL2" ] && [ -n "$MOOL1" ]; then
    echo "  Same Archive ID: $MOOL1"
    remove_duplicate "mool-ramayana-ramnathlal-2.md" \
        "Duplicate of mool-ramayana-ramnathlal-1.md (same Archive ID)"
else
    echo "  Different Archive IDs - KEEPING BOTH"
    echo "    File 1: $MOOL1"
    echo "    File 2: $MOOL2"
fi
echo ""

# 5. Purohit Darpan - need to verify
echo "⚠ VERIFY BEFORE REMOVING:"
echo "  - purohit-darpaned25-bhattacharya.md vs purohit-darpaned25-bhattacharya-surendramohan-comp.md"
PUROHIT1=$(grep -o "archive.org/details/[^\"]*" purohit-darpaned25-bhattacharya.md 2>/dev/null | head -1)
PUROHIT2=$(grep -o "archive.org/details/[^\"]*" purohit-darpaned25-bhattacharya-surendramohan-comp.md 2>/dev/null | head -1)
if [ "$PUROHIT1" = "$PUROHIT2" ] && [ -n "$PUROHIT1" ]; then
    echo "  Same Archive ID: $PUROHIT1"
    remove_duplicate "purohit-darpaned25-bhattacharya.md" \
        "Duplicate of purohit-darpaned25-bhattacharya-surendramohan-comp.md (keeping version with full compiler name)"
else
    echo "  Different Archive IDs - KEEPING BOTH"
    echo "    File 1: $PUROHIT1"
    echo "    File 2: $PUROHIT2"
fi
echo ""

# 6. Research Methodology - need to verify
echo "⚠ VERIFY BEFORE REMOVING:"
echo "  - research-methodology-bm-jain-1.md vs research-methodology-bm-jain-2.md"
RESEARCH1=$(grep -o "archive.org/details/[^\"]*" research-methodology-bm-jain-1.md 2>/dev/null | head -1)
RESEARCH2=$(grep -o "archive.org/details/[^\"]*" research-methodology-bm-jain-2.md 2>/dev/null | head -1)
if [ "$RESEARCH1" = "$RESEARCH2" ] && [ -n "$RESEARCH1" ]; then
    echo "  Same Archive ID: $RESEARCH1"
    remove_duplicate "research-methodology-bm-jain-2.md" \
        "Duplicate of research-methodology-bm-jain-1.md (same Archive ID)"
else
    echo "  Different Archive IDs - KEEPING BOTH"
    echo "    File 1: $RESEARCH1"
    echo "    File 2: $RESEARCH2"
fi
echo ""

# 7. Sushrut Sanhita - need to verify
echo "⚠ VERIFY BEFORE REMOVING:"
echo "  - sushrut-sanhita-ambikadatt-1.md vs sushrut-sanhita-ambikadatt-2.md"
SUSHRUT1=$(grep -o "archive.org/details/[^\"]*" sushrut-sanhita-ambikadatt-1.md 2>/dev/null | head -1)
SUSHRUT2=$(grep -o "archive.org/details/[^\"]*" sushrut-sanhita-ambikadatt-2.md 2>/dev/null | head -1)
if [ "$SUSHRUT1" = "$SUSHRUT2" ] && [ -n "$SUSHRUT1" ]; then
    echo "  Same Archive ID: $SUSHRUT1"
    remove_duplicate "sushrut-sanhita-ambikadatt-2.md" \
        "Duplicate of sushrut-sanhita-ambikadatt-1.md (same Archive ID)"
else
    echo "  Different Archive IDs - KEEPING BOTH"
    echo "    File 1: $SUSHRUT1"
    echo "    File 2: $SUSHRUT2"
fi
echo ""

# Count remaining files
REMAINING=$(ls -1 *.md 2>/dev/null | wc -l)
BACKED_UP=$(ls -1 "$BACKUP_DIR"/*.md 2>/dev/null | wc -l)

echo "=========================================="
echo "Summary:"
echo "  Files remaining: $REMAINING"
echo "  Files backed up: $BACKED_UP"
echo "  Backup location: $BACKUP_DIR"
echo "=========================================="
echo ""
echo "✓ Duplicate removal complete!"
echo ""
echo "To restore duplicates if needed:"
echo "  cp $BACKUP_DIR/*.md /home/bhuvanesh/dhwani-new-works/"
