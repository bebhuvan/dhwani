#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const wave1Data = JSON.parse(fs.readFileSync('./wave1-author-results.json', 'utf-8'));
const allResults = wave1Data.allResults;

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

function inferSubjects(title) {
  const t = title.toLowerCase();
  const subjects = [];

  if (t.includes('sacred') || t.includes('veda') || t.includes('upanishad')) subjects.push('Vedic Studies');
  if (t.includes('buddhist') || t.includes('buddha') || t.includes('jataka')) subjects.push('Buddhist Studies');
  if (t.includes('sanskrit')) subjects.push('Sanskrit Literature');
  if (t.includes('history') || t.includes('ancient')) subjects.push('Indian History');
  if (t.includes('philosophy')) subjects.push('Indian Philosophy');
  if (t.includes('linguistic')) subjects.push('Linguistics');
  if (t.includes('dictionary')) subjects.push('Reference');
  if (t.includes('grammar')) subjects.push('Grammar');

  return subjects.length > 0 ? subjects : ['Indian Studies'];
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

  const subjects = inferSubjects(title);
  const langs = title.toLowerCase().includes('sanskrit') ? ['Sanskrit', 'English'] : ['English'];

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
author: ["${creator.replace(/"/g, '\\"')}"]
year: ${year}
language: ${JSON.stringify(langs)}
genre: ${JSON.stringify(subjects)}
description: "${title} by ${creator}, published in ${year}. ${subjects.join(', ')}."
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
_collection: "Wave 1 - Author Search"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
_wave: "1"
_search_type: "author"
---

# ${title}

## Overview

Published in ${year}, this work ${subjects.length > 0 ? `covers ${subjects.join(', ')}` : 'is an important contribution to Indian studies'}.

${creator.toLowerCase().includes('muller') ? `\n**Max Müller** was one of the most influential Indologists of the 19th century, best known for editing the Sacred Books of the East series.\n` : ''}
${creator.toLowerCase().includes('monier') || creator.toLowerCase().includes('williams') ? `\n**Monier Monier-Williams** was a prominent Sanskrit scholar and compiler of the authoritative Sanskrit-English Dictionary.\n` : ''}
${creator.toLowerCase().includes('macdonell') ? `\n**Arthur Anthony Macdonell** was a Sanskrit scholar and Professor of Sanskrit at Oxford University.\n` : ''}
${creator.toLowerCase().includes('keith') ? `\n**Arthur Berriedale Keith** was a Scottish constitutional lawyer and Sanskrit scholar specializing in Vedic literature.\n` : ''}
${creator.toLowerCase().includes('cunningham') ? `\n**Alexander Cunningham** was a British Army engineer and the founder of the Archaeological Survey of India.\n` : ''}

## Public Domain Status

**Status**: ✓ Public Domain
**Reason**: Published in ${year} (before 1924)
**Confidence**: High

## Source

[View on Archive.org](https://archive.org/details/${id})

**Collection**: Wave 1 - Author Search
**Identifier**: \`${id}\`

---

**Note**: This candidate was automatically fetched from Wave 1 author searches and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return { status: 'created', title, filename };
}

// Create all candidates
console.log('\n🎯 WAVE 1 CANDIDATE GENERATION\n');
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
console.log('📊 WAVE 1 STATISTICS\n');
console.log(`Total works processed:      ${allResults.length}`);
console.log(`✅ Created:                 ${stats.created}`);
console.log(`⏭  Already in collection:   ${stats['duplicate-existing']}`);
console.log(`⏭  Already in candidates:   ${stats['duplicate-candidate']}`);
console.log(`⏭  Duplicate titles:        ${stats['duplicate-title']}`);
console.log(`⏭  Files exist:             ${stats['file-exists']}`);
console.log('═'.repeat(70));

console.log(`\n✅ Wave 1 candidate generation complete! Created ${stats.created} new candidates.\n`);
