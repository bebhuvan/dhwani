import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// Configuration
const WORKS_DIR = './src/content/works';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const REQUEST_TIMEOUT = 20000;
const RATE_LIMIT_DELAY = 800;

// Results tracking
const results = {
  totalWorks: 0,
  totalLinks: 0,
  workingLinks: 0,
  brokenLinks: 0,
  suspiciousLinks: 0,
  irrelevantLinks: 0,
  redirectedLinks: 0,
  timeoutLinks: 0,
  errorLinks: 0,
  details: []
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extract frontmatter
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  if (!match) return null;
  return match[1];
}

// Parse frontmatter
function parseFrontmatter(frontmatter) {
  const sources = [];
  const references = [];

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

  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : 'Unknown';

  const authorMatch = frontmatter.match(/author:\s*\[(.*?)\]/s);
  const authors = authorMatch ? authorMatch[1].match(/"([^"]+)"/g)?.map(a => a.replace(/"/g, '')) || [] : [];

  return { title, authors, sources, references };
}

// Domain-specific validations
function getDomainValidator(url) {
  const domain = new URL(url).hostname.toLowerCase();

  if (domain.includes('archive.org')) {
    return {
      name: 'Internet Archive',
      checkContent: (content) => {
        // Check for soft-404s
        if (content.includes('Item not available') ||
            content.includes('The item is not available') ||
            content.includes('This item is no longer available') ||
            content.includes('Page Not Found')) {
          return { valid: false, reason: 'Soft-404: Item not available on Archive.org' };
        }
        return { valid: true };
      }
    };
  }

  if (domain.includes('gutenberg.org')) {
    return {
      name: 'Project Gutenberg',
      checkContent: (content) => {
        if (content.includes('not find') ||
            content.includes('No such file') ||
            content.includes('404') ||
            content.toLowerCase().includes('error')) {
          return { valid: false, reason: 'Soft-404: Book not found on Gutenberg' };
        }
        return { valid: true };
      }
    };
  }

  if (domain.includes('wikisource.org')) {
    return {
      name: 'Wikisource',
      checkContent: (content) => {
        if (content.includes('There is currently no text in this page') ||
            content.includes('This page does not exist') ||
            content.includes('Wikipedia does not have an article')) {
          return { valid: false, reason: 'Soft-404: Page does not exist on Wikisource' };
        }
        return { valid: true };
      }
    };
  }

  if (domain.includes('wikipedia.org')) {
    return {
      name: 'Wikipedia',
      checkContent: (content) => {
        if (content.includes('Wikipedia does not have an article') ||
            content.includes('This page does not exist') ||
            content.includes('There is currently no text in this page')) {
          return { valid: false, reason: 'Soft-404: Article does not exist on Wikipedia' };
        }
        return { valid: true };
      }
    };
  }

  return null;
}

