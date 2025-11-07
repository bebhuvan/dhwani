#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const wave9Data = JSON.parse(fs.readFileSync('./wave9-regional-sikhism-results.json', 'utf-8'));
const allResults = wave9Data.allResults;

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

// Load existing candidates
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

  // Regional languages
  if (t.includes('gujarati') || c.includes('gujarati')) subjects.push('Gujarati Literature', 'Regional Languages');
  if (t.includes('malayalam')) subjects.push('Malayalam Literature', 'Regional Languages');
  if (t.includes('oriya') || t.includes('odia')) subjects.push('Oriya Literature', 'Regional Languages');
  if (t.includes('punjabi') || t.includes('panjabi')) subjects.push('Punjabi Literature', 'Regional Languages');

  // Grammar & dictionaries
  if (t.includes('grammar')) subjects.push('Grammar', 'Linguistics');
  if (t.includes('dictionary')) subjects.push('Dictionary', 'Reference');

  // Sikhism
  if (t.includes('sikh') || t.includes('guru') || t.includes('granth') || t.includes('nanak')) {
    subjects.push('Sikhism', 'Sikh Studies');
  }
  if (t.includes('adi granth') || t.includes('guru granth')) subjects.push('Guru Granth Sahib', 'Sacred Texts');
  if (t.includes('ranjit singh') || t.includes('punjab') && t.includes('history')) subjects.push('Sikh History');

  // Science & Mathematics
  if (t.includes('mathematics') || t.includes('science')) subjects.push('Indian Mathematics', 'Science');

  // Government
  if (t.includes('polity') || t.includes('administration') || t.includes('government')) {
    subjects.push('Indian Administration', 'Colonial History');
  }

  // Fallback
  if (subjects.length === 0) subjects.push('Indian Studies');

  return subjects;
}

function getLanguages(title) {
  const t = title.toLowerCase();
  const langs = ['English']; // Default

  if (t.includes('gujarati')) {
    if (!langs.includes('Gujarati')) langs.unshift('Gujarati');
  }
  if (t.includes('malayalam')) {
    if (!langs.includes('Malayalam')) langs.unshift('Malayalam');
  }
  if (t.includes('oriya') || t.includes('odia')) {
    if (!langs.includes('Oriya')) langs.unshift('Oriya');
  }
  if (t.includes('punjabi') || t.includes('panjabi')) {
    if (!langs.includes('Punjabi')) langs.unshift('Punjabi');
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
  const langs = getLanguages(title);
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
_collection: "Wave 9 - Regional Languages & Sikhism"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
_wave: "9"
_search_type: "regional-sikhism"
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

**Collection**: Wave 9 - Regional Languages & Sikhism
**Identifier**: \`${id}\`

---

**Note**: This work was automatically fetched from Wave 9 regional language and Sikhism searches and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return { status: 'created', title, filename };
}

// Create all candidates
console.log('\n🌐 WAVE 9 CANDIDATE GENERATION: REGIONAL LANGUAGES & SIKHISM\n');
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
console.log('📊 WAVE 9 STATISTICS\n');
console.log(`Total works processed:      ${allResults.length}`);
console.log(`✅ Created:                 ${stats.created}`);
console.log(`⏭  Already in collection:   ${stats['duplicate-existing']}`);
console.log(`⏭  Already in candidates:   ${stats['duplicate-candidate']}`);
console.log(`⏭  Duplicate titles:        ${stats['duplicate-title']}`);
console.log(`⏭  Files exist:             ${stats['file-exists']}`);
console.log('═'.repeat(70));

console.log(`\n✅ Wave 9 candidate generation complete! Created ${stats.created} new candidates.\n`);
