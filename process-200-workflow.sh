#!/bin/bash

###############################################################################
# DHWANI - Process First 200 Candidates Workflow
# Batches of 25 for careful manual review
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
INPUT_DIR="first-200-candidates"
OUTPUT_DIR="testing-batches"
BATCH_SIZE=25
EXISTING_WORKS="src/content/works"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}║         DHWANI - Processing First 200 Candidates                ║${NC}"
echo -e "${BLUE}║         Batches of 25 for Manual Review                         ║${NC}"
echo -e "${BLUE}║                                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Count files
TOTAL_FILES=$(ls -1 "$INPUT_DIR"/*.md 2>/dev/null | wc -l)
echo -e "${GREEN}Total candidates: $TOTAL_FILES${NC}"
echo ""

# Step 1: Check for duplicates
echo -e "${BLUE}━━━ STEP 1: Checking for Duplicates ━━━${NC}"
echo "Comparing against $EXISTING_WORKS..."

node -e "
const fs = require('fs');
const path = require('path');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
    if (m) {
      const key = m[1];
      let value = m[2].trim();
      if (value.startsWith('[')) {
        try { fm[key] = JSON.parse(value); } catch { fm[key] = value; }
      } else if (value.startsWith('\"')) {
        fm[key] = value.slice(1, -1);
      } else {
        fm[key] = value;
      }
    }
  });
  return fm;
}

const candidateFiles = fs.readdirSync('$INPUT_DIR').filter(f => f.endsWith('.md'));
const existingFiles = fs.readdirSync('$EXISTING_WORKS').filter(f => f.endsWith('.md'));

const existing = existingFiles.map(f => {
  const content = fs.readFileSync(path.join('$EXISTING_WORKS', f), 'utf-8');
  const fm = parseFrontmatter(content);
  return { file: f, title: (fm.title || '').toLowerCase() };
});

const duplicates = [];

candidateFiles.forEach(f => {
  const content = fs.readFileSync(path.join('$INPUT_DIR', f), 'utf-8');
  const fm = parseFrontmatter(content);
  const title = (fm.title || '').toLowerCase();

  const match = existing.find(e => e.title === title);
  if (match) {
    duplicates.push({ candidate: f, existing: match.file, title: fm.title });
  }
});

if (duplicates.length > 0) {
  console.log('⚠️  Found', duplicates.length, 'duplicates:');
  duplicates.forEach(d => console.log('  -', d.candidate, '→ duplicate of', d.existing));
  fs.writeFileSync('duplicates-found.json', JSON.stringify(duplicates, null, 2));
} else {
  console.log('✅ No duplicates found!');
}
"

echo ""

# Step 2: Generate descriptions
echo -e "${BLUE}━━━ STEP 2: Generating Scholarly Descriptions ━━━${NC}"
echo "Using Claude Haiku 4 API..."
export ANTHROPIC_API_KEY="YOUR_API_KEY_HERE"
node generate-scholarly-descriptions.cjs "$INPUT_DIR"

echo ""

# Step 3: Fix Wikipedia links
echo -e "${BLUE}━━━ STEP 3: Finding Wikipedia & Reference Links ━━━${NC}"
node smart-link-finder.cjs "$INPUT_DIR"

echo ""

# Step 4: Verify Archive links
echo -e "${BLUE}━━━ STEP 4: Verifying Archive.org Links ━━━${NC}"
node -e "
const fs = require('fs');
const path = require('path');
const https = require('https');

async function verifyArchiveLink(url) {
  return new Promise((resolve) => {
    if (!url || !url.includes('archive.org')) {
      resolve({ valid: false, reason: 'not an archive.org link' });
      return;
    }

    https.get(url, { timeout: 10000 }, (res) => {
      resolve({ valid: res.statusCode >= 200 && res.statusCode < 400, statusCode: res.statusCode });
    }).on('error', (err) => {
      resolve({ valid: false, error: err.message });
    }).on('timeout', () => {
      resolve({ valid: false, error: 'timeout' });
    });
  });
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { sources: [] };

  const sources = [];
  const lines = match[1].split('\n');
  let inSources = false;
  let currentSource = null;

  lines.forEach(line => {
    if (line.trim() === 'sources:') {
      inSources = true;
    } else if (inSources && line.match(/^[a-zA-Z_]/)) {
      inSources = false;
    } else if (inSources && line.trim().startsWith('- name:')) {
      if (currentSource) sources.push(currentSource);
      const nameMatch = line.match(/name:\s*\"([^\"]+)\"/);
      currentSource = { name: nameMatch ? nameMatch[1] : '' };
    } else if (inSources && line.trim().startsWith('url:') && currentSource) {
      const urlMatch = line.match(/url:\s*\"([^\"]+)\"/);
      if (urlMatch) currentSource.url = urlMatch[1];
    }
  });

  if (currentSource) sources.push(currentSource);
  return { sources };
}

async function main() {
  const files = fs.readdirSync('$INPUT_DIR').filter(f => f.endsWith('.md'));
  let checked = 0;
  let valid = 0;
  let invalid = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join('$INPUT_DIR', file), 'utf-8');
    const { sources } = parseFrontmatter(content);

    for (const source of sources) {
      if (source.url && source.url.includes('archive.org')) {
        checked++;
        const result = await verifyArchiveLink(source.url);
        if (result.valid) {
          valid++;
        } else {
          invalid++;
          console.log('⚠️  Invalid link:', file, '->', source.url);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  console.log('✅ Checked:', checked, 'links');
  console.log('✅ Valid:', valid);
  console.log('❌ Invalid:', invalid);
}

main();
"

echo ""

# Step 5: Find alternative Archive links
echo -e "${BLUE}━━━ STEP 5: Finding Alternative Archive.org Links ━━━${NC}"
node find-alternative-archive-links.cjs "$INPUT_DIR"

echo ""

# Step 6: Organize into batches
echo -e "${BLUE}━━━ STEP 6: Organizing into Batches of 25 ━━━${NC}"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Get list of files and split into batches
FILES=($(ls "$INPUT_DIR"/*.md))
TOTAL=${#FILES[@]}
NUM_BATCHES=$(( (TOTAL + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Creating $NUM_BATCHES batches of $BATCH_SIZE works each..."

for ((batch=0; batch<NUM_BATCHES; batch++)); do
  BATCH_NUM=$((batch + 1))
  BATCH_DIR="$OUTPUT_DIR/batch-$(printf '%02d' $BATCH_NUM)"
  mkdir -p "$BATCH_DIR"

  START=$((batch * BATCH_SIZE))
  END=$((START + BATCH_SIZE))

  if [ $END -gt $TOTAL ]; then
    END=$TOTAL
  fi

  COUNT=0
  for ((i=START; i<END; i++)); do
    cp "${FILES[$i]}" "$BATCH_DIR/"
    COUNT=$((COUNT + 1))
  done

  # Create batch manifest
  cat > "$BATCH_DIR/BATCH-MANIFEST.md" << EOF
# Batch $BATCH_NUM - Manual Review

## Summary
- Batch Number: $BATCH_NUM of $NUM_BATCHES
- Works in batch: $COUNT
- Status: Pending Review

## Works
$(ls "$BATCH_DIR"/*.md | grep -v MANIFEST | xargs -n 1 basename | sed 's/^/- /')

## Review Checklist

For each work, verify:

### ✅ Content Quality
- [ ] Title is accurate and clear
- [ ] Author information is correct
- [ ] Year is accurate
- [ ] Description is scholarly (no fluff/marketing)
- [ ] Description length: 1500-2500 chars
- [ ] Genre/tags are appropriate

### ✅ Links Verification
- [ ] Archive.org primary link works
- [ ] Has 1-3 alternative Archive.org links
- [ ] Wikipedia links are actual articles (not search)
- [ ] At least 2-4 relevant Wikipedia links
- [ ] Wikisource link if applicable

### ✅ India Relevance
- [ ] Work is genuinely about India/Indian topics
- [ ] Not a tangential or unrelated work
- [ ] Fits Dhwani's mission

### ✅ No Duplicates
- [ ] Not already in main collection
- [ ] Not duplicate within this batch

## Approval

**Reviewer**: ___________________
**Date**: ___________________
**Status**: [ ] Approved [ ] Needs Revision [ ] Rejected

**Notes**:

EOF

  echo "  ✓ Batch $BATCH_NUM: $COUNT works in $BATCH_DIR"
done

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     PROCESSING COMPLETE                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  Total processed: $TOTAL works"
echo "  Batches created: $NUM_BATCHES"
echo "  Output location: $OUTPUT_DIR"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Review each batch in: $OUTPUT_DIR"
echo "  2. Check BATCH-MANIFEST.md in each folder"
echo "  3. Verify quality of 2-3 works per batch"
echo "  4. Mark checklist items as you review"
echo "  5. Move approved batches to production"
echo ""
echo -e "${GREEN}Ready for manual review! 🇮🇳${NC}"
