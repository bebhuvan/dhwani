#!/usr/bin/env node
/**
 * Mark tracker rows as priority based on a list of candidate files.
 *
 * Usage:
 *   node scripts/mark-priority-from-files.js new-candidates-2/new-works/<a>.md [...]
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TRACKER = path.join(ROOT, 'new-candidates-2', '_tracker.csv');

function readTracker() {
  if (!fs.existsSync(TRACKER)) throw new Error('Tracker not found: ' + TRACKER);
  const text = fs.readFileSync(TRACKER, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines.shift();
  const rows = lines.map(l => l).filter(Boolean);
  return { header, rows };
}

function extractFirstArchiveUrl(mdPath) {
  const txt = fs.readFileSync(mdPath, 'utf8');
  const m = txt.match(/\n\s*url:\s*"(https?:\/\/[^\"]+)"/);
  return m ? m[1] : null;
}

function csvSplit(line) {
  let q=false, cell=''; const cols=[];
  for (let i=0;i<line.length;i++){
    const ch=line[i];
    if (ch==='"') {
      if (q && line[i+1]==='"') { cell+='"'; i++; }
      else q=!q;
    } else if (ch===',' && !q) { cols.push(cell); cell=''; }
    else cell+=ch;
  }
  cols.push(cell);
  return cols;
}

function csvJoin(cols) {
  return cols.map(v => {
    const s=String(v??'');
    return (/[",\n]/.test(s)) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(',');
}

function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node scripts/mark-priority-from-files.js <md> [...]');
    process.exit(1);
  }
  const { header, rows } = readTracker();
  const urlToRowIdx = new Map();
  rows.forEach((line, idx) => {
    const cols = csvSplit(line);
    const url = (cols[3]||'').replace(/^\"|\"$/g,'');
    if (url) urlToRowIdx.set(url, idx);
  });

  let updated = 0; const missing = [];
  for (const rel of files) {
    const abs = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
    if (!fs.existsSync(abs)) { missing.push(rel); continue; }
    const url = extractFirstArchiveUrl(abs);
    if (!url) { missing.push(rel); continue; }
    const idx = urlToRowIdx.get(url);
    if (idx == null) { missing.push(rel); continue; }
    const cols = csvSplit(rows[idx]);
    cols[4] = 'priority';
    rows[idx] = csvJoin(cols);
    updated++;
  }

  const out = [header].concat(rows).join('\n') + '\n';
  fs.writeFileSync(TRACKER, out, 'utf8');
  console.log(`Priority updated: ${updated}, Missing matches: ${missing.length}`);
  if (missing.length) {
    console.log('No tracker match for:');
    missing.slice(0,20).forEach(f => console.log('  -', f));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();

