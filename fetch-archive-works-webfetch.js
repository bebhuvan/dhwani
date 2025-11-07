#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  candidatesDir: './potential-candidates',
  existingWorksDir: './src/content/works',
  maxItemsPerCollection: 50, // Limit to avoid overwhelming
  maxItemsTotal: 150,
};

// Collections to search
const COLLECTIONS = [
  { name: 'Cornell', id: 'cornell' },
  { name: 'University of California', id: 'university_of_california_libraries' },
  { name: 'University of Toronto', id: 'university_of_toronto' }
];

// Search queries
const SEARCH_QUERIES = [
  'India AND Sanskrit',
  'India AND (Vedic OR Hindu OR Buddhist)',
  'India AND (Mahabharata OR Ramayana OR Upanishad)',
];

// Statistics
const stats = {
  totalFound: 0,
  alreadyExists: 0,
  notRelevant: 0,
  newCandidates: 0,
  errors: 0,
};

// Create directories
if (!fs.existsSync(CONFIG.candidatesDir)) {
  fs.mkdirSync(CONFIG.candidatesDir, { recursive: true });
}

// Load existing works
function loadExistingWorks() {
  const existing = new Set();

  if (!fs.existsSync(CONFIG.existingWorksDir)) {
    return existing;
  }

  const files = fs.readdirSync(CONFIG.existingWorksDir);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      try {
        const content = fs.readFileSync(path.join(CONFIG.existingWorksDir, file), 'utf-8');

        const archiveUrls = content.match(/archive\.org\/details\/([a-zA-Z0-9_\-\.]+)/g);
        if (archiveUrls) {
          archiveUrls.forEach(url => {
            const identifier = url.replace('archive.org/details/', '');
            existing.add(identifier);
          });
        }

        const titleMatch = content.match(/^title:\s*"(.+)"$/m);
        if (titleMatch) {
          existing.add(titleMatch[1].toLowerCase().trim());
        }
      } catch (error) {
        // Ignore errors
      }
    }
  });

  return existing;
}

// Check relevance
function isRelevantToIndia(doc) {
  const searchTerms = [
    'india', 'indian', 'hindi', 'sanskrit', 'bengali', 'tamil', 'telugu',
    'marathi', 'gujarati', 'kannada', 'malayalam', 'punjabi', 'urdu',
    'hindustan', 'bharat', 'vedic', 'hindu', 'buddhist', 'mughal',
    'ramayana', 'mahabharata', 'upanishad', 'veda'
  ];

  const text = [
    doc.title || '',
    doc.creator || '',
    Array.isArray(doc.subject) ? doc.subject.join(' ') : (doc.subject || ''),
    doc.description || ''
  ].join(' ').toLowerCase();

  const excludeTerms = ['indiana', 'west indies', 'american indian'];
  if (excludeTerms.some(term => text.includes(term))) {
    return false;
  }

  return searchTerms.some(term => text.includes(term));
}

// Check public domain
function isPublicDomain(doc) {
  const year = parseInt(doc.date || doc.year || '0');

  if (year && year < 1924) {
    return { status: true, reason: `Published in ${year} (before 1924)`, confidence: 'high' };
  }

  if (doc.possible_copyright_status === 'NOT_IN_COPYRIGHT') {
    return { status: true, reason: 'Not in copyright', confidence: 'high' };
  }

  if (doc.licenseurl && doc.licenseurl.includes('publicdomain')) {
    return { status: true, reason: 'Public domain license', confidence: 'high' };
  }

  if (year >= 1924 && year < 1950) {
    return { status: 'uncertain', reason: `Published in ${year} (may be in copyright)`, confidence: 'medium' };
  }

  return { status: 'uncertain', reason: 'Needs manual verification', confidence: 'low' };
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
function createWorkFile(doc, collectionName, pdStatus) {
  const title = doc.title || 'Untitled';
  const author = doc.creator || 'Unknown';
  const year = doc.date || doc.year || 'Unknown';
  const identifier = doc.identifier;
  const subjects = Array.isArray(doc.subject) ? doc.subject : (doc.subject ? [doc.subject] : []);
  const language = doc.language || 'Unknown';
  const description = doc.description || 'No description available.';

  const filename = sanitizeFilename(title, author) + '.md';
  const filepath = path.join(CONFIG.candidatesDir, filename);

  if (fs.existsSync(filepath)) {
    return null;
  }

  const statusIndicator = pdStatus.status === true ? '✓ Public Domain' :
                          pdStatus.status === false ? '✗ Likely Copyright' :
                          '⚠ Uncertain - Needs Verification';

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
author: ["${author.replace(/"/g, '\\"')}"]
year: ${year}
language: ["${language}"]
genre: ${JSON.stringify(subjects.slice(0, 5))}
description: "${description.replace(/"/g, '\\"').replace(/\n/g, ' ').substring(0, 500)}..."
collections: []
sources:
  - name: "Internet Archive (${collectionName})"
    url: "https://archive.org/details/${identifier}"
    type: "other"
