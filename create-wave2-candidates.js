#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const wave2Data = JSON.parse(fs.readFileSync('./wave2-all-subject-results.json', 'utf-8'));
const allResults = wave2Data.allResults;

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

function sanitizeFilename(title, creator) {
  const base = creator ? `${title} ${creator}` : title;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function inferLanguages(title, subject) {
  const langs = new Set(['English']);
  if (title.match(/[[\u0900-\u097F]/)) langs.add('Sanskrit');
  if (title.match(/[\u0B80-\u0BFF]/)) langs.add('Tamil');
  if (title.match(/[\u0980-\u09FF]/)) langs.add('Bengali');
  if (subject === 'Tamil Literature') langs.add('Tamil');
  if (subject === 'Bengali Literature') langs.add('Bengali');
  return Array.from(langs);
}

function createCandidate(work) {
  const {id, title, creator, year, subject} = work;

  if (existingIds.has(id)) {
    return { status: 'duplicate-existing', title };
  }
  if (existingCandidateIds.has(id)) {
    return { status: 'duplicate-candidate', title };
  }
  if (existingTitles.has(title.toLowerCase())) {
    return { status: 'duplicate-title', title };
  }

  const filename = sanitizeFilename(title, creator) + '.md';
  const filepath = path.join(candidatesDir, filename);

  if (fs.existsSync(filepath)) {
    return { status: 'file-exists', title };
  }

  const langs = inferLanguages(title, subject);
  const author = creator || "Unknown";

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
author: ["${author.replace(/"/g, '\\"')}"]
year: ${year}
language: ${JSON.stringify(langs)}
genre: ["${subject}"]
description: "${title} by ${author}, published in ${year}. ${subject}."
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
tags: ["${subject}"]
_public_domain_status: "true"
_public_domain_reason: "Published in ${year} (before 1924)"
_public_domain_confidence: "high"
_collection: "Wave 2 - Subject Search"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
_wave: "2"
_search_type: "subject"
_subject: "${subject}"
---

# ${title}

## Overview

Published in ${year}, this work is part of the ${subject} collection.

## Public Domain Status

**Status**: ✓ Public Domain
**Reason**: Published in ${year} (before 1924)
**Confidence**: High

## Source

[View on Archive.org](https://archive.org/details/${id})

**Collection**: Wave 2 - Subject Search
**Subject**: ${subject}
**Identifier**: \`${id}\`

---

**Note**: This candidate was automatically fetched from Wave 2 subject searches and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return { status: 'created', title, filename, subject };
}

console.log('\n🎯 WAVE 2 CANDIDATE GENERATION\n');
console.log('═'.repeat(70));

let stats = {
  created: 0,
  'duplicate-existing': 0,
  'duplicate-candidate': 0,
  'duplicate-title': 0,
  'file-exists': 0
};

let bySubject = {};

allResults.forEach(work => {
  const result = createCandidate(work);
  stats[result.status]++;
  
  if (result.status === 'created') {
    if (!bySubject[result.subject]) bySubject[result.subject] = 0;
    bySubject[result.subject]++;
    console.log(`✓ ${result.subject}: ${result.filename.substring(0, 60)}`);
  }
});

console.log('\n' + '═'.repeat(70));
console.log('📊 WAVE 2 STATISTICS\n');
console.log(`Total works processed:      ${allResults.length}`);
console.log(`✅ Created:                 ${stats.created}`);
console.log(`⏭  Already in collection:   ${stats['duplicate-existing']}`);
console.log(`⏭  Already in candidates:   ${stats['duplicate-candidate']}`);
console.log(`⏭  Duplicate titles:        ${stats['duplicate-title']}`);
console.log(`⏭  Files exist:             ${stats['file-exists']}`);
console.log('═'.repeat(70));

console.log('\n📚 BY SUBJECT:\n');
Object.keys(bySubject).sort().forEach(subject => {
  console.log(`${subject.padEnd(30)} ${bySubject[subject]} candidates`);
});

console.log('\n' + '═'.repeat(70));
console.log(`✅ Wave 2 candidate generation complete! Created ${stats.created} new candidates.\n`);
