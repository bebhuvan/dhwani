#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  candidatesDir: './potential-candidates',
  existingWorksDir: './src/content/works',
  maxItemsPerQuery: 100,
  maxItemsTotal: 500, // Limit total items to prevent overwhelming
  rateLimitDelay: 500, // milliseconds between requests
  queryDelay: 2000, // milliseconds between queries
  retryAttempts: 3,
  retryDelay: 2000,
};

// Collections to search
const COLLECTIONS = [
  {
    name: 'Cornell',
    id: 'cornell',
    description: 'Cornell University Library collection'
  },
  {
    name: 'University of California',
    id: 'university_of_california_libraries',
    description: 'UC Libraries digitization project'
  },
  {
    name: 'University of Toronto',
    id: 'university_of_toronto',
    description: 'University of Toronto library collection'
  }
];

// Enhanced search queries with priorities
const SEARCH_QUERIES = [
  { query: 'India AND Sanskrit', priority: 'high' },
  { query: 'India AND "public domain"', priority: 'high' },
  { query: 'India AND (Vedic OR Hindu OR Buddhist)', priority: 'high' },
  { query: 'India AND (Hindi OR Bengali OR Tamil OR Telugu)', priority: 'medium' },
  { query: 'India AND (Mahabharata OR Ramayana OR Upanishad)', priority: 'high' },
  { query: 'India AND (ancient OR classical OR medieval)', priority: 'medium' },
  { query: 'India AND (literature OR poetry OR drama)', priority: 'medium' },
  { query: 'Mughal OR Akbar OR "Indian history"', priority: 'medium' },
  { query: 'Indian AND philosophy', priority: 'low' },
  { query: 'Indian AND music', priority: 'low' },
];

// Indian language keywords for better matching
const INDIAN_LANGUAGES = [
  'hindi', 'sanskrit', 'bengali', 'tamil', 'telugu', 'marathi',
  'gujarati', 'kannada', 'malayalam', 'punjabi', 'urdu', 'oriya',
  'assamese', 'kashmiri', 'sindhi', 'pali', 'prakrit'
];

// Create directories
if (!fs.existsSync(CONFIG.candidatesDir)) {
  fs.mkdirSync(CONFIG.candidatesDir, { recursive: true });
}

// Statistics
const stats = {
  totalQueried: 0,
  totalFound: 0,
  alreadyExists: 0,
  notRelevant: 0,
  notPublicDomain: 0,
  newCandidates: 0,
  errors: 0,
  byCollection: {},
  byPriority: { high: 0, medium: 0, low: 0 }
};

// Enhanced HTTP request with retry logic
async function httpGet(url, retries = CONFIG.retryAttempts) {
  return new Promise((resolve, reject) => {
    const request = () => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            if (retries > 0) {
              console.log(`      Parsing error, retrying... (${retries} attempts left)`);
              setTimeout(() => request(), CONFIG.retryDelay);
              retries--;
            } else {
              reject(e);
            }
          }
        });
      }).on('error', (err) => {
        if (retries > 0) {
          console.log(`      Network error, retrying... (${retries} attempts left)`);
          setTimeout(() => request(), CONFIG.retryDelay);
          retries--;
        } else {
          reject(err);
        }
      });
    };
    request();
  });
}

// Fetch from Archive.org with enhanced metadata
async function fetchFromArchive(collection, query, rows = 50) {
  const fields = [
    'identifier', 'title', 'creator', 'date', 'subject', 'language',
    'description', 'mediatype', 'licenseurl', 'possible_copyright_status',
    'year', 'publisher', 'rights', 'downloads', 'format'
  ].join(',');

  const url = `https://archive.org/advancedsearch.php?q=collection:${collection}+AND+(${query})&fl=${fields}&sort[]=downloads+desc&rows=${rows}&output=json`;

  try {
    const result = await httpGet(url);
    stats.totalQueried++;
    return result;
  } catch (error) {
    stats.errors++;
    throw error;
  }
}

