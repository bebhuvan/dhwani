#!/usr/bin/env node
/**
 * Export a priority queue TSV from _tracker.csv
 * Picks rows where status == 'priority' and not 'duplicate-catalog'
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TRACKER = path.join(ROOT, 'new-candidates-2', '_tracker.csv');
const OUT = path.join(ROOT, 'verification-reports', 'priority-queue.tsv');

function csvSplit(line) {
  let q=false, cell=''; const cols=[];
  for (let i=0;i<line.length;i++){
    const ch=line[i];
    if (ch==='"') { if (q && line[i+1]==='"'){ cell+='"'; i++; } else q=!q; }
    else if (ch===',' && !q) { cols.push(cell); cell=''; }
    else cell+=ch;
  }
  cols.push(cell);
  return cols;
}

function main(){
  if (!fs.existsSync(TRACKER)) throw new Error('Tracker not found');
  const lines = fs.readFileSync(TRACKER,'utf8').split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  const rows = lines.map(csvSplit);
  const out = [['author','candidate_title','source_url','status']];
  for (const cols of rows) {
    const [author,, title, url, status] = cols;
    if (status === 'priority') {
      out.push([author, title, url.replace(/^\"|\"$/g,'') , status]);
    }
  }
  fs.writeFileSync(OUT, out.map(r=>r.join('\t')).join('\n'));
  console.log('Wrote', OUT, 'with', out.length-1, 'rows');
}

if (import.meta.url === `file://${process.argv[1]}`) main();

