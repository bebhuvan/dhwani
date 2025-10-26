#!/usr/bin/env node
/**
 * Fix YAML frontmatter quote issues automatically
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../src/content');

let filesFixed = 0;
let filesSkipped = 0;

/**
 * Fix YAML frontmatter quotes
 */
function fixYAMLQuotes(content) {
  const lines = content.split('\n');
  const fixed = [];
  let inFrontmatter = false;
  let frontmatterEnd = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Track frontmatter boundaries
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else if (inFrontmatter && !frontmatterEnd) {
        frontmatterEnd = true;
      }
      fixed.push(line);
      continue;
    }

    // Only process frontmatter lines
    if (inFrontmatter && !frontmatterEnd) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        fixed.push(line);
        continue;
      }

      // Fix description field specifically (most common issue)
      if (line.match(/^description:\s*"/)) {
        // Description already starts with quote - ensure it's properly closed
        const match = line.match(/^(description:\s*)"(.*)"/);
        if (match) {
          const [, prefix, value] = match;
          // Check if there are unescaped quotes inside the value
          if (value.includes('"')) {
            // Escape internal quotes
            const escapedValue = value.replace(/"/g, '\\"');
            line = `${prefix}"${escapedValue}"`;
          }
        } else {
          // Malformed - try to fix
          const valueMatch = line.match(/^description:\s*"?(.+)/);
          if (valueMatch) {
            const value = valueMatch[1].replace(/^"|"$/g, ''); // Remove any quotes
            const escapedValue = value.replace(/"/g, '\\"'); // Escape quotes
            line = `description: "${escapedValue}"`;
          }
        }
      }
      // Fix other string fields that might have quote issues
      else if (line.match(/^(title|name):\s*"/) && !line.match(/^(title|name):\s*"[^"]*"$/)) {
        const match = line.match(/^(title|name):\s*"?(.+)/);
        if (match) {
          const [, field, value] = match;
          const cleanValue = value.replace(/^"|"$/g, '');
          const escapedValue = cleanValue.replace(/"/g, '\\"');
          line = `${field}: "${escapedValue}"`;
        }
      }
    }

    fixed.push(line);
  }

  return fixed.join('\n');
}

/**
 * Process a single file
 */
async function fixFile(filepath) {
  try {
    const original = await fs.readFile(filepath, 'utf-8');
    const fixed = fixYAMLQuotes(original);

    if (original !== fixed) {
      await fs.writeFile(filepath, fixed);
      filesFixed++;
      console.log(`✅ Fixed: ${path.basename(filepath)}`);
    } else {
      filesSkipped++;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${path.basename(filepath)}:`, error.message);
  }
}

/**
 * Process all files in a content directory
 */
async function fixContentDir(dirName) {
  const dirPath = path.join(CONTENT_DIR, dirName);

  try {
    const files = await glob('**/*.{md,mdx}', { cwd: dirPath });

    for (const file of files) {
      await fixFile(path.join(dirPath, file));
    }
  } catch (error) {
    console.error(`Error processing ${dirName}:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Fixing YAML quote issues...\n');

  const contentTypes = ['works', 'authors', 'blog', 'collections'];

  for (const type of contentTypes) {
    await fixContentDir(type);
  }

  console.log(`\n📊 Results:`);
  console.log(`   Files fixed: ${filesFixed}`);
  console.log(`   Files skipped (no issues): ${filesSkipped}`);
  console.log('\n✨ Done! Run validate-content.js to verify.');
}

main().catch(console.error);
