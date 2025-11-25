#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

const worksPath = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works';

async function fixYamlTitles() {
  const files = await fs.readdir(worksPath);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  let fixed = 0;

  for (const filename of mdFiles) {
    const filePath = path.join(worksPath, filename);
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) continue;

    try {
      // Try to parse YAML - if it fails, the file has issues
      yaml.parse(match[1]);
    } catch (error) {
      console.log(`Fixing: ${filename}`);

      // Read the file line by line
      const lines = content.split('\n');
      let titleLineIndex = -1;

      // Find the title line
      for (let i = 0; i < lines.length && i < 10; i++) {
        if (lines[i].startsWith('title:')) {
          titleLineIndex = i;
          break;
        }
      }

      if (titleLineIndex > -1) {
        const titleLine = lines[titleLineIndex];

        // Extract title value (remove 'title: ' and surrounding quotes)
        const titleMatch = titleLine.match(/title:\s*['"](.*)['"]$/);

        if (titleMatch) {
          let title = titleMatch[1];

          // Simplify title by removing everything after first colon if it's too long
          if (title.length > 100 && title.includes(':')) {
            const colonIndex = title.indexOf(':');
            title = title.substring(0, colonIndex);
          }

          // Remove semicolons and everything after
          if (title.includes(';')) {
            title = title.split(';')[0];
          }

          // Clean up
          title = title.trim();

          // Use double quotes to handle apostrophes
          lines[titleLineIndex] = `title: "${title}"`;

          // Write back
          const newContent = lines.join('\n');
          await fs.writeFile(filePath, newContent, 'utf-8');

          fixed++;
          console.log(`  ✓ Fixed: ${title.substring(0, 60)}...`);
        }
      }
    }
  }

  console.log(`\n✅ Fixed ${fixed} files with YAML title issues`);
}

fixYamlTitles().catch(console.error);
