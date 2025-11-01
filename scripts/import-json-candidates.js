#!/usr/bin/env node
/**
 * Import JSON Candidate Works into _tracker.csv
 *
 * Usage:
 *   node scripts/import-json-candidates.js <json> [<json> ...]
 *
 * Each JSON file should be an array of objects with at least:
 *   - title (string)
 *   - author (string | string[])
 *   - year (number|string, optional)
 *   - archive_url (string)
 *   - description/notes (optional)
 *
 * Appends unique rows to new-candidates-2/_tracker.csv with columns:
 *   author,pd_year,candidate_title,source_url,status,reviewer,notes
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TRACKER = path.join(ROOT, 'new-candidates-2', '_tracker.csv');

function csvEscape(value) {
  const s = String(value ?? '');
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function readTracker() {
  if (!fs.existsSync(TRACKER)) {
    const header = 'author,pd_year,candidate_title,source_url,status,reviewer,notes\n';
    fs.writeFileSync(TRACKER, header, 'utf8');
  }
  const text = fs.readFileSync(TRACKER, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  const rows = lines.map(line => {
    // very simple split accepting quoted commas
    const cols = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // toggle or escape within quotes
        if (q && line[i+1] === '"') { cur += '"'; i++; }
        else { q = !q; }
      } else if (ch === ',' && !q) {
        cols.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    return {
      author: cols[0] || '',
      pd_year: cols[1] || '',
      candidate_title: cols[2] || '',
      source_url: cols[3] || '',
      status: cols[4] || '',
      reviewer: cols[5] || '',
      notes: cols[6] || ''
    };
  });
  return { header, rows };
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, '')
    .replace(/\s+/g, ' ') 
    .trim();
}

function buildKey(author, title, url) {
  if (url) return 'url:' + url.trim();
  return 'at:' + normalize(author) + '|' + normalize(title);
}

function asAuthorString(a) {
  if (Array.isArray(a)) return a.join('; ').trim();
  return String(a || '').trim();
}

function asNotes(obj) {
  const parts = [];
  if (obj.description) parts.push(String(obj.description));
  if (obj.notes) parts.push(String(obj.notes));
  // truncate overly long notes
  const note = parts.join(' ').replace(/\s+/g, ' ').trim();
  return note.length > 800 ? note.slice(0, 780) + '…' : note;
}

function toTrackerRow(obj) {
  const author = asAuthorString(obj.author);
  const year = obj.year ? String(obj.year).match(/\d{4}/)?.[0] : '';
  const title = String(obj.title || '').trim();
  const candidate = year ? `${title} (${year})` : title;
  const url = obj.archive_url || obj.archiveUrl || obj.url || '';
  const status = 'queued';
  const reviewer = '';
  const notes = asNotes(obj);
  // pd_year left blank; can be enriched later by RightsVerifier

  return {
    author,
    pd_year: '',
    candidate_title: candidate,
    source_url: url,
    status,
    reviewer,
    notes
  };
}

function rowToCsv(r) {
  return [
    csvEscape(r.author),
    csvEscape(r.pd_year),
    csvEscape(r.candidate_title),
    csvEscape(r.source_url),
    csvEscape(r.status),
    csvEscape(r.reviewer),
    csvEscape(r.notes)
  ].join(',');
}

function main() {
  const jsonPaths = process.argv.slice(2);
  if (jsonPaths.length === 0) {
    console.error('Usage: node scripts/import-json-candidates.js <json> [<json> ...]');
    process.exit(1);
  }

  const { header, rows } = readTracker();
  const existingKeys = new Set(rows.map(r => buildKey(r.author, r.candidate_title, r.source_url)));

  let added = 0, skipped = 0;
  const appended = [];

  for (const p of jsonPaths) {
    const abs = path.isAbsolute(p) ? p : path.join(ROOT, '..', path.basename(p));
    if (!fs.existsSync(abs)) {
      console.warn('Skipping missing file:', p);
      continue;
    }
    let data;
    try {
      data = JSON.parse(fs.readFileSync(abs, 'utf8'));
    } catch (e) {
      console.warn('Failed to parse JSON:', p, e.message);
      continue;
    }
    if (!Array.isArray(data)) {
      console.warn('JSON is not an array:', p);
      continue;
    }
    for (const obj of data) {
      if (!obj || !obj.title || !obj.archive_url) { skipped++; continue; }
      const r = toTrackerRow(obj);
      const key = buildKey(r.author, r.candidate_title, r.source_url);
      if (existingKeys.has(key)) { skipped++; continue; }
      existingKeys.add(key);
      appended.push(r);
      added++;
    }
  }

  if (added > 0) {
    const out = [''].concat(appended.map(rowToCsv)).join('\n');
    fs.appendFileSync(TRACKER, out + '\n', 'utf8');
  }

  console.log(`Import complete. Added: ${added}, Skipped: ${skipped}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

