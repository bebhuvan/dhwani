#!/usr/bin/env node
/**
 * Mark duplicates in _tracker.csv from duplicate-detection.json
 *
 * For each duplicate new work, extract its first source URL and
 * set the corresponding tracker row status to 'duplicate-catalog'.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const REPORT = path.join(ROOT, 'verification-reports', 'duplicate-detection.json');
const TRACKER = path.join(ROOT, 'new-candidates-2', '_tracker.csv');
const NEW_WORKS_DIR = path.join(ROOT, 'new-candidates-2', 'new-works');

function csvSplit(line) {
  let q=false, cell=''; const cols=[];
  for (let i=0; i<line.length; i++){
    const ch=line[i];
    if (ch==='"') {
      if (q && line[i+1]==='"'){ cell+='"'; i++; }
      else q=!q;
    } else if (ch===',' && !q) { cols.push(cell); cell=''; }
    else cell+=ch;
  }
  cols.push(cell);
  return cols;
}

function csvJoin(cols) {
  return cols.map(v=>{
    const s=String(v??'');
    return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(',');
}

function readTracker() {
  if (!fs.existsSync(TRACKER)) throw new Error('Tracker not found: '+TRACKER);
  const text = fs.readFileSync(TRACKER, 'utf8');
  const lines = text.split(/\r?\n/);
  const header = lines.shift();
  const rows = lines.filter(Boolean);
  return { header, rows };
}

function extractFirstUrl(mdPath) {
  const txt = fs.readFileSync(mdPath, 'utf8');
  const m = txt.match(/\n\s*url:\s*"(https?:\/\/[^\"]+)"/);
  return m ? m[1] : null;
}

function main() {
  if (!fs.existsSync(REPORT)) {
    console.error('Duplicate report not found:', REPORT);
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  const duplicates = (report.all || []).map(d => d.newWork);
  const uniqueFiles = Array.from(new Set(duplicates));

  const { header, rows } = readTracker();
  // Build map url -> row indices
  const urlToIdx = new Map();
  rows.forEach((line, idx) => {
    const cols = csvSplit(line);
    const url = (cols[3]||'').replace(/^\"|\"$/g,'');
    if (url) { if (!urlToIdx.has(url)) urlToIdx.set(url, []); urlToIdx.get(url).push(idx); }
  });

  let marked = 0, unresolved = [];
  for (const file of uniqueFiles) {
    const mdPath = path.join(NEW_WORKS_DIR, file);
    if (!fs.existsSync(mdPath)) { unresolved.push({file, reason:'MD missing'}); continue; }
    const url = extractFirstUrl(mdPath);
    if (!url) { unresolved.push({file, reason:'No URL in MD'}); continue; }
    const hit = urlToIdx.get(url);
    if (!hit || hit.length === 0) { unresolved.push({file, reason:'No tracker row for URL'}); continue; }
    for (const idx of hit) {
      const cols = csvSplit(rows[idx]);
      cols[4] = 'duplicate-catalog';
      rows[idx] = csvJoin(cols);
      marked++;
    }
  }

  fs.writeFileSync(TRACKER, [header].concat(rows).join('\n')+'\n', 'utf8');
  console.log(`Marked duplicates in tracker: ${marked}`);
  if (unresolved.length) {
    console.log('Unresolved:');
    unresolved.slice(0,30).forEach(u => console.log(`  - ${u.file}: ${u.reason}`));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();

