#!/usr/bin/env node
/**
 * Generate New Works From _tracker.csv
 *
 * Creates Markdown drafts for every tracker row with a candidate_title.
 * Files are written to new-candidates-2/new-works/<slug>.md
 *
 * Data policy: only commit facts present in the tracker (author, title, year
 * parsed from title, language heuristics from notes, and the source URL).
 * No speculative description text is added.
 */

import fs from 'fs';
import path from 'path';

// Assume script runs with CWD at project root (new-dhwani)
const ROOT = process.cwd();
const TRACKER = path.join(ROOT, 'new-candidates-2', '_tracker.csv');
const OUT_DIR = path.join(ROOT, 'new-candidates-2', 'new-works');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // quoted-fields CSV split
    let inQuotes = false; let cell = '';
    const cols = [];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { cols.push(cell); cell = ''; }
      else { cell += ch; }
    }
    cols.push(cell);
    const obj = {};
    headers.forEach((h, idx) => obj[h] = (cols[idx] || '').trim());
    rows.push(obj);
  }
  return rows;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractYear(title) {
  if (!title) return '';
  const m = title.match(/\((\d{4})\)/);
  return m ? m[1] : '';
}

function cleanTitle(title) {
  if (!title) return '';
  return title.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

function inferLanguage(notes) {
  const map = {
    'Bengali': 'Bengali',
    'Bangla': 'Bengali',
    'Hindi': 'Hindi',
    'Urdu': 'Urdu',
    'Assamese': 'Assamese',
    'Tamil': 'Tamil',
    'Telugu': 'Telugu',
    'Kannada': 'Kannada',
    'Marathi': 'Marathi',
    'Gujarati': 'Gujarati',
    'English': 'English'
  };
  const langs = new Set();
  for (const key of Object.keys(map)) {
    if (new RegExp(`\\b${key}\\b`, 'i').test(notes || '')) langs.add(map[key]);
  }
  return Array.from(langs);
}

function inferGenre(title, notes) {
  const corpus = `${title} ${notes}`.toLowerCase();
  const genres = [];
  if (/poem|poetry|kulliyat|ghazal|shayari|afsane|stories|short stories/.test(corpus)) genres.push('Poetry/Stories');
  if (/novel/.test(corpus)) genres.push('Novel');
  if (/drama|natak|play/.test(corpus)) genres.push('Drama');
  if (/essays|literary|study|theory|criticism|polity|sociological|history|biography|memoir/.test(corpus)) genres.push('Prose/Essays');
  if (/translation|translator/.test(corpus)) genres.push('Translation');
  return genres.length ? genres : ['General'];
}

function mdFrontmatter({ title, author, year, language, genre, sourceUrl }) {
  const langs = language.length ? language.map(l => `"${l}"`).join(', ') : '"Unknown"';
  const gens = genre.length ? genre.map(g => `"${g}"`).join(', ') : '"General"';
  const yr = year || 'Unknown';
  const safeTitle = title.replace(/"/g, '\\"');
  const safeAuthor = author.replace(/"/g, '\\"');
  return `---
title: "${safeTitle}"
author: ["${safeAuthor}"]
year: ${yr}
language: [${langs}]
genre: [${gens}]
description: "Edition present at the listed source. Entry drafted from tracker data; edition details to be verified from imprint pages."
collections: ['new-candidates']
sources:
  - name: "Source"
    url: "${sourceUrl}"
    type: "archive"
references: []
publishDate: ${new Date().toISOString().slice(0,10)}
tags: []
---`;
}

function mdBody({ title, year, author, notes, sourceUrl }) {
  return `
# ${title}

## Overview

This draft records a candidate public‑domain work identified in the Dhwani tracker. A digitized edition is accessible at the source link below. Curators will confirm imprint details (publisher, city, year) directly from the scan before promotion.

## Edition Notes

- Reported year: ${year || 'Unspecified'}
- Source: ${sourceUrl}
- Tracker notes: ${notes || '—'}
- Tasks: verify title page and verso for publication facts; note translator/editor if applicable.

## About the Author

Author biography will be compiled from authority records (Wikidata/national libraries) and reliable reference sources during drafting. No unverified details are included at this stage.

## Rights Checklist

- India PD: 60 years after author’s death (literary/dramatic/musical/artistic works).
- If translation: translator’s death year governs translation rights.
- Record evidence links for death year(s) and apply rule explicitly in the final entry.

## Duplicate Screening

- Run duplicate check against current catalog using title/author normalization.
- Distinguish new translations/editions from duplicates of the same edition.

## Source Integrity

- Capture the Archive identifier or stable catalog link.
- Prefer scans with complete, legible imprint pages.
- Add a direct file link (PDF/EPUB) if available for accessibility.
`;
}

function writeDraft(row) {
  const author = row.author || row.Author || '';
  const rawTitle = row.candidate_title || row.candidate || '';
  const title = cleanTitle(rawTitle);
  const year = extractYear(rawTitle);
  const notes = row.notes || '';
  const sourceUrl = row.source_url || '';
  if (!author || !title || !sourceUrl) return { skipped: true, reason: 'missing_fields', author, title };

  const language = inferLanguage(notes);
  const genre = inferGenre(rawTitle, notes);

  const base = `${slugify(title)}-${slugify(author)}`;
  let file = path.join(OUT_DIR, `${base}.md`);
  let i = 2;
  while (fs.existsSync(file)) {
    file = path.join(OUT_DIR, `${base}-${i++}.md`);
  }

  const fm = mdFrontmatter({ title, author, year, language, genre, sourceUrl });
  const body = mdBody({ title, year, author, notes, sourceUrl });
  fs.writeFileSync(file, `${fm}\n${body}\n`, 'utf8');
  return { created: true, file };
}

function main() {
  if (!fs.existsSync(TRACKER)) {
    console.error('Tracker not found:', TRACKER);
    process.exit(1);
  }
  ensureDir(OUT_DIR);
  const rows = parseCSV(fs.readFileSync(TRACKER, 'utf8'));
  const withTitles = rows.filter(r => (r.candidate_title || '').trim() && (r.source_url || '').trim());

  const results = withTitles.map(writeDraft);
  const created = results.filter(r => r.created);
  const skipped = results.filter(r => r.skipped);

  console.log(`Drafts created: ${created.length}`);
  created.slice(0, 20).forEach(r => console.log('  +', r.file));
  if (skipped.length) {
    const counts = skipped.reduce((a, s) => { a[s.reason] = (a[s.reason]||0)+1; return a; }, {});
    console.log('Skipped:', counts);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
