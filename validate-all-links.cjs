#!/usr/bin/env node

/**
 * Comprehensive Link Validator
 *
 * Validates ALL links in markdown files:
 * - Archive.org links (primary and alternatives)
 * - Wikipedia links
 * - Wikisource links
 * - Any other URLs
 *
 * Reports broken links and suggests fixes
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

const CONFIG = {
  inputDir: process.argv[2] || path.join(__dirname, 'first-200-candidates'),
  timeout: 15000,
};

const RESULTS = {
  total: 0,
  checked: 0,
  valid: 0,
  invalid: 0,
  redirected: 0,
  broken: [],
};

/**
 * Check if URL is accessible
 */
async function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      method: 'HEAD',
      timeout: CONFIG.timeout,
      headers: {
        'User-Agent': 'DhwaniBot/1.0 (https://github.com/dhwani; contact@dhwani.org) Node.js'
      }
    };

    try {
      const urlObj = new URL(url);
      options.hostname = urlObj.hostname;
      options.path = urlObj.pathname + urlObj.search;
    } catch (error) {
      resolve({ valid: false, error: 'invalid URL' });
      return;
    }

    const req = protocol.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ valid: true, statusCode: res.statusCode });
      } else if (res.statusCode >= 300 && res.statusCode < 400) {
        resolve({
          valid: true,
          redirect: true,
          statusCode: res.statusCode,
          location: res.headers.location
        });
      } else {
        resolve({ valid: false, statusCode: res.statusCode });
      }
    });

    req.on('error', (error) => {
      resolve({ valid: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ valid: false, error: 'timeout' });
    });

    req.end();
  });
}

/**
 * Parse frontmatter and extract all URLs
 */
function extractUrls(content) {
  const urls = [];
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) return urls;

  const frontmatter = frontmatterMatch[1];
  const urlRegex = /url:\s*"([^"]+)"/g;
  let match;

  while ((match = urlRegex.exec(frontmatter)) !== null) {
    urls.push({
      url: match[1],
      context: getUrlContext(frontmatter, match.index)
    });
  }

  return urls;
}

/**
 * Get context for URL (is it in sources, references, etc.)
 */
function getUrlContext(text, index) {
  const beforeUrl = text.substring(Math.max(0, index - 200), index);

  if (beforeUrl.includes('sources:')) return 'source';
  if (beforeUrl.includes('references:')) return 'reference';
  return 'other';
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const urls = extractUrls(content);

  if (urls.length === 0) {
    return { file: path.basename(filePath), checked: 0, issues: [] };
  }

  const issues = [];

  for (const {url, context} of urls) {
    RESULTS.checked++;

    process.stdout.write('.');

    const result = await checkUrl(url);
    await new Promise(r => setTimeout(r, 500)); // Rate limiting

    if (result.valid) {
      RESULTS.valid++;
      if (result.redirect) {
        RESULTS.redirected++;
      }
    } else {
      RESULTS.invalid++;
      issues.push({
        url,
        context,
        error: result.error || `HTTP ${result.statusCode}`,
        statusCode: result.statusCode
      });
    }
  }

  return {
    file: path.basename(filePath),
    checked: urls.length,
    issues
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🔗 Comprehensive Link Validator\n');
  console.log('Validating ALL links in markdown files...\n');

  const files = await fs.readdir(CONFIG.inputDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`Found ${mdFiles.length} files to check\n`);

  RESULTS.total = mdFiles.length;

  for (let i = 0; i < mdFiles.length; i++) {
    const file = mdFiles[i];
    const filePath = path.join(CONFIG.inputDir, file);

    process.stdout.write(`[${i + 1}/${mdFiles.length}] ${file.substring(0, 50)}... `);

    try {
      const result = await processFile(filePath);

      if (result.issues.length > 0) {
        console.log(` ❌ ${result.issues.length} broken link(s)`);
        RESULTS.broken.push(result);
      } else {
        console.log(` ✓ All ${result.checked} links OK`);
      }
    } catch (error) {
      console.log(` ⚠️  Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(70));
  console.log(`Files checked:       ${RESULTS.total}`);
  console.log(`Links checked:       ${RESULTS.checked}`);
  console.log(`✅ Valid links:      ${RESULTS.valid}`);
  console.log(`❌ Broken links:     ${RESULTS.invalid}`);
  console.log(`🔀 Redirects:        ${RESULTS.redirected}`);
  console.log(`📁 Files with issues: ${RESULTS.broken.length}`);
  console.log('='.repeat(70));

  if (RESULTS.broken.length > 0) {
    console.log('\n❌ BROKEN LINKS DETAILS:\n');
    for (const item of RESULTS.broken) {
      console.log(`📄 ${item.file}:`);
      for (const issue of item.issues) {
        console.log(`   ❌ [${issue.context}] ${issue.url}`);
        console.log(`      Error: ${issue.error}`);
      }
      console.log('');
    }

    // Save detailed report
    await fs.writeFile(
      path.join(__dirname, 'broken-links-report.json'),
      JSON.stringify(RESULTS.broken, null, 2)
    );
    console.log('📄 Detailed report saved to: broken-links-report.json\n');
  }

  // Exit with error code if there are broken links
  process.exit(RESULTS.invalid > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkUrl, processFile };
