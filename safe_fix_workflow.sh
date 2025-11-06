#!/bin/bash

###############################################################################
# Safe Link Fixing Workflow
# Automated validation and safety checks for Dhwani link fixes
###############################################################################

set -e  # Exit on error

WORKS_DIR="src/content/works"
BACKUP_DIR="link-fixes-backup"
DATE=$(date +%Y-%m-%d)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Dhwani Safe Link Fixing Workflow${NC}"
echo "===================================="
echo ""

# Function: Create snapshot
create_snapshot() {
    echo -e "${BLUE}📸 Creating snapshot...${NC}"
    SNAPSHOT_DIR="${BACKUP_DIR}/${DATE}-$(date +%H%M%S)"
    mkdir -p "$SNAPSHOT_DIR"
    cp -r "$WORKS_DIR"/* "$SNAPSHOT_DIR"/
    echo -e "${GREEN}✅ Snapshot saved to: $SNAPSHOT_DIR${NC}"
    echo "$SNAPSHOT_DIR" > .last_snapshot
    echo ""
}

# Function: Show what changed
show_changes() {
    if [ ! -f .last_snapshot ]; then
        echo -e "${YELLOW}⚠️  No snapshot found - cannot show changes${NC}"
        return
    fi

    SNAPSHOT_DIR=$(cat .last_snapshot)
    echo -e "${BLUE}📊 Changes since last snapshot:${NC}"
    echo ""

    CHANGED=0
    for file in "$WORKS_DIR"/*.md; do
        filename=$(basename "$file")
        if [ -f "${SNAPSHOT_DIR}/${filename}" ]; then
            if ! diff -q "$file" "${SNAPSHOT_DIR}/${filename}" > /dev/null 2>&1; then
                echo -e "${YELLOW}Modified: ${filename}${NC}"
                CHANGED=$((CHANGED + 1))
            fi
        fi
    done

    if [ $CHANGED -eq 0 ]; then
        echo -e "${GREEN}No changes detected${NC}"
    else
        echo -e "${YELLOW}Total modified files: $CHANGED${NC}"
    fi
    echo ""
}

# Function: Validate all changes
validate_changes() {
    echo -e "${BLUE}🔍 Running automated validation...${NC}"
    echo ""

    if node validate_changes.js; then
        echo ""
        echo -e "${GREEN}✅ Validation passed!${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}❌ Validation failed!${NC}"
        echo -e "${YELLOW}Please review and fix errors before proceeding.${NC}"
        return 1
    fi
}

# Function: Test a specific URL
test_url() {
    echo -e "${BLUE}🔗 Testing URL: $1${NC}"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "$1" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
        echo -e "${GREEN}✅ OK (HTTP $HTTP_CODE)${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed (HTTP $HTTP_CODE)${NC}"
        return 1
    fi
}

# Function: Quick verify a single file
quick_verify_file() {
    local FILE=$1
    echo -e "${BLUE}🔍 Quick verify: $(basename $FILE)${NC}"

    # Check frontmatter exists
    if ! grep -q "^---$" "$FILE"; then
        echo -e "${RED}❌ No frontmatter found${NC}"
        return 1
    fi

    # Count sources
    SOURCE_COUNT=$(grep -A 100 "^sources:" "$FILE" | grep "url:" | wc -l)

    if [ "$SOURCE_COUNT" -lt 1 ]; then
        echo -e "${RED}❌ No sources found!${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ ${SOURCE_COUNT} source(s) found${NC}"
    return 0
}

# Function: Rollback to snapshot
rollback() {
    if [ ! -f .last_snapshot ]; then
        echo -e "${RED}❌ No snapshot found - cannot rollback${NC}"
        exit 1
    fi

    SNAPSHOT_DIR=$(cat .last_snapshot)

    echo -e "${YELLOW}⚠️  Rolling back to: $SNAPSHOT_DIR${NC}"
    read -p "Are you sure? (yes/no): " -r
    echo

    if [[ $REPLY =~ ^[Yy]es$ ]]; then
        cp -r "${SNAPSHOT_DIR}"/* "$WORKS_DIR"/
        echo -e "${GREEN}✅ Rollback complete${NC}"
    else
        echo -e "${YELLOW}Rollback cancelled${NC}"
    fi
}

# Function: Compare with verified baseline
compare_with_baseline() {
    echo -e "${BLUE}📊 Comparing with verification baseline...${NC}"
    echo ""

    if [ ! -f verification-reports/link-verification-robust-2025-11-05.json ]; then
        echo -e "${YELLOW}⚠️  No baseline found${NC}"
        return
    fi

    node -e "
    const fs = require('fs');
    const baseline = JSON.parse(fs.readFileSync('verification-reports/link-verification-robust-2025-11-05.json', 'utf8'));

    console.log('Baseline Statistics:');
    console.log('  Total links:', baseline.totalLinks);
    console.log('  Working:', baseline.workingLinks);
    console.log('  Broken:', baseline.brokenLinks);
    console.log('  Irrelevant:', baseline.irrelevantLinks);
    console.log('');
    console.log('After your fixes, these numbers should improve!');
    "
}

# Main menu
show_menu() {
    echo -e "${BLUE}📋 What would you like to do?${NC}"
    echo ""
    echo "1. Create snapshot (before making changes)"
    echo "2. Show what changed since last snapshot"
    echo "3. Validate all changes"
    echo "4. Test a single URL"
    echo "5. Quick verify a single file"
    echo "6. Rollback to last snapshot"
    echo "7. Compare with baseline"
    echo "8. Run full link verification"
    echo "9. Exit"
    echo ""
    read -p "Choose (1-9): " choice
    echo ""

    case $choice in
        1)
            create_snapshot
            ;;
        2)
            show_changes
            ;;
        3)
            validate_changes
            ;;
        4)
            read -p "Enter URL to test: " url
            test_url "$url"
            ;;
        5)
            read -p "Enter filename (e.g., charaka-samhita-ayurveda-english-translation.md): " filename
            quick_verify_file "${WORKS_DIR}/${filename}"
            ;;
        6)
            rollback
            ;;
        7)
            compare_with_baseline
            ;;
        8)
            echo -e "${BLUE}Running full verification (this takes ~2 hours)...${NC}"
            node verify_links_robust.js
            ;;
        9)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
    echo ""
}

# Main loop
while true; do
    clear
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Dhwani Safe Link Fixing Workflow    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    show_menu
done
