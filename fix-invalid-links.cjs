#!/usr/bin/env node

/**
 * Invalid Link Remover for Dhwani Works
 * Removes broken links from YAML frontmatter based on validation report
 */

const fs = require('fs').promises;
const path = require('path');

const WORKS_DIR = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/fully-enhanced-works';
const VALIDATION_REPORT = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/link-validation-report.json';
const BACKUP_DIR = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/link-fix-backup';

// Remove invalid URLs from a file's frontmatter
async function fixFileLinks(filename, invalidUrls) {
  const filePath = path.join(WORKS_DIR, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log(`  ⚠️  No frontmatter found in ${filename}`);
    return { removed: 0 };
  }

  let frontmatter = frontmatterMatch[1];
  const body = content.substring(frontmatterMatch[0].length);

  let removedCount = 0;

  for (const invalidUrl of invalidUrls) {
    // Find and remove the entire source/reference block containing this URL
    // Match patterns like:
    //   - name: Something
    //     url: https://invalid.url
    //     type: other
    
    const urlEscaped = invalidUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Pattern to match entire YAML list item (with proper indentation)
    const patterns = [
      // Multi-line pattern (name, url, type on separate lines)
      new RegExp(`  - name: [^\\n]+\\n    url: ${urlEscaped}\\n    type: [^\\n]+\\n`, 'g'),
      // Single-line URL-only pattern (fallback)
      new RegExp(`  - url: ${urlEscaped}\\n`, 'g'),
      // Another variant
      new RegExp(`\\s*- name: [^\\n]*\\n\\s+url: ${urlEscaped}\\n\\s+type: [^\\n]+\\n`, 'g')
    ];

    for (const pattern of patterns) {
      const beforeLength = frontmatter.length;
      frontmatter = frontmatter.replace(pattern, '');
      if (frontmatter.length < beforeLength) {
        removedCount++;
        break; // Found and removed, move to next URL
      }
    }
  }

  if (removedCount > 0) {
    // Reconstruct file
    const newContent = `---\n${frontmatter}---${body}`;
    await fs.writeFile(filePath, newContent, 'utf-8');
  }

  return { removed: removedCount };
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔧 DHWANI INVALID LINK REMOVAL');
  console.log('='.repeat(70));

  // Create backup directory
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  // Read validation report
  console.log('\n📖 Reading validation report...');
  const reportData = await fs.readFile(VALIDATION_REPORT, 'utf-8');
  const report = JSON.parse(reportData);

  console.log(`\nValidation summary:`);
  console.log(`  Total URLs checked: ${report.totalUrls}`);
  console.log(`  Valid: ${report.validUrls}`);
  console.log(`  Invalid: ${report.invalidUrls}`);

  if (report.invalidUrls === 0) {
    console.log('\n✅ No invalid links to remove!');
    return;
  }

  // Build map of files to invalid URLs
  const fileInvalidUrls = new Map();

  for (const fileResult of report.fileResults) {
    if (!fileResult.urls || fileResult.urls.length === 0) continue;

    const invalidUrls = fileResult.urls
      .filter(u => !u.ok)
      .map(u => u.url);

    if (invalidUrls.length > 0) {
      fileInvalidUrls.set(fileResult.file, invalidUrls);
    }
  }

  console.log(`\n📝 Files with invalid links: ${fileInvalidUrls.size}`);
  console.log('\n🔧 Fixing files...\n');

  let totalRemoved = 0;
  let filesFixed = 0;

  for (const [filename, invalidUrls] of fileInvalidUrls.entries()) {
    console.log(`📄 ${filename}`);
    console.log(`   Removing ${invalidUrls.length} invalid URLs...`);

    // Backup original file
    const originalPath = path.join(WORKS_DIR, filename);
    const backupPath = path.join(BACKUP_DIR, filename);
    await fs.copyFile(originalPath, backupPath);

    // Fix the file
    const result = await fixFileLinks(filename, invalidUrls);
    
    if (result.removed > 0) {
      console.log(`   ✅ Removed ${result.removed} invalid link(s)`);
      totalRemoved += result.removed;
      filesFixed++;
    } else {
      console.log(`   ⚠️  Could not remove links (check manually)`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 LINK FIX SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nFiles processed: ${fileInvalidUrls.size}`);
  console.log(`Files fixed: ${filesFixed}`);
  console.log(`Invalid links removed: ${totalRemoved}`);
  console.log(`\n💾 Backups saved to: ${BACKUP_DIR}`);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
