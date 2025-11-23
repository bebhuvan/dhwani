// Quick test of verification script on 3 works
const { execSync } = require('child_process');
const fs = require('fs');

// Get first 3 works from batch-01
const batch01 = './testing-batches/batch-01';
const files = fs.readdirSync(batch01)
  .filter(f => f.endsWith('.md') && !f.includes('MANIFEST'))
  .slice(0, 3);

console.log('Testing verification on 3 works:');
files.forEach((f, i) => console.log(`  ${i+1}. ${f}`));
console.log('\nStarting test...\n');

// Copy script and modify to only process these 3 files
const script = fs.readFileSync('./verify-testing-batches.cjs', 'utf8');
const modifiedScript = script.replace(
  'for (let i = 1; i <= 8; i++)',
  'for (let i = 1; i <= 1; i++)'
).replace(
  '.filter(f => f.endsWith(\'.md\') && !f.includes(\'MANIFEST\'))',
  '.filter(f => f.endsWith(\'.md\') && !f.includes(\'MANIFEST\')).slice(0, 3)'
);

fs.writeFileSync('./verify-test-temp.cjs', modifiedScript);
execSync('node verify-test-temp.cjs', { stdio: 'inherit' });
fs.unlinkSync('./verify-test-temp.cjs');
