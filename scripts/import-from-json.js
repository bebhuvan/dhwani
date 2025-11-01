#!/usr/bin/env node
/**
 * Import candidates from local JSON datasets into new-candidates-2/new-works
 * Skips duplicates by Archive.org URL or fuzzy title+author already in catalog.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const WORKS_DIR = path.join(ROOT, 'src', 'content', 'works');
const NEW_DIR = path.join(ROOT, 'new-candidates-2', 'new-works');

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function readAllMD(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => ({
    file: f,
    text: fs.readFileSync(path.join(dir, f), 'utf8')
  }));
}

function extractUrls(text) {
  const urls = [];
  const re = /url:\s*"([^"]+)"/g;
  let m; while ((m = re.exec(text))) urls.push(m[1]);
  return urls;
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleYear(obj) {
  const y = obj.year || obj.date || obj.publication_year || '';
  const str = String(y);
  const m = str.match(/\d{4}/);
  return m ? Number(m[0]) : 'Unknown';
}

function arr(x) { return Array.isArray(x) ? x : (x ? [x] : []); }

function toFrontmatter(obj) {
  const title = obj.title || 'Untitled';
  const year = titleYear(obj);
  const author = arr(obj.author || obj.authors).map(a => String(a));
  const language = arr(obj.language).map(s => String(s).split(/[(),]/)[0].trim()).filter(Boolean);
  const genres = arr(obj.genre || obj.genres || obj.subject).map(s => String(s));
  const archiveUrl = obj.archive_url || obj.archiveUrl || obj.url;
  const description = obj.description ? String(obj.description) : 'Digitized edition available at the listed source.';
  const srcName = obj.archive_collection || 'Internet Archive';

  return {
    title,
    year,
    author: author.length ? author : ['Unknown'],
    language: language.length ? language : ['English'],
    genre: genres.length ? genres : ['General'],
    description,
    sources: [{ name: srcName, url: archiveUrl, type: 'archive' }]
  };
}

function mdFromFrontmatter(fm) {
  const yaml = [
    '---',
    `title: "${fm.title.replace(/"/g, '\\"')}"`,
    `author: [${fm.author.map(a => `"${a.replace(/"/g, '\\"')}"`).join(', ')}]`,
    `year: ${fm.year}`,
    `language: [${fm.language.map(l => `"${l}"`).join(', ')}]`,
    `genre: [${fm.genre.map(g => `"${g}"`).join(', ')}]`,
    `description: "${fm.description.replace(/"/g, '\\"')}"`,
    `collections: ['new-candidates']`,
    'sources:',
    ...fm.sources.map(s => `  - name: "${s.name}"
    url: "${s.url}"
    type: "${s.type || 'archive'}"`),
    'references: []',
    `publishDate: ${new Date().toISOString().slice(0,10)}`,
    'tags: []',
    '---'
  ].join('\n');

  const body = `
# ${fm.title}

## Overview

Digitized edition accessible at the source link below. This entry will be expanded with edition‑specific notes (publisher, city, year) after imprint verification.

## Edition Notes

- Reported year: ${fm.year}
- Source: ${fm.sources[0]?.url || ''}
- Tasks: verify imprint details on title/verso; note any prefaces, appendices, or indices.

## About the Author

Brief biography and scholarly context will be added based on authority records and standard references.

## Significance

Why the work matters within its field; to be expanded after content review.

## Editions & Sources

- Confirm exact edition based on imprint; add alternative scans if needed.

## Reading Guide

- Prepare a short outline of chapters/sections; list key terms for a glossary.
`;
  return `${yaml}\n\n${body.trim()}\n`;
}

function main() {
  const jsonPaths = process.argv.slice(2);
  if (jsonPaths.length === 0) {
    console.error('Usage: node scripts/import-from-json.js <file1.json> [file2.json ...]');
    process.exit(1);
  }
  ensureDir(NEW_DIR);

  // build existing URL set from site and new works
  const existing = new Set();
  for (const dir of [WORKS_DIR, NEW_DIR]) {
    for (const { text } of readAllMD(dir)) extractUrls(text).forEach(u => existing.add(u));
  }

  let created = 0, skipped = 0;
  function parseLenient(text) {
    try { return JSON.parse(text); } catch (e) {
      // try to sanitize year fields like 1888 (reprint 1981)
      const fixed = text.replace(/"year"\s*:\s*([^,\n]+)(,?)/g, (m, val, comma) => {
        const v = String(val).trim();
        const y = v.match(/\d{4}/)?.[0];
        if (y) return `"year": ${y}${comma || ''}`;
        const safe = v.replace(/"/g, '\\"');
        return `"year": "${safe}"${comma || ''}`;
      });
      return JSON.parse(fixed);
    }
  }

  for (const jp of jsonPaths) {
    const abs = path.isAbsolute(jp) ? jp : path.resolve(ROOT, jp); // resolve relative to project cwd
    if (!fs.existsSync(abs)) { console.warn('Missing JSON:', abs); continue; }
    const arr = parseLenient(fs.readFileSync(abs, 'utf8'));
    for (const rec of arr) {
      const url = rec.archive_url || rec.archiveUrl || rec.url || '';
      if (!url) { skipped++; continue; }
      if (existing.has(url)) { skipped++; continue; }

      const fm = toFrontmatter(rec);
      const base = `${slugify(fm.title)}-${slugify(fm.author[0] || 'unknown')}`;
      let out = path.join(NEW_DIR, `${base}.md`);
      let i = 2;
      while (fs.existsSync(out)) { out = path.join(NEW_DIR, `${base}-${i++}.md`); }
      fs.writeFileSync(out, mdFromFrontmatter(fm), 'utf8');
      existing.add(url);
      created++;
    }
  }
  console.log(`Imported: ${created}, Skipped: ${skipped}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
