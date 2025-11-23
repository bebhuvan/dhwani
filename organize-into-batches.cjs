#!/usr/bin/env node

/**
 * Organize Verified Works into Batches
 *
 * Creates organized batches of 10 works for manual review
 */

const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  inputDir: process.argv[2] || path.join(__dirname, 'potential-candidates'),
  outputBase: path.join(__dirname, 'verified-batches'),
  batchSize: 10,
  verificationReport: path.join(__dirname, 'verification-report.json'),
};

/**
 * Create batch folders and organize files
 */
async function organizeBatches() {
  console.log('📦 Organizing works into batches\n');

  // Load verification report if it exists
  let verifiedWorks = [];
  try {
    const reportData = await fs.readFile(CONFIG.verificationReport, 'utf-8');
    const report = JSON.parse(reportData);
    verifiedWorks = report.passed.map(w => w.filename);
    console.log(`✓ Found verification report: ${verifiedWorks.length} verified works\n`);
  } catch (error) {
    console.log('⚠️  No verification report found. Organizing all works.\n');
  }

  // Get all candidate files
  const allFiles = await fs.readdir(CONFIG.inputDir);
  const mdFiles = allFiles.filter(f => f.endsWith('.md'));

  // Filter to only verified works if report exists
  const filesToOrganize = verifiedWorks.length > 0
    ? mdFiles.filter(f => verifiedWorks.includes(f))
    : mdFiles;

  console.log(`Total files to organize: ${filesToOrganize.length}\n`);

  // Calculate number of batches
  const numBatches = Math.ceil(filesToOrganize.length / CONFIG.batchSize);
  console.log(`Creating ${numBatches} batches of ${CONFIG.batchSize} works each\n`);

  // Create base output directory
  try {
    await fs.mkdir(CONFIG.outputBase, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Organize into batches
  for (let batchNum = 0; batchNum < numBatches; batchNum++) {
    const batchName = `batch-${String(batchNum + 1).padStart(3, '0')}`;
    const batchPath = path.join(CONFIG.outputBase, batchName);

    // Create batch directory
    await fs.mkdir(batchPath, { recursive: true });

    // Get files for this batch
    const startIdx = batchNum * CONFIG.batchSize;
    const endIdx = Math.min(startIdx + CONFIG.batchSize, filesToOrganize.length);
    const batchFiles = filesToOrganize.slice(startIdx, endIdx);

    console.log(`📁 ${batchName}: ${batchFiles.length} works`);

    // Copy files to batch directory
    for (const file of batchFiles) {
      const srcPath = path.join(CONFIG.inputDir, file);
      const destPath = path.join(batchPath, file);
      await fs.copyFile(srcPath, destPath);
    }

    // Create batch manifest
    const manifest = {
      batchNumber: batchNum + 1,
      totalBatches: numBatches,
      worksCount: batchFiles.length,
      works: batchFiles,
      created: new Date().toISOString(),
      status: 'pending_review'
    };

    const manifestPath = path.join(batchPath, 'BATCH-MANIFEST.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Create review checklist
    const checklist = `# Batch ${batchNum + 1} Review Checklist

## Works in this batch: ${batchFiles.length}

${batchFiles.map((f, i) => `${i + 1}. [ ] ${f.replace('.md', '')}`).join('\n')}

## Review Guidelines

For each work, verify:

1. **India Relevance**
   - [ ] Work is genuinely related to Indian culture/history/literature
   - [ ] Not a tangential or unrelated work

2. **Description Quality**
   - [ ] Scholarly and academic tone
   - [ ] No marketing fluff or promotional language
   - [ ] Factually accurate
   - [ ] Comprehensive (2-4 paragraphs minimum)

3. **Links**
   - [ ] Archive.org link works
   - [ ] Wikipedia links are actual articles (not search pages)
   - [ ] OpenLibrary links are valid
   - [ ] Wikisource links (if applicable) are correct

4. **Metadata**
   - [ ] Title is accurate
   - [ ] Author is correct
   - [ ] Year is accurate
   - [ ] Genre/tags are appropriate
   - [ ] Language is correct

5. **No Duplicates**
   - [ ] Not already in the main collection
   - [ ] Not a duplicate within this batch

## Approval

- [ ] All works in batch reviewed
- [ ] All issues addressed
- [ ] Batch ready for production

**Reviewer**: ___________________
**Date**: ___________________
**Notes**:
`;

    const checklistPath = path.join(batchPath, 'REVIEW-CHECKLIST.md');
    await fs.writeFile(checklistPath, checklist);

    console.log(`   ✓ Created manifest and checklist\n`);
  }

  console.log('='.repeat(60));
  console.log(`✅ Successfully organized ${filesToOrganize.length} works into ${numBatches} batches`);
  console.log(`📂 Output directory: ${CONFIG.outputBase}`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  organizeBatches().catch(console.error);
}

module.exports = { organizeBatches };
