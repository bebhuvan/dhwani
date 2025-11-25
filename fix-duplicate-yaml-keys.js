#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const worksDir = path.join(__dirname, 'src/content/works');

console.log('🔍 Finding and fixing duplicate YAML keys...\n');

let fixedCount = 0;
const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(worksDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) continue;

  const frontmatter = frontmatterMatch[1];
  const lines = frontmatter.split('\n');
  let modified = false;

  // Track duplicate collections
  const collectionsStart = lines.findIndex(l => l.trim() === 'collections:');
  if (collectionsStart !== -1) {
    const collections = [];
    let i = collectionsStart + 1;
    while (i < lines.length && lines[i].startsWith('- ')) {
      const collection = lines[i].substring(2).trim();
      if (!collections.includes(collection)) {
        collections.push(collection);
      }
      i++;
    }

    // Replace collection lines
    const collectionsEnd = i;
    const uniqueCollectionLines = collections.map(c => `- ${c}`);
    if (collectionsEnd - collectionsStart - 1 !== uniqueCollectionLines.length) {
      lines.splice(collectionsStart + 1, collectionsEnd - collectionsStart - 1, ...uniqueCollectionLines);
      modified = true;
    }
  }

  // Fix duplicate url keys in sources/references
  let inSource = false;
  const cleanedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect when we're in a source or reference item
    if ((line.trim().startsWith('- name:') &&
         (i > 0 && (lines[i-1].includes('sources:') || lines[i-1].includes('references:') || lines[i-1].trim().startsWith('type:')))) ||
        (line.trim().startsWith('- name:') && cleanedLines[cleanedLines.length-1]?.includes('type:'))) {
      inSource = true;
      cleanedLines.push(line);

      // Look ahead and remove duplicate url: lines
      let j = i + 1;
      let urlFound = false;
      while (j < lines.length && lines[j].startsWith('  ') && !lines[j].trim().startsWith('- ')) {
        if (lines[j].trim().startsWith('url:')) {
          if (!urlFound) {
            cleanedLines.push(lines[j]);
            urlFound = true;
          } else {
            // Skip duplicate url
            modified = true;
          }
        } else if (lines[j].trim().startsWith('type:')) {
          cleanedLines.push(lines[j]);
          inSource = false;
        } else {
          cleanedLines.push(lines[j]);
        }
        j++;
      }
      i = j - 1;
    } else {
      cleanedLines.push(line);
    }
  }

  if (modified) {
    const newFrontmatter = cleanedLines.join('\n');
    const newContent = content.replace(frontmatterMatch[1], newFrontmatter);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  }
}

console.log(`\n✨ Fixed ${fixedCount} files with duplicate YAML keys`);
