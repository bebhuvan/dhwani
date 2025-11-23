const fs = require('fs');
const path = require('path');

const worksDir = './src/content/works';
const files = fs.readdirSync(worksDir);

const results = [];

files.forEach(file => {
  if (!file.endsWith('.md')) return;

  const content = fs.readFileSync(path.join(worksDir, file), 'utf-8');
  const match = content.match(/description: \|([\s\S]*?)\n(?=\w+:)/);

  if (match && match[1]) {
    const desc = match[1].trim();
    const wordCount = desc.split(/\s+/).length;

    if (wordCount > 100) {
      results.push({ file, wordCount });
    }
  }
});

results.sort((a, b) => b.wordCount - a.wordCount);
results.slice(0, 30).forEach(r => {
  console.log(`${r.wordCount} words - ${r.file}`);
});
