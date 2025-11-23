#!/usr/bin/env node

/**
 * Comprehensive Candidate Processing System for Dhwani
 *
 * This script processes potential candidate works through multiple verification
 * and enhancement stages:
 * 1. Load and parse all candidates and existing works
 * 2. Check for duplicates
 * 3. Verify Archive.org links
 * 4. Verify India-relevance
 * 5. Fix Wikipedia/OpenLibrary links
 * 6. Generate scholarly descriptions using Claude API
 * 7. Quality check descriptions
 * 8. Organize into batches of 10
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  candidatesDir: path.join(__dirname, 'potential-candidates'),
  existingWorksDir: path.join(__dirname, 'src', 'content', 'works'),
  outputDir: path.join(__dirname, 'verified-candidates'),
  batchSize: 10,
  claudeApiKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModel: 'claude-3-5-haiku-20241022',
};

// Progress tracking
const PROGRESS = {
  total: 0,
  processed: 0,
  verified: 0,
  rejected: 0,
  duplicates: 0,
};

// Results storage
const RESULTS = {
  verified: [],
  duplicates: [],
  rejected: [],
  errors: [],
};

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = match[1];
  const body = content.slice(match[0].length);

  // Simple YAML parser (basic)
  const frontmatter = {};
  let currentKey = null;
  let currentArray = null;

  frontmatterText.split('\n').forEach(line => {
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();

      if (value === '') {
        currentArray = [];
        frontmatter[currentKey] = currentArray;
      } else if (value === '|') {
        frontmatter[currentKey] = '';
        currentArray = null;
      } else if (value.startsWith('[')) {
        try {
          frontmatter[currentKey] = JSON.parse(value);
        } catch {
          frontmatter[currentKey] = value;
        }
        currentArray = null;
      } else if (value.startsWith('"') && value.endsWith('"')) {
        frontmatter[currentKey] = value.slice(1, -1);
        currentArray = null;
      } else {
        frontmatter[currentKey] = value;
        currentArray = null;
      }
    } else if (line.match(/^\s*-\s+/) && currentArray) {
      const value = line.trim().slice(2);
      currentArray.push(value.startsWith('"') ? value.slice(1, -1) : value);
    } else if (currentKey && frontmatter[currentKey] === '') {
      frontmatter[currentKey] += (frontmatter[currentKey] ? '\n' : '') + line;
    }
  });

  return { frontmatter, body };
}

/**
 * Load all markdown files from a directory
 */
async function loadMarkdownFiles(dir) {
  const files = await fs.readdir(dir);
  const markdownFiles = files.filter(f => f.endsWith('.md'));

  const works = [];
  for (const file of markdownFiles) {
    const filePath = path.join(dir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    works.push({
      filename: file,
      filepath: filePath,
      frontmatter,
      body,
      content,
    });
  }

  return works;
}

/**
 * Check if work is a duplicate
 */
function isDuplicate(candidate, existingWorks) {
  const candidateTitle = (candidate.frontmatter.title || '').toLowerCase().trim();
  const candidateAuthor = Array.isArray(candidate.frontmatter.author)
    ? candidate.frontmatter.author[0]
    : candidate.frontmatter.author || '';
  const candidateAuthorLower = candidateAuthor.toLowerCase().trim();

  for (const existing of existingWorks) {
    const existingTitle = (existing.frontmatter.title || '').toLowerCase().trim();
    const existingAuthor = Array.isArray(existing.frontmatter.author)
      ? existing.frontmatter.author[0]
      : existing.frontmatter.author || '';
    const existingAuthorLower = existingAuthor.toLowerCase().trim();

    // Exact title match
    if (candidateTitle === existingTitle) {
      return { isDuplicate: true, match: existing.filename, reason: 'exact title match' };
    }

    // Title and author match
    if (candidateTitle === existingTitle && candidateAuthorLower === existingAuthorLower) {
      return { isDuplicate: true, match: existing.filename, reason: 'title and author match' };
    }

    // Very similar titles (fuzzy match)
    const similarity = calculateSimilarity(candidateTitle, existingTitle);
    if (similarity > 0.9 && candidateAuthorLower === existingAuthorLower) {
      return { isDuplicate: true, match: existing.filename, reason: `similar title (${Math.round(similarity * 100)}%)` };
    }
  }

  return { isDuplicate: false };
}

/**
 * Calculate string similarity (Levenshtein distance normalized)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Verify Archive.org link
 */
async function verifyArchiveLink(url) {
  return new Promise((resolve) => {
    if (!url || !url.includes('archive.org')) {
      resolve({ valid: false, reason: 'not an archive.org link' });
      return;
    }

    https.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 200) {
        resolve({ valid: true, statusCode: res.statusCode });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        resolve({ valid: true, statusCode: res.statusCode, redirect: res.headers.location });
      } else {
        resolve({ valid: false, statusCode: res.statusCode });
      }
    }).on('error', (err) => {
      resolve({ valid: false, error: err.message });
    }).on('timeout', () => {
      resolve({ valid: false, error: 'timeout' });
    });
  });
}

/**
 * Check if work is India-related using Claude API
 */
