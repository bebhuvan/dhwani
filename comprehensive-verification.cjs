#!/usr/bin/env node

/**
 * Comprehensive Verification System for Dhwani
 *
 * Multi-layered verification with strict quality controls
 * This is the user's passion project - we must ensure excellence
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const CONFIG = {
  candidatesDir: process.argv[2] || path.join(__dirname, 'potential-candidates'),
  existingWorksDir: path.join(__dirname, 'src', 'content', 'works'),
  apiKey: process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE',
  model: 'claude-3-5-haiku-20241022',
};

// Verification results
const VERIFICATION_RESULTS = {
  totalWorks: 0,
  passed: [],
  failed: [],
  warnings: [],
  criticalIssues: [],
};

/**
 * Parse frontmatter with robust error handling
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('No frontmatter found');
  }

  const frontmatterText = match[1];
  const body = content.slice(match[0].length);

  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let currentValue = '';
  let inMultiline = false;

  for (const line of lines) {
    // Check for new key
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);

    if (keyMatch && !inMultiline) {
      // Save previous key if exists
      if (currentKey) {
        frontmatter[currentKey] = parseValue(currentValue.trim());
      }

      currentKey = keyMatch[1];
      const value = keyMatch[2].trim();

      if (value === '|') {
        inMultiline = true;
        currentValue = '';
      } else if (value === '') {
        currentValue = '';
      } else {
        currentValue = value;
        frontmatter[currentKey] = parseValue(value);
        currentKey = null;
      }
    } else if (inMultiline && line.match(/^[a-zA-Z_]/)) {
      // End of multiline value
      frontmatter[currentKey] = currentValue.trim();
      inMultiline = false;
      currentKey = null;
      currentValue = '';

      // Parse this line as a new key
      const newKeyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
      if (newKeyMatch) {
        currentKey = newKeyMatch[1];
        currentValue = newKeyMatch[2].trim();
        if (currentValue !== '|' && currentValue !== '') {
          frontmatter[currentKey] = parseValue(currentValue);
          currentKey = null;
        } else if (currentValue === '|') {
          inMultiline = true;
          currentValue = '';
        }
      }
    } else if (inMultiline) {
      currentValue += line.replace(/^\s{2}/, '') + '\n';
    } else if (currentKey && line.match(/^\s+/)) {
      currentValue += '\n' + line;
    }
  }

  // Save last key
  if (currentKey) {
    frontmatter[currentKey] = inMultiline ? currentValue.trim() : parseValue(currentValue.trim());
  }

  return { frontmatter, body };
}

function parseValue(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  } else if (value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } else if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  } else if (!isNaN(value) && value !== '') {
    return Number(value);
  }
  return value;
}

/**
 * Verification Check 1: Required Fields
 */