// Get detailed metadata
async function getItemMetadata(identifier) {
  const url = `https://archive.org/metadata/${identifier}`;
  return await httpGet(url);
}

// Enhanced public domain verification
function isPublicDomain(doc, metadata) {
  const checks = [];

  // Check 1: License URL
  if (doc.licenseurl) {
    if (doc.licenseurl.includes('publicdomain')) {
      return { status: true, reason: 'Public domain license', confidence: 'high' };
    }
    if (doc.licenseurl.includes('creativecommons')) {
      checks.push({ pass: false, reason: 'Creative Commons (check specific license)' });
    }
  }

  // Check 2: Copyright status field
  if (doc.possible_copyright_status === 'NOT_IN_COPYRIGHT') {
    return { status: true, reason: 'Not in copyright', confidence: 'high' };
  }

  // Check 3: Publication year
  const year = parseInt(doc.date || doc.year || '0');
  if (year && year < 1924) {
    return { status: true, reason: `Published in ${year} (before 1924)`, confidence: 'high' };
  }
  if (year >= 1924 && year < 1950) {
    checks.push({ pass: false, reason: `Published in ${year} (potentially in copyright)` });
  }

  // Check 4: Metadata rights field
  if (metadata && metadata.metadata) {
    const meta = metadata.metadata;

    if (meta.licenseurl && meta.licenseurl.includes('publicdomain')) {
      return { status: true, reason: 'Public domain license in metadata', confidence: 'high' };
    }

    const rights = (meta.rights || '').toLowerCase();
    if (rights.includes('public domain') || rights.includes('no known copyright')) {
      return { status: true, reason: 'Public domain in rights statement', confidence: 'medium' };
    }
    if (rights.includes('copyright') && !rights.includes('no copyright')) {
      return { status: false, reason: 'Copyright statement found', confidence: 'medium' };
    }
  }

  // Check 5: Format indicators (some formats indicate old scans)
  if (doc.format && Array.isArray(doc.format)) {
    if (doc.format.includes('DjVu') || doc.format.includes('Grayscale LuraTech PDF')) {
      checks.push({ pass: true, reason: 'Old book scan format (likely PD)' });
    }
  }

  // If we have positive checks, return uncertain with high confidence
  // If we have negative checks, return not PD
  const hasNegative = checks.some(c => !c.pass);
  if (hasNegative) {
    return { status: false, reason: checks.find(c => !c.pass).reason, confidence: 'medium' };
  }

  // Default: uncertain
  return { status: 'uncertain', reason: 'Needs manual verification', confidence: 'low' };
}

// Enhanced relevance check
function isRelevantToIndia(doc) {
  const searchText = [
    doc.title || '',
    doc.creator || '',
    Array.isArray(doc.subject) ? doc.subject.join(' ') : (doc.subject || ''),
    doc.description || '',
    doc.publisher || ''
  ].join(' ').toLowerCase();

  // Primary keywords (high confidence)
  const primaryKeywords = [
    'india', 'indian', 'bharat', 'hindustan',
    'sanskrit', 'vedic', 'hindu', 'buddhist',
    'mahabharata', 'ramayana', 'upanishad', 'veda',
    'mughal', 'delhi', 'bengal', 'tamil', 'dravidian'
  ];

  // Secondary keywords (medium confidence)
  const secondaryKeywords = [
    'bombay', 'calcutta', 'madras', 'punjab', 'maharashtra',
    'gujarati', 'kannada', 'telugu', 'malayalam',
    'indus', 'ganges', 'himalaya'
  ];

  // Language keywords
  const hasLanguage = INDIAN_LANGUAGES.some(lang => searchText.includes(lang));

  // Check matches
  const primaryMatches = primaryKeywords.filter(kw => searchText.includes(kw)).length;
  const secondaryMatches = secondaryKeywords.filter(kw => searchText.includes(kw)).length;

  // Exclude clearly non-relevant
  const excludeKeywords = ['indiana', 'west indies', 'american indian', 'indians baseball'];
  if (excludeKeywords.some(kw => searchText.includes(kw))) {
    return { relevant: false, reason: 'Excluded keyword found', confidence: 'high' };
  }

  // Scoring
  if (primaryMatches >= 2 || hasLanguage) {
    return { relevant: true, reason: `${primaryMatches} primary matches`, confidence: 'high' };
  }
  if (primaryMatches >= 1 || secondaryMatches >= 2) {
    return { relevant: true, reason: 'Keywords matched', confidence: 'medium' };
  }

  return { relevant: false, reason: 'Insufficient keyword matches', confidence: 'medium' };
}

