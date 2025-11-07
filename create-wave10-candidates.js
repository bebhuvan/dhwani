#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const wave10Data = JSON.parse(fs.readFileSync('./wave10-comprehensive-results.json', 'utf-8'));
const allResults = wave10Data.allResults;

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

  // Languages & Philology
  if (t.includes('linguistic') || t.includes('language')) subjects.push('Linguistics', 'Indian Languages');
  if (t.includes('dravidian')) subjects.push('Dravidian Languages');
  if (t.includes('hobson-jobson')) subjects.push('Anglo-Indian Terminology', 'Reference');
  if (t.includes('dictionary')) subjects.push('Dictionary', 'Reference');
  if (t.includes('grammar')) subjects.push('Grammar', 'Linguistics');
  if (t.includes('hindustani') || t.includes('hindi') || t.includes('urdu')) subjects.push('Hindi-Urdu');
  if (t.includes('prakrit')) subjects.push('Prakrit Languages');

  // Inscriptions
  if (t.includes('inscription') || t.includes('epigraphy') || t.includes('epigraphia')) {
    subjects.push('Indian Epigraphy', 'Inscriptions');
  }
  if (t.includes('corpus inscriptionum')) subjects.push('Corpus Inscriptionum Indicarum');
  if (t.includes('carnatica')) subjects.push('Karnataka History');
  if (t.includes('south indian inscriptions')) subjects.push('South Indian History');
  if (t.includes('gupta')) subjects.push('Gupta Empire');

  // Economics
  if (t.includes('economic') || t.includes('commerce') || t.includes('trade')) {
    subjects.push('Indian Economics', 'Economic History');
  }
  if (t.includes('currency') || t.includes('coin')) subjects.push('Indian Currency', 'Numismatics');
  if (t.includes('arthasastra')) subjects.push('Arthasastra', 'Ancient Economics');
  if (t.includes('land revenue') || t.includes('land tenure')) subjects.push('Land Administration');

  // Geography & Gazetteers
  if (t.includes('gazetteer')) subjects.push('Indian Gazetteers', 'Historical Geography');
  if (t.includes('geography') || t.includes('geographical')) subjects.push('Indian Geography');
  if (t.includes('ancient india') || t.includes('ancient geography')) subjects.push('Ancient India', 'Classical Geography');
  if (t.includes('travel') || t.includes('journey')) subjects.push('Indian Travel Accounts');
  if (t.includes('himalayan') || t.includes('kashmir') || t.includes('ladak')) subjects.push('Himalayan Region');

  // Major Indologists
  if (c.includes('wilson') || t.includes('wilson')) subjects.push('H.H. Wilson', 'Indology');
  if (c.includes('mitra') || t.includes('rajendralal')) subjects.push('Rajendralal Mitra', 'Indology');
  if (c.includes('muir') || t.includes('muir')) subjects.push('John Muir', 'Indology');
  if (t.includes('vishnu purana')) subjects.push('Puranas', 'Hindu Texts');
  if (t.includes('rig-veda') || t.includes('rigveda')) subjects.push('Rigveda', 'Vedic Studies');
  if (t.includes('indo-aryan')) subjects.push('Indo-Aryan Studies');

  // Sacred Books of the East
  if (t.includes('sacred books of the east') || c.includes('müller') || c.includes('muller')) {
    subjects.push('Sacred Books of the East', 'F. Max Müller');
  }
  if (t.includes('upanishad')) subjects.push('Upanishads', 'Vedic Philosophy');
  if (t.includes('bhagavadgita') || t.includes('bhagavad gita')) subjects.push('Bhagavad Gita');
  if (t.includes('dhammapada')) subjects.push('Dhammapada', 'Buddhist Texts');
  if (t.includes('vinaya')) subjects.push('Vinaya', 'Buddhist Texts');
  if (t.includes('satapatha brahmana')) subjects.push('Brahmanas', 'Vedic Texts');
  if (t.includes('jaina sutras')) subjects.push('Jaina Sutras', 'Jain Texts');
  if (t.includes('laws of manu')) subjects.push('Manusmriti', 'Dharmashastra');
  if (t.includes('zend-avesta') || t.includes('pahlavi')) subjects.push('Zoroastrianism');

  // Women
  if (t.includes('women') || t.includes('woman') || t.includes('zenana') || t.includes('purdah')) {
    subjects.push('Women in India', 'Gender Studies');
  }
  if (t.includes('hindu woman') || t.includes('hindu women')) subjects.push('Hindu Women');

  // Fallback
  if (subjects.length === 0) subjects.push('Indian Studies');

  return subjects;
}

function getLanguages(title) {
  const t = title.toLowerCase();
  const langs = ['English']; // Default

  if (t.includes('sanskrit')) {
    if (!langs.includes('Sanskrit')) langs.unshift('Sanskrit');
  }
  if (t.includes('pali')) {
    if (!langs.includes('Pali')) langs.unshift('Pali');
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
_collection: "Wave 10 - Comprehensive Coverage"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
_wave: "10"
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

**Collection**: Wave 10 - Comprehensive Coverage
**Identifier**: \`${id}\`

---

**Note**: This work was automatically fetched from Wave 10 comprehensive searches and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return { status: 'created', title, filename };
}

// Create all candidates
console.log('\n🌐 WAVE 10 CANDIDATE GENERATION: COMPREHENSIVE COVERAGE\n');
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
console.log('📊 WAVE 10 STATISTICS\n');
console.log(`Total works processed:      ${allResults.length}`);
console.log(`✅ Created:                 ${stats.created}`);
console.log(`⏭  Already in collection:   ${stats['duplicate-existing']}`);
console.log(`⏭  Already in candidates:   ${stats['duplicate-candidate']}`);
console.log(`⏭  Duplicate titles:        ${stats['duplicate-title']}`);
console.log(`⏭  Files exist:             ${stats['file-exists']}`);
console.log('═'.repeat(70));

console.log(`\n✅ Wave 10 candidate generation complete! Created ${stats.created} new candidates.\n`);