function checkRequiredFields(work, filename) {
  const required = ['title', 'author', 'year', 'language', 'genre', 'description', 'sources'];
  const issues = [];

  for (const field of required) {
    if (!work.frontmatter[field]) {
      issues.push({
        severity: 'critical',
        field,
        message: `Missing required field: ${field}`
      });
    } else if (Array.isArray(work.frontmatter[field]) && work.frontmatter[field].length === 0) {
      issues.push({
        severity: 'critical',
        field,
        message: `Empty array for required field: ${field}`
      });
    }
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Verification Check 2: Description Quality
 */
function checkDescriptionQuality(description) {
  const issues = [];

  // Check minimum length
  if (!description || description.length < 400) {
    issues.push({
      severity: 'critical',
      field: 'description',
      message: `Description too short (${description?.length || 0} chars, minimum 400)`
    });
  }

  // Check for marketing fluff
  const fluffPatterns = [
    { pattern: /\bgroundbreaking\b/i, term: 'groundbreaking' },
    { pattern: /\bessential reading\b/i, term: 'essential reading' },
    { pattern: /\bmust-have\b/i, term: 'must-have' },
    { pattern: /\bmust read\b/i, term: 'must read' },
    { pattern: /\bindispensable\b/i, term: 'indispensable' },
    { pattern: /\bunparalleled\b/i, term: 'unparalleled' },
    { pattern: /\bmasterpiece\b/i, term: 'masterpiece' },
    { pattern: /\btimeless classic\b/i, term: 'timeless classic' },
    { pattern: /\bSEO\b/i, term: 'SEO' },
    { pattern: /\bcall to action\b/i, term: 'call to action' },
  ];

  for (const { pattern, term } of fluffPatterns) {
    if (description && pattern.test(description)) {
      issues.push({
        severity: 'warning',
        field: 'description',
        message: `Marketing fluff detected: "${term}"`
      });
    }
  }

  // Check for academic/scholarly tone
  const scholarlyIndicators = [
    /\b(historical|scholarly|academic|literature|cultural|significant|context|tradition|period)\b/i
  ];

  let hasScholarlyTone = false;
  for (const pattern of scholarlyIndicators) {
    if (description && pattern.test(description)) {
      hasScholarlyTone = true;
      break;
    }
  }

  if (!hasScholarlyTone) {
    issues.push({
      severity: 'warning',
      field: 'description',
      message: 'Description lacks scholarly vocabulary and tone'
    });
  }

  return { passed: issues.filter(i => i.severity === 'critical').length === 0, issues };
}

/**
 * Verification Check 3: India Relevance
 */
async function checkIndiaRelevance(work) {
  const { title, author, genre, description } = work.frontmatter;

  const authorStr = Array.isArray(author) ? author.join(', ') : author;
  const genreStr = Array.isArray(genre) ? genre.join(', ') : genre;

  const prompt = `You are a scholarly expert on Indian literature, history, and culture. Verify if this work is genuinely relevant to India.

**Work:**
Title: ${title}
Author: ${authorStr}
Genre: ${genreStr}
Description: ${description}

**Task:**
Determine if this work is truly relevant to Indian literature, Indian history, Indian culture, Indian languages, or Indian studies. Be strict - works must have substantial Indian content or significance.

**Examples of RELEVANT works:**
- Books about Indian history, culture, or society
- Indian language dictionaries, grammars
- Sanskrit, Tamil, Hindi, or other Indian language literature
- Works by Indian authors on Indian topics
- British colonial works ABOUT India (e.g., gazetteers, administrative reports on India)
- Translations of Indian texts

**Examples of NOT RELEVANT works:**
- General British imperial history not focused on India
- Works about other Asian countries
- Generic world history books
- European language dictionaries (unless they're paired with Indian languages)

**Respond with JSON:**
{
  "relevant": true/false,
  "confidence": "high/medium/low",
  "reason": "specific explanation of why this is or isn't India-related",
  "indian_connection": "describe the specific Indian connection"
}`;

  try {
    const response = await callClaudeAPI(prompt);
    const result = JSON.parse(response.trim());
    return result;
  } catch (error) {
    return {
      relevant: true, // Default to true if check fails
      confidence: 'unknown',
      error: error.message
    };
  }
}

/**
 * Verification Check 4: Link Validity
 */
async function checkLinks(work) {
  const issues = [];
  const sources = work.frontmatter.sources || [];
  const references = work.frontmatter.references || [];

  // Check Archive.org links
  for (const source of sources) {
    if (source.url && source.url.includes('archive.org')) {
      const result = await verifyUrl(source.url);
      if (!result.valid) {
        issues.push({
          severity: 'critical',
          field: 'sources',
          message: `Invalid Archive.org link: ${source.url} (${result.error || result.statusCode})`
        });
      }
    }
  }

  // Check for search URLs instead of actual links
  for (const ref of references) {
    if (ref.url && (ref.url.includes('Special:Search') || ref.url.includes('search?q='))) {
      issues.push({
        severity: 'warning',
        field: 'references',
        message: `Search URL instead of direct link: ${ref.name}`
      });
    }
  }

  return { passed: issues.filter(i => i.severity === 'critical').length === 0, issues };
}

/**
 * Verification Check 5: Duplicate Detection
 */
async function checkDuplicates(candidate, existingWorks) {
  const candidateTitle = (candidate.frontmatter.title || '').toLowerCase().trim();
  const candidateAuthor = Array.isArray(candidate.frontmatter.author)
    ? candidate.frontmatter.author[0]
    : candidate.frontmatter.author || '';

  for (const existing of existingWorks) {
    const existingTitle = (existing.frontmatter.title || '').toLowerCase().trim();
    const existingAuthor = Array.isArray(existing.frontmatter.author)
      ? existing.frontmatter.author[0]
      : existing.frontmatter.author || '';

    if (candidateTitle === existingTitle) {
      return {
        isDuplicate: true,
        match: existing.filename,
        reason: 'Exact title match',
        severity: 'critical'
      };
    }

    const similarity = stringSimilarity(candidateTitle, existingTitle);
    if (similarity > 0.85 && candidateAuthor.toLowerCase() === existingAuthor.toLowerCase()) {
      return {
        isDuplicate: true,
        match: existing.filename,
        reason: `Very similar title (${Math.round(similarity * 100)}%) with same author`,
        severity: 'critical'
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Helper: Call Claude API
 */
async function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CONFIG.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.content && response.content[0]) {
            resolve(response.content[0].text);
          } else {
            reject(new Error(response.error?.message || 'Invalid API response'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Helper: Verify URL
 */
async function verifyUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { timeout: 10000 }, (res) => {
      resolve({
        valid: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode
      });
    }).on('error', (err) => {
      resolve({ valid: false, error: err.message });
    });
  });
}

/**
 * Helper: String similarity
 */
function stringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Load markdown files
 */
async function loadMarkdownFiles(dir) {
  const files = await fs.readdir(dir);
  const works = [];

  for (const file of files.filter(f => f.endsWith('.md'))) {
    try {
      const content = await fs.readFile(path.join(dir, file), 'utf-8');
      const parsed = parseFrontmatter(content);
      works.push({ filename: file, ...parsed });
    } catch (error) {
      console.error(`Error loading ${file}:`, error.message);
    }
  }

  return works;
}

/**
 * Main verification function
 */
async function verifyWork(work, existingWorks) {
  const allIssues = [];
  const checks = [];

  console.log(`\n   Running comprehensive verification...`);

  // Check 1: Required fields
  const reqFields = checkRequiredFields(work, work.filename);
  checks.push({ name: 'Required Fields', ...reqFields });
  allIssues.push(...reqFields.issues);
  console.log(`      ✓ Required fields: ${reqFields.passed ? 'PASS' : 'FAIL'}`);

  // Check 2: Description quality
  const descQuality = checkDescriptionQuality(work.frontmatter.description);
  checks.push({ name: 'Description Quality', ...descQuality });
  allIssues.push(...descQuality.issues);
  console.log(`      ✓ Description quality: ${descQuality.passed ? 'PASS' : 'FAIL'}`);

  // Check 3: India relevance (with API)
  process.stdout.write('      ⏳ India relevance check... ');
  const indiaRelevance = await checkIndiaRelevance(work);
  const relevancePassed = indiaRelevance.relevant && (indiaRelevance.confidence === 'high' || indiaRelevance.confidence === 'medium');
  checks.push({ name: 'India Relevance', passed: relevancePassed, details: indiaRelevance });

  if (!relevancePassed) {
    allIssues.push({
      severity: 'critical',
      field: 'content',
      message: `Not India-relevant: ${indiaRelevance.reason}`
    });
  }
  console.log(relevancePassed ? 'PASS' : 'FAIL');

  // Check 4: Link validity
  process.stdout.write('      ⏳ Link verification... ');
  const linkCheck = await checkLinks(work);
  checks.push({ name: 'Link Validity', ...linkCheck });
  allIssues.push(...linkCheck.issues);
  console.log(linkCheck.passed ? 'PASS' : 'FAIL');

  // Check 5: Duplicate detection
  const dupCheck = await checkDuplicates(work, existingWorks);
  checks.push({ name: 'Duplicate Check', passed: !dupCheck.isDuplicate, details: dupCheck });

  if (dupCheck.isDuplicate) {
    allIssues.push({
      severity: 'critical',
      field: 'duplicate',
      message: `Duplicate of ${dupCheck.match}: ${dupCheck.reason}`
    });
  }
  console.log(`      ✓ Duplicate check: ${dupCheck.isDuplicate ? 'FAIL' : 'PASS'}`);

  // Determine overall result
  const criticalIssues = allIssues.filter(i => i.severity === 'critical');
  const warnings = allIssues.filter(i => i.severity === 'warning');

  const result = {
    filename: work.filename,
    title: work.frontmatter.title,
    passed: criticalIssues.length === 0,
    checks,
    criticalIssues,
    warnings,
    score: Math.max(0, 100 - (criticalIssues.length * 25) - (warnings.length * 5))
  };

  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 COMPREHENSIVE VERIFICATION SYSTEM');
  console.log('    For Dhwani - Indian Literary Heritage\n');
  console.log('='.repeat(70) + '\n');

  // Load all works
  console.log('📚 Loading works...');
  const candidates = await loadMarkdownFiles(CONFIG.candidatesDir);
  const existingWorks = await loadMarkdownFiles(CONFIG.existingWorksDir);

  console.log(`   Candidates: ${candidates.length}`);
  console.log(`   Existing works: ${existingWorks.length}\n`);

  VERIFICATION_RESULTS.totalWorks = candidates.length;

  // Verify each work
  for (let i = 0; i < candidates.length; i++) {
    const work = candidates[i];
    console.log(`[${i + 1}/${candidates.length}] Verifying: ${work.frontmatter.title || work.filename}`);

    try {
      const result = await verifyWork(work, existingWorks);

      if (result.passed) {
        VERIFICATION_RESULTS.passed.push(result);
        console.log(`   ✅ PASSED (score: ${result.score}/100)\n`);
      } else {
        VERIFICATION_RESULTS.failed.push(result);
        console.log(`   ❌ FAILED (score: ${result.score}/100)`);
        console.log(`   Critical issues:`);
        result.criticalIssues.forEach(issue => {
          console.log(`      - ${issue.message}`);
        });
        console.log('');
      }

      if (result.warnings.length > 0) {
        VERIFICATION_RESULTS.warnings.push(result);
      }

      if (result.criticalIssues.length > 0) {
        VERIFICATION_RESULTS.criticalIssues.push(...result.criticalIssues.map(issue => ({
          work: work.filename,
          ...issue
        })));
      }

    } catch (error) {
      console.error(`   ⚠️  ERROR: ${error.message}\n`);
      VERIFICATION_RESULTS.failed.push({
        filename: work.filename,
        passed: false,
        error: error.message
      });
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  // Generate report
  console.log('\n' + '='.repeat(70));
  console.log('📊 VERIFICATION REPORT');
  console.log('='.repeat(70));
  console.log(`Total works verified:     ${VERIFICATION_RESULTS.totalWorks}`);
  console.log(`✅ Passed:                ${VERIFICATION_RESULTS.passed.length}`);
  console.log(`❌ Failed:                ${VERIFICATION_RESULTS.failed.length}`);
  console.log(`⚠️  Warnings:             ${VERIFICATION_RESULTS.warnings.length}`);
  console.log(`🚨 Critical issues:       ${VERIFICATION_RESULTS.criticalIssues.length}`);
  console.log('='.repeat(70) + '\n');

  // Save detailed report
  const reportPath = path.join(__dirname, 'verification-report.json');
  await fs.writeFile(reportPath, JSON.stringify(VERIFICATION_RESULTS, null, 2));
  console.log(`📄 Detailed report saved: ${reportPath}\n`);

  // Return exit code
  process.exit(VERIFICATION_RESULTS.failed.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { verifyWork, checkRequiredFields, checkDescriptionQuality, checkIndiaRelevance };
