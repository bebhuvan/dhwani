import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

/**
 * Automated Link Change Validator
 * Prevents mistakes when fixing links
 */

const WORKS_DIR = './src/content/works';
const BACKUP_DIR = './link-fixes-backup';

// Safety rules
const SAFETY_RULES = {
  MIN_SOURCES_PER_WORK: 1,
  REQUIRE_WORKING_LINK_TEST: true,
  PREVENT_REMOVING_ALL_SOURCES: true,
  PREVENT_BREAKING_WORKING_LINKS: true,
  AUTO_BACKUP: true
};

const results = {
  filesChecked: 0,
  errors: [],
  warnings: [],
  changes: [],
  passed: true
};

// Quick URL test
async function testUrl(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode
        });
      });

      req.on('error', () => resolve({ success: false, statusCode: null }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, statusCode: null });
      });

      req.end();
    } catch (error) {
      resolve({ success: false, statusCode: null });
    }
  });
}

// Extract frontmatter
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

// Parse sources and references from frontmatter
function parseLinksFromFrontmatter(frontmatter) {
  const sources = [];
  const references = [];

  // Extract sources
  const sourcesMatch = frontmatter.match(/sources:\s*([\s\S]*?)(?=\n\w+:|$)/);
  if (sourcesMatch) {
    const urls = Array.from(sourcesMatch[1].matchAll(/url:\s*"([^"]+)"/g), m => m[1]);
    const names = Array.from(sourcesMatch[1].matchAll(/name:\s*"([^"]+)"/g), m => m[1]);
    for (let i = 0; i < urls.length; i++) {
      sources.push({ name: names[i], url: urls[i] });
    }
  }

  // Extract references
  const referencesMatch = frontmatter.match(/references:\s*([\s\S]*?)(?=\n\w+:|$)/);
  if (referencesMatch) {
    const urls = Array.from(referencesMatch[1].matchAll(/url:\s*"([^"]+)"/g), m => m[1]);
    const names = Array.from(referencesMatch[1].matchAll(/name:\s*"([^"]+)"/g), m => m[1]);
    for (let i = 0; i < urls.length; i++) {
      references.push({ name: names[i], url: urls[i] });
    }
  }

  return { sources, references };
}

// Validate a single file
async function validateFile(filePath, originalData = null) {
  const filename = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatter = extractFrontmatter(content);

  if (!frontmatter) {
    results.errors.push(`${filename}: No frontmatter found`);
    return false;
  }

  const { sources, references } = parseLinksFromFrontmatter(frontmatter);
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : filename;

  let fileValid = true;

  // Rule 1: Must have at least MIN_SOURCES sources
  if (sources.length < SAFETY_RULES.MIN_SOURCES_PER_WORK) {
    results.errors.push(
      `❌ ${title}: Only ${sources.length} source(s). Minimum required: ${SAFETY_RULES.MIN_SOURCES_PER_WORK}`
    );
    fileValid = false;
  }

  // Rule 2: Check if we're comparing to original (change validation)
  if (originalData) {
    const originalSources = originalData.sources || [];
    const removedSources = originalSources.filter(
      orig => !sources.find(curr => curr.url === orig.url)
    );

    if (removedSources.length > 0 && sources.length === 0) {
      results.errors.push(
        `❌ ${title}: All sources removed! This would leave the work with no sources.`
      );
      fileValid = false;
    }

    // Track changes
    if (removedSources.length > 0 || sources.length > originalSources.length) {
      results.changes.push({
        file: filename,
        title,
        removedSources: removedSources.length,
        addedSources: sources.length - originalSources.length,
        totalSources: sources.length
      });
    }
  }

  // Rule 3: Test new/changed URLs (if testing enabled)
  if (SAFETY_RULES.REQUIRE_WORKING_LINK_TEST && originalData) {
    const originalUrls = (originalData.sources || []).map(s => s.url);
    const newUrls = sources.filter(s => !originalUrls.includes(s.url));

    for (const source of newUrls) {
      console.log(`   Testing new URL: ${source.url}`);
      const test = await testUrl(source.url);

      if (!test.success) {
        results.warnings.push(
          `⚠️  ${title}: New URL returns ${test.statusCode || 'error'}: ${source.url}`
        );
      } else {
        console.log(`   ✅ OK (${test.statusCode})`);
      }
    }
  }

  // Rule 4: Warn about duplicate URLs
  const allUrls = [...sources, ...references].map(l => l.url);
  const duplicates = allUrls.filter((url, i) => allUrls.indexOf(url) !== i);
  if (duplicates.length > 0) {
    results.warnings.push(
      `⚠️  ${title}: Duplicate URLs found: ${duplicates.join(', ')}`
    );
  }

  return fileValid;
}