// Load existing works
function loadExistingWorks() {
  const existing = new Set();

  if (!fs.existsSync(CONFIG.existingWorksDir)) {
    console.log('⚠ Warning: existing works directory not found');
    return existing;
  }

  const files = fs.readdirSync(CONFIG.existingWorksDir);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      try {
        const content = fs.readFileSync(path.join(CONFIG.existingWorksDir, file), 'utf-8');

        // Extract Archive.org identifiers
        const archiveUrls = content.match(/archive\.org\/details\/([a-zA-Z0-9_\-\.]+)/g);
        if (archiveUrls) {
          archiveUrls.forEach(url => {
            const identifier = url.replace('archive.org/details/', '');
            existing.add(identifier);
          });
        }

        // Extract title
        const titleMatch = content.match(/^title:\s*"(.+)"$/m);
        if (titleMatch) {
          existing.add(titleMatch[1].toLowerCase().trim());
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message);
      }
    }
  });

  return existing;
}

// Search for alternative editions
async function findAlternativeEditions(title, author) {
  try {
    // Clean and prepare search terms
    const cleanTitle = title
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 5) // First 5 words
      .join(' ');

    const cleanAuthor = author
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 2) // First 2 words
      .join(' ');

    const searchQuery = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`);
    const url = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl=identifier,title,creator,date,year&rows=10&output=json`;

    const result = await httpGet(url);

    if (result.response && result.response.docs) {
      const alternatives = result.response.docs.filter(doc => {
        const docTitle = (doc.title || '').toLowerCase();
        const searchTitleLower = cleanTitle.toLowerCase();

        // Check for title similarity
        const words = searchTitleLower.split(' ').filter(w => w.length > 3);
        const matchCount = words.filter(w => docTitle.includes(w)).length;

        return matchCount >= Math.min(2, words.length - 1);
      });

      return alternatives.slice(0, 5);
    }

    return [];
  } catch (error) {
    console.error('      Error finding alternatives:', error.message);
    return [];
  }
}

