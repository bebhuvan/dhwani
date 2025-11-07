#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const wave7Data = JSON.parse(fs.readFileSync('./wave7-literature-results.json', 'utf-8'));
const allResults = wave7Data.allResults;

// Load existing works for duplicate detection
const existingWorksDir = './src/content/works';
const existingIds = new Set();
const existingTitles = new Set();

if (fs.existsSync(existingWorksDir)) {
  const files = fs.readdirSync(existingWorksDir).filter(f => f.endsWith('.md'));
  files.forEach(file => {
    const content = fs.readFileSync(path.join(existingWorksDir, file), 'utf-8');
    const idMatch = content.match(/_identifier:\s*"([^"]+)"/);
    const titleMatch = content.match(/^title:\s*"([^"]+)"/m);
    if (idMatch) existingIds.add(idMatch[1]);
    if (titleMatch) existingTitles.add(titleMatch[1].toLowerCase());
  });
}

// Load existing candidates to avoid overwriting
const candidatesDir = './potential-candidates';
const existingCandidateIds = new Set();
if (fs.existsSync(candidatesDir)) {
  const files = fs.readdirSync(candidatesDir).filter(f => f.endsWith('.md'));
  files.forEach(file => {
    const content = fs.readFileSync(path.join(candidatesDir, file), 'utf-8');
    const idMatch = content.match(/_identifier:\s*"([^"]+)"/);
    if (idMatch) existingCandidateIds.add(idMatch[1]);
  });
}

