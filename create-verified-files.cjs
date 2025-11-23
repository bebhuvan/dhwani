const fs = require('fs');
const path = require('path');
const report = require('./verification-report.json');

const outputDir = './verified-works';

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Creating verified markdown files with improved descriptions...\n');

let created = 0;
let skipped = 0;

// Process verified works
for (const work of report.results.verified) {
  const filename = work.filename;
  const originalPath = path.join('./testing-batches', findOriginalFile(filename));

  if (!fs.existsSync(originalPath)) {
    console.log('⚠️  Original not found: ' + filename);
    skipped++;
    continue;
  }

  // Read original file
  const content = fs.readFileSync(originalPath, 'utf8');

  // Replace description if we have an improved one
  if (work.improvedDescription) {
    const updatedContent = updateDescription(content, work.improvedDescription);
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, updatedContent, 'utf8');
    created++;
    if (created <= 5 || created % 20 === 0) {
      console.log('✓ Created: ' + filename);
    }
  } else {
    // Copy original as-is
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, content, 'utf8');
    created++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Created ' + created + ' verified markdown files');
console.log('📁 Location: ' + path.resolve(outputDir));
console.log('='.repeat(60));

// Helper to find original file in batches
function findOriginalFile(filename) {
  for (let i = 1; i <= 8; i++) {
    const batchPath = 'batch-' + String(i).padStart(2, '0') + '/' + filename;
    if (fs.existsSync(path.join('./testing-batches', batchPath))) {
      return batchPath;
    }
  }
  return null;
}

// Helper to update description in frontmatter
function updateDescription(content, newDescription) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return content;

  const frontmatter = match[1];

  // Find and replace description
  const descPattern = /description:\s*\|[\s\S]*?(?=\n[a-zA-Z_]|\ncollections:)/;
  const updatedFrontmatter = frontmatter.replace(descPattern, 'description: |\n  ' + newDescription);

  return content.replace(match[1], updatedFrontmatter);
}
