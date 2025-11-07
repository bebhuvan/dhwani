#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const wave8Data = JSON.parse(fs.readFileSync('./wave8-comprehensive-results.json', 'utf-8'));
const allResults = wave8Data.allResults;

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

  // Buddhism & Pali
  if (t.includes('buddhis') || t.includes('buddha') || t.includes('pali')) subjects.push('Buddhism', 'Buddhist Studies');
  if (t.includes('mahavans') || t.includes('ceylon')) subjects.push('Sri Lankan Buddhism');
  if (t.includes('tibet') || t.includes('lama')) subjects.push('Tibetan Buddhism');

  // Jainism
  if (t.includes('jain') || t.includes('kalpa sutra')) subjects.push('Jainism', 'Jain Studies');
  if (t.includes('sravana belgola')) subjects.push('Jain Inscriptions');

  // Regional languages
  if (t.includes('marathi') || c.includes('marathi')) subjects.push('Marathi Literature', 'Regional Languages');
  if (t.includes('kannada') || t.includes('canarese')) subjects.push('Kannada Literature', 'Regional Languages');
  if (t.includes('telugu')) subjects.push('Telugu Literature', 'Regional Languages');
  if (t.includes('tamil')) subjects.push('Tamil Literature', 'Regional Languages');

  // Grammar & dictionaries
  if (t.includes('grammar') || t.includes('dictionary')) subjects.push('Linguistics', 'Reference');
  if (t.includes('glossary')) subjects.push('Reference', 'Linguistics');

  // Art, Architecture, Music
  if (t.includes('art') || t.includes('architecture') || t.includes('music')) subjects.push('Indian Art');
  if (t.includes('architecture')) subjects.push('Indian Architecture');
  if (t.includes('music')) subjects.push('Indian Music');
  if (t.includes('archaeology')) subjects.push('Archaeology', 'Indian History');

  // Folklore
  if (t.includes('folk') || t.includes('tales') || t.includes('stories')) subjects.push('Folklore', 'Oral Tradition');
  if (t.includes('kashmir')) subjects.push('Kashmir');

  // Religion & Social Life
  if (t.includes('manners') || t.includes('customs') || t.includes('social')) subjects.push('Ethnography', 'Social Life');
  if (t.includes('religion')) subjects.push('Religion', 'Indian Studies');
  if (t.includes('india') && (t.includes('life') || t.includes('society'))) subjects.push('Indian Society');

  // Historical works
  if (t.includes('history') || t.includes('antiquities')) subjects.push('Indian History');
  if (t.includes('ain') && t.includes('akbar')) subjects.push('Mughal History');
  if (t.includes('empire')) subjects.push('Colonial History');

  // Fallback
  if (subjects.length === 0) subjects.push('Indian Studies');

  return subjects;
}

function getLanguages(title, creator) {
  const t = title.toLowerCase();
  const langs = ['English']; // Default

  if (t.includes('marathi')) {
    if (!langs.includes('Marathi')) langs.unshift('Marathi');
  }
  if (t.includes('kannada') || t.includes('canarese')) {
    if (!langs.includes('Kannada')) langs.unshift('Kannada');
  }
  if (t.includes('telugu')) {
    if (!langs.includes('Telugu')) langs.unshift('Telugu');
  }
  if (t.includes('pali')) {
    if (!langs.includes('Pali')) langs.unshift('Pali');
  }
  if (t.includes('sanskrit') || t.includes('sanscrit')) {
    if (!langs.includes('Sanskrit')) langs.unshift('Sanskrit');
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
_collection: "Wave 8 - Comprehensive (Buddhism, Jainism, Regional Languages, Art)"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
_wave: "8"
_search_type: "comprehensive"
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

**Collection**: Wave 8 - Comprehensive (Buddhism, Jainism, Regional Languages, Art)
**Identifier**: \`${id}\`

---

**Note**: This work was automatically fetched from Wave 8 comprehensive searches and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return { status: 'created', title, filename };
}

// Create all candidates
console.log('\n🌍 WAVE 8 CANDIDATE GENERATION: COMPREHENSIVE\n');
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
console.log('📊 WAVE 8 STATISTICS\n');
console.log(`Total works processed:      ${allResults.length}`);
console.log(`✅ Created:                 ${stats.created}`);
console.log(`⏭  Already in collection:   ${stats['duplicate-existing']}`);
console.log(`⏭  Already in candidates:   ${stats['duplicate-candidate']}`);
console.log(`⏭  Duplicate titles:        ${stats['duplicate-title']}`);
console.log(`⏭  Files exist:             ${stats['file-exists']}`);
console.log('═'.repeat(70));

console.log(`\n✅ Wave 8 candidate generation complete! Created ${stats.created} new candidates.\n`);
