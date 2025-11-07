#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const wave11Data = JSON.parse(fs.readFileSync('./wave11-final-comprehensive-results.json', 'utf-8'));
const allResults = wave11Data.allResults;

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

  // Regional Languages
  if (t.includes('assamese') || t.includes('assam')) subjects.push('Assamese Literature', 'Regional Languages');
  if (t.includes('kashmiri') || t.includes('kashmir')) subjects.push('Kashmiri Literature', 'Regional Languages');
  if (t.includes('sindhi') || t.includes('sindh')) subjects.push('Sindhi Literature', 'Regional Languages');

  // Zoroastrian & Parsi
  if (t.includes('zend') || t.includes('avesta') || t.includes('zoroast') || t.includes('parsi') || t.includes('parsee')) {
    subjects.push('Zoroastrianism', 'Parsi Studies');
  }

  // Children's Literature
  if (t.includes('children') || t.includes('lotus buds') || t.includes('sun babies')) {
    subjects.push("Children's Literature", 'Indian Childhood');
  }

  // Fiction
  if (t.includes('tale') || t.includes('story') || t.includes('novel') || t.includes('romance') ||
      c.includes('kipling') || c.includes('tagore') || c.includes('steel') || c.includes('chatterjee')) {
    subjects.push('Indian Fiction', 'Literature');
  }
  if (c.includes('kipling')) subjects.push('Rudyard Kipling', 'British Indian Literature');
  if (c.includes('tagore')) subjects.push('Rabindranath Tagore', 'Bengali Literature');
  if (c.includes('chatterjee') || c.includes('bankim')) subjects.push('Bankim Chandra Chatterjee', 'Bengali Literature');

  // Ayurveda & Medicine
  if (t.includes('ayurveda') || t.includes('susruta') || t.includes('caraka') || t.includes('medicine') || t.includes('medical')) {
    subjects.push('Ayurveda', 'Indian Medicine');
  }
  if (t.includes('hindu medicine')) subjects.push('Hindu Medical Science');

  // Social Reform
  if (t.includes('brahmo samaj') || t.includes('arya samaj') || t.includes('social reform') ||
      t.includes('keshub') || t.includes('raja ram mohan')) {
    subjects.push('Indian Social Reform', 'Religious Reform Movements');
  }

  // Drama
  if (t.includes('drama') || t.includes('play') || t.includes('theatre')) subjects.push('Indian Drama', 'Theatre');
  if (c.includes('kalidasa') || t.includes('malavikagnimitra')) subjects.push('Sanskrit Drama', 'Kalidasa');

  // Architecture & Monuments
  if (t.includes('monument') || t.includes('tomb') || t.includes('architecture') ||
      t.includes('taj') || t.includes('inscription') || t.includes('archaeological')) {
    subjects.push('Indian Architecture', 'Monuments');
  }

  // General categories
  if (t.includes('dictionary')) subjects.push('Dictionary', 'Reference');
  if (t.includes('grammar')) subjects.push('Grammar', 'Linguistics');
  if (t.includes('proverb')) subjects.push('Proverbs', 'Folklore');

  // Fallback
  if (subjects.length === 0) subjects.push('Indian Studies');

  return subjects;
}

function getLanguages(title) {
  const t = title.toLowerCase();
  const langs = ['English']; // Default

  if (t.includes('assamese')) {
    if (!langs.includes('Assamese')) langs.unshift('Assamese');
  }
  if (t.includes('kashmiri')) {
    if (!langs.includes('Kashmiri')) langs.unshift('Kashmiri');
  }
  if (t.includes('sindhi')) {
    if (!langs.includes('Sindhi')) langs.unshift('Sindhi');
  }
  if (t.includes('sanskrit')) {
    if (!langs.includes('Sanskrit')) langs.unshift('Sanskrit');
  }
  if (t.includes('bengali')) {
    if (!langs.includes('Bengali')) langs.unshift('Bengali');
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
_collection: "Wave 11 - Final Comprehensive Coverage"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
_wave: "11"
_search_type: "final-comprehensive"
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

**Collection**: Wave 11 - Final Comprehensive Coverage
**Identifier**: \`${id}\`

---

**Note**: This work was automatically fetched from Wave 11 final comprehensive searches and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return { status: 'created', title, filename };
}

// Create all candidates
console.log('\n🌐 WAVE 11 CANDIDATE GENERATION: FINAL COMPREHENSIVE COVERAGE\n');
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
console.log('📊 WAVE 11 STATISTICS\n');
console.log(`Total works processed:      ${allResults.length}`);
console.log(`✅ Created:                 ${stats.created}`);
console.log(`⏭  Already in collection:   ${stats['duplicate-existing']}`);
console.log(`⏭  Already in candidates:   ${stats['duplicate-candidate']}`);
console.log(`⏭  Duplicate titles:        ${stats['duplicate-title']}`);
console.log(`⏭  Files exist:             ${stats['file-exists']}`);
console.log('═'.repeat(70));

console.log(`\n✅ Wave 11 candidate generation complete! Created ${stats.created} new candidates.\n`);