function sanitizeFilename(title, author) {
  return `${title} ${author}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function inferSubjects(title, creator) {
  const t = title.toLowerCase();
  const c = (creator || '').toLowerCase();
  const subjects = [];

  // Language categorization
  if (t.includes('sanskrit') || t.includes('sanscrit')) subjects.push('Sanskrit Literature');
  if (t.includes('tamil') || t.includes('tamul') || c.includes('tamil')) subjects.push('Tamil Literature');
  if (t.includes('bengali') || c.includes('bengali')) subjects.push('Bengali Literature');
  if (t.includes('pali')) subjects.push('Pali Literature');

  // Genre categorization
  if (t.includes('drama') || t.includes('theatre') || t.includes('theater')) subjects.push('Sanskrit Drama');
  if (t.includes('poetry') || t.includes('poem')) subjects.push('Poetry');
  if (t.includes('kalidasa') || t.includes('calidasa')) subjects.push('Kalidasa', 'Classical Sanskrit Literature');
  if (t.includes('mega duta') || t.includes('meghaduta')) subjects.push('Sanskrit Poetry');
  if (t.includes('shakuntala') || t.includes('abhijna')) subjects.push('Sanskrit Drama');

  // Philosophy & Religion
  if (t.includes('vedanta') || t.includes('upanishad')) subjects.push('Vedanta', 'Indian Philosophy');
  if (t.includes('yoga')) subjects.push('Yoga', 'Indian Philosophy');
  if (t.includes('bhagavad') || t.includes('gita')) subjects.push('Bhagavad Gita', 'Hindu Philosophy');
  if (t.includes('hindu') || t.includes('hindoo')) subjects.push('Hinduism');
  if (t.includes('mythology')) subjects.push('Indian Mythology');
  if (t.includes('vedic') || t.includes('veda')) subjects.push('Vedic Studies');
  if (t.includes('dharma') || t.includes('law')) subjects.push('Hindu Law', 'Dharmashastra');

  // Epics
  if (t.includes('mahabharata')) subjects.push('Mahabharata', 'Indian Epic');
  if (t.includes('ramayana')) subjects.push('Ramayana', 'Indian Epic');
  if (t.includes('purana')) subjects.push('Puranas', 'Hindu Mythology');
  if (t.includes('vishnu purana')) subjects.push('Vishnu Purana');

  // Linguistics & Grammar
  if (t.includes('grammar') || t.includes('dictionary')) subjects.push('Linguistics', 'Reference');
  if (t.includes('catalogue') || t.includes('bibliotheca')) subjects.push('Bibliography', 'Reference');

  // History & Antiquities
  if (t.includes('history') || t.includes('antiquities')) subjects.push('Indian History');
  if (t.includes('travel') || t.includes('voyage')) subjects.push('Travel Literature', 'Ethnography');
  if (t.includes('military') || t.includes('war')) subjects.push('Military History');
  if (t.includes('kashmir')) subjects.push('Kashmir History');
  if (t.includes('akbar') || t.includes('ayeen akbery')) subjects.push('Mughal History');

  // Fallback
  if (subjects.length === 0) subjects.push('Indian Studies');

  return subjects;
}

function getLanguages(title, creator) {
  const t = title.toLowerCase();
  const c = (creator || '').toLowerCase();
  const langs = ['English']; // Default

  if (t.includes('sanskrit') || t.includes('sanscrit') || title.match(/[अ-ह]/)) {
    if (!langs.includes('Sanskrit')) langs.unshift('Sanskrit');
  }
  if (t.includes('tamil') || t.includes('tamul')) {
    if (!langs.includes('Tamil')) langs.unshift('Tamil');
  }
  if (t.includes('bengali')) {
    if (!langs.includes('Bengali')) langs.unshift('Bengali');
  }
  if (t.includes('hindi')) {
    if (!langs.includes('Hindi')) langs.unshift('Hindi');
  }

  return langs;
}

function createCandidate(work) {
  const {id, title, creator, year} = work;

  // Check for duplicates
  if (existingIds.has(id)) {
    console.log(`⏭  Duplicate (existing work): ${title}`);
    return { status: 'duplicate-existing', title };
  }

  if (existingCandidateIds.has(id)) {
    console.log(`⏭  Duplicate (existing candidate): ${title}`);
    return { status: 'duplicate-candidate', title };
  }

  if (existingTitles.has(title.toLowerCase())) {
    console.log(`⏭  Duplicate title: ${title}`);
    return { status: 'duplicate-title', title };
  }

  const filename = sanitizeFilename(title, creator) + '.md';
  const filepath = path.join(candidatesDir, filename);

  if (fs.existsSync(filepath)) {
    console.log(`⏭  File exists: ${filename}`);
    return { status: 'file-exists', title };
  }

  const subjects = inferSubjects(title, creator);
  const langs = getLanguages(title, creator);
  const description = `${title} by ${creator}, published in ${year}. ${subjects.join(', ')}.`;

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
author: ["${creator.replace(/"/g, '\\"')}"]
year: ${year}
language: ${JSON.stringify(langs)}
genre: ${JSON.stringify(subjects)}
description: "${description.replace(/"/g, '\\"')}"
collections: []
sources:
  - name: "Internet Archive"
    url: "https://archive.org/details/${id}"
    type: "other"
references:
  - name: "Wikipedia search"
    url: "https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(title)}"
    type: "wikipedia"
featured: false
publishDate: ${new Date().toISOString().split('T')[0]}
tags: ${JSON.stringify(subjects)}
_public_domain_status: "true"
_public_domain_reason: "Published in ${year} (before 1924)"
_public_domain_confidence: "high"
_collection: "Wave 7 - Comprehensive Literature"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
_wave: "7"
_search_type: "literature"
---

# ${title}

## Overview

${description}

## Public Domain Status

**Status**: ✓ Public Domain
**Reason**: Published in ${year} (before 1924)
**Confidence**: High

## Source

[View on Archive.org](https://archive.org/details/${id})

**Collection**: Wave 7 - Comprehensive Literature
**Identifier**: \`${id}\`

---

**Note**: This work was automatically fetched from Wave 7 literature searches and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return { status: 'created', title, filename };
}

// Create all candidates
console.log('\n📚 WAVE 7 CANDIDATE GENERATION: COMPREHENSIVE LITERATURE\n');
console.log('═'.repeat(70));

let stats = {
  created: 0,
  'duplicate-existing': 0,
  'duplicate-candidate': 0,
  'duplicate-title': 0,
  'file-exists': 0
};

allResults.forEach(work => {
  const result = createCandidate(work);
  stats[result.status]++;
  if (result.status === 'created') {
    console.log(`✓ Created: ${result.filename}`);
  }
});

console.log('\n' + '═'.repeat(70));
console.log('📊 WAVE 7 STATISTICS\n');
console.log(`Total works processed:      ${allResults.length}`);
console.log(`✅ Created:                 ${stats.created}`);
console.log(`⏭  Already in collection:   ${stats['duplicate-existing']}`);
console.log(`⏭  Already in candidates:   ${stats['duplicate-candidate']}`);
console.log(`⏭  Duplicate titles:        ${stats['duplicate-title']}`);
console.log(`⏭  Files exist:             ${stats['file-exists']}`);
console.log('═'.repeat(70));

console.log(`\n✅ Wave 7 candidate generation complete! Created ${stats.created} new candidates.\n`);
