#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const REPORT = path.join(ROOT, 'verification-reports', 'pd-verification.json');
const NEW_DIR = path.join(ROOT, 'new-candidates-2', 'new-works');

function run(cmd) { execSync(cmd, { stdio: 'inherit', cwd: ROOT }); }

function main() {
  // Refresh PD report for all new works
  run('node verification-tools/pd-verifier.js new-candidates-2/new-works');

  if (!fs.existsSync(REPORT)) {
    console.error('PD report not found:', REPORT);
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  const all = report.all || [];
  const certain = all.filter(w => (w.certainty || '').toUpperCase() === 'CERTAIN');
  if (certain.length === 0) {
    console.log('No CERTAIN items to promote.');
    process.exit(0);
  }

  console.log(`Promoting ${certain.length} CERTAIN items...`);
  for (const item of certain) {
    const f = path.join(NEW_DIR, item.file);
    if (fs.existsSync(f)) {
      try {
        run(`node scripts/promote-candidate.js ${path.relative(ROOT, f)}`);
      } catch (e) {
        console.warn('Failed to promote:', item.file);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();