references:
  - name: "Wikipedia search"
    url: "https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(title)}"
    type: "wikipedia"
featured: false
publishDate: ${new Date().toISOString().split('T')[0]}
tags: ${JSON.stringify(subjects.slice(0, 10))}
_public_domain_status: "${pdStatus.status}"
_public_domain_reason: "${pdStatus.reason}"
_public_domain_confidence: "${pdStatus.confidence}"
_collection: "${collectionName}"
_identifier: "${identifier}"
_needs_review: true
---

# ${title}

## Overview

${description}

## Public Domain Status

**Status**: ${statusIndicator}
**Reason**: ${pdStatus.reason}
**Confidence**: ${pdStatus.confidence}

${pdStatus.status !== true ? '\n**⚠ Action Required**: Please manually verify the copyright status before publishing.\n' : ''}

## Source

[View on Archive.org](https://archive.org/details/${identifier})

**Collection**: ${collectionName}

---

**Note**: This candidate was automatically fetched from Archive.org and requires manual review before adding to the main Dhwani collection.
`;

  fs.writeFileSync(filepath, content);
  return filename;
}

// Main function
async function main() {
  console.log('═'.repeat(70));
  console.log('🕉  DHWANI ARCHIVE.ORG WORKS FETCHER (WebFetch Version)');
  console.log('═'.repeat(70));
  console.log();

  const existingWorks = loadExistingWorks();
  console.log(`📚 Loaded ${existingWorks.size} existing works\n`);

  let totalProcessed = 0;

  for (const collection of COLLECTIONS) {
    if (totalProcessed >= CONFIG.maxItemsTotal) {
      console.log(`\n⚠ Reached maximum limit (${CONFIG.maxItemsTotal}), stopping...`);
      break;
    }

    console.log('─'.repeat(70));
    console.log(`📖 Searching: ${collection.name}`);
    console.log('─'.repeat(70));

    for (const query of SEARCH_QUERIES) {
      if (totalProcessed >= CONFIG.maxItemsTotal) break;

      console.log(`\n   Query: "${query}"`);

      try {
        // Build Archive.org API URL
        const apiUrl = `https://archive.org/advancedsearch.php?q=collection:${collection.id}+AND+(${encodeURIComponent(query)})&fl=identifier,title,creator,date,subject,language,description,year,publisher,possible_copyright_status,licenseurl&rows=20&output=json`;

        // Call claude tool to fetch (this is a workaround - in actual implementation,
        // we'd need to parse JSON directly, but WebFetch processes it)
        console.log(`   Fetching from Archive.org...`);

        // Since we can't call Claude tools from within Node.js, we'll need to
        // implement this differently. This script is meant to be run WITH Claude Code
        // assisting by making WebFetch calls.

        console.log(`   ℹ️  This script requires Claude Code assistance to fetch data.`);
        console.log(`   ℹ️  API URL: ${apiUrl}`);
        console.log(`   ℹ️  Please use WebFetch tool to get the data.`);

      } catch (error) {
        stats.errors++;
        console.error(`   ✗ Error: ${error.message}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total found:        ${stats.totalFound}`);
  console.log(`Already exists:     ${stats.alreadyExists}`);
  console.log(`Not relevant:       ${stats.notRelevant}`);
  console.log(`Errors:             ${stats.errors}`);
  console.log(`✓ New candidates:   ${stats.newCandidates}`);
}

// Export for use with Claude Code
export { loadExistingWorks, isRelevantToIndia, isPublicDomain, createWorkFile, CONFIG, COLLECTIONS, SEARCH_QUERIES };

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('This script is designed to work WITH Claude Code using WebFetch.');
  console.log('Please see the interactive version where Claude assists with fetching.\n');
}
