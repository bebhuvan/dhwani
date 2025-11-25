#!/usr/bin/env node

/**
 * Add Good Links to Dhwani Works
 * Adds verified alternative sources found by the good link finder
 */

const fs = require('fs').promises;
const path = require('path');

const WORKS_DIR = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/fully-enhanced-works';
const GOOD_LINKS_FILE = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/good-links-found.json';
const BACKUP_DIR = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/good-links-backup';

async function addLinksToFile(filename, newLinks) {
  const filePath = path.join(WORKS_DIR, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log(`  ⚠️  No frontmatter in ${filename}`);
    return { added: 0 };
  }

  let frontmatter = frontmatterMatch[1];
  const body = content.substring(frontmatterMatch[0].length);

  // Find the sources section
  const sourcesMatch = frontmatter.match(/(sources:\s*\n(?:\s*-\s*.*\n(?:\s{4}.*\n)*)*)/);
  
  if (!sourcesMatch) {
    console.log(`  ⚠️  No sources section in ${filename}`);
    return { added: 0 };
  }

  // Build new source entries
  const newSourceEntries = newLinks.map(link => {
    const note = link.title ? `Internet Archive: ${link.title}` : `Alternative scan`;
    return `  - name: ${note}\n    url: ${link.url}\n    type: other`;
  }).join('\n');

  // Insert new sources after existing sources
  const existingSources = sourcesMatch[0];
  const updatedSources = existingSources.trimEnd() + '\n' + newSourceEntries + '\n';
  
  frontmatter = frontmatter.replace(sourcesMatch[0], updatedSources);

  // Reconstruct file
  const newContent = `---\n${frontmatter}---${body}`;
  await fs.writeFile(filePath, newContent, 'utf-8');

  return { added: newLinks.length };
}

async function main() {
  console.log('='.repeat(70));
  console.log('📎 DHWANI GOOD LINK ADDER');
  console.log('='.repeat(70));

  // Create backup directory
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  // Read good links report
  console.log('\n📖 Reading good links report...');
  const reportData = await fs.readFile(GOOD_LINKS_FILE, 'utf-8');
  const report = JSON.parse(reportData);

  console.log(`\nGood links found: ${report.totalLinksFound}`);
  console.log(`Files with new links: ${report.fileResults.filter(f => f.found && f.found.length > 0).length}`);

  if (report.totalLinksFound === 0) {
    console.log('\n⚠️  No new links to add!');
    return;
  }

  console.log('\n📝 Adding links to files...\n');

  let totalAdded = 0;
  let filesUpdated = 0;

  for (const fileResult of report.fileResults) {
    if (!fileResult.found || fileResult.found.length === 0) {
      continue;
    }

    console.log(`📄 ${fileResult.file}`);
    console.log(`   Adding ${fileResult.found.length} new link(s)...`);

    // Backup original file
    const originalPath = path.join(WORKS_DIR, fileResult.file);
    const backupPath = path.join(BACKUP_DIR, fileResult.file);
    await fs.copyFile(originalPath, backupPath);

    // Add the links
    const result = await addLinksToFile(fileResult.file, fileResult.found);
    
    if (result.added > 0) {
      console.log(`   ✅ Added ${result.added} link(s)`);
      totalAdded += result.added;
      filesUpdated++;
      
      // Show what was added
      fileResult.found.forEach(link => {
        console.log(`      + ${link.identifier} (score: ${link.score})`);
      });
    } else {
      console.log(`   ⚠️  Could not add links`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 LINK ADDITION SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nFiles updated: ${filesUpdated}`);
  console.log(`Total links added: ${totalAdded}`);
  console.log(`\n💾 Backups saved to: ${BACKUP_DIR}`);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
