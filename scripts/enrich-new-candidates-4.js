#!/usr/bin/env node
/**
 * Enrich MD drafts in ~/new-candidates-4 with references and rights notes
 * - Adds reference links (Wikipedia/Wikisource/Open Library/Gutenberg searches)
 * - Computes PD flags for India (from CSV PD year) and US (<=1929 heuristic)
 * - Inserts a concise, factual description if missing
 */

import fs from 'fs';
import path from 'path';

const HOME = process.env.HOME || '/home/bhuvanesh';
const INPUT_DIR = path.join(HOME, 'new-candidates-4');
const CSV = path.join(HOME, 'Downloads', 'india_pd_2012_2022_master_with_search_links.csv');

function readCSVMap(csvPath) {
  const map = new Map(); // author -> { pdYear, wikiSearch, wikisourceSearch }
  if (!fs.existsSync(csvPath)) return map;
  const [header, ...lines] = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const heads = header.split(',').map(h => h.trim());
  for (const line of lines) {
    let inQ=false, cell=''; const cols=[];
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (ch==='"') { inQ=!inQ; continue; }
      if (ch===',' && !inQ) { cols.push(cell); cell=''; }
      else cell+=ch;
    }
    cols.push(cell);
    const row={}; heads.forEach((h,idx)=>row[h]= (cols[idx]||'').trim());
    const author = row.Author || row.author;
    if (!author) continue;
    map.set(author, {
      pdYear: row.PD_Year_India || '',
      wikiSearch: row.Wikipedia_Search_URL || '',
      wikisourceSearch: row.Wikisource_Search_URL || ''
    });
  }
  return map;
}

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\s\S]*?)\n---/);
  if (!m) return { fm: {}, body: md, raw: md, head: '', tail: md };
  const head = m[0];
  const fmBlock = m[1];
  const tail = md.slice(head.length);
  const fm = {};
  for (const line of fmBlock.split('\n')) {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx+1).trim();
      fm[key] = val;
    }
  }
  return { fm, body: tail, raw: md, head, tail };
}

function parseArrayField(val) {
  if (!val) return [];
  const m = val.match(/\[(.*)\]/);
  if (!m) return [];
  const inner = m[1];
  return inner.split(',').map(s => s.replace(/^\s*\"|\"\s*$/g,'').trim()).filter(Boolean);
}

function upsertReferences(head, refs) {
  // Insert references: block into YAML frontmatter under `references:`
  if (!/\nreferences:\s*\n/.test(head)) {
    // add an empty references list if missing
    head = head.replace(/\n---\s*$/m, '\nreferences:\n\n---');
  }
  // Build YAML refs block
  const lines = ['references:'];
  for (const r of refs) {
    lines.push(`  - name: "${r.name}"`);
    lines.push(`    url: "${r.url}"`);
    lines.push(`    type: "${r.type}"`);
  }
  // Replace existing references block
  head = head.replace(/references:[\s\S]*?(?=\n\w|\n---)/m, lines.join('\n'));
  return head;
}

function ensureDescription(head, title, author, year, language) {
  if (/\ndescription:\s*\"[^\"]+\"/.test(head)) return head;
  const desc = `${title}${year?` (${year})`:''} is a ${language?.[0]||'Unknown language'} work by ${author.join(', ')}. This entry records the digitized edition at the listed source; imprint details (publisher, city) should be confirmed from the scan.`;
  return head.replace(/\ncollections:[\s\S]*?\n/, m => `\ndescription: "${desc}"\n`+m);
}

function injectRights(body, indiaPD, usPD, pdYear) {
  const rights = [
    '## Rights',
    '',
    `- India PD: ${indiaPD ? 'Yes' : 'No'}${pdYear?` (PD year: ${pdYear})`:''}`,
    `- US PD: ${usPD ? 'Yes' : 'No'} (heuristic: publication year ${usPD?'<=':'>'} 1929)`,
    '',
  ].join('\n');

  if (/## Rights Checklist/.test(body)) {
    return body.replace(/## Rights Checklist[\s\S]*?(?=\n## |$)/m, rights + '\n');
  }
  if (!/## Rights\b/.test(body)) {
    // Insert after Overview block if present
    const re = /(## Overview[\s\S]*?)(\n## |$)/m;
    if (re.test(body)) return body.replace(re, `$1\n\n${rights}\n$2`);
    return rights + '\n' + body;
  }
  return body;
}

function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error('Input dir not found:', INPUT_DIR);
    process.exit(1);
  }
  const csvMap = readCSVMap(CSV);
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.md'));
  let changed = 0;
  for (const f of files) {
    const abs = path.join(INPUT_DIR, f);
    const md = fs.readFileSync(abs, 'utf8');
    const { fm, head, tail } = parseFrontmatter(md);
    const title = (fm.title || '').replace(/\"/g,'').replace(/^\"|\"$/g,'');
    const author = parseArrayField(fm.author);
    const year = (fm.year || '').toString().match(/\d{4}/)?.[0] || '';
    const langs = parseArrayField(fm.language);
    // Extract first source URL from YAML
    const srcUrlMatch = md.match(/\n\s*url:\s*\"(https?:\/\/[^\"]+)\"/);
    const srcUrl = srcUrlMatch ? srcUrlMatch[1] : '';

    // Build references
    const authorKey = author[0] || '';
    const rec = csvMap.get(authorKey) || {};
    const wikiSearch = rec.wikiSearch || (authorKey ? `https://www.google.com/search?q=${encodeURIComponent('"'+authorKey+'" wikipedia')}` : '');
    const wikisourceSearch = rec.wikisourceSearch || (authorKey ? `https://www.google.com/search?q=${encodeURIComponent('"'+authorKey+'" site:wikisource.org')}` : '');
    const olSearch = `https://openlibrary.org/search?q=${encodeURIComponent(`${title} ${authorKey}`.trim())}`;
    const pgSearch = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(authorKey)}`;
    const refs = [];
    if (srcUrl) refs.push({ name: 'Internet Archive', url: srcUrl, type: 'archive' });
    if (wikiSearch) refs.push({ name: `Wikipedia search: ${authorKey}`, url: wikiSearch, type: 'wikipedia' });
    if (wikisourceSearch) refs.push({ name: `Wikisource search: ${authorKey}`, url: wikisourceSearch, type: 'wikisource' });
    refs.push({ name: 'Open Library search', url: olSearch, type: 'openlibrary' });
    refs.push({ name: 'Project Gutenberg search', url: pgSearch, type: 'gutenberg' });

    let newHead = upsertReferences(head, refs);
    newHead = ensureDescription(newHead, title, author, year, langs);

    // Rights calc
    const pdYearIndia = rec.pdYear || '';
    const indiaPD = !!pdYearIndia; // author listed in CSV implies PD in India with that PD year
    const pubYear = parseInt(year || '0', 10);
    const usPD = pubYear && pubYear <= 1929;
    const newBody = injectRights(tail, indiaPD, usPD, pdYearIndia);

    const out = `${newHead}${newBody}`;
    if (out !== md) {
      fs.writeFileSync(abs, out, 'utf8');
      changed++;
    }
  }
  console.log(`Enriched ${changed} files in ${INPUT_DIR}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

