#!/usr/bin/env node
/**
 * Seed Research From CSV
 *
 * Reads a CSV of Indian PD authors and creates/updates structured
 * research briefs under new-candidates-2/research/<slug>.md
 *
 * Input CSV columns (minimum):
 *   Author,PD_Year_India,Wikipedia_Search_URL,Wikisource_Search_URL,Notes
 *
 * Optional: can also ingest additional columns if present.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PROJECT_ROOT = path.resolve(ROOT, '..');
const RESEARCH_DIR = path.join(PROJECT_ROOT, 'new-candidates-2', 'research');
const TRACKER_PATH = path.join(PROJECT_ROOT, 'new-candidates-2', '_tracker.csv');

// Basic CSV parser (no external deps)
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current);
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = (cols[idx] || '').trim()));
    return obj;
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s'-]/gu, '')
    .replace(/['’`]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readTrackerAuthors() {
  if (!fs.existsSync(TRACKER_PATH)) return new Set();
  const text = fs.readFileSync(TRACKER_PATH, 'utf8');
  const lines = text.split(/\r?\n/).slice(1); // skip header
  const authors = new Set();
  for (const line of lines) {
    if (!line.trim()) continue;
    const author = line.split(',')[0]?.trim();
    if (author) authors.add(author);
  }
  return authors;
}

function buildArchiveSearch(author) {
  const q = encodeURIComponent(`(creator:(\"${author}\") OR title:(\"${author}\")) AND mediatype:texts`);
  return `https://archive.org/search.php?query=${q}`;
}

function buildGutenbergSearch(author) {
  const q = encodeURIComponent(author);
  return `https://www.gutenberg.org/ebooks/search/?query=${q}`;
}

function buildOpenLibrarySearch(author) {
  const q = encodeURIComponent(author);
  return `https://openlibrary.org/search?q=${q}&mode=everything&author_key=`;
}

function buildGoogleBooksSearch(author) {
  const q = encodeURIComponent(`${author} site:books.google.com`);
  return `https://www.google.com/search?q=${q}`;
}

function buildDLIProxySearch(author) {
  // DLI mirrors often surfaced via archive.org; provide a general query
  const q = encodeURIComponent(`${author} DLI scan site:archive.org`);
  return `https://www.google.com/search?q=${q}`;
}

function researchTemplate({ author, pdYear, wikiUrl, wikisourceUrl, notes }) {
  const archiveUrl = buildArchiveSearch(author);
  const gutenbergUrl = buildGutenbergSearch(author);
  const openLibraryUrl = buildOpenLibrarySearch(author);
  const googleBooksUrl = buildGoogleBooksSearch(author);
  const dliUrl = buildDLIProxySearch(author);

  return `# Research Brief — ${author}

PD Year (India): ${pdYear || 'UNKNOWN'}

## Primary Search Links
- Wikipedia: ${wikiUrl || 'N/A'}
- Wikisource: ${wikisourceUrl || 'N/A'}
- Archive.org: ${archiveUrl}
- Project Gutenberg: ${gutenbergUrl}
- Open Library: ${openLibraryUrl}
- Google Books (broad): ${googleBooksUrl}
- DLI via Archive mirrors: ${dliUrl}

## Candidate Discovery (SourceScout)
- [ ] List 3–10 candidate items with exact edition details (title, year, publisher)
- [ ] Prefer Indian languages (Bengali, Hindi, Tamil, Telugu, Urdu, Assamese, etc.) and English if authored by Indian writers
- [ ] Capture permanent links (Archive.org identifier, Gutenberg ebook ID)
- [ ] Note translation/edition relationships (translator, editor, revised editions)

| Title | Year | Edition/Publisher | Language | URL | Notes |
|---|---|---|---|---|---|

## Rights Verification (RightsVerifier)
- [ ] Confirm author’s death year from 2+ sources (Wikidata, national biographies)
- [ ] India PD rule: 60 years after death (literary, dramatic, musical, artistic)
- [ ] Translator/editor rights: translation PD windows apply to translator death
- [ ] Government/IGNCA items: check specific PD clauses
- [ ] US PD note: pre-1929 generally safe for US-hosted mirrors (Gutenberg)

Evidence:
- Sources for death year:
- Edition imprint scan (title page, verso) confirming year/publisher:

## Duplicate Screening (DuplicateScreener)
- [ ] Run duplicate check against existing catalog
  - Command: \`npm run dup:check:new\`
- [ ] Normalize transliterations and aliases in title/author when checking
- [ ] Treat distinct translations as distinct works; same edition = duplicate

Potential conflicts found:

## Metadata Draft (MetadataCrafter)
- [ ] Draft YAML frontmatter with: title, author[], year, language[], genre[], collections[], sources[], references[], tags[], publishDate
- [ ] Prepare sections: Overview, About the Author, Historical Context, The Work, Significance, Editions & Sources
- [ ] Avoid generic boilerplate; anchor claims to verifiable facts

## Checkpoints (QACloser)
- [ ] PD verification pass (\`npm run pd:verify:new\`)
- [ ] Checkpoint validation pass (\`npm run validate:new\`)
- [ ] Archive URL validation (\`npm run archive:validate:new\`, requires network)

## Notes
${notes || ''}
`;
}

function upsertResearchBrief(row, existingAuthors) {
  const author = row.Author || row.author || '';
  if (!author) return { skipped: true, reason: 'Missing author' };

  const slug = slugify(author);
  const filePath = path.join(RESEARCH_DIR, `${slug}.md`);
  const pdYear = row.PD_Year_India || row.pd_year || '';
  const wikiUrl = row.Wikipedia_Search_URL || '';
  const wikisourceUrl = row.Wikisource_Search_URL || '';
  const notes = row.Notes || '';

  // If file exists, do not overwrite; user may have populated it
  if (fs.existsSync(filePath)) {
    return { skipped: true, reason: 'Exists', filePath };
  }

  const content = researchTemplate({ author, pdYear, wikiUrl, wikisourceUrl, notes });
  fs.writeFileSync(filePath, content, 'utf8');
  return { created: true, filePath };
}

function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: node scripts/seed-research-from-csv.js <path-to-csv>');
    process.exit(1);
  }

  const absCsvPath = path.isAbsolute(csvPath)
    ? csvPath
    : path.join(process.cwd(), csvPath);

  if (!fs.existsSync(absCsvPath)) {
    console.error(`CSV not found: ${absCsvPath}`);
    process.exit(1);
  }

  ensureDir(RESEARCH_DIR);

  const text = fs.readFileSync(absCsvPath, 'utf8');
  const rows = parseCSV(text);
  if (rows.length === 0) {
    console.error('No rows parsed from CSV.');
    process.exit(1);
  }

  const existingAuthors = readTrackerAuthors();
  const results = [];

  rows.forEach((row, idx) => {
    const res = upsertResearchBrief(row, existingAuthors);
    results.push({ idx: idx + 1, author: row.Author || row.author, ...res });
  });

  const created = results.filter(r => r.created);
  const skipped = results.filter(r => r.skipped);

  console.log(`Seed complete. Created: ${created.length}, Skipped: ${skipped.length}`);
  if (created.length) {
    created.slice(0, 10).forEach(r => console.log(`  + ${r.author} -> ${r.filePath}`));
  }
  if (skipped.length) {
    const reasons = skipped.reduce((acc, r) => {
      acc[r.reason] = (acc[r.reason] || 0) + 1;
      return acc;
    }, {});
    console.log('Skipped breakdown:', reasons);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

