// Test on a single work
const script = require('fs').readFileSync('./verify-testing-batches.cjs', 'utf8');
const modScript = script
  .replace('for (let i = 1; i <= 8; i++)', 'for (let i = 1; i <= 1; i++)')
  .replace(/\.filter\(f => f\.endsWith\('\.md'\) && !f\.includes\('MANIFEST'\)\)/g, 
    ".filter(f => f.endsWith('.md') && !f.includes('MANIFEST')).slice(0, 1)");

require('fs').writeFileSync('./test-temp.cjs', modScript);
require('child_process').execSync('node test-temp.cjs', { stdio: 'inherit' });
require('fs').unlinkSync('./test-temp.cjs');
