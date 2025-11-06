#!/usr/bin/env node

/**
 * Documented Links Verifier
 *
 * Verifies all 600+ Archive.org URLs documented in verification reports
 * Tests HTTP status codes and validates actual accessibility
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BATCH_SIZE = 10; // Process N URLs in parallel
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
const REQUEST_TIMEOUT = 10000; // 10 second timeout per request

/**
 * Extract Archive.org URLs from markdown report
 */
function extractUrlsFromReport(reportPath) {
  const content = fs.readFileSync(reportPath, 'utf8');
  const urls = [];

  // Pattern 1: Full URLs with https://
  const fullUrlRegex = /https?:\/\/archive\.org\/(details|stream)\/[^\s\)"\]<>]+/gi;
  const fullMatches = content.match(fullUrlRegex) || [];

  fullMatches.forEach(url => {
    // Clean URL (remove trailing punctuation)
    const cleanUrl = url.replace(/[,;.)\]]+$/, '');
    if (!urls.includes(cleanUrl)) {
      urls.push(cleanUrl);
    }
  });

  // Pattern 2: Relative URLs in tables (archive.org/details/...)
  const relativeUrlRegex = /archive\.org\/(details|stream)\/[^\s\)"\]<>\|]+/gi;
  const relativeMatches = content.match(relativeUrlRegex) || [];

  relativeMatches.forEach(url => {
    // Skip if already found as full URL
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const cleanUrl = fullUrl.replace(/[,;.)\]]+$/, '');

    if (!urls.includes(cleanUrl)) {
      urls.push(cleanUrl);
    }
  });

  return urls;
}

/**
 * Extract Archive.org ID from URL
 */
function extractArchiveId(url) {
  const match = url.match(/archive\.org\/details\/([^\/\?#]+)/);
  return match ? match[1] : null;
}

/**
 * Check HTTP status of URL with redirects
 */
function checkUrlStatus(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'Dhwani-Link-Verifier/1.0'
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://archive.org${res.headers.location}`;

        resolve({
          url,
          status: res.statusCode,
          finalUrl: redirectUrl,
          redirected: true,
          success: true
        });
      } else {
        resolve({
          url,
          status: res.statusCode,
          finalUrl: url,
          redirected: false,
          success: res.statusCode === 200
        });
      }
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        error: err.message,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        error: 'Request timeout',
        success: false
      });
    });
  });
}

/**
 * Fetch Archive.org metadata
 */
