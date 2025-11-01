#!/usr/bin/env node
/**
 * Generate a prioritized harvest queue from _tracker.csv and research briefs.
 * Writes new-candidates-2/HARVEST_QUEUE.md with IA search links and status.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TRACKER = path.join(ROOT, 'new-candidates-2', '_tracker.csv');
const RESEARCH_DIR = path.join(ROOT, 'new-candidates-2', 'research');
const NEW_WORKS_DIR = path.join(ROOT, 'new-candidates-2', 'new-works');
const OUT = path.join(ROOT, 'new-candidates-2', 'HARVEST_QUEUE.md');

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const header = lines.shift()?.split(',') || [];
  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    let inQ = false, cell = '';
    const cols = [];
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cell); cell = ''; } else { cell += ch; }
    }
    cols.push(cell);
    const obj = {};
    header.forEach((h, i) => obj[h] = (cols[i] || '').trim());
    rows.push(obj);
  }
  return rows;
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

function buildArchiveSearch(author) {
  const q = encodeURIComponent(`(creator:(\"${author}\") OR title:(\"${author}\")) AND mediatype:texts`);
  return `https://archive.org/search.php?query=${q}`;
}

function hasNewWork(author, title) {
  const files = fs.existsSync(NEW_WORKS_DIR) ? fs.readdirSync(NEW_WORKS_DIR) : [];
  const slugA = slugify(author);
  const slugT = slugify((title || '').replace(/\(\d{4}\)/, '').trim());
  return files.some(f => f.includes(slugA) && (!slugT || f.includes(slugT)));
}

function main() {
  if (!fs.existsSync(TRACKER)) {
    console.error('Missing tracker:', TRACKER);
    process.exit(1);
  }
  const rows = parseCSV(fs.readFileSync(TRACKER, 'utf8'));
  // Filter candidates to harvest: queued, researching, pd-check
  const targetStatuses = new Set(['queued', 'researching', 'pd-check']);
  const candidates = rows.filter(r => targetStatuses.has((r.status || '').toLowerCase()));

  // Prioritize by PD year (older first), then by presence of candidate_title
  candidates.sort((a, b) => (Number(a.pd_year) || 9999) - (Number(b.pd_year) || 9999) || (b.candidate_title ? 1 : -1));

  const lines = [];
  lines.push('# Harvest Queue');
  lines.push('');
  lines.push('This queue lists high‑priority authors/works to harvest from Internet Archive (and others). Use the search links to find editions, then add exact items to the tracker.');
  lines.push('');
  lines.push('| Author | PD (India) | Candidate/Hint | IA Search | Status | Draft | Research |');
  lines.push('|---|---:|---|---|---|---|---|');

  for (const r of candidates.slice(0, 200)) {
    const author = r.author || r.Author || '';
    const pdYear = r.pd_year || '';
    const cand = r.candidate_title || '';
    const search = buildArchiveSearch(author);
    const status = r.status || '';
    const draft = hasNewWork(author, cand) ? 'yes' : '';
    const researchPath = path.join(RESEARCH_DIR, `${slugify(author)}.md`);
    const research = fs.existsSync(researchPath) ? `research/${path.basename(researchPath)}` : '';
    lines.push(`| ${author} | ${pdYear} | ${cand} | ${search} | ${status} | ${draft} | ${research} |`);
  }

  fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
  console.log('Wrote harvest queue:', OUT);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

