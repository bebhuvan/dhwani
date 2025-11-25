import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const worksDir = 'src/content/works';
const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));

let missingReferences = [];
let hasReferences = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(worksDir, file), 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    try {
      const frontmatter = yaml.load(match[1]);
      if (!frontmatter.references || frontmatter.references.length === 0) {
        missingReferences.push({
          file,
          title: frontmatter.title,
          author: frontmatter.author
        });
      } else {
        hasReferences.push(file);
      }
    } catch (e) {
      console.log(`Error parsing ${file}: ${e.message}`);
    }
  }
});

console.log(`\n📊 References Audit Results:`);
console.log(`   Total files checked: ${files.length}`);
console.log(`   Works WITH references: ${hasReferences.length}`);
console.log(`   Works WITHOUT references: ${missingReferences.length}`);

if (missingReferences.length > 0) {
  console.log(`\n❌ All files missing references:`);
  missingReferences.forEach(({ file, title, author }) => {
    console.log(`   - ${file}`);
    console.log(`     Title: ${title}`);
    console.log(`     Author: ${Array.isArray(author) ? author.join(', ') : author}`);
  });
}
