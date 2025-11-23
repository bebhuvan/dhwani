import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const worksDir = 'src/content/works';
const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));

let missingUrls = [];
let totalSources = 0;

files.forEach(file => {
  const content = fs.readFileSync(path.join(worksDir, file), 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    try {
      const frontmatter = yaml.load(match[1]);
      if (frontmatter.sources && Array.isArray(frontmatter.sources)) {
        frontmatter.sources.forEach((source, idx) => {
          totalSources++;
          if (!source.url || source.url.trim() === '') {
            missingUrls.push({ file, sourceIndex: idx, sourceName: source.name });
          }
        });
      }
    } catch (e) {
      console.log(`Error parsing ${file}: ${e.message}`);
    }
  }
});

console.log(`\n📊 URL Verification Results:`);
console.log(`   Total files checked: ${files.length}`);
console.log(`   Total sources: ${totalSources}`);
console.log(`   Missing URLs: ${missingUrls.length}`);

if (missingUrls.length > 0) {
  console.log(`\n❌ Files with missing URLs:`);
  missingUrls.forEach(({ file, sourceIndex, sourceName }) => {
    console.log(`   - ${file} (source #${sourceIndex}: ${sourceName})`);
  });
} else {
  console.log(`\n✅ All sources have URLs!`);
}