// Create backup of original files
function createBackup(files) {
  if (!SAFETY_RULES.AUTO_BACKUP) return;

  const timestamp = new Date().toISOString().split('T')[0];
  const backupPath = path.join(BACKUP_DIR, timestamp);

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  let backedUp = 0;
  for (const file of files) {
    const filename = path.basename(file);
    const backupFile = path.join(backupPath, filename);

    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(file, backupFile);
      backedUp++;
    }
  }

  console.log(`✅ Backed up ${backedUp} files to ${backupPath}`);
}

// Load previous verification data to compare
function loadPreviousData() {
  try {
    const data = JSON.parse(
      fs.readFileSync('verification-reports/link-verification-robust-2025-11-05.json', 'utf-8')
    );

    const workData = {};
    data.details.forEach(work => {
      workData[work.file] = {
        title: work.title,
        sources: work.links.filter(l => l.type === 'source'),
        references: work.links.filter(l => l.type === 'reference')
      };
    });

    return workData;
  } catch (error) {
    console.log('⚠️  No previous verification data found - skipping change comparison');
    return null;
  }
}

// Main validation
async function main() {
  console.log('🔍 Automated Link Change Validator');
  console.log('===================================\n');

  console.log('Safety Rules:');
  Object.entries(SAFETY_RULES).forEach(([rule, value]) => {
    console.log(`  ${rule}: ${value}`);
  });
  console.log('');

  // Get all work files
  const files = fs.readdirSync(WORKS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(WORKS_DIR, f));

  console.log(`📚 Found ${files.length} work files to validate\n`);

  // Create backup first
  if (SAFETY_RULES.AUTO_BACKUP) {
    console.log('💾 Creating backup...');
    createBackup(files);
    console.log('');
  }

  // Load previous data for comparison
  const previousData = loadPreviousData();

  console.log('🔍 Validating files...\n');

  // Validate each file
  for (const file of files) {
    const filename = path.basename(file);
    const originalData = previousData ? previousData[filename] : null;

    const valid = await validateFile(file, originalData);
    results.filesChecked++;

    if (!valid) {
      results.passed = false;
    }
  }

  // Generate report
  console.log('\n📊 VALIDATION REPORT');
  console.log('====================\n');

  console.log(`Files checked: ${results.filesChecked}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  console.log(`Changes detected: ${results.changes.length}\n`);

  if (results.errors.length > 0) {
    console.log('❌ ERRORS:\n');
    results.errors.forEach(err => console.log(err));
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    results.warnings.forEach(warn => console.log(warn));
    console.log('');
  }

  if (results.changes.length > 0) {
    console.log('📝 CHANGES DETECTED:\n');
    results.changes.forEach(change => {
      console.log(`${change.title}:`);
      if (change.removedSources > 0) {
        console.log(`  - Removed ${change.removedSources} source(s)`);
      }
      if (change.addedSources > 0) {
        console.log(`  + Added ${change.addedSources} source(s)`);
      }
      console.log(`  = Total sources: ${change.totalSources}`);
      console.log('');
    });
  }

  // Save validation report
  const reportPath = `./validation-report-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed report saved: ${reportPath}\n`);

  if (results.passed) {
    console.log('✅ VALIDATION PASSED - All safety checks passed!');
    process.exit(0);
  } else {
    console.log('❌ VALIDATION FAILED - Please fix errors before proceeding!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
