#!/bin/bash

###############################################################################
# DHWANI CANDIDATE PROCESSING - MASTER WORKFLOW
#
# Complete workflow for processing, verifying, and organizing candidate works
# for the Dhwani digital library
#
# This workflow ensures:
# - Multi-stage verification
# - Quality control at every step
# - Proper organization for manual review
# - Alternative archive links for preservation
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CANDIDATES_DIR="potential-candidates"
VERIFIED_DIR="verified-batches"
LOG_DIR="processing-logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/workflow_${TIMESTAMP}.log"

# Create log directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}  $1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n" | tee -a "$LOG_FILE"
}

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    log_warning "ANTHROPIC_API_KEY not set. Setting from configuration..."
    export ANTHROPIC_API_KEY="YOUR_API_KEY_HERE"
fi

# Display banner
clear
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║                   DHWANI PROCESSING SYSTEM                       ║
║                                                                  ║
║         Preserving India's Literary Heritage                    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

log "Starting Dhwani candidate processing workflow"
log "Timestamp: $TIMESTAMP"
log "Candidates directory: $CANDIDATES_DIR"
log "Output directory: $VERIFIED_DIR"

# Count candidates
CANDIDATE_COUNT=$(ls -1 "$CANDIDATES_DIR"/*.md 2>/dev/null | wc -l)
log "Found $CANDIDATE_COUNT candidate works to process\n"

# Confirmation
read -p "$(echo -e ${YELLOW}Do you want to proceed with processing all $CANDIDATE_COUNT works? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Processing cancelled by user"
    exit 0
fi

###############################################################################
# STEP 1: Initial Processing and Duplicate Detection
###############################################################################
log_step "STEP 1: Initial Processing & Duplicate Detection"

log "Running initial candidate processing..."
if node process-potential-candidates.cjs 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Initial processing complete"
else
    log_error "Initial processing failed. Check logs for details."
    exit 1
fi

###############################################################################
# STEP 2: Fix Wikipedia and OpenLibrary Links
###############################################################################
log_step "STEP 2: Fixing Reference Links"

log "Converting search URLs to actual article/work links..."
if node fix-candidate-links.cjs "$CANDIDATES_DIR" 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Links fixed successfully"
else
    log_warning "Some links could not be fixed. Continuing..."
fi

###############################################################################
# STEP 3: Generate Scholarly Descriptions
###############################################################################
log_step "STEP 3: Generating Scholarly Descriptions"

log "Generating high-quality scholarly descriptions using Claude API..."
log_warning "This may take a while for $CANDIDATE_COUNT works..."

if node generate-scholarly-descriptions.cjs "$CANDIDATES_DIR" 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Description generation complete"
else
    log_error "Description generation failed"
    exit 1
fi

###############################################################################
# STEP 4: Comprehensive Verification
###############################################################################
log_step "STEP 4: Comprehensive Verification"

log "Running multi-stage verification system..."
log "Checking: required fields, description quality, India relevance, links, duplicates"

if node comprehensive-verification.cjs 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Verification complete"

    # Check verification results
    if [ -f "verification-report.json" ]; then
        PASSED=$(jq '.passed | length' verification-report.json)
        FAILED=$(jq '.failed | length' verification-report.json)

        log "\n📊 Verification Results:"
        log "   ✅ Passed: $PASSED works"
        log "   ❌ Failed: $FAILED works"

        if [ "$FAILED" -gt 0 ]; then
            log_warning "Some works failed verification. Review verification-report.json for details."

            read -p "$(echo -e ${YELLOW}Do you want to continue with only verified works? [y/N]:${NC} )" -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "Processing cancelled. Please review failed works."
                exit 1
            fi
        fi
    fi
else
    log_error "Verification failed"
    exit 1
fi

###############################################################################
# STEP 5: Organize into Batches
###############################################################################
log_step "STEP 5: Organizing into Review Batches"

log "Creating batches of 10 works for manual review..."

if node organize-into-batches.cjs "$CANDIDATES_DIR" 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Batches created successfully"

    BATCH_COUNT=$(ls -d "$VERIFIED_DIR"/batch-* 2>/dev/null | wc -l)
    log "   Created $BATCH_COUNT batches in: $VERIFIED_DIR"
else
    log_error "Batch organization failed"
    exit 1
fi

###############################################################################
# STEP 6: Find Alternative Archive Links (OPTIONAL)
###############################################################################
log_step "STEP 6: Finding Alternative Archive.org Links (OPTIONAL)"

read -p "$(echo -e ${YELLOW}Do you want to find alternative archive links for redundancy? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Searching for alternative Archive.org copies..."

    if node find-alternative-archive-links.cjs "$VERIFIED_DIR" 2>&1 | tee -a "$LOG_FILE"; then
        log "✓ Alternative links added"
    else
        log_warning "Could not find alternative links for some works"
    fi
else
    log "Skipping alternative links step"
fi

###############################################################################
# FINAL REPORT
###############################################################################
log_step "PROCESSING COMPLETE"

log "\n🎉 ${GREEN}Workflow completed successfully!${NC}\n"
log "Summary:"
log "  📁 Processed candidates: $CANDIDATE_COUNT"
log "  ✅ Verified works: $PASSED"
log "  📦 Batches created: $BATCH_COUNT"
log "  📂 Output location: $VERIFIED_DIR"
log "  📄 Verification report: verification-report.json"
log "  📋 Processing log: $LOG_FILE"

log "\n${BLUE}Next Steps:${NC}"
log "  1. Review batches in: $VERIFIED_DIR"
log "  2. Each batch has a REVIEW-CHECKLIST.md for manual verification"
log "  3. Check verification-report.json for any issues"
log "  4. After manual review, move approved works to src/content/works/"

log "\n${GREEN}Thank you for preserving India's literary heritage! 🇮🇳${NC}\n"

# Open verification report if possible
if command -v xdg-open &> /dev/null; then
    read -p "$(echo -e ${YELLOW}Do you want to open the verification report? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open verification-report.json &
    fi
fi
