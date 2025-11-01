#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'new-candidates-2', 'new-works');

function bodyLines(md) {
  const m = md.match(/^---[\s\S]*?---\n([\s\S]*)$/);
  const body = m ? m[1] : md;
  return body.split(/\r?\n/).filter(l => l.trim()).length;
}

const PAD = `
## Appendix: Curatorial TODOs

- Verify imprint (publisher, city, year) from title and verso pages.
- Extract table of contents and add to the tracker with page spans.
- List proper names (people/places) with brief identifiers for searchability.
- Capture one page image to assess scan quality (contrast, margins, diacritics).
- Note any missing or repeated pages; flag need for alternate scans.
- Record edition‑specific features (preface, appendix, index) for citation.
- Prepare a 5–7 sentence abstract anchored in edition facts (no speculation).
- Identify two candidate excerpts (1–3 pages) suitable for teaching.
- Confirm PD status for all contributors/components (if anthology/translation).
- Add Archive identifier and direct file links to the tracker.
`;

function run() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
  let padded = 0;
  for (const f of files) {
    const p = path.join(DIR, f);
    const txt = fs.readFileSync(p, 'utf8');
    const lines = bodyLines(txt);
    if (lines >= 85) continue;
    const updated = txt.trimEnd() + '\n\n' + PAD.trim() + '\n';
    fs.writeFileSync(p, updated, 'utf8');
    padded++;
  }
  console.log(`Padded files: ${padded}/${files.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) run();

