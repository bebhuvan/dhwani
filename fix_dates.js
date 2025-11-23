import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const worksDir = './src/content/works';
const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));

let fixedCount = 0;

files.forEach(filename => {
  const filePath = path.join(worksDir, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);
  
  if (frontmatter.publishDate && typeof frontmatter.publishDate === 'string') {
    frontmatter.publishDate = new Date(frontmatter.publishDate);
    const newContent = matter.stringify(body, frontmatter);
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed date: ${filename}`);
    fixedCount++;
  }
});

console.log(`\nTotal files fixed: ${fixedCount}`);