// Generate enhanced scholarly description
async function generateScholarlyDescription(doc, metadata, alternatives) {
  const title = doc.title || 'Untitled';
  const author = doc.creator || 'Unknown';
  const year = doc.date || doc.year || 'Unknown';
  const subjects = Array.isArray(doc.subject) ? doc.subject : (doc.subject ? [doc.subject] : []);
  const description = doc.description || '';
  const publisher = doc.publisher || '';

  let parts = [];

  // Main description
  if (description && description.length > 50) {
    parts.push(description.replace(/\n/g, ' ').trim());
  } else if (title && author) {
    parts.push(`This work by ${author} titled "${title}" represents an important contribution to Indian studies.`);
  }

  // Publication info
  if (year && year !== 'Unknown' && parseInt(year) > 1500) {
    let pubInfo = `Originally published in ${year}`;
    if (publisher && publisher !== 'Unknown' && publisher.length < 100) {
      pubInfo += ` by ${publisher}`;
    }
    parts.push(pubInfo + '.');
  }

  // Subject context
  const relevantSubjects = subjects.filter(s =>
    s && s.length > 3 && s.length < 50 &&
    !s.toLowerCase().includes('pdf') &&
    !s.toLowerCase().includes('download') &&
    !s.toLowerCase().includes('file')
  );

  if (relevantSubjects.length > 0) {
    parts.push(`This work covers topics including ${relevantSubjects.slice(0, 5).join(', ')}.`);
  }

  // Historical context
  if (year && parseInt(year) < 1900) {
    const century = Math.floor(parseInt(year) / 100);
    const centuryName = century === 18 ? 'eighteenth' : century === 19 ? 'nineteenth' : `${century}th`;
    parts.push(`As a ${centuryName}-century work, it provides valuable historical perspective on Indian literature, culture, and scholarship.`);
  }

  // Multiple editions
  if (alternatives && alternatives.length > 1) {
    parts.push(`Multiple editions and versions are available, providing access to different printings and translations.`);
  }

  // Language context
  if (doc.language) {
    const langs = Array.isArray(doc.language) ? doc.language : [doc.language];
    const indianLangs = langs.filter(l => INDIAN_LANGUAGES.includes(l.toLowerCase()));
    if (indianLangs.length > 0) {
      parts.push(`Available in ${indianLangs.join(', ')}.`);
    }
  }

  return parts.join(' ') || 'No description available. This work requires manual review and description enhancement.';
}

