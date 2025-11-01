#!/usr/bin/env node
/**
 * Harvest Archive.org candidates by author list
 *
 * Reads authors from a CSV (first column Author) and queries
 * Internet Archive Advanced Search across preferred collections
 * for mediatype=texts with publication year <= 1961.
 *
 * Appends unique findings into new-candidates-2/_tracker.csv.
 *
 * Usage:
 *   node scripts/harvest-archive-authors.js <path-to-authors-csv> [--rows 80] [--perAuthor 25]
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TRACKER = path.join(ROOT, 'new-candidates-2', '_tracker.csv');

const PREFERRED_COLLECTIONS = [
  'digitallibraryindia',
  'university_of_california_libraries',
  'university_of_toronto',
  'cornell',
  'in.gov.ignca',
  'asiarchive' // Archaeological Survey mirrors
];

const FIELDS = [
  'identifier','title','creator','date','year','language','publisher','collection','subject'
];

function parseArgs(argv) {
  const args = { rows: 80, perAuthor: 25, csv: null };
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (!args.csv && !a[i].startsWith('--')) args.csv = a[i];
    else if (a[i] === '--rows') args.rows = parseInt(a[++i] || '80', 10);
    else if (a[i] === '--perAuthor') args.perAuthor = parseInt(a[++i] || '25', 10);
  }
  return args;
}

function csvParse(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
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
    const obj={};
    headers.forEach((h,idx)=>obj[h]= (cols[idx]||'').trim());
    return obj;
  });
}

function readAuthors(csvPath) {
  const abs = path.isAbsolute(csvPath) ? csvPath : path.join(ROOT, '..', path.basename(csvPath));
  if (!fs.existsSync(abs)) throw new Error('CSV not found: '+abs);
  const rows = csvParse(fs.readFileSync(abs, 'utf8'));
  // Accept either Author or author
  const names = rows.map(r => r.Author || r.author).filter(Boolean);
  return Array.from(new Set(names));
}

function buildQuery(author) {
  const quoted = `\"${author}\"`;
  const coll = PREFERRED_COLLECTIONS.map(c => `collection:${c}`).join(' OR ');
  const base = `mediatype:texts AND (${coll}) AND (creator:(${quoted}) OR title:(${quoted}))`;
  const cutoff = `(date:[* TO 1961] OR year:[* TO 1961] OR NOT date:*)`;
  return `${base} AND ${cutoff}`;
}

function iaRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'DhwaniHarvester/1.0' }}, (res) => {
      let data='';
      res.on('data', c=>data+=c);
      res.on('end', ()=>{
        try { resolve(JSON.parse(data)); }
        catch(e){ reject(new Error('Bad JSON from IA')); }
      });
    }).on('error', reject);
  });
}

function parseYear(obj) {
  const s = String(obj.year || obj.date || '').match(/\d{4}/);
  return s ? parseInt(s[0], 10) : '';
}

function parseLanguage(l) {
  const s = (Array.isArray(l)? l.join(','): (l||'')).toLowerCase();
  const map = { eng:'English', hin:'Hindi', ben:'Bengali', tam:'Tamil', tel:'Telugu', kan:'Kannada', mar:'Marathi', guj:'Gujarati', pan:'Punjabi', san:'Sanskrit', mal:'Malayalam', urd:'Urdu' };
  const langs = new Set();
  Object.entries(map).forEach(([k,v])=>{ if (s.includes(k) || s.includes(v.toLowerCase())) langs.add(v); });
  return Array.from(langs);
}

function trackerRead() {
  if (!fs.existsSync(TRACKER)) return { header:'author,pd_year,candidate_title,source_url,status,reviewer,notes', rows:[] };
  const text = fs.readFileSync(TRACKER, 'utf8');
  const [header, ...lines] = text.split(/\r?\n/);
  const rows = lines.filter(Boolean).map(l => l.split(','));
  const urls = new Set(rows.map(cols => (cols[3]||'').replace(/^\"|\"$/g,'')));
  return { header, rows, urls };
}

function trackerAppend(rows) {
  const lines = rows.map(r => r.join(','));
  fs.appendFileSync(TRACKER, '\n'+lines.join('\n')+'\n', 'utf8');
}

function csvEsc(s) {
  const v = String(s??'');
  return v.includes(',') || v.includes('"') || v.includes('\n') ? '"'+v.replace(/"/g,'""')+'"' : v;
}

async function harvestAuthor(author, perAuthor) {
  const q = encodeURIComponent(buildQuery(author));
  const fields = encodeURIComponent(FIELDS.join(','));
  const url = `https://archive.org/advancedsearch.php?q=${q}&output=json&rows=${perAuthor}&page=1&fields=${fields}`;
  const json = await iaRequest(url);
  const docs = json?.response?.docs || [];
  return docs.map(d => ({
    identifier: d.identifier,
    title: d.title || '',
    author: Array.isArray(d.creator) ? d.creator.join('; ') : (d.creator || author),
    year: parseYear(d),
    language: parseLanguage(d.language),
    publisher: Array.isArray(d.publisher) ? d.publisher[0] : (d.publisher || ''),
    url: `https://archive.org/details/${d.identifier}`
  }));
}

async function main() {
  const { csv, rows, perAuthor } = parseArgs(process.argv);
  if (!csv) {
    console.error('Usage: node scripts/harvest-archive-authors.js <path-to-authors-csv> [--rows 80] [--perAuthor 25]');
    process.exit(1);
  }

  const authors = readAuthors(csv);
  const tracker = trackerRead();
  const seenUrls = tracker.urls || new Set();
  const appended = [];

  let processed = 0;
  for (const author of authors) {
    processed++;
    try {
      const hits = await harvestAuthor(author, perAuthor);
      for (const h of hits) {
        if (!h.url || seenUrls.has(h.url)) continue;
        seenUrls.add(h.url);
        const candidateTitle = h.year ? `${h.title} (${h.year})` : h.title;
        const notes = [`Language: ${h.language.join('/')||'Unknown'}`, h.publisher?`Publisher: ${h.publisher}`:'', `Collection: IA`]
          .filter(Boolean).join(' | ');
        appended.push([
          csvEsc(author), '', csvEsc(candidateTitle), csvEsc(h.url), 'queued', '', csvEsc(notes)
        ]);
      }
    } catch (e) {
      // continue on errors, minimal logging
    }
    // polite pacing
    await new Promise(r => setTimeout(r, 700));
  }

  if (appended.length) trackerAppend(appended);
  console.log(`Harvested authors: ${authors.length}, appended rows: ${appended.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

