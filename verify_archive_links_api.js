#!/usr/bin/env node
/**
 * Archive.org Link Verification Script using Metadata API
 *
 * This script verifies Archive.org links by using their official Metadata API,
 * which is more reliable than checking the web pages directly.
 *
 * Usage:
 *   node verify_archive_links_api.js [--batch-size=10] [--delay=2000]
 *
 * Run this from a machine with good Archive.org connectivity!
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const WORKS_DIR = path.join(__dirname, 'src/content/works');
const BATCH_SIZE = parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 10;
const DELAY_MS = parseInt(process.argv.find(arg => arg.startsWith('--delay='))?.split('=')[1]) || 2000;

// Results storage
const results = {
  working: [],
  broken: [],
  errors: [],
  total: 0
};

/**
 * Extract Archive.org identifier from URL
 * e.g., "https://archive.org/details/in.ernet.dli.2015.31959" -> "in.ernet.dli.2015.31959"
 */
function extractIdentifier(url) {
  const match = url.match(/archive\.org\/details\/([^\/\?#]+)/);
  return match ? match[1] : null;
}

/**
 * Check if Archive.org item exists using Metadata API
 * API: https://archive.org/metadata/{identifier}
 * Returns: { exists: true/false, title: string, error: string }
 */
function checkArchiveItem(identifier) {
  return new Promise((resolve) => {
    const apiUrl = `https://archive.org/metadata/${identifier}`;

    https.get(apiUrl, { timeout: 15000 }, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);

      res.on('end', () => {
        try {
          const json = JSON.parse(data);

          // Check for error response
          if (json.error || json.is_dark || json.metadata?.identifier === undefined) {
            resolve({
              exists: false,
              error: json.error || 'Item not found or dark archive'
            });
          } else {
            resolve({
              exists: true,
              title: json.metadata?.title || 'Untitled',
              identifier: json.metadata?.identifier
            });
          }
        } catch (err) {
          resolve({
            exists: false,
            error: `Parse error: ${err.message}`
          });
        }
      });
    })
    .on('error', (err) => {
      resolve({
        exists: false,
        error: `Network error: ${err.message}`
      });
    })
    .on('timeout', () => {
      resolve({
        exists: false,
        error: 'Request timeout (15s)'
      });
    });
  });
}

/**
 * Find all Archive.org links in work files
 */
function findArchiveLinks() {
  const links = [];
  const files = fs.readdirSync(WORKS_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filepath = path.join(WORKS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');

    // Match Archive.org URLs in sources section
    const urlMatches = content.matchAll(/url:\s*(https?:\/\/archive\.org\/details\/[^\s\)]+)/g);

    for (const match of urlMatches) {
      const url = match[1].replace(/[,;]$/, ''); // Remove trailing punctuation
      const identifier = extractIdentifier(url);

      if (identifier) {
        links.push({
          file,
          url,
          identifier
        });
      }
    }
  }

  return links;
}

/**
 * Delay execution
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main verification function
 */
async function verifyAllLinks() {
  console.log('🔍 Archive.org Link Verification using Metadata API\n');
  console.log(`Configuration:`);
  console.log(`  - Batch size: ${BATCH_SIZE}`);
  console.log(`  - Delay between requests: ${DELAY_MS}ms`);
  console.log(`  - Works directory: ${WORKS_DIR}\n`);

  // Find all Archive.org links
  console.log('📂 Scanning work files for Archive.org links...');
  const links = findArchiveLinks();
  results.total = links.length;

  console.log(`✅ Found ${links.length} Archive.org links to verify\n`);

  if (links.length === 0) {
    console.log('No Archive.org links found. Exiting.');
    return;
  }

  // Verify in batches
  console.log('🚀 Starting verification...\n');
  let count = 0;

  for (const link of links) {
    count++;
    const progress = `[${count}/${links.length}]`;

    process.stdout.write(`${progress} Checking ${link.identifier}... `);

    const result = await checkArchiveItem(link.identifier);

    if (result.exists) {
      console.log(`✅ WORKS - ${result.title.substring(0, 50)}`);
      results.working.push({
        ...link,
        title: result.title
      });
    } else {
      console.log(`❌ BROKEN - ${result.error}`);
      results.broken.push({
        ...link,
        error: result.error
      });
    }

    // Delay between requests (except last one)
    if (count < links.length) {
      if (count % BATCH_SIZE === 0) {
        console.log(`\n⏸️  Batch complete. Waiting ${DELAY_MS}ms before next batch...\n`);
      }
      await delay(DELAY_MS);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total links checked: ${results.total}`);
  console.log(`✅ Working: ${results.working.length} (${Math.round(results.working.length/results.total*100)}%)`);
  console.log(`❌ Broken: ${results.broken.length} (${Math.round(results.broken.length/results.total*100)}%)`);
  console.log('='.repeat(60) + '\n');

  // Save detailed results
  const timestamp = new Date().toISOString().split('T')[0];
  const reportFile = path.join(__dirname, `archive_verification_${timestamp}.json`);

  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed results saved to: ${reportFile}`);

  // Print broken links details
  if (results.broken.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ BROKEN LINKS DETAILS');
    console.log('='.repeat(60));

    results.broken.forEach((link, idx) => {
      console.log(`\n${idx + 1}. File: ${link.file}`);
      console.log(`   URL: ${link.url}`);
      console.log(`   Identifier: ${link.identifier}`);
      console.log(`   Error: ${link.error}`);
    });
  }

  // Create fix script
  if (results.broken.length > 0) {
    createFixScript();
  }
}

/**
 * Create a script to remove broken links
 */
function createFixScript() {
  const timestamp = new Date().toISOString().split('T')[0];
  const scriptPath = path.join(__dirname, `fix_broken_archive_links_${timestamp}.sh`);

  let script = '#!/bin/bash\n';
  script += '# Auto-generated script to review and fix broken Archive.org links\n';
  script += '# Review each file manually before applying changes!\n\n';
  script += 'set -e\n\n';

  // Group by file
  const byFile = {};
  results.broken.forEach(link => {
    if (!byFile[link.file]) byFile[link.file] = [];
    byFile[link.file].push(link);
  });

  Object.keys(byFile).forEach(file => {
    script += `echo "===== ${file} ====="\n`;
    script += `echo "Broken links: ${byFile[file].length}"\n`;
    byFile[file].forEach(link => {
      script += `echo "  - ${link.identifier} (${link.error})"\n`;
    });
    script += `echo "Review: src/content/works/${file}"\n`;
    script += `echo ""\n\n`;
  });

  script += 'echo "Review the files above and remove broken links manually."\n';
  script += 'echo "Always ensure each work has at least 1 working source!"\n';

  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');

  console.log(`\n📝 Fix script created: ${scriptPath}`);
  console.log(`   Run it to see which files need manual review.`);
}

// Run verification
verifyAllLinks().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
