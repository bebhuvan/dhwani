import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const worksDir = './src/content/works';
const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));

const requiredFields = ['author', 'language', 'genre', 'description', 'sources', 'publishDate'];
let fixedCount = 0;

files.forEach(filename => {
  const filePath = path.join(worksDir, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);
  
  let needsFix = false;
  const fixes = {};
  
  // Check if author is string
  if (typeof frontmatter.author === 'string') {
    fixes.author = [frontmatter.author];
    needsFix = true;
  }
  
  // Check missing required fields
  requiredFields.forEach(field => {
    if (!frontmatter[field]) {
      needsFix = true;
      
      if (field === 'language') fixes.language = ['English'];
      else if (field === 'genre') fixes.genre = ['Literature'];
      else if (field === 'description') fixes.description = frontmatter.title || 'Historical work';
      else if (field === 'sources') fixes.sources = [{name: 'Internet Archive', url: 'https://archive.org', type: 'other'}];
      else if (field === 'publishDate') fixes.publishDate = '2025-11-03';
    }
  });
  
  if (needsFix) {
    const updatedFrontmatter = { ...frontmatter, ...fixes };
    const newContent = matter.stringify(body, updatedFrontmatter);
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed: ${filename}`);
    fixedCount++;
  }
});

console.log(`\nTotal files fixed: ${fixedCount}`);
