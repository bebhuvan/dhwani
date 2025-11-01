#!/usr/bin/env node
/**
 * Promote Candidate
 *
 * Moves a validated Markdown from new-candidates-2/ into src/content/works/
 * while ensuring slug uniqueness and minimal normalization.
 *
 * Usage:
 *   node scripts/promote-candidate.js new-candidates-2/<file>.md
 */

import fs from 'fs';
import path from 'path';

const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(SCRIPTS_DIR, '..'); // project root: new-dhwani
const CANDIDATES_DIR = path.join(ROOT, 'new-candidates-2');
const WORKS_DIR = path.join(ROOT, 'src', 'content', 'works');

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    // strip non-ASCII after normalization to keep slugs consistent
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractTitle(content) {
  const match = content.match(/^title:\s*"([^"]+)"/m);
  return match ? match[1] : null;
}

function ensureUniqueSlug(basename) {
  let final = basename;
  let i = 2;
  while (fs.existsSync(path.join(WORKS_DIR, final + '.md'))) {
    final = `${basename}-${i++}`;
  }
  return final;
}

function main() {
  const relPath = process.argv[2];
  if (!relPath) {
    console.error('Usage: node scripts/promote-candidate.js new-candidates-2/<file>.md');
    process.exit(1);
  }

  const absPath = path.isAbsolute(relPath) ? relPath : path.join(ROOT, relPath);
  if (!absPath.startsWith(CANDIDATES_DIR)) {
    console.error('Error: input must be under new-candidates-2/');
    process.exit(1);
  }
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(absPath, 'utf8');
  const title = extractTitle(content);
  if (!title) {
    console.error('Frontmatter title is required to derive slug.');
    process.exit(1);
  }

  const baseSlug = slugify(title);
  const uniqueSlug = ensureUniqueSlug(baseSlug);
  const destPath = path.join(WORKS_DIR, uniqueSlug + '.md');

  // Safety: light validation — ensure frontmatter delimiters exist
  if (!/^---[\s\S]*?---/m.test(content)) {
    console.error('File appears to be missing valid frontmatter (---). Aborting.');
    process.exit(1);
  }

  // Move
  fs.copyFileSync(absPath, destPath);
  console.log(`Promoted: ${relPath} -> src/content/works/${uniqueSlug}.md`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