// Fetch full content (GET request)
async function fetchContent(url, retries = 0) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const options = {
        method: 'GET',
        timeout: REQUEST_TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DhwaniLinkChecker/2.0; +https://dhwani.org)'
        }
      };

      const req = protocol.request(url, options, (res) => {
        const statusCode = res.statusCode;
        let data = '';

        // Handle redirects
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location;
          resolve({
            status: 'redirect',
            statusCode,
            redirectUrl,
            message: `Redirects to ${redirectUrl}`
          });
          return;
        }

        // Collect response data
        res.on('data', (chunk) => {
          // Limit data collection to first 100KB to avoid memory issues
          if (data.length < 100000) {
            data += chunk.toString();
          }
        });

        res.on('end', () => {
          if (statusCode >= 200 && statusCode < 300) {
            resolve({
              status: 'ok',
              statusCode,
              content: data,
              message: 'OK'
            });
          } else if (statusCode >= 400) {
            resolve({
              status: 'error',
              statusCode,
              content: data,
              message: `HTTP ${statusCode}`
            });
          } else {
            resolve({
              status: 'unknown',
              statusCode,
              content: data,
              message: `HTTP ${statusCode}`
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        if (retries < MAX_RETRIES) {
          setTimeout(async () => {
            const result = await fetchContent(url, retries + 1);
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
            const result = await fetchContent(url, retries + 1);
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

// Check URL with content validation
async function checkUrlRobust(url, workMetadata) {
  console.log(`   ⏳ Checking: ${url}`);

  const result = await fetchContent(url);
  await sleep(RATE_LIMIT_DELAY);

  if (result.status !== 'ok' || !result.content) {
    return result;
  }

  // Domain-specific validation
  const validator = getDomainValidator(url);
  if (validator && result.content) {
    const validation = validator.checkContent(result.content);
    if (!validation.valid) {
      console.log(`   ⚠️  Suspicious: ${validation.reason}`);
      return {
        ...result,
        status: 'suspicious',
        suspicionReason: validation.reason
      };
    }
  }

  // Check for relevance (basic keyword matching)
  const titleWords = workMetadata.title.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const authorWords = workMetadata.authors.flatMap(a => a.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const contentLower = result.content.toLowerCase();

  let relevanceScore = 0;
  let maxScore = titleWords.length + authorWords.length;

  titleWords.forEach(word => {
    if (contentLower.includes(word)) relevanceScore++;
  });

  authorWords.forEach(word => {
    if (contentLower.includes(word)) relevanceScore++;
  });

  const relevancePercentage = maxScore > 0 ? (relevanceScore / maxScore) * 100 : 0;

  if (relevancePercentage < 20 && maxScore > 2) {
    console.log(`   ⚠️  Low relevance: ${relevancePercentage.toFixed(1)}% match`);
    return {
      ...result,
      status: 'irrelevant',
      relevanceScore: relevancePercentage,
      message: `Low relevance score: ${relevancePercentage.toFixed(1)}%`
    };
  }

  console.log(`   ✅ OK (relevance: ${relevancePercentage.toFixed(1)}%)`);
  return {
    ...result,
    relevanceScore: relevancePercentage
  };
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
    const result = await checkUrlRobust(link.url, parsed);

    const linkResult = {
      name: link.name,
      url: link.url,
      type: link.type,
      status: result.status,
      statusCode: result.statusCode,
      message: result.message,
      redirectUrl: result.redirectUrl,
      relevanceScore: result.relevanceScore,
      suspicionReason: result.suspicionReason
    };

    workResult.links.push(linkResult);

    // Update counters
    results.totalLinks++;

    if (result.status === 'ok') {
      results.workingLinks++;
    } else if (result.status === 'redirect') {
      results.redirectedLinks++;
    } else if (result.status === 'timeout') {
      results.timeoutLinks++;
    } else if (result.status === 'suspicious') {
      results.suspiciousLinks++;
    } else if (result.status === 'irrelevant') {
      results.irrelevantLinks++;
    } else {
      if (result.statusCode === 404) {
        results.brokenLinks++;
      } else {
        results.errorLinks++;
      }
    }
  }

  return workResult;
}

// Main function
async function main() {
  console.log('🚀 Dhwani Robust Link Verification System');
  console.log('==========================================\n');
  console.log(`📂 Scanning directory: ${WORKS_DIR}`);

  const files = fs.readdirSync(WORKS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(WORKS_DIR, f));

  results.totalWorks = files.length;
  console.log(`📚 Found ${files.length} work files\n`);
  console.log('⚙️  Enhanced Configuration:');
  console.log(`   - Content fetching: Enabled (GET requests)`);
  console.log(`   - Domain-specific validation: Enabled`);
  console.log(`   - Relevance checking: Enabled`);
  console.log(`   - Soft-404 detection: Enabled`);
  console.log(`   - Max retries: ${MAX_RETRIES}`);
  console.log(`   - Request timeout: ${REQUEST_TIMEOUT}ms`);
  console.log(`   - Rate limit delay: ${RATE_LIMIT_DELAY}ms`);
  console.log('\n🔍 Starting enhanced verification...\n');

  const startTime = Date.now();

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

  // Generate summary
  console.log('\n\n📊 ENHANCED VERIFICATION SUMMARY');
  console.log('================================\n');
  console.log(`⏱️  Duration: ${duration} minutes`);
  console.log(`📚 Total works: ${results.totalWorks}`);
  console.log(`🔗 Total links: ${results.totalLinks}`);
  console.log(`✅ Working links: ${results.workingLinks} (${((results.workingLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`🔄 Redirected links: ${results.redirectedLinks} (${((results.redirectedLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`❌ Broken links (404): ${results.brokenLinks} (${((results.brokenLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`⚠️  Suspicious links (soft-404): ${results.suspiciousLinks} (${((results.suspiciousLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`🔍 Irrelevant links (low match): ${results.irrelevantLinks} (${((results.irrelevantLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`⏱️  Timeout links: ${results.timeoutLinks} (${((results.timeoutLinks/results.totalLinks)*100).toFixed(1)}%)`);
  console.log(`⚠️  Other errors: ${results.errorLinks} (${((results.errorLinks/results.totalLinks)*100).toFixed(1)}%)`);

  // Save reports
  const reportDir = './verification-reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }

  const timestamp = new Date().toISOString().split('T')[0];

  // Full report
  const jsonReport = path.join(reportDir, `link-verification-robust-${timestamp}.json`);
  fs.writeFileSync(jsonReport, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full robust report: ${jsonReport}`);

  // Problem links report (broken + suspicious + irrelevant)
  const problemLinks = results.details
    .map(work => ({
      file: work.file,
      title: work.title,
      problemLinks: work.links.filter(l =>
        l.status === 'error' ||
        l.status === 'suspicious' ||
        l.status === 'irrelevant' ||
        l.status === 'timeout'
      )
    }))
    .filter(work => work.problemLinks.length > 0);

  if (problemLinks.length > 0) {
    const problemReport = path.join(reportDir, `problem-links-robust-${timestamp}.json`);
    fs.writeFileSync(problemReport, JSON.stringify(problemLinks, null, 2));
    console.log(`⚠️  Problem links report: ${problemReport}`);

    // Markdown report
    let mdReport = '# Dhwani Robust Link Verification Report\n\n';
    mdReport += `Generated: ${new Date().toISOString()}\n\n`;
    mdReport += `## Summary\n\n`;
    mdReport += `- Total works: ${results.totalWorks}\n`;
    mdReport += `- Total links checked: ${results.totalLinks}\n`;
    mdReport += `- Working links: ${results.workingLinks}\n`;
    mdReport += `- Broken links (404): ${results.brokenLinks}\n`;
    mdReport += `- Suspicious links (soft-404): ${results.suspiciousLinks}\n`;
    mdReport += `- Irrelevant links: ${results.irrelevantLinks}\n`;
    mdReport += `- Redirected links: ${results.redirectedLinks}\n`;
    mdReport += `- Timeout links: ${results.timeoutLinks}\n`;
    mdReport += `- Other errors: ${results.errorLinks}\n\n`;
    mdReport += `## Works with Problem Links\n\n`;
    mdReport += `Found ${problemLinks.length} works with problematic links.\n\n`;

    problemLinks.forEach(work => {
      mdReport += `### ${work.title}\n\n`;
      mdReport += `**File:** \`${work.file}\`\n\n`;
      work.problemLinks.forEach(link => {
        mdReport += `#### ${link.name} (${link.type})\n\n`;
        mdReport += `- **URL:** ${link.url}\n`;
        mdReport += `- **Status:** ${link.status}\n`;
        if (link.statusCode) mdReport += `- **HTTP Code:** ${link.statusCode}\n`;
        if (link.message) mdReport += `- **Message:** ${link.message}\n`;
        if (link.suspicionReason) mdReport += `- **Suspicion:** ${link.suspicionReason}\n`;
        if (link.relevanceScore !== undefined) mdReport += `- **Relevance:** ${link.relevanceScore.toFixed(1)}%\n`;
        if (link.redirectUrl) mdReport += `- **Redirects to:** ${link.redirectUrl}\n`;
        mdReport += `\n`;
      });
    });

    const mdReportPath = path.join(reportDir, `problem-links-robust-${timestamp}.md`);
    fs.writeFileSync(mdReportPath, mdReport);
    console.log(`📝 Problem links markdown: ${mdReportPath}`);
  }

  console.log('\n✅ Enhanced verification complete!');

  if (results.brokenLinks > 0 || results.suspiciousLinks > 0) {
    console.log('\n⚠️  Warning: Problem links detected!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
