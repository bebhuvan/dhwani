#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

// Collections to search
const COLLECTIONS = [
  { name: 'Cornell', id: 'cornell' },
  { name: 'University of California', id: 'university_of_california_libraries' },
  { name: 'University of Toronto', id: 'university_of_toronto' }
];

// Directory to store candidates
const CANDIDATES_DIR = './potential-candidates';
const EXISTING_WORKS_DIR = './src/content/works';

// Create candidates directory if it doesn't exist
if (!fs.existsSync(CANDIDATES_DIR)) {
  fs.mkdirSync(CANDIDATES_DIR, { recursive: true });
}

// Fetch from Archive.org API
function fetchFromArchive(collection, query, rows = 50, page = 1) {
  return new Promise((resolve, reject) => {
    // Include licenseurl and possible_copyright_status in fields
    const url = `https://archive.org/advancedsearch.php?q=collection:${collection}+AND+(${query})&fl[]=identifier,title,creator,date,subject,language,description,mediatype,licenseurl,possible_copyright_status,year,publisher&sort[]=downloads+desc&rows=${rows}&page=${page}&output=json`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Get detailed metadata for an item
function getItemMetadata(identifier) {
  return new Promise((resolve, reject) => {
    const url = `https://archive.org/metadata/${identifier}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Check if work is in public domain
function isPublicDomain(doc, metadata) {
  // Check license URL
  if (doc.licenseurl && doc.licenseurl.includes('publicdomain')) {
    return { status: true, reason: 'Public domain license' };
  }

  // Check copyright status
  if (doc.possible_copyright_status === 'NOT_IN_COPYRIGHT') {
    return { status: true, reason: 'Not in copyright' };
  }

  // Check publication year (India: works published before 1924, or author died before 1965)
  const year = parseInt(doc.date || doc.year || '0');
  if (year && year < 1924) {
    return { status: true, reason: `Published in ${year} (before 1924)` };
  }

  // Check metadata for public domain markers
  if (metadata && metadata.metadata) {
    const meta = metadata.metadata;

    if (meta.licenseurl && meta.licenseurl.includes('publicdomain')) {
      return { status: true, reason: 'Public domain license in metadata' };
    }

    if (meta.possible_copyright_status === 'NOT_IN_COPYRIGHT') {
      return { status: true, reason: 'Not in copyright (metadata)' };
    }

    // Check for public domain in rights statement
    const rights = (meta.rights || '').toLowerCase();
    if (rights.includes('public domain') || rights.includes('no known copyright')) {
      return { status: true, reason: 'Public domain in rights statement' };
    }
  }

  // Conservative approach: if uncertain, mark for manual review
  return { status: 'uncertain', reason: 'Needs manual verification' };
}

// Search for alternative editions of the same work
async function findAlternativeEditions(title, author) {
  try {
    // Clean title and author for search
    const cleanTitle = title.replace(/[^\w\s]/g, ' ').trim();
    const cleanAuthor = author.replace(/[^\w\s]/g, ' ').trim();

    const searchQuery = encodeURIComponent(`${cleanTitle} ${cleanAuthor}`);
    const url = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl[]=identifier,title,creator,date&rows=20&output=json`;

    const result = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    if (result.response && result.response.docs) {
      // Filter for similar titles
      const alternatives = result.response.docs.filter(doc => {
        const docTitle = (doc.title || '').toLowerCase();
        const docAuthor = (doc.creator || '').toLowerCase();
        return docTitle.includes(cleanTitle.toLowerCase().substring(0, 20)) ||
               cleanTitle.toLowerCase().includes(docTitle.substring(0, 20));
      });

      return alternatives.slice(0, 5); // Return up to 5 alternatives
    }

    return [];
  } catch (error) {
    console.error('Error finding alternatives:', error.message);
    return [];
  }
}

// Load existing works to avoid duplicates
function loadExistingWorks() {
  const existing = new Set();
  const files = fs.readdirSync(EXISTING_WORKS_DIR);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(EXISTING_WORKS_DIR, file), 'utf-8');

      // Extract Archive.org URLs from the content
      const archiveUrls = content.match(/archive\.org\/details\/([a-zA-Z0-9_\-]+)/g);
      if (archiveUrls) {
        archiveUrls.forEach(url => {
          const identifier = url.replace('archive.org/details/', '');
          existing.add(identifier);
        });
      }

      // Also extract title for fuzzy matching
      const titleMatch = content.match(/^title:\s*"(.+)"$/m);
      if (titleMatch) {
        existing.add(titleMatch[1].toLowerCase().trim());
      }
    }
  });

  return existing;
}

