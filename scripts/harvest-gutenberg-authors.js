#!/usr/bin/env node
/**
 * Harvest Project Gutenberg candidates by author list via Gutendex
 *
 * Reads authors from a CSV and queries Gutendex (public PG API mirror)
 * to find potential PD items. Appends unique findings into
 * new-candidates-2/_tracker.csv.
 *
 * Usage:
 *   node scripts/harvest-gutenberg-authors.js <path-to-authors-csv> [--perAuthor 15]
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TRACKER = path.join(ROOT, 'new-candidates-2', '_tracker.csv');

function parseArgs(argv) {
  const args = { csv: null, perAuthor: 15 };
  const a = argv.slice(2);
  for (let i=0;i<a.length;i++) {
    if (!args.csv && !a[i].startsWith('--')) args.csv = a[i];
    else if (a[i] === '--perAuthor') args.perAuthor = parseInt(a[++i]||'15',10);
  }
  return args;
}

function csvParse(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    let q=false, cell=''; const cols=[];
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch==='"') { if (q && line[i+1]==='"') { cell+='"'; i++; } else q=!q; }
      else if (ch===',' && !q) { cols.push(cell); cell=''; }
      else cell+=ch;
    }
    cols.push(cell);
    const obj={}; headers.forEach((h,idx)=>obj[h]= (cols[idx]||'').trim());
    return obj;
  });
}

function readAuthors(csvPath) {
  const abs = path.isAbsolute(csvPath) ? csvPath : path.join(ROOT, '..', path.basename(csvPath));
  if (!fs.existsSync(abs)) throw new Error('CSV not found: '+abs);
  const rows = csvParse(fs.readFileSync(abs, 'utf8'));
  return Array.from(new Set(rows.map(r => r.Author || r.author).filter(Boolean)));
}

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'DhwaniHarvester/1.0' } }, res => {
      let data='';
      res.on('data', c => data+=c);
      res.on('end', () => { try{ resolve(JSON.parse(data)); } catch(e){ reject(e);} });
    }).on('error', reject);
  });
}

function trackerReadUrls() {
  if (!fs.existsSync(TRACKER)) return new Set();
  const lines = fs.readFileSync(TRACKER, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
  return new Set(lines.map(l => (l.split(',')[3]||'').replace(/^\"|\"$/g,'')));
}

function csvEsc(s) {
  const v = String(s??'');
  return v.includes(',') || v.includes('"') || v.includes('\n') ? '"'+v.replace(/"/g,'""')+'"' : v;
}

function appendRows(rows) {
  fs.appendFileSync(TRACKER, '\n'+rows.map(r => r.join(',')).join('\n')+'\n', 'utf8');
}

async function harvest(author, perAuthor) {
  const q = encodeURIComponent(author);
  const url = `https://gutendex.com/books?search=${q}`;
  const json = await request(url);
  const results = json?.results || [];
  return results.slice(0, perAuthor).map(b => ({
    id: b.id,
    title: b.title,
    authors: (b.authors||[]).map(a => a.name).join('; '),
    languages: b.languages || [],
    url: `https://www.gutenberg.org/ebooks/${b.id}`
  }));
}

async function main() {
  const { csv, perAuthor } = parseArgs(process.argv);
  if (!csv) {
    console.error('Usage: node scripts/harvest-gutenberg-authors.js <path-to-authors-csv> [--perAuthor 15]');
    process.exit(1);
  }
  const authors = readAuthors(csv);
  const seen = trackerReadUrls();
  const out = [];

  for (const a of authors) {
    try {
      const hits = await harvest(a, perAuthor);
      for (const h of hits) {
        if (seen.has(h.url)) continue;
        seen.add(h.url);
        const notes = `Gutenberg candidates | Language: ${h.languages.join('/')}`;
        out.push([
          csvEsc(a), '', csvEsc(h.title), csvEsc(h.url), 'queued', '', csvEsc(notes)
        ]);
      }
    } catch (e) {
      // ignore errors per author
    }
    await new Promise(r => setTimeout(r, 500));
  }

  if (out.length) appendRows(out);
  console.log(`Gutenberg harvest appended: ${out.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

