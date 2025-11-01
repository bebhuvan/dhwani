#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const HOME = process.env.HOME || '/home/bhuvanesh';
const INPUT_DIR = path.join(HOME, 'new-candidates-4');
const CSV = path.join(HOME, 'Downloads', 'india_pd_2012_2022_master_with_search_links.csv');

function readCSVMap(csvPath) {
  const map = new Map();
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
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: {}, head: '', body: md };
  const head = m[0];
  const fmBlock = m[1];
  const fm = {};
  for (const line of fmBlock.split('\n')) {
    const idx = line.indexOf(':');
    if (idx > -1) fm[line.slice(0,idx).trim()] = line.slice(idx+1).trim();
  }
  const body = md.slice(head.length);
  return { fm, head, body };
}

function parseArray(val) {
  const m = (val||'').match(/\[(.*)\]/);
  if (!m) return [];
  return m[1].split(',').map(s => s.replace(/^\s*\"|\"\s*$/g,'').trim()).filter(Boolean);
}

function buildRefs(srcUrl, title, author, csvRec) {
  const authorKey = author[0] || '';
  const wikiSearch = csvRec?.wikiSearch || (authorKey ? `https://www.google.com/search?q=${encodeURIComponent('"'+authorKey+'" wikipedia')}` : '');
  const wikisourceSearch = csvRec?.wikisourceSearch || (authorKey ? `https://www.google.com/search?q=${encodeURIComponent('"'+authorKey+'" site:wikisource.org')}` : '');
  const olSearch = `https://openlibrary.org/search?q=${encodeURIComponent(`${title} ${authorKey}`.trim())}`;
  const pgSearch = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(authorKey)}`;
  const refs = [];
  if (srcUrl) refs.push({ name: 'Internet Archive', url: srcUrl, type: 'archive' });
  if (wikiSearch) refs.push({ name: `Wikipedia search: ${authorKey}`, url: wikiSearch, type: 'wikipedia' });
  if (wikisourceSearch) refs.push({ name: `Wikisource search: ${authorKey}`, url: wikisourceSearch, type: 'wikisource' });
  refs.push({ name: 'Open Library search', url: olSearch, type: 'openlibrary' });
  refs.push({ name: 'Project Gutenberg search', url: pgSearch, type: 'gutenberg' });
  const lines = ['references:'];
  for (const r of refs) {
    lines.push(`  - name: "${r.name}"`);
    lines.push(`    url: "${r.url}"`);
    lines.push(`    type: "${r.type}"`);
  }
  return lines.join('\n');
}

function replaceReferences(head, refsBlock) {
  // Remove existing references block
  head = head.replace(/\nreferences:[\s\S]*?(?=\n[A-Za-z_][\w-]*\s*:|\n---)/m, '\n');
  // Insert after sources block if present, else before closing ---
  if (/\nsources:\s*[\s\S]*?(?=\n[A-Za-z_][\w-]*\s*:|\n---)/m.test(head)) {
    return head.replace(/(\nsources:[\s\S]*?)(?=\n[A-Za-z_][\w-]*\s*:|\n---)/m, (m0, m1) => `${m1}\n${refsBlock}\n`);
  }
  return head.replace(/\n---\s*$/m, `\n${refsBlock}\n---`);
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
  // Remove any existing Rights/Rights Checklist blocks
  let cleaned = body.replace(/## Rights(?: Checklist)?[\s\S]*?(?=\n## |$)/gm, '');
  // Prefer to insert after About the Author or Overview
  const afterAuthor = /(## About the Author[\s\S]*?)(\n## |$)/m;
  if (afterAuthor.test(cleaned)) return cleaned.replace(afterAuthor, `$1\n\n${rights}\n$2`);
  const afterOverview = /(## Overview[\s\S]*?)(\n## |$)/m;
  if (afterOverview.test(cleaned)) return cleaned.replace(afterOverview, `$1\n\n${rights}\n$2`);
  return rights + '\n' + cleaned;
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
    const { fm, head, body } = parseFrontmatter(md);
    const title = (fm.title || '').replace(/\"/g,'').replace(/^\"|\"$/g,'');
    const author = parseArray(fm.author);
    const year = (fm.year || '').toString().match(/\d{4}/)?.[0] || '';
    const language = parseArray(fm.language);
    const srcUrlMatch = md.match(/\n\s*url:\s*\"(https?:\/\/[^\"]+)\"/);
    const srcUrl = srcUrlMatch ? srcUrlMatch[1] : '';
    const rec = csvMap.get(author[0] || '') || {};

    const refsBlock = buildRefs(srcUrl, title, author, rec);
    let newHead = replaceReferences(head, refsBlock);
    newHead = ensureDescription(newHead, title, author, year, language);

    const pdYearIndia = rec.pdYear || '';
    const indiaPD = !!pdYearIndia;
    const pubYear = parseInt(year || '0', 10);
    const usPD = pubYear && pubYear <= 1929;
    const newBody = injectRights(body, indiaPD, usPD, pdYearIndia);

    const out = `${newHead}${newBody}`;
    if (out !== md) {
      fs.writeFileSync(abs, out, 'utf8');
      changed++;
    }
  }
  console.log(`Enriched ${changed} files.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