// Check if a work is relevant to India
function isRelevantToIndia(doc) {
  const searchTerms = [
    'india', 'indian', 'hindi', 'sanskrit', 'bengali', 'tamil', 'telugu',
    'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi', 'urdu',
    'hindustan', 'bharat', 'vedic', 'hindu', 'buddhist', 'mughal',
    'delhi', 'bombay', 'calcutta', 'madras', 'bengal', 'punjab',
    'maharashtra', 'ramayana', 'mahabharata', 'upanishad', 'veda'
  ];

  const text = [
    doc.title || '',
    doc.creator || '',
    doc.subject ? (Array.isArray(doc.subject) ? doc.subject.join(' ') : doc.subject) : '',
    doc.description || ''
  ].join(' ').toLowerCase();

  return searchTerms.some(term => text.includes(term));
}

// Sanitize filename
function sanitizeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// Generate scholarly description using Claude API (if available)
async function generateScholarlyDescription(doc, metadata, alternatives) {
  // For now, create a structured description from available metadata
  // In future, this could call Claude API for enhanced descriptions

  const title = doc.title || 'Untitled';
  const author = doc.creator || 'Unknown';
  const year = doc.date || doc.year || 'Unknown';
  const subjects = Array.isArray(doc.subject) ? doc.subject : (doc.subject ? [doc.subject] : []);
  const description = doc.description || '';
  const publisher = doc.publisher || '';

  let scholarlyDesc = '';

  // Build a comprehensive description
  if (description) {
    scholarlyDesc = description.replace(/\n/g, ' ').trim();
  }

  // Add contextual information
  if (year && year !== 'Unknown' && parseInt(year) > 1700) {
    scholarlyDesc += ` Originally published in ${year}`;
    if (publisher) {
      scholarlyDesc += ` by ${publisher}`;
    }
    scholarlyDesc += '.';
  }

  // Add subject context
  if (subjects.length > 0) {
    const relevantSubjects = subjects.filter(s =>
      s && !s.toLowerCase().includes('pdf') && !s.toLowerCase().includes('download')
    );
    if (relevantSubjects.length > 0) {
      scholarlyDesc += ` This work covers topics including ${relevantSubjects.slice(0, 5).join(', ')}.`;
    }
  }

  // Add information about available editions
  if (alternatives && alternatives.length > 1) {
    scholarlyDesc += ` Multiple editions are available on Archive.org, providing readers with different versions and translations.`;
  }

  // Add historical context for old works
  if (year && parseInt(year) < 1900) {
    scholarlyDesc += ` As a work from the ${Math.floor(parseInt(year) / 100) * 100}s, it provides valuable historical perspective on Indian literature and culture.`;
  }

  return scholarlyDesc || 'No description available. This work requires manual review and description enhancement.';
}

// Create markdown file for a work
async function createWorkFile(doc, collectionName, publicDomainStatus, metadata, alternatives) {
  const title = doc.title || 'Untitled';
  const author = doc.creator || 'Unknown';
  const year = doc.date || doc.year || 'Unknown';
  const identifier = doc.identifier;
  const subjects = Array.isArray(doc.subject) ? doc.subject : (doc.subject ? [doc.subject] : []);
  const language = doc.language || 'Unknown';

  // Generate scholarly description
  const description = await generateScholarlyDescription(doc, metadata, alternatives);

  const filename = sanitizeFilename(`${title}-${author}`) + '.md';
  const filepath = path.join(CANDIDATES_DIR, filename);

  // Don't overwrite if file exists
  if (fs.existsSync(filepath)) {
    return null;
  }

  // Build sources array with all available editions
  let sources = [
    `  - name: "Internet Archive (${collectionName})"\n    url: "https://archive.org/details/${identifier}"\n    type: "other"`
  ];

  if (alternatives && alternatives.length > 0) {
    alternatives.forEach((alt, idx) => {
      if (alt.identifier !== identifier) {
        const altYear = alt.date ? ` - ${alt.date}` : '';
        sources.push(`  - name: "Internet Archive (Alternative edition${altYear})"\n    url: "https://archive.org/details/${alt.identifier}"\n    type: "other"`);
      }
    });
  }

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
author: ["${author.replace(/"/g, '\\"')}"]
year: ${year}
language: ["${language}"]
genre: ${JSON.stringify(subjects.slice(0, 5))}
description: "${description.replace(/"/g, '\\"')}"
collections: []
sources:
${sources.join('\n')}
references:
  - name: "Wikipedia search"
    url: "https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(title)}"
    type: "wikipedia"
featured: false
publishDate: ${new Date().toISOString().split('T')[0]}
tags: ${JSON.stringify(subjects.slice(0, 10))}
_public_domain_status: "${publicDomainStatus.status}"
_public_domain_reason: "${publicDomainStatus.reason}"
_collection: "${collectionName}"
_identifier: "${identifier}"
_needs_review: true
---

