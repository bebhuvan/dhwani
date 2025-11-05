import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// Configuration
const WORKS_DIR = './src/content/works';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const REQUEST_TIMEOUT = 15000; // 15 seconds
const RATE_LIMIT_DELAY = 500; // 500ms between requests
const MAX_REDIRECTS = 5;

// Results tracking
const results = {
  totalWorks: 0,
  totalLinks: 0,
  workingLinks: 0,
  brokenLinks: 0,
  redirectedLinks: 0,
  timeoutLinks: 0,
  errorLinks: 0,
  details: []
};

// Sleep helper for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extract frontmatter from markdown file
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  if (!match) return null;
  return match[1];
}

// Parse YAML-like frontmatter (simple parser for our needs)
function parseFrontmatter(frontmatter) {
  const sources = [];
  const references = [];

  // Extract sources
  const sourcesMatch = frontmatter.match(/sources:\s*([\s\S]*?)(?=\n\w+:|$)/);
  if (sourcesMatch) {
    const sourcesText = sourcesMatch[1];
    const urlMatches = sourcesText.matchAll(/url:\s*"([^"]+)"/g);
    const nameMatches = sourcesText.matchAll(/name:\s*"([^"]+)"/g);
    const urls = Array.from(urlMatches, m => m[1]);
    const names = Array.from(nameMatches, m => m[1]);

    for (let i = 0; i < urls.length; i++) {
      sources.push({ name: names[i] || 'Unknown', url: urls[i] });
    }
  }

  // Extract references
  const referencesMatch = frontmatter.match(/references:\s*([\s\S]*?)(?=\n\w+:|$)/);
  if (referencesMatch) {
    const referencesText = referencesMatch[1];
    const urlMatches = referencesText.matchAll(/url:\s*"([^"]+)"/g);
    const nameMatches = referencesText.matchAll(/name:\s*"([^"]+)"/g);
    const urls = Array.from(urlMatches, m => m[1]);
    const names = Array.from(nameMatches, m => m[1]);

    for (let i = 0; i < urls.length; i++) {
      references.push({ name: names[i] || 'Unknown', url: urls[i] });
    }
  }

  // Extract title
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : 'Unknown';

  return { title, sources, references };
}

// Check URL with retry logic
async function checkUrl(url, retries = 0) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const options = {
        method: 'HEAD',
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0; +Dhwani Link Verification)'
        }
      };

      const req = protocol.request(url, options, (res) => {
        const statusCode = res.statusCode;

        // Handle redirects
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location;
          resolve({
            status: 'redirect',
            statusCode,
            redirectUrl,
            message: `Redirects to ${redirectUrl}`
          });
        }
        // Success
        else if (statusCode >= 200 && statusCode < 300) {
          resolve({
            status: 'ok',
            statusCode,
            message: 'OK'
          });
        }
        // Client/Server errors
        else if (statusCode >= 400) {
          resolve({
            status: 'error',
            statusCode,
            message: `HTTP ${statusCode}`
          });
        }
        // Other status codes
        else {
          resolve({
            status: 'unknown',
            statusCode,
            message: `HTTP ${statusCode}`
          });
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (retries < MAX_RETRIES) {
          setTimeout(async () => {
            const result = await checkUrl(url, retries + 1);
            resolve(result);
          }, RETRY_DELAY);
        } else {
          resolve({
            status: 'timeout',
            message: `Timeout after ${MAX_RETRIES} retries`
          });
        }
      });

      req.on('error', (error) => {
        if (retries < MAX_RETRIES) {
          setTimeout(async () => {
            const result = await checkUrl(url, retries + 1);
            resolve(result);
          }, RETRY_DELAY);
        } else {
          resolve({
            status: 'error',
            message: error.message
          });
        }
      });

      req.end();
    } catch (error) {
      resolve({
        status: 'error',
        message: `Invalid URL: ${error.message}`
      });
    }
  });
}

// Process a single work file
async function processWorkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatter = extractFrontmatter(content);

  if (!frontmatter) {
    console.log(`⚠️  No frontmatter found in ${path.basename(filePath)}`);
    return null;
  }

  const parsed = parseFrontmatter(frontmatter);
  const allLinks = [
    ...parsed.sources.map(s => ({ ...s, type: 'source' })),
    ...parsed.references.map(r => ({ ...r, type: 'reference' }))
  ];

  const workResult = {
    file: path.basename(filePath),
    title: parsed.title,
    links: []
  };

  console.log(`\n📖 Checking: ${parsed.title}`);
  console.log(`   ${allLinks.length} link(s) to verify...`);

  for (const link of allLinks) {
    console.log(`   ⏳ ${link.type}: ${link.name} - ${link.url}`);

    const result = await checkUrl(link.url);
    await sleep(RATE_LIMIT_DELAY); // Rate limiting

    const linkResult = {
      name: link.name,
      url: link.url,
      type: link.type,
      status: result.status,
      statusCode: result.statusCode,
      message: result.message,
      redirectUrl: result.redirectUrl
    };

    workResult.links.push(linkResult);

    // Update counters
    results.totalLinks++;

    if (result.status === 'ok') {
      results.workingLinks++;
      console.log(`   ✅ OK (${result.statusCode})`);
    } else if (result.status === 'redirect') {
      results.redirectedLinks++;
      console.log(`   🔄 Redirect (${result.statusCode}) -> ${result.redirectUrl}`);
    } else if (result.status === 'timeout') {
      results.timeoutLinks++;
      console.log(`   ⏱️  Timeout`);
    } else {
      if (result.statusCode === 404) {
        results.brokenLinks++;
        console.log(`   ❌ Not Found (404)`);
      } else {
        results.errorLinks++;
        console.log(`   ⚠️  Error: ${result.message}`);
      }
    }
  }

  return workResult;
}

