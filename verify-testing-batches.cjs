#!/usr/bin/env node

/**
 * Enhanced Testing Batches Verification & Processing
 *
 * Comprehensive verification workflow for testing-batches/ works:
 * 1. Duplicate detection against existing 757 Dhwani works
 * 2. Public domain verification
 * 3. Indian works verification
 * 4. Link verification (Archive.org, Wikipedia, etc.)
 * 5. Archive.org search for additional editions
 * 6. Generate improved scholarly descriptions using Claude API
 * 7. Output verified works to reviewed-candidates/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  testingBatchesDir: './testing-batches',
  existingWorksDir: './src/content/works',
  outputDir: './reviewed-candidates',
  claudeApiKey: 'YOUR_API_KEY_HERE',
  logFile: './verification-report.json',
  rateLimitMs: 1500, // API call delay
};

// Statistics tracker
const stats = {
  total: 0,
  processed: 0,
  verified: 0,
  duplicates: 0,
  notPublicDomain: 0,
  notIndianWork: 0,
  linkIssues: 0,
  descriptionsGenerated: 0,
  errors: 0,
};

const results = {
  verified: [],
  duplicates: [],
  rejected: [],
  errors: [],
};

// ============================================================================
// FRONTMATTER PARSING
// ============================================================================

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentValue = [];
  let inMultiline = false;

  for (const line of lines) {
    // Check if starting a new key
    if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/) && !inMultiline) {
      // Save previous key
      if (currentKey) {
        fm[currentKey] = parseValue(currentValue.join('\n'));
      }

      const colonIndex = line.indexOf(':');
      currentKey = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Check for multiline indicator
      if (value === '|') {
        inMultiline = true;
        currentValue = [];
      } else if (value === '[' || value.startsWith('[')) {
        // Array continuation
        currentValue = [value];
        if (!value.endsWith(']')) {
          inMultiline = true;
        } else {
          inMultiline = false;
        }
      } else {
        currentValue = [value];
        inMultiline = false;
      }
    } else if (currentKey) {
      // Continuation of current value
      currentValue.push(line);

      // Check if array or multiline ended
      if (line.trim().endsWith(']') && currentValue.join('\n').includes('[')) {
        inMultiline = false;
      }
    }
  }

  // Save last key
  if (currentKey) {
    fm[currentKey] = parseValue(currentValue.join('\n'));
  }

  return fm;
}

function parseValue(value) {
  value = value.trim();

  // Empty value
  if (!value || value === '|') return '';

  // Arrays
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      // Try JSON parse first
      const jsonValue = value.replace(/'/g, '"');
      return JSON.parse(jsonValue);
    } catch {
      // Manual array parsing
      const content = value.slice(1, -1);
      return content.split(',').map(v =>
        v.trim().replace(/^["']|["']$/g, '')
      ).filter(v => v);
    }
  }

  // Quoted strings
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Numbers
  if (!isNaN(value) && value !== '') {
    return Number(value);
  }

  // Booleans
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Default: return as string
  return value;
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

function buildExistingWorksIndex() {
  console.log('\n📚 Building index of existing Dhwani works...');
  const works = [];
  const files = fs.readdirSync(CONFIG.existingWorksDir);

  for (const file of files.filter(f => f.endsWith('.md'))) {
    const filePath = path.join(CONFIG.existingWorksDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const fm = parseFrontmatter(content);

    if (fm) {
      works.push({
        filename: file,
        title: fm.title || '',
        author: fm.author || [],
        year: fm.year,
        identifier: fm._identifier,
      });
    }
  }

  console.log(`✓ Indexed ${works.length} existing works\n`);
  return works;
}

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');
}

function normalizeAuthor(author) {
  if (Array.isArray(author)) {
    return author.map(a => normalizeString(a)).sort().join('');
  }
  return normalizeString(author);
}

function checkDuplicate(candidate, existingWorks) {
  const candTitle = normalizeString(candidate.title);
  const candAuthor = normalizeAuthor(candidate.author);
  const candId = candidate._identifier;

  for (const existing of existingWorks) {
    // Check identifier
    if (candId && candId === existing.identifier) {
      return {
        isDuplicate: true,
        reason: 'Same Archive.org identifier',
        match: existing
      };
    }

    // Check title + author
    const existTitle = normalizeString(existing.title);
    const existAuthor = normalizeAuthor(existing.author);

    if (candTitle === existTitle && candAuthor === existAuthor) {
      return {
        isDuplicate: true,
        reason: 'Same title and author',
        match: existing
      };
    }

    // Check very similar titles with same author
    const similarity = similarityScore(candTitle, existTitle);
    if (similarity > 0.85 && candAuthor === existAuthor) {
      return {
        isDuplicate: true,
        reason: `Very similar title (${Math.round(similarity * 100)}%) with same author`,
        match: existing,
        similarity
      };
    }
  }

  return { isDuplicate: false };
}

function similarityScore(s1, s2) {
  if (!s1 || !s2) return 0;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;

  const editDist = levenshtein(longer, shorter);
  return (longer.length - editDist) / longer.length;
}

function levenshtein(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = s1[j - 1] === s2[i - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[n][m];
}

// ============================================================================
// PUBLIC DOMAIN VERIFICATION
// ============================================================================

function verifyPublicDomain(work) {
  const year = parseInt(work.year);

  if (isNaN(year)) {
    return {
      status: 'UNCERTAIN',
      reason: 'Missing or invalid publication year',
      confidence: 'unknown',
      needsReview: true
    };
  }

  // US copyright: pre-1929 is clearly public domain
  if (year < 1929) {
    return {
      status: 'PUBLIC_DOMAIN',
      reason: `Published in ${year} (before 1929)`,
      confidence: 'high',
      needsReview: false
    };
  }

  // 1929-1964: may be PD if copyright not renewed
  if (year >= 1929 && year <= 1964) {
    return {
      status: 'LIKELY_PD',
      reason: `Published ${year}: Likely PD if copyright not renewed`,
      confidence: 'medium',
      needsReview: true
    };
  }

  // After 1964: likely still under copyright
  return {
    status: 'UNCERTAIN',
    reason: `Published ${year}: Likely still under copyright`,
    confidence: 'low',
    needsReview: true
  };
}

// ============================================================================
// INDIAN WORKS VERIFICATION
// ============================================================================

const INDIAN_INDICATORS = {
  strong: [
    'india', 'indian', 'hindi', 'sanskrit', 'tamil', 'telugu', 'bengali',
    'malayalam', 'marathi', 'gujarati', 'kannada', 'punjabi', 'urdu',
    'vedic', 'veda', 'upanishad', 'ramayana', 'mahabharata', 'bhagavad',
    'ayurveda', 'dharma', 'hinduism', 'buddhism', 'jainism'
  ],
  medium: [
    'bengal', 'punjab', 'madras', 'bombay', 'calcutta', 'delhi',
    'deccan', 'malabar', 'coromandel', 'mysore', 'hyderabad',
    'mughal', 'maratha', 'rajput', 'sikh'
  ],
  negative: [
    'further india', 'burma', 'myanmar', 'thailand', 'siam',
    'cambodia', 'vietnam', 'indonesia', 'malaysia'
  ]
};

function verifyIndianWork(work) {
  const text = [
    work.title || '',
    JSON.stringify(work.author || []),
    work.description || '',
    JSON.stringify(work.genre || []),
    JSON.stringify(work.language || [])
  ].join(' ').toLowerCase();

  let score = 0;
  const found = {strong: [], medium: [], negative: []};

  // Check strong indicators (worth 3 points each)
  for (const keyword of INDIAN_INDICATORS.strong) {
    if (text.includes(keyword)) {
      score += 3;
      found.strong.push(keyword);
    }
  }

  // Check medium indicators (worth 2 points each)
  for (const keyword of INDIAN_INDICATORS.medium) {
    if (text.includes(keyword)) {
      score += 2;
      found.medium.push(keyword);
    }
  }

  // Check negative indicators (subtract 5 points each)
  for (const keyword of INDIAN_INDICATORS.negative) {
    if (text.includes(keyword)) {
      score -= 5;
      found.negative.push(keyword);
    }
  }

  const isIndian = score >= 5;
  const confidence = score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low';

  return {
    isIndian,
    score,
    confidence,
    found,
    warnings: found.negative.length > 0 ?
      [`Contains potentially non-Indian keywords: ${found.negative.join(', ')}`] : []
  };
}

// ============================================================================
// LINK VERIFICATION
// ============================================================================

function verifyUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const options = {
      method: 'HEAD',
      timeout,
      headers: { 'User-Agent': 'Mozilla/5.0 (Dhwani LinkChecker/1.0)' }
    };

    const protocol = url.startsWith('https') ? https : require('http');
    const req = protocol.request(url, options, (res) => {
      resolve({
        url,
        status: res.statusCode,
        ok: res.statusCode >= 200 && res.statusCode < 400,
        redirect: res.headers.location
      });
    });

    req.on('error', (err) => {
      resolve({ url, status: 0, ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: 0, ok: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function verifyAllLinks(work) {
  const issues = [];
  const verified = { sources: [], references: [] };

  // Verify sources (must be actual Archive.org item pages)
  if (work.sources && Array.isArray(work.sources)) {
    for (const source of work.sources) {
      if (source.url) {
        // Check if Archive.org link is actual item page (not search)
        if (source.url.includes('archive.org')) {
          if (source.url.includes('/search.php') || source.url.includes('/search?')) {
            issues.push(`❌ CRITICAL: Archive.org SEARCH PAGE (need actual item): ${source.url}`);
          } else if (!source.url.includes('/details/')) {
            issues.push(`⚠️  Archive.org link may not be item page: ${source.url}`);
          }
        }

        const result = await verifyUrl(source.url);
        verified.sources.push({ ...source, check: result });

        if (!result.ok) {
          issues.push(`Source broken: ${source.url} (${result.error || result.status})`);
        }
      }
    }
  }

  // Verify references (Wikipedia and Wikisource must be actual articles/pages)
  if (work.references && Array.isArray(work.references)) {
    for (const ref of work.references) {
      if (ref.url) {
        // Flag Wikipedia search pages (NOT ALLOWED)
        if (ref.url.includes('wikipedia.org')) {
          if (ref.url.includes('/wiki/Special:Search') || ref.url.includes('/w/index.php?search=')) {
            issues.push(`❌ CRITICAL: Wikipedia SEARCH PAGE (need actual article): ${ref.url}`);
          }
        }

        // Flag Wikisource search pages (NOT ALLOWED)
        if (ref.url.includes('wikisource.org')) {
          if (ref.url.includes('Special:Search')) {
            issues.push(`❌ CRITICAL: Wikisource SEARCH PAGE (need actual page): ${ref.url}`);
          }
        }

        // OpenLibrary search pages are OK (explicitly allowed)
        if (ref.url.includes('openlibrary.org') && ref.url.includes('/search')) {
          // This is fine - note it but don't flag as issue
          verified.references.push({ ...ref, check: { ok: true, note: 'OpenLibrary search (allowed)' } });
          continue;
        }

        const result = await verifyUrl(ref.url);
        verified.references.push({ ...ref, check: result });

        if (!result.ok) {
          issues.push(`Reference broken: ${ref.url} (${result.error || result.status})`);
        }
      }
    }
  }

  return { verified, issues };
}

// ============================================================================
// CLAUDE API - DESCRIPTION GENERATION
// ============================================================================

function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.claudeApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.content?.[0]?.text) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('Unexpected API response'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generateScholarlyDescription(work) {
  const prompt = `You are a scholarly editor for Dhwani, a digital library of Indian historical texts and works about India.

Generate a detailed, scholarly description for this work that matches the style of academic reference works.

**Work Details:**
Title: ${work.title}
Author: ${Array.isArray(work.author) ? work.author.join(', ') : work.author}
Year: ${work.year}
Genre: ${Array.isArray(work.genre) ? work.genre.join(', ') : work.genre}
Language: ${Array.isArray(work.language) ? work.language.join(', ') : work.language}

**Current Description (for reference):**
${work.description}

**Style Requirements:**
Write in the scholarly, analytical style of academic reference works. The description should be substantive and informative, similar to entries in encyclopedias of literature or library catalog descriptions.

**Content Structure (3-4 paragraphs, ~400-600 words total):**

1. **Opening Paragraph**: Introduce the work's nature, significance, and historical context. What is this work? When and where was it created? What makes it significant in its field?

2. **Content & Scholarly Contribution**: Describe the work's content, methodological approach, and intellectual contribution. What does it cover? What scholarly methods or perspectives does it employ? How does it contribute to its field?

3. **Historical & Cultural Context**: Situate the work within its historical, cultural, and intellectual context. What were the circumstances of its creation? How does it relate to broader scholarly, literary, or cultural movements of its time?

4. **Legacy & Significance** (if applicable): Discuss the work's reception, influence, and enduring significance. How was it received? What impact did it have? Why does it remain relevant?

**Tone Guidelines:**
- Scholarly and analytical, not promotional
- Precise and factual, avoiding vague superlatives ("important," "groundbreaking," "essential")
- Focus on specific historical, cultural, and scholarly details
- Academic voice suitable for reference work or library catalog
- Avoid marketing language or enthusiastic tone
- When uncertain about details, remain general but accurate

**Format:**
Return ONLY the description text as a single flowing piece. Do NOT include headers, markdown formatting, or section labels. Write in continuous paragraphs.`;

  try {
    const description = await callClaudeAPI(prompt);
    return { success: true, description: description.trim(), length: description.trim().length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ============================================================================
// ARCHIVE.ORG SEARCH
// ============================================================================

async function searchArchiveOrg(title, author) {
  // For now, we'll just construct search URLs
  // Actually querying Archive.org API can be added later
  const query = `${title} ${author}`.replace(/[^\w\s]/g, ' ').trim();
  const searchUrl = `https://archive.org/search.php?query=${encodeURIComponent(query)}`;

  return {
    searchUrl,
    note: 'Manual verification recommended'
  };
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

async function processWork(filePath, filename, existingWorks) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📖 ${filename}`);
  console.log('='.repeat(70));

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const work = parseFrontmatter(content);

    if (!work) {
      throw new Error('Could not parse frontmatter');
    }

    const result = {
      filename,
      title: work.title,
      author: work.author,
      year: work.year,
      checks: {},
      work
    };

    // 1. Duplicate check
    console.log('🔍 Checking for duplicates...');
    const dupCheck = checkDuplicate(work, existingWorks);
    result.checks.duplicate = dupCheck;

    if (dupCheck.isDuplicate) {
      console.log(`❌ DUPLICATE: ${dupCheck.reason}`);
      console.log(`   Matches: ${dupCheck.match.filename}`);
      stats.duplicates++;
      results.duplicates.push(result);
      return result;
    }
    console.log('✓ No duplicate');

    // 2. Public domain check
    console.log('⚖️  Checking public domain status...');
    const pdCheck = verifyPublicDomain(work);
    result.checks.publicDomain = pdCheck;
    console.log(`${pdCheck.status === 'PUBLIC_DOMAIN' ? '✓' : '⚠️'}  ${pdCheck.reason} (${pdCheck.confidence})`);

    if (pdCheck.status === 'UNCERTAIN' && pdCheck.confidence === 'low') {
      console.log('❌ Likely not public domain');
      stats.notPublicDomain++;
      results.rejected.push(result);
      return result;
    }

    // 3. Indian work verification
    console.log('🇮🇳 Verifying Indian relevance...');
    const indianCheck = verifyIndianWork(work);
    result.checks.indian = indianCheck;

    if (!indianCheck.isIndian) {
      console.log(`❌ NOT INDIAN WORK (score: ${indianCheck.score})`);
      stats.notIndianWork++;
      results.rejected.push(result);
      return result;
    }
    console.log(`✓ Indian work verified (score: ${indianCheck.score}, ${indianCheck.confidence})`);
    if (indianCheck.warnings.length > 0) {
      indianCheck.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
    }

    // 4. Link verification
    console.log('🔗 Verifying links...');
    const linkCheck = await verifyAllLinks(work);
    result.checks.links = linkCheck;

    if (linkCheck.issues.length > 0) {
      console.log(`⚠️  ${linkCheck.issues.length} link issues:`);
      linkCheck.issues.slice(0, 3).forEach(issue => console.log(`   - ${issue}`));
      if (linkCheck.issues.length > 3) {
        console.log(`   ... and ${linkCheck.issues.length - 3} more`);
      }
      stats.linkIssues++;
    } else {
      console.log('✓ All links verified');
    }

    // 5. Archive.org search
    console.log('📚 Searching Archive.org...');
    const archiveSearch = await searchArchiveOrg(work.title, work.author);
    result.checks.archiveSearch = archiveSearch;
    console.log(`   Search URL: ${archiveSearch.searchUrl}`);

    // 6. Generate description
    console.log('✍️  Generating scholarly description...');
    const descResult = await generateScholarlyDescription(work);
    result.checks.description = descResult;

    if (descResult.success) {
      console.log(`✓ Generated (${descResult.length} chars)`);
      result.improvedDescription = descResult.description;
      stats.descriptionsGenerated++;
    } else {
      console.log(`⚠️  Failed: ${descResult.error}`);
    }

    console.log('\n✅ VERIFIED');
    stats.verified++;
    results.verified.push(result);
    return result;

  } catch (err) {
    console.log(`❌ ERROR: ${err.message}`);
    stats.errors++;
    results.errors.push({ filename, error: err.message });
    return null;
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log(' DHWANI TESTING BATCHES VERIFICATION');
  console.log('='.repeat(80));

  // Build existing works index
  const existingWorks = buildExistingWorksIndex();

  // Get all candidate files
  const candidateFiles = [];
  for (let i = 1; i <= 8; i++) {
    const batchDir = path.join(CONFIG.testingBatchesDir, `batch-${String(i).padStart(2, '0')}`);
    if (fs.existsSync(batchDir)) {
      const files = fs.readdirSync(batchDir)
        .filter(f => f.endsWith('.md') && !f.includes('MANIFEST'))
        .map(f => ({ batch: i, filename: f, path: path.join(batchDir, f) }));
      candidateFiles.push(...files);
    }
  }

  stats.total = candidateFiles.length;
  console.log(`\n📦 Found ${stats.total} candidate works\n`);

  // Process each work
  for (const file of candidateFiles) {
    await processWork(file.path, file.filename, existingWorks);
    stats.processed++;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimitMs));
  }

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log(' VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total works: ${stats.total}`);
  console.log(`Processed: ${stats.processed}`);
  console.log(`✅ Verified: ${stats.verified}`);
  console.log(`🔄 Duplicates: ${stats.duplicates}`);
  console.log(`⚖️  Not PD: ${stats.notPublicDomain}`);
  console.log(`🇮🇳 Not Indian: ${stats.notIndianWork}`);
  console.log(`🔗 Link issues: ${stats.linkIssues}`);
  console.log(`✍️  Descriptions generated: ${stats.descriptionsGenerated}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log('='.repeat(80));

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    stats,
    results
  };

  fs.writeFileSync(CONFIG.logFile, JSON.stringify(report, null, 2));
  console.log(`\n💾 Detailed report saved to: ${CONFIG.logFile}`);
  console.log('\n✅ Verification complete!');
}

// Run
main().catch(console.error);