function fetchArchiveMetadata(archiveId) {
  return new Promise((resolve) => {
    const url = `https://archive.org/metadata/${archiveId}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const metadata = JSON.parse(data);
          if (metadata.error) {
            resolve({ error: metadata.error });
          } else {
            const meta = metadata.metadata || {};
            resolve({
              title: meta.title || 'N/A',
              creator: meta.creator || meta.author || 'N/A',
              date: meta.date || meta.year || 'N/A',
              mediatype: meta.mediatype || 'N/A',
              collection: Array.isArray(meta.collection) ? meta.collection : [meta.collection || 'N/A']
            });
          }
        } catch (e) {
          resolve({ error: `Parse error: ${e.message}` });
        }
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

/**
 * Process URLs in batches
 */
async function verifyUrlsBatch(urls, startIdx, batchSize) {
  const batch = urls.slice(startIdx, startIdx + batchSize);
  const promises = batch.map(url => checkUrlStatus(url));
  return await Promise.all(promises);
}

/**
 * Verify all URLs with detailed metadata
 */
async function verifyAllUrls(urls) {
  const results = [];

  console.log(`\n🔍 Verifying ${urls.length} Archive.org URLs...`);
  console.log(`⚙️  Processing ${BATCH_SIZE} URLs at a time with ${DELAY_BETWEEN_BATCHES}ms delay\n`);

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batchResults = await verifyUrlsBatch(urls, i, BATCH_SIZE);

    // Add metadata for successful results
    for (const result of batchResults) {
      const archiveId = extractArchiveId(result.url);

      if (result.success && archiveId) {
        // Fetch metadata
        const metadata = await fetchArchiveMetadata(archiveId);
        result.archiveId = archiveId;
        result.metadata = metadata;

        // Small delay between metadata requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      results.push(result);

      // Progress indicator
      const progressChar = result.success ? '✓' : '✗';
      const statusInfo = result.status || 'ERR';
      console.log(`[${results.length}/${urls.length}] ${progressChar} ${statusInfo} ${result.url.substring(0, 60)}...`);
    }

    // Delay between batches (except for last batch)
    if (i + BATCH_SIZE < urls.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  return results;
}

/**
 * Generate comprehensive report
 */
function generateReport(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const redirected = results.filter(r => r.redirected);

  const statusCodes = {};
  results.forEach(r => {
    const code = r.status || 'ERROR';
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });

  return {
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      redirected: redirected.length,
      successRate: `${((successful.length / results.length) * 100).toFixed(1)}%`,
      statusCodes
    },
    successful: successful.map(r => ({
      url: r.url,
      archiveId: r.archiveId,
      status: r.status,
      redirected: r.redirected || false,
      finalUrl: r.finalUrl,
      metadata: r.metadata
    })),
    failed: failed.map(r => ({
      url: r.url,
      status: r.status,
      error: r.error
    })),
    redirected: redirected.map(r => ({
      url: r.url,
      status: r.status,
      finalUrl: r.finalUrl
    }))
  };
}

/**
 * Generate human-readable markdown report
 */
function generateMarkdownReport(report) {
  const timestamp = new Date().toISOString();

  return `# ARCHIVE.ORG LINKS VERIFICATION REPORT

**Date:** ${timestamp}
**Total URLs Tested:** ${report.summary.total}
**Successful:** ${report.summary.successful} (${report.summary.successRate})
**Failed:** ${report.summary.failed}
**Redirected:** ${report.summary.redirected}

---

## 📊 STATUS CODE BREAKDOWN

${Object.entries(report.summary.statusCodes)
  .sort((a, b) => b[1] - a[1])
  .map(([code, count]) => `- **${code}**: ${count} URLs`)
  .join('\n')}

---

## ✅ SUCCESSFUL URLS (${report.summary.successful})

${report.successful.slice(0, 50).map((r, i) => `
### ${i + 1}. ${r.archiveId || 'Unknown'}

- **URL:** ${r.url}
- **Status:** ${r.status}${r.redirected ? ' (Redirected)' : ''}
${r.finalUrl !== r.url ? `- **Final URL:** ${r.finalUrl}` : ''}
${r.metadata && !r.metadata.error ? `- **Title:** ${r.metadata.title}
- **Creator:** ${r.metadata.creator}
- **Date:** ${r.metadata.date}
- **Media Type:** ${r.metadata.mediatype}
- **Collections:** ${Array.isArray(r.metadata.collection) ? r.metadata.collection.join(', ') : r.metadata.collection}` : ''}
`).join('\n')}

${report.successful.length > 50 ? `\n... and ${report.successful.length - 50} more successful URLs\n` : ''}

---

## ❌ FAILED URLS (${report.summary.failed})

${report.failed.length > 0 ? report.failed.map((r, i) => `
${i + 1}. **${r.url}**
   - Status: ${r.status || 'ERROR'}
   - Error: ${r.error || 'Unknown'}
`).join('\n') : 'None - all URLs verified successfully!'}

---

## 🔄 REDIRECTED URLS (${report.summary.redirected})

${report.redirected.length > 0 ? report.redirected.map((r, i) => `
${i + 1}. **Original:** ${r.url}
   - **Redirected to:** ${r.finalUrl}
   - **Status:** ${r.status}
`).join('\n') : 'No redirects detected'}

---

## 📋 RECOMMENDATIONS

${report.summary.failed > 0 ? `
### Failed Links
${report.failed.length} URLs failed verification. Review these for:
- Incorrect Archive.org identifiers
- Temporarily unavailable items
- Items that may have been removed

Consider searching Archive.org manually for alternative editions.
` : ''}

${report.summary.redirected > 0 ? `
### Redirected Links
${report.redirected.length} URLs redirect to different locations. Consider updating to final URLs.
` : ''}

### Overall Assessment
- **Success Rate:** ${report.summary.successRate}
- **Recommended Action:** ${parseFloat(report.summary.successRate) > 95 ? 'Proceed with adding links to work files' : 'Review and fix failed links before proceeding'}

---

**Report Generated:** ${timestamp}
**Verification Tool:** verify-documented-links.js v1.0
`;
}

/**
 * Main execution
 */
async function main() {
  const reportFiles = [
    '../BATCH_2_VERIFICATION_REPORT.md',
    '../BATCH_3_FINAL_SPRINT.txt',
    '../FINAL_VERIFICATION_SUMMARY.md',
    '../MASTER_PROGRESS_REPORT.md'
  ];

  let allUrls = [];

  // Extract URLs from all reports
  console.log('📚 Extracting URLs from verification reports...\n');

  for (const reportFile of reportFiles) {
    const reportPath = path.join(__dirname, reportFile);

    if (fs.existsSync(reportPath)) {
      const urls = extractUrlsFromReport(reportPath);
      console.log(`  ${path.basename(reportFile)}: ${urls.length} URLs`);
      allUrls = allUrls.concat(urls);
    }
  }

  // Remove duplicates
  allUrls = [...new Set(allUrls)];
  console.log(`\n✨ Total unique URLs to verify: ${allUrls.length}\n`);

  // Verify all URLs
  const results = await verifyAllUrls(allUrls);

  // Generate reports
  console.log('\n📊 Generating reports...\n');

  const report = generateReport(results);
  const markdownReport = generateMarkdownReport(report);

  // Save reports
  const jsonPath = path.join(__dirname, '../URL_VERIFICATION_REPORT.json');
  const mdPath = path.join(__dirname, '../URL_VERIFICATION_REPORT.md');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdPath, markdownReport);

  // Print summary
  console.log('═══════════════════════════════════════');
  console.log('      VERIFICATION COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`Total URLs:     ${report.summary.total}`);
  console.log(`Successful:     ${report.summary.successful} (${report.summary.successRate})`);
  console.log(`Failed:         ${report.summary.failed}`);
  console.log(`Redirected:     ${report.summary.redirected}`);
  console.log('═══════════════════════════════════════');
  console.log(`\n📄 JSON Report: ${jsonPath}`);
  console.log(`📄 MD Report:   ${mdPath}\n`);

  if (report.summary.failed > 0) {
    console.log('⚠️  Some URLs failed verification. Review the report for details.\n');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

export { extractUrlsFromReport, checkUrlStatus, verifyAllUrls, generateReport };