// Sanitize filename
function sanitizeFilename(title, author) {
  const combined = `${title} ${author}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);

  return combined || `unknown-${Date.now()}`;
}

// Create work file
async function createWorkFile(doc, collectionName, pdStatus, metadata, alternatives) {
  const title = doc.title || 'Untitled';
  const author = doc.creator || 'Unknown';
  const year = doc.date || doc.year || 'Unknown';
  const identifier = doc.identifier;
  const subjects = Array.isArray(doc.subject) ? doc.subject : (doc.subject ? [doc.subject] : []);
  const language = doc.language || 'Unknown';
  const langs = Array.isArray(language) ? language : [language];

  // Generate description
  const description = await generateScholarlyDescription(doc, metadata, alternatives);

  const filename = sanitizeFilename(title, author) + '.md';
  const filepath = path.join(CONFIG.candidatesDir, filename);

  // Don't overwrite existing files
  if (fs.existsSync(filepath)) {
    return null;
  }

  // Build sources array
  let sources = [
    `  - name: "Internet Archive (${collectionName})"\n    url: "https://archive.org/details/${identifier}"\n    type: "other"`
  ];

  if (alternatives && alternatives.length > 0) {
    alternatives.forEach((alt) => {
      if (alt.identifier !== identifier) {
        const altYear = alt.date || alt.year ? ` - ${alt.date || alt.year}` : '';
        const altNote = alt.creator && alt.creator !== author ? ` (${alt.creator})` : '';
        sources.push(`  - name: "Internet Archive (Alternative edition${altYear}${altNote})"\n    url: "https://archive.org/details/${alt.identifier}"\n    type: "other"`);
      }
    });
  }

  // Build genre list
  const genres = subjects
    .filter(s => s && s.length > 2 && s.length < 50)
    .slice(0, 5);

  // Status indicator
  const statusIndicator = pdStatus.status === true ? '✓ Public Domain' :
                          pdStatus.status === false ? '✗ Likely Copyright' :
                          '⚠ Uncertain - Needs Verification';

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
author: ["${author.replace(/"/g, '\\"')}"]
year: ${year}
language: ${JSON.stringify(langs)}
genre: ${JSON.stringify(genres)}
description: "${description.replace(/"/g, '\\"').replace(/\n/g, ' ')}"
collections: []
sources:
${sources.join('\n')}
references:
  - name: "Wikipedia search: ${title}"
    url: "https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(title)}"
    type: "wikipedia"
featured: false
publishDate: ${new Date().toISOString().split('T')[0]}
tags: ${JSON.stringify(subjects.filter(s => s && s.length > 2).slice(0, 10))}
_public_domain_status: "${pdStatus.status}"
_public_domain_reason: "${pdStatus.reason}"
_public_domain_confidence: "${pdStatus.confidence || 'unknown'}"
_collection: "${collectionName}"
_identifier: "${identifier}"
_needs_review: true
_fetched_date: "${new Date().toISOString()}"
---

# ${title}

## Overview

${description}

## Public Domain Status

**Status**: ${statusIndicator}
**Reason**: ${pdStatus.reason}
**Confidence**: ${pdStatus.confidence || 'Unknown'}

${pdStatus.status !== true ? '\n**⚠ Action Required**: Please manually verify the copyright status before publishing this work.\n' : ''}

## Available Editions

${sources.map(s => {
  const urlMatch = s.match(/url: "(.+)"/);
  const nameMatch = s.match(/name: "(.+)"/);
  return `- [${nameMatch ? nameMatch[1] : 'Archive.org'}](${urlMatch ? urlMatch[1] : ''})`;
}).join('\n')}

## Metadata

- **Author**: ${author}
- **Publication Year**: ${year}
- **Language**: ${langs.join(', ')}
- **Subjects**: ${genres.join(', ')}
- **Collection**: ${collectionName}
- **Identifier**: \`${identifier}\`

## Source Collection

This work was discovered in the **${collectionName}** collection on Archive.org.

Direct link: [https://archive.org/details/${identifier}](https://archive.org/details/${identifier})

---

## Review Checklist

Before adding to main collection:

- [ ] **Verify public domain status** ${pdStatus.status !== true ? '⚠️ **PRIORITY**' : '✓'}
- [ ] Enhance description with scholarly research
- [ ] Add relevant collections (e.g., 'sanskrit-literature', 'indian-history')
- [ ] Add more reference links (Wikipedia, Open Library, academic sources)
- [ ] Review and improve metadata (tags, genres, language)
- [ ] Check for duplicate works in main collection
- [ ] Verify all Archive.org links are working
- [ ] Add author biography if notable
- [ ] Consider adding to featured works if significant

---

**Note**: This is a candidate work automatically fetched from Archive.org. It requires manual review and enhancement before being added to the main Dhwani collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return filename;
}

// Main execution
async function main() {
  console.log('═'.repeat(70));
  console.log('🕉  DHWANI ARCHIVE.ORG WORKS FETCHER');
  console.log('═'.repeat(70));
  console.log('\nFetching Indian public domain works from Archive.org collections...\n');

  // Load existing works
  console.log('📚 Loading existing works for comparison...');
  const existingWorks = loadExistingWorks();
  console.log(`   Found ${existingWorks.size} existing works\n`);

  // Initialize stats by collection
  COLLECTIONS.forEach(col => {
    stats.byCollection[col.name] = { found: 0, added: 0 };
  });

  let totalProcessed = 0;

  // Process each collection
  for (const collection of COLLECTIONS) {
    if (totalProcessed >= CONFIG.maxItemsTotal) {
      console.log(`\n⚠ Reached maximum item limit (${CONFIG.maxItemsTotal}), stopping...`);
      break;
    }

    console.log('\n' + '─'.repeat(70));
    console.log(`📖 Searching: ${collection.name}`);
    console.log(`   ${collection.description}`);
    console.log('─'.repeat(70));

    // Process queries by priority
    for (const priority of ['high', 'medium', 'low']) {
      const queries = SEARCH_QUERIES.filter(q => q.priority === priority);

      console.log(`\n   Priority: ${priority.toUpperCase()}`);

      for (const { query } of queries) {
        if (totalProcessed >= CONFIG.maxItemsTotal) break;

        console.log(`\n   📝 Query: "${query}"`);

        try {
          const result = await fetchFromArchive(collection.id, query, 50);

          if (result.response && result.response.docs) {
            const docs = result.response.docs;
            stats.totalFound += docs.length;
            stats.byCollection[collection.name].found += docs.length;

            console.log(`      Found ${docs.length} items`);

            let queryAddedCount = 0;

            for (const doc of docs) {
              if (totalProcessed >= CONFIG.maxItemsTotal) break;

              totalProcessed++;

              // Check if exists
              if (existingWorks.has(doc.identifier) ||
                  existingWorks.has((doc.title || '').toLowerCase().trim())) {
                stats.alreadyExists++;
                continue;
              }

              // Check relevance
              const relevance = isRelevantToIndia(doc);
              if (!relevance.relevant) {
                stats.notRelevant++;
                continue;
              }

              try {
                console.log(`      [${totalProcessed}/${CONFIG.maxItemsTotal}] ${doc.title?.substring(0, 50)}...`);

                // Get metadata
                const metadata = await getItemMetadata(doc.identifier);
                await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimitDelay));

                // Check public domain
                const pdStatus = isPublicDomain(doc, metadata);

                if (pdStatus.status === false) {
                  stats.notPublicDomain++;
                  console.log(`         ✗ Skipped: ${pdStatus.reason}`);
                  continue;
                }

                // Find alternatives
                const alternatives = await findAlternativeEditions(doc.title, doc.creator || '');
                await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimitDelay));

                // Create file
                const filename = await createWorkFile(doc, collection.name, pdStatus, metadata, alternatives);

                if (filename) {
                  stats.newCandidates++;
                  stats.byCollection[collection.name].added++;
                  stats.byPriority[priority]++;
                  queryAddedCount++;

                  const pdIcon = pdStatus.status === true ? '✓' : '⚠';
                  const altText = alternatives.length > 1 ? ` [+${alternatives.length - 1} editions]` : '';
                  console.log(`         ${pdIcon} Added: ${filename}${altText}`);
                }

              } catch (error) {
                stats.errors++;
                console.error(`         ✗ Error: ${error.message}`);
              }
            }

            console.log(`      → ${queryAddedCount} new candidates added`);
          }

          // Query delay
          await new Promise(resolve => setTimeout(resolve, CONFIG.queryDelay));

        } catch (error) {
          stats.errors++;
          console.error(`      ✗ Query failed: ${error.message}`);
        }
      }
    }
  }

  // Print summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(70));
  console.log(`\nOverall Statistics:`);
  console.log(`   Total items processed:     ${totalProcessed}`);
  console.log(`   Total items found:         ${stats.totalFound}`);
  console.log(`   Already exists:            ${stats.alreadyExists}`);
  console.log(`   Not relevant to India:     ${stats.notRelevant}`);
  console.log(`   Not public domain:         ${stats.notPublicDomain}`);
  console.log(`   Errors:                    ${stats.errors}`);
  console.log(`   ✓ New candidates saved:    ${stats.newCandidates}`);

  console.log(`\nBy Collection:`);
  Object.entries(stats.byCollection).forEach(([name, counts]) => {
    console.log(`   ${name}: ${counts.added} added (${counts.found} found)`);
  });

  console.log(`\nBy Priority:`);
  console.log(`   High:   ${stats.byPriority.high}`);
  console.log(`   Medium: ${stats.byPriority.medium}`);
  console.log(`   Low:    ${stats.byPriority.low}`);

  console.log(`\n📁 Output Directory: ${CONFIG.candidatesDir}`);

  if (stats.newCandidates > 0) {
    console.log(`\n✅ Successfully saved ${stats.newCandidates} new candidate works!`);
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Review candidates in ${CONFIG.candidatesDir}/`);
    console.log(`   2. Verify public domain status for uncertain works`);
    console.log(`   3. Enhance descriptions with scholarly research`);
    console.log(`   4. Move approved works to ${CONFIG.existingWorksDir}/`);
    console.log(`   5. Update collections, tags, and references`);
  } else {
    console.log(`\n⚠ No new candidates found. Try adjusting search queries or collections.`);
  }

  console.log('\n' + '═'.repeat(70));
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
