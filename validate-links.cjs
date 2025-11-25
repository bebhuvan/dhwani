#!/usr/bin/env node

/**
 * Link Validator for Enhanced Dhwani Works
 * Validates all URLs in YAML frontmatter
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

const WORKS_DIR = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/fully-enhanced-works';
const REPORT_FILE = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/link-validation-report.json';

// Check if URL is accessible
async function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        method: 'HEAD',
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        timeout: timeout,
        headers: {
          'User-Agent': 'Dhwani-Link-Validator/1.0'
        }
      };

      const req = protocol.request(options, (res) => {
        resolve({
          url,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          redirected: res.statusCode >= 300 && res.statusCode < 400
        });
      });

      req.on('error', (err) => {
        resolve({
          url,
          status: 0,
          ok: false,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          status: 0,
          ok: false,
          error: 'Timeout'
        });
      });

      req.end();
    } catch (err) {
      resolve({
        url,
        status: 0,
        ok: false,
        error: `Invalid URL: ${err.message}`
      });
    }
  });
}

// Extract URLs from YAML frontmatter
function extractUrls(content) {
  const urls = [];
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    return urls;
  }

  const frontmatter = frontmatterMatch[1];
  
  // Extract URLs from sources and references
  const urlMatches = frontmatter.matchAll(/url:\s*(?:['"]?)([^\s'"]+)(?:['"]?)/g);
  
  for (const match of urlMatches) {
    const url = match[1];
    if (url.startsWith('http')) {
      urls.push(url);
    }
  }

  return urls;
}

// Validate a single work file
async function validateWorkFile(filename) {
  const filePath = path.join(WORKS_DIR, filename);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const urls = extractUrls(content);
    
    if (urls.length === 0) {
      return {
        file: filename,
        urls: [],
        allValid: true,
        totalUrls: 0,
        validUrls: 0,
        invalidUrls: 0
      };
    }

    console.log(`\n📄 ${filename}`);
    console.log(`   Found ${urls.length} URLs to validate...`);

    const results = [];
    
    for (const url of urls) {
      const result = await checkUrl(url);
      results.push(result);
      
      if (!result.ok) {
        console.log(`   ❌ ${url} (${result.status || result.error})`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const validCount = results.filter(r => r.ok).length;
    const invalidCount = results.filter(r => !r.ok).length;

    console.log(`   ✓ ${validCount} valid, ✗ ${invalidCount} invalid`);

    return {
      file: filename,
      urls: results,
      allValid: invalidCount === 0,
      totalUrls: urls.length,
      validUrls: validCount,
      invalidUrls: invalidCount
    };

  } catch (error) {
    console.error(`Error processing ${filename}: ${error.message}`);
    return {
      file: filename,
      error: error.message,
      allValid: false
    };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔗 DHWANI LINK VALIDATION');
  console.log('='.repeat(70));

  const files = await fs.readdir(WORKS_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`\n📚 Validating links in ${mdFiles.length} files...\n`);

  const results = {
    timestamp: new Date().toISOString(),
    totalFiles: mdFiles.length,
    filesProcessed: 0,
    totalUrls: 0,
    validUrls: 0,
    invalidUrls: 0,
    fileResults: [],
    invalidUrlsByType: {
      archive: [],
      wikipedia: [],
      wikisource: [],
      openLibrary: [],
      other: []
    }
  };

  for (const filename of mdFiles) {
    const fileResult = await validateWorkFile(filename);
    results.fileResults.push(fileResult);
    results.filesProcessed++;
    results.totalUrls += fileResult.totalUrls || 0;
    results.validUrls += fileResult.validUrls || 0;
    results.invalidUrls += fileResult.invalidUrls || 0;

    // Categorize invalid URLs
    if (fileResult.urls) {
      for (const urlResult of fileResult.urls) {
        if (!urlResult.ok) {
          const url = urlResult.url;
          if (url.includes('archive.org')) {
            results.invalidUrlsByType.archive.push({ file: filename, ...urlResult });
          } else if (url.includes('wikipedia.org')) {
            results.invalidUrlsByType.wikipedia.push({ file: filename, ...urlResult });
          } else if (url.includes('wikisource.org')) {
            results.invalidUrlsByType.wikisource.push({ file: filename, ...urlResult });
          } else if (url.includes('openlibrary.org')) {
            results.invalidUrlsByType.openLibrary.push({ file: filename, ...urlResult });
          } else {
            results.invalidUrlsByType.other.push({ file: filename, ...urlResult });
          }
        }
      }
    }
  }

  // Save detailed report
  await fs.writeFile(REPORT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nTotal files: ${results.totalFiles}`);
  console.log(`Total URLs checked: ${results.totalUrls}`);
  console.log(`✅ Valid URLs: ${results.validUrls} (${(results.validUrls/results.totalUrls*100).toFixed(1)}%)`);
  console.log(`❌ Invalid URLs: ${results.invalidUrls} (${(results.invalidUrls/results.totalUrls*100).toFixed(1)}%)`);

  console.log('\n📋 Invalid URLs by Type:');
  console.log(`  Archive.org: ${results.invalidUrlsByType.archive.length}`);
  console.log(`  Wikipedia: ${results.invalidUrlsByType.wikipedia.length}`);
  console.log(`  Wikisource: ${results.invalidUrlsByType.wikisource.length}`);
  console.log(`  Open Library: ${results.invalidUrlsByType.openLibrary.length}`);
  console.log(`  Other: ${results.invalidUrlsByType.other.length}`);

  if (results.invalidUrls > 0) {
    console.log('\n⚠️  Files with invalid URLs:');
    const filesWithInvalid = results.fileResults.filter(f => f.invalidUrls > 0);
    filesWithInvalid.forEach(f => {
      console.log(`  - ${f.file}: ${f.invalidUrls} invalid out of ${f.totalUrls}`);
    });
  }

  console.log(`\n📝 Detailed report: ${REPORT_FILE}`);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
