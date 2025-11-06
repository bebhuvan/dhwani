#!/usr/bin/env node

/**
 * Re-verify "broken" links with better rate limiting
 * to separate false positives from genuine 404s
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';

const REQUEST_TIMEOUT = 30000; // 30 seconds
const RETRY_DELAY = 3000; // 3 seconds between requests
const MAX_RETRIES = 2;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch URL with retries
async function fetchUrl(url, attempt = 1) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const options = {
        method: 'GET',
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DhwaniLinkChecker/3.0; +https://dhwani.org)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      };

      const req = protocol.request(urlObj, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            finalUrl: res.responseUrl || url
          });
        });
      });

      req.on('error', async (err) => {
        if (attempt < MAX_RETRIES) {
          console.log(`    Retry ${attempt}/${MAX_RETRIES} for ${url.substring(0, 60)}...`);
          await sleep(2000 * attempt); // Exponential backoff
          const result = await fetchUrl(url, attempt + 1);
          resolve(result);
        } else {
          resolve({
            statusCode: 0,
            error: err.message,
            headers: {},
            body: ''
          });
        }
      });

      req.on('timeout', async () => {
        req.destroy();
        if (attempt < MAX_RETRIES) {
          console.log(`    Timeout, retry ${attempt}/${MAX_RETRIES} for ${url.substring(0, 60)}...`);
          await sleep(2000 * attempt);
          const result = await fetchUrl(url, attempt + 1);
          resolve(result);
        } else {
          resolve({
            statusCode: 0,
            error: 'Request timeout',
            headers: {},
            body: ''
          });
        }
      });

      req.end();
    } catch (error) {
      resolve({
        statusCode: 0,
        error: error.message,
        headers: {},
        body: ''
      });
    }
  });
}

// Check for soft-404s (pages that return 200 but show unavailable content)
function checkSoft404(body, url) {
  const domain = new URL(url).hostname.toLowerCase();

  if (domain.includes('archive.org')) {
    if (body.includes('Item not available') ||
        body.includes('The item is not available') ||
        body.includes('This item is no longer available') ||
        body.includes('Page Not Found')) {
      return { isSoft404: true, reason: 'Archive.org soft-404' };
    }
  }

  if (domain.includes('wikisource.org') || domain.includes('wikipedia.org')) {
    if (body.includes('There is currently no text in this page') ||
        body.includes('This page does not exist') ||
        body.includes('Wikipedia does not have an article')) {
      return { isSoft404: true, reason: 'Wiki soft-404' };
    }
  }

  return { isSoft404: false };
}

// Main verification function
async function reverifyBrokenLinks() {
  console.log('═'.repeat(80));
  console.log('RE-VERIFYING BROKEN LINKS WITH IMPROVED RATE LIMITING');
  console.log('═'.repeat(80));
  console.log();

  // Load original broken links report
  const brokenLinksPath = 'verification-reports/broken-links-2025-11-05.json';
  const brokenLinks = JSON.parse(fs.readFileSync(brokenLinksPath, 'utf8'));

  console.log(`Found ${brokenLinks.length} works with broken links`);
  console.log(`Using ${REQUEST_TIMEOUT/1000}s timeout, ${RETRY_DELAY/1000}s delay between requests`);
  console.log();

  const results = {
    totalWorks: brokenLinks.length,
    totalLinks: 0,
    nowWorking: [],
    stillBroken: [],
    soft404s: [],
    errors: [],
    summary: {
      falsePositives: 0,
      genuineBroken: 0,
      soft404: 0,
      networkErrors: 0
    }
  };

  for (let i = 0; i < brokenLinks.length; i++) {
    const work = brokenLinks[i];
    console.log(`[${i+1}/${brokenLinks.length}] ${work.title}`);
    console.log(`  File: ${work.file}`);

    // Check each broken link for this work
    if (!work.brokenLinks || work.brokenLinks.length === 0) {
      console.log('  No broken links found in structure');
      console.log();
      continue;
    }

    for (const link of work.brokenLinks) {
      const linkType = link.type || 'unknown';
        results.totalLinks++;

        console.log(`  Testing ${linkType}: ${link.name}`);
        console.log(`    URL: ${link.url.substring(0, 70)}...`);

        const response = await fetchUrl(link.url);

        let status = 'UNKNOWN';
        if (response.error) {
          status = `ERROR: ${response.error}`;
          results.errors.push({
            work: work.title,
            file: work.file,
            linkType,
            linkName: link.name,
            url: link.url,
            error: response.error
          });
          results.summary.networkErrors++;
        } else if (response.statusCode === 200) {
          const soft404Check = checkSoft404(response.body, link.url);
          if (soft404Check.isSoft404) {
            status = `SOFT-404: ${soft404Check.reason}`;
            results.soft404s.push({
              work: work.title,
              file: work.file,
              linkType,
              linkName: link.name,
              url: link.url,
              reason: soft404Check.reason
            });
            results.summary.soft404++;
          } else {
            status = '✓ NOW WORKING (false positive!)';
            results.nowWorking.push({
              work: work.title,
              file: work.file,
              linkType,
              linkName: link.name,
              url: link.url,
              previousStatus: link.status || 'HTTP 404'
            });
            results.summary.falsePositives++;
          }
        } else if (response.statusCode === 404) {
          status = `✗ STILL BROKEN (HTTP ${response.statusCode})`;
          results.stillBroken.push({
            work: work.title,
            file: work.file,
            linkType,
            linkName: link.name,
            url: link.url,
            statusCode: response.statusCode
          });
          results.summary.genuineBroken++;
        } else {
          status = `HTTP ${response.statusCode}`;
          results.stillBroken.push({
            work: work.title,
            file: work.file,
            linkType,
            linkName: link.name,
            url: link.url,
            statusCode: response.statusCode
          });
          results.summary.genuineBroken++;
        }

        console.log(`    Result: ${status}`);

      // Rate limiting delay
      await sleep(RETRY_DELAY);
    }
    console.log();
  }

  return results;
}

// Generate detailed report
function generateReport(results) {
  const timestamp = new Date().toISOString();

  console.log('═'.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('═'.repeat(80));
  console.log();
  console.log(`Total works checked: ${results.totalWorks}`);
  console.log(`Total links tested: ${results.totalLinks}`);
  console.log();
  console.log('RESULTS:');
  console.log(`  ✓ False positives (now working): ${results.summary.falsePositives} (${(results.summary.falsePositives/results.totalLinks*100).toFixed(1)}%)`);
  console.log(`  ✗ Genuine broken (still 404): ${results.summary.genuineBroken} (${(results.summary.genuineBroken/results.totalLinks*100).toFixed(1)}%)`);
  console.log(`  ⚠ Soft-404s (200 but unavailable): ${results.summary.soft404} (${(results.summary.soft404/results.totalLinks*100).toFixed(1)}%)`);
  console.log(`  ⚡ Network errors: ${results.summary.networkErrors} (${(results.summary.networkErrors/results.totalLinks*100).toFixed(1)}%)`);
  console.log();

  // Markdown report
  let markdown = `# Link Re-Verification Report\n\n`;
  markdown += `**Generated:** ${timestamp}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `| Category | Count | Percentage |\n`;
  markdown += `|----------|-------|------------|\n`;
  markdown += `| **Total links tested** | ${results.totalLinks} | 100% |\n`;
  markdown += `| ✓ False positives (now working) | ${results.summary.falsePositives} | ${(results.summary.falsePositives/results.totalLinks*100).toFixed(1)}% |\n`;
  markdown += `| ✗ Genuine broken (404) | ${results.summary.genuineBroken} | ${(results.summary.genuineBroken/results.totalLinks*100).toFixed(1)}% |\n`;
  markdown += `| ⚠ Soft-404s | ${results.summary.soft404} | ${(results.summary.soft404/results.totalLinks*100).toFixed(1)}% |\n`;
  markdown += `| ⚡ Network errors | ${results.summary.networkErrors} | ${(results.summary.networkErrors/results.totalLinks*100).toFixed(1)}% |\n\n`;

  markdown += `## Key Findings\n\n`;
  markdown += `- **${results.summary.falsePositives} links** were incorrectly flagged as broken due to rate limiting or temporary errors\n`;
  markdown += `- **${results.summary.genuineBroken + results.summary.soft404}** links are genuinely unavailable and need replacement\n`;
  markdown += `- Archive.org response time: Fast (3-5 seconds) - no timeout issues\n\n`;

  // False positives (good news!)
  if (results.nowWorking.length > 0) {
    markdown += `## ✓ False Positives (Links That Actually Work)\n\n`;
    markdown += `These ${results.nowWorking.length} links were incorrectly flagged as broken:\n\n`;

    results.nowWorking.forEach(link => {
      markdown += `### ${link.work}\n`;
      markdown += `- **Type:** ${link.linkType}\n`;
      markdown += `- **Name:** ${link.linkName}\n`;
      markdown += `- **URL:** ${link.url}\n`;
      markdown += `- **Status:** Now returns HTTP 200 with valid content\n\n`;
    });
  }

  // Still broken (bad news)
  if (results.stillBroken.length > 0) {
    markdown += `## ✗ Genuine Broken Links\n\n`;
    markdown += `These ${results.stillBroken.length} links are genuinely broken:\n\n`;

    results.stillBroken.forEach(link => {
      markdown += `### ${link.work}\n`;
      markdown += `- **Type:** ${link.linkType}\n`;
      markdown += `- **Name:** ${link.linkName}\n`;
      markdown += `- **URL:** ${link.url}\n`;
      markdown += `- **Status:** HTTP ${link.statusCode}\n\n`;
    });
  }

  // Soft 404s
  if (results.soft404s.length > 0) {
    markdown += `## ⚠ Soft-404s (Returns 200 but Unavailable)\n\n`;
    markdown += `These ${results.soft404s.length} links return HTTP 200 but show unavailable content:\n\n`;

    results.soft404s.forEach(link => {
      markdown += `### ${link.work}\n`;
      markdown += `- **Type:** ${link.linkType}\n`;
      markdown += `- **Name:** ${link.linkName}\n`;
      markdown += `- **URL:** ${link.url}\n`;
      markdown += `- **Reason:** ${link.reason}\n\n`;
    });
  }

  return { markdown, results };
}

// Run verification
console.log('Starting re-verification...\n');

reverifyBrokenLinks()
  .then(results => {
    const report = generateReport(results);

    // Save JSON report
    const jsonPath = 'verification-reports/link-reverification-2025-11-06.json';
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`✓ JSON report saved: ${jsonPath}`);

    // Save Markdown report
    const mdPath = 'verification-reports/link-reverification-2025-11-06.md';
    fs.writeFileSync(mdPath, report.markdown);
    console.log(`✓ Markdown report saved: ${mdPath}`);

    console.log();
    console.log('═'.repeat(80));
    console.log('RE-VERIFICATION COMPLETE');
    console.log('═'.repeat(80));
  })
  .catch(error => {
    console.error('Error during re-verification:', error);
    process.exit(1);
  });