# ${title}

## Overview

${description}

## Public Domain Status

**Status**: ${publicDomainStatus.status === true ? '✓ Public Domain' : publicDomainStatus.status === 'uncertain' ? '⚠ Uncertain - Needs Verification' : '✗ Not Verified'}

**Reason**: ${publicDomainStatus.reason}

${publicDomainStatus.status !== true ? '\n**Action Required**: Please manually verify the copyright status before publishing.\n' : ''}

## Available Editions

This work has been digitized and is available on Archive.org:

${sources.map(s => {
  const urlMatch = s.match(/url: "(.+)"/);
  const nameMatch = s.match(/name: "(.+)"/);
  return `- [${nameMatch ? nameMatch[1] : 'Archive.org'}](${urlMatch ? urlMatch[1] : ''})`;
}).join('\n')}

## Source Collection

This work was found in the **${collectionName}** collection on Archive.org.

---

**Note**: This is a candidate work that needs manual review and enhancement before being added to the main Dhwani collection. Please:
1. Verify public domain status
2. Enhance the description with scholarly content
3. Add relevant collections and tags
4. Add more reference links (Wikipedia, Open Library, etc.)
5. Review and edit all metadata
`;

  fs.writeFileSync(filepath, content);
  return filename;
}

// Main function
async function main() {
  console.log('Starting Archive.org search for Indian public domain works...\n');

  const existingWorks = loadExistingWorks();
  console.log(`Loaded ${existingWorks.size} existing works for comparison\n`);

  const stats = {
    totalFound: 0,
    alreadyExists: 0,
    notRelevant: 0,
    newCandidates: 0
  };

  for (const collection of COLLECTIONS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Searching ${collection.name} collection...`);
    console.log('='.repeat(60));

    try {
      // Search for works related to India
      const queries = [
        'India',
        'Sanskrit OR Hindi OR Bengali OR Tamil',
        'Vedic OR Hindu OR Buddhist OR Mughal',
        'Ramayana OR Mahabharata OR Upanishad'
      ];

      for (const query of queries) {
        console.log(`\n  Query: "${query}"`);

        // Fetch first 100 results
        const result = await fetchFromArchive(collection.id, query, 100, 1);

        if (result.response && result.response.docs) {
          const docs = result.response.docs;
          console.log(`  Found ${docs.length} items`);
          stats.totalFound += docs.length;

          let queryNewCandidates = 0;

          for (const doc of docs) {
            // Check if already exists
            if (existingWorks.has(doc.identifier) ||
                existingWorks.has((doc.title || '').toLowerCase().trim())) {
              stats.alreadyExists++;
              continue;
            }

            // Check if relevant to India
            if (!isRelevantToIndia(doc)) {
              stats.notRelevant++;
              continue;
            }

            try {
              // Get detailed metadata
              console.log(`    Checking: ${doc.title?.substring(0, 50)}...`);
              const metadata = await getItemMetadata(doc.identifier);

              // Check public domain status
              const pdStatus = isPublicDomain(doc, metadata);

              // Find alternative editions
              console.log(`      Finding alternative editions...`);
              const alternatives = await findAlternativeEditions(doc.title, doc.creator || '');

              // Create candidate file
              const filename = await createWorkFile(doc, collection.name, pdStatus, metadata, alternatives);
              if (filename) {
                queryNewCandidates++;
                stats.newCandidates++;
                const pdIndicator = pdStatus.status === true ? '✓' : pdStatus.status === 'uncertain' ? '⚠' : '✗';
                console.log(`      ${pdIndicator} Created: ${filename}`);
                console.log(`         Public Domain: ${pdStatus.reason}`);
                if (alternatives.length > 1) {
                  console.log(`         Found ${alternatives.length} editions`);
                }
              }

              // Rate limiting - wait 0.5 seconds between items
              await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
              console.error(`      Error processing ${doc.identifier}:`, error.message);
            }
          }

          console.log(`  → ${queryNewCandidates} new candidates from this query`);
        }

        // Rate limiting - wait 1 second between queries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error searching ${collection.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total items found:      ${stats.totalFound}`);
  console.log(`Already exists:         ${stats.alreadyExists}`);
  console.log(`Not relevant to India:  ${stats.notRelevant}`);
  console.log(`New candidates saved:   ${stats.newCandidates}`);
  console.log('\nNew candidates have been saved to:', CANDIDATES_DIR);
  console.log('\nNext steps:');
  console.log('1. Review the candidates manually');
  console.log('2. Enhance descriptions and metadata');
  console.log('3. Move approved works to src/content/works/');
}

main().catch(console.error);