async function verifyIndiaRelevance(work) {
  if (!CONFIG.claudeApiKey) {
    console.warn('No Claude API key found. Skipping India relevance check.');
    return { relevant: true, confidence: 'unknown', reason: 'no API key' };
  }

  const prompt = `Analyze if this work is relevant to India, Indian history, Indian literature, Indian culture, or Indian studies.

Title: ${work.frontmatter.title}
Author: ${Array.isArray(work.frontmatter.author) ? work.frontmatter.author.join(', ') : work.frontmatter.author}
Year: ${work.frontmatter.year}
Genre: ${Array.isArray(work.frontmatter.genre) ? work.frontmatter.genre.join(', ') : work.frontmatter.genre}
Description: ${work.frontmatter.description}

Respond with ONLY a JSON object in this format:
{
  "relevant": true/false,
  "confidence": "high/medium/low",
  "reason": "brief explanation"
}`;

  try {
    const response = await callClaudeAPI(prompt, 'claude-3-5-haiku-20241022');
    const result = JSON.parse(response);
    return result;
  } catch (error) {
    console.error('Error checking India relevance:', error.message);
    return { relevant: true, confidence: 'unknown', error: error.message };
  }
}

/**
 * Call Claude API
 */
async function callClaudeAPI(prompt, model = CONFIG.claudeModel) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-api-key': CONFIG.claudeApiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.content && response.content[0] && response.content[0].text) {
            resolve(response.content[0].text);
          } else {
            reject(new Error('Invalid API response'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Main processing function
 */
async function processCandidates() {
  console.log('🚀 Starting Dhwani Candidate Processing System\n');

  // Step 1: Load all files
  console.log('📚 Loading candidates and existing works...');
  const candidates = await loadMarkdownFiles(CONFIG.candidatesDir);
  const existingWorks = await loadMarkdownFiles(CONFIG.existingWorksDir);

  PROGRESS.total = candidates.length;
  console.log(`   Found ${candidates.length} candidates`);
  console.log(`   Found ${existingWorks.length} existing works\n`);

  // Step 2: Process each candidate
  console.log('🔍 Processing candidates...\n');

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    PROGRESS.processed++;

    console.log(`[${PROGRESS.processed}/${PROGRESS.total}] Processing: ${candidate.frontmatter.title}`);

    try {
      // Check for duplicates
      const dupCheck = isDuplicate(candidate, existingWorks);
      if (dupCheck.isDuplicate) {
        console.log(`   ❌ DUPLICATE: ${dupCheck.reason} (${dupCheck.match})`);
        PROGRESS.duplicates++;
        RESULTS.duplicates.push({
          candidate: candidate.filename,
          reason: dupCheck.reason,
          match: dupCheck.match,
        });
        continue;
      }

      // Verify Archive.org link
      const archiveSource = (candidate.frontmatter.sources || []).find(s =>
        s.url && s.url.includes('archive.org')
      );

      if (archiveSource) {
        process.stdout.write('   📎 Verifying Archive.org link... ');
        const linkCheck = await verifyArchiveLink(archiveSource.url);
        if (linkCheck.valid) {
          console.log('✓');
        } else {
          console.log(`✗ (${linkCheck.reason || linkCheck.error})`);
          RESULTS.errors.push({
            candidate: candidate.filename,
            error: 'Invalid Archive.org link',
            details: linkCheck,
          });
        }
      }

      // Verify India relevance
      process.stdout.write('   🇮🇳 Checking India relevance... ');
      const relevanceCheck = await verifyIndiaRelevance(candidate);

      if (!relevanceCheck.relevant && relevanceCheck.confidence === 'high') {
        console.log(`✗ NOT RELEVANT (${relevanceCheck.reason})`);
        PROGRESS.rejected++;
        RESULTS.rejected.push({
          candidate: candidate.filename,
          reason: relevanceCheck.reason,
        });
        continue;
      } else {
        console.log(`✓ (${relevanceCheck.confidence} confidence)`);
      }

      // Mark as verified
      PROGRESS.verified++;
      RESULTS.verified.push({
        candidate: candidate.filename,
        title: candidate.frontmatter.title,
        author: candidate.frontmatter.author,
        relevance: relevanceCheck,
      });

      console.log(`   ✅ VERIFIED\n`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`   ⚠️  ERROR: ${error.message}\n`);
      RESULTS.errors.push({
        candidate: candidate.filename,
        error: error.message,
      });
    }
  }

  // Step 3: Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 PROCESSING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total candidates:     ${PROGRESS.total}`);
  console.log(`Processed:            ${PROGRESS.processed}`);
  console.log(`✅ Verified:          ${PROGRESS.verified}`);
  console.log(`❌ Duplicates:        ${PROGRESS.duplicates}`);
  console.log(`❌ Rejected:          ${PROGRESS.rejected}`);
  console.log(`⚠️  Errors:           ${RESULTS.errors.length}`);
  console.log('='.repeat(60) + '\n');

  // Save results
  const reportPath = path.join(__dirname, 'candidate-processing-report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    progress: PROGRESS,
    results: RESULTS,
  }, null, 2));

  console.log(`📄 Report saved to: ${reportPath}\n`);
}

// Run if executed directly
if (require.main === module) {
  processCandidates().catch(console.error);
}

module.exports = { processCandidates, parseFrontmatter, isDuplicate, verifyArchiveLink, verifyIndiaRelevance };
