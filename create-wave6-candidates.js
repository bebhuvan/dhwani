#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const wave6Data = JSON.parse(fs.readFileSync('./wave6-journals-results.json', 'utf-8'));
const allResults = wave6Data.allResults;

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

  // Journal-specific categorization
  if (t.includes('antiquary')) subjects.push('Archaeology', 'Indian History');
  if (t.includes('asiatic researches') || t.includes('asiatic society')) subjects.push('Orientalism', 'Indian Studies');
  if (t.includes('epigraphia') || t.includes('inscription')) subjects.push('Epigraphy', 'Archaeology');
  if (t.includes('gazetteer')) subjects.push('Geography', 'Indian History', 'Reference');
  if (t.includes('archaeological survey')) subjects.push('Archaeology', 'Indian History');
  if (t.includes('historical quarterly')) subjects.push('Indian History');
  if (t.includes('royal asiatic') || t.includes('bombay branch')) subjects.push('Orientalism', 'Indian Studies');

  // Fallback
  if (subjects.length === 0) subjects.push('Indian Studies', 'Scholarly Journal');

  return subjects;
}

function getJournalDescription(title, creator, year, subjects) {
  const t = title.toLowerCase();

  if (t.includes('indian antiquary')) {
    return `${title}, published in ${year}. The Indian Antiquary was a foundational journal for Oriental research, covering archaeology, epigraphy, ethnology, and Indian history.`;
  }

  if (t.includes('asiatic researches')) {
    return `${title}, published in ${year}. Asiatic Researches was the pioneering journal of the Asiatic Society of Bengal, founded in 1788, publishing groundbreaking research on Indian languages, culture, and sciences.`;
  }

  if (t.includes('epigraphia indica')) {
    return `${title}, published in ${year}. Epigraphia Indica is the authoritative journal for Indian epigraphy, documenting inscriptions from across the subcontinent.`;
  }

  if (t.includes('gazetteer')) {
    return `${title}, published in ${year}. District and regional gazetteers provided comprehensive geographical, statistical, and historical information about India during the British period.`;
  }

  if (t.includes('journal') && t.includes('asiatic society of bengal')) {
    return `${title}, published in ${year}. The Journal of the Asiatic Society of Bengal was the premier scholarly journal for Oriental studies in the 19th century.`;
  }

  if (t.includes('archaeological survey')) {
    return `${title}, published in ${year}. The Archaeological Survey of India's reports documented monuments, inscriptions, and archaeological sites across India.`;
  }

  return `${title} by ${creator}, published in ${year}. ${subjects.join(', ')}.`;
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
  const description = getJournalDescription(title, creator, year, subjects);
  const langs = ['English'];  // Most journals are in English

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
_collection: "Wave 6 - Journals & Periodicals"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
_wave: "6"
_search_type: "journals"
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

**Collection**: Wave 6 - Journals & Periodicals
**Identifier**: \`${id}\`

---

**Note**: This scholarly journal/periodical was automatically fetched from Wave 6 searches and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return { status: 'created', title, filename };
}

// Create all candidates
console.log('\n📰 WAVE 6 CANDIDATE GENERATION: JOURNALS & PERIODICALS\n');
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
console.log('📊 WAVE 6 STATISTICS\n');
console.log(`Total works processed:      ${allResults.length}`);
console.log(`✅ Created:                 ${stats.created}`);
console.log(`⏭  Already in collection:   ${stats['duplicate-existing']}`);
console.log(`⏭  Already in candidates:   ${stats['duplicate-candidate']}`);
console.log(`⏭  Duplicate titles:        ${stats['duplicate-title']}`);
console.log(`⏭  Files exist:             ${stats['file-exists']}`);
console.log('═'.repeat(70));

console.log(`\n✅ Wave 6 candidate generation complete! Created ${stats.created} new candidates.\n`);