// Main function
async function main() {
  console.log('🚀 Dhwani Link Verification System');
  console.log('=====================================\n');
  console.log(`📂 Scanning directory: ${WORKS_DIR}`);

  // Get all markdown files
  const files = fs.readdirSync(WORKS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(WORKS_DIR, f));

  results.totalWorks = files.length;
  console.log(`📚 Found ${files.length} work files\n`);
  console.log('⚙️  Configuration:');
  console.log(`   - Max retries: ${MAX_RETRIES}`);
  console.log(`   - Request timeout: ${REQUEST_TIMEOUT}ms`);
  console.log(`   - Rate limit delay: ${RATE_LIMIT_DELAY}ms`);
  console.log('\n🔍 Starting verification...\n');

  const startTime = Date.now();

  // Process each file
  for (const file of files) {
    try {
      const workResult = await processWorkFile(file);
      if (workResult) {
        results.details.push(workResult);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

  // Generate summary report
  console.log('\n\n📊 VERIFICATION SUMMARY');
  console.log('======================\n');
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log(`📚 Total works: ${results.totalWorks}`);
  console.log(`🔗 Total links: ${results.totalLinks}`);
  console.log(`✅ Working links: ${results.workingLinks} (${((results.workingLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`🔄 Redirected links: ${results.redirectedLinks} (${((results.redirectedLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`❌ Broken links: ${results.brokenLinks} (${((results.brokenLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`⏱️  Timeout links: ${results.timeoutLinks} (${((results.timeoutLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`⚠️  Error links: ${results.errorLinks} (${((results.errorLinks/results.totalLinks)*100).toFixed(1)}%)`);

  // Generate detailed reports
  const reportDir = './verification-reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }

  const timestamp = new Date().toISOString().split('T')[0];

  // Full JSON report
  const jsonReport = path.join(reportDir, `link-verification-${timestamp}.json`);
  fs.writeFileSync(jsonReport, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full report saved to: ${jsonReport}`);

  // Broken links report
  const brokenLinks = results.details
    .map(work => ({
      file: work.file,
      title: work.title,
      brokenLinks: work.links.filter(l => l.status === 'error' && l.statusCode === 404)
    }))
    .filter(work => work.brokenLinks.length > 0);

  if (brokenLinks.length > 0) {
    const brokenReport = path.join(reportDir, `broken-links-${timestamp}.json`);
    fs.writeFileSync(brokenReport, JSON.stringify(brokenLinks, null, 2));
    console.log(`❌ Broken links report: ${brokenReport}`);

    // Markdown summary of broken links
    let mdReport = '# Broken Links Report\n\n';
    mdReport += `Generated: ${new Date().toISOString()}\n\n`;
    mdReport += `## Summary\n\n`;
    mdReport += `- Total works with broken links: ${brokenLinks.length}\n`;
    mdReport += `- Total broken links: ${results.brokenLinks}\n\n`;
    mdReport += `## Details\n\n`;

    brokenLinks.forEach(work => {
      mdReport += `### ${work.title}\n\n`;
      mdReport += `**File:** \`${work.file}\`\n\n`;
      work.brokenLinks.forEach(link => {
        mdReport += `- **${link.type}**: ${link.name}\n`;
        mdReport += `  - URL: ${link.url}\n`;
        mdReport += `  - Status: ${link.message}\n\n`;
      });
    });

    const mdReportPath = path.join(reportDir, `broken-links-${timestamp}.md`);
    fs.writeFileSync(mdReportPath, mdReport);
    console.log(`📝 Broken links markdown: ${mdReportPath}`);
  }

  // Redirected links report
  const redirectedLinks = results.details
    .map(work => ({
      file: work.file,
      title: work.title,
      redirectedLinks: work.links.filter(l => l.status === 'redirect')
    }))
    .filter(work => work.redirectedLinks.length > 0);

  if (redirectedLinks.length > 0) {
    const redirectReport = path.join(reportDir, `redirected-links-${timestamp}.json`);
    fs.writeFileSync(redirectReport, JSON.stringify(redirectedLinks, null, 2));
    console.log(`🔄 Redirected links report: ${redirectReport}`);
  }

  // Error/timeout links report
  const problemLinks = results.details
    .map(work => ({
      file: work.file,
      title: work.title,
      problemLinks: work.links.filter(l => l.status === 'timeout' || (l.status === 'error' && l.statusCode !== 404))
    }))
    .filter(work => work.problemLinks.length > 0);

  if (problemLinks.length > 0) {
    const problemReport = path.join(reportDir, `problem-links-${timestamp}.json`);
    fs.writeFileSync(problemReport, JSON.stringify(problemLinks, null, 2));
    console.log(`⚠️  Problem links report: ${problemReport}`);
  }

  console.log('\n✅ Verification complete!');

  // Return exit code based on results
  if (results.brokenLinks > 0) {
    console.log('\n⚠️  Warning: Broken links detected!');
    process.exit(1);
  }
}

// Run the verification
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
