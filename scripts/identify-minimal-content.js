import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const worksDir = path.join(__dirname, '../src/content/works');

// Read all markdown files
const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));

const minimalWorks = [];
const worksWithContent = [];

files.forEach(file => {
  const filePath = path.join(worksDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split into frontmatter and body
  const parts = content.split('---');

  if (parts.length >= 3) {
    const frontmatter = parts[1];
    const body = parts.slice(2).join('---').trim();

    // Count lines in body
    const bodyLines = body.split('\n').filter(line => line.trim()).length;

    // Check if body is minimal or has fallback content
    const hasFallbackContent = body.includes('A significant work from') ||
                               body.includes('representing an important contribution');
    const isMinimal = bodyLines < 5 || hasFallbackContent;

    const entry = {
      file,
      bodyLines,
      hasFallback: hasFallbackContent,
      isMinimal
    };

    if (isMinimal) {
      minimalWorks.push(entry);
    } else {
      worksWithContent.push(entry);
    }
  }
});

console.log('\n=== CONTENT STATUS REPORT ===\n');
console.log(`Total works: ${files.length}`);
console.log(`Works with substantial content: ${worksWithContent.length}`);
console.log(`Works with minimal/fallback content: ${minimalWorks.length}`);
console.log(`Completion rate: ${((worksWithContent.length / files.length) * 100).toFixed(1)}%`);

console.log('\n=== WORKS NEEDING CONTENT ===\n');
minimalWorks
  .sort((a, b) => a.file.localeCompare(b.file))
  .forEach((work, idx) => {
    console.log(`${idx + 1}. ${work.file} (${work.bodyLines} lines${work.hasFallback ? ', fallback' : ''})`);
  });

// Save to file
const report = {
  timestamp: new Date().toISOString(),
  total: files.length,
  withContent: worksWithContent.length,
  needingContent: minimalWorks.length,
  completionRate: ((worksWithContent.length / files.length) * 100).toFixed(1),
  minimalWorks: minimalWorks.map(w => w.file)
};

fs.writeFileSync(
  path.join(__dirname, '../MINIMAL_CONTENT_REPORT.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✓ Report saved to MINIMAL_CONTENT_REPORT.json\n');
