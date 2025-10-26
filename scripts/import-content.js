#!/usr/bin/env node
/**
 * Content Import Script
 * Copies and optimizes content from old Dhwani site
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLD_SITE = path.join(__dirname, '../../A main projects/Dhwani/akshara-dhara');
const NEW_SITE = path.join(__dirname, '..');

const CONTENT_DIRS = ['works', 'authors', 'blog', 'collections'];

// Statistics
const stats = {
  copied: 0,
  optimized: 0,
  errors: 0,
};

/**
 * Optimize markdown frontmatter and content
 */
function optimizeMarkdown(content, filename) {
  let optimized = content;

  // Trim excessive whitespace
  optimized = optimized.replace(/\n{3,}/g, '\n\n');

  // Optimize description length (for metadata/SEO)
  const descMatch = optimized.match(/description:\s*["'](.+?)["']/s);
  if (descMatch && descMatch[1].length > 300) {
    const trimmed = descMatch[1].substring(0, 297) + '...';
    optimized = optimized.replace(descMatch[0], `description: "${trimmed}"`);
  }

  // Ensure publishDate is properly formatted
  optimized = optimized.replace(/publishDate:\s*(\d{4}-\d{2}-\d{2})/, 'publishDate: $1');

  return optimized;
}

/**
 * Validate frontmatter
 */
function validateFrontmatter(content, filename) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.warn(`⚠️  No frontmatter in ${filename}`);
    return false;
  }

  const frontmatter = frontmatterMatch[1];

  // Check required fields
  const required = ['title', 'description'];
  for (const field of required) {
    if (!frontmatter.includes(`${field}:`)) {
      console.warn(`⚠️  Missing ${field} in ${filename}`);
      return false;
    }
  }

  return true;
}

/**
 * Copy and optimize content directory
 */
async function copyContentDir(dirName) {
  const oldDir = path.join(OLD_SITE, 'src/content', dirName);
  const newDir = path.join(NEW_SITE, 'src/content', dirName);

  try {
    // Check if source exists
    await fs.access(oldDir);

    // Create destination
    await fs.mkdir(newDir, { recursive: true });

    // Read all files
    const files = await fs.readdir(oldDir);

    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.mdx')) {
        const oldPath = path.join(oldDir, file);
        const newPath = path.join(newDir, file);

        // Read content
        const content = await fs.readFile(oldPath, 'utf-8');

        // Validate
        if (!validateFrontmatter(content, file)) {
          stats.errors++;
          continue;
        }

        // Optimize
        const optimized = optimizeMarkdown(content, file);

        // Write
        await fs.writeFile(newPath, optimized);

        stats.copied++;
        if (optimized !== content) {
          stats.optimized++;
        }
      }
    }

    console.log(`✅ Copied ${dirName}: ${files.length} files`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⏭️  Skipping ${dirName} (not found)`);
    } else {
      console.error(`❌ Error copying ${dirName}:`, error.message);
      stats.errors++;
    }
  }
}

/**
 * Copy content config
 */
async function copyContentConfig() {
  const oldConfig = path.join(OLD_SITE, 'src/content/config.ts');
  const newConfig = path.join(NEW_SITE, 'src/content/config.ts');

  try {
    await fs.copyFile(oldConfig, newConfig);
    console.log('✅ Copied content config');
  } catch (error) {
    console.error('❌ Error copying config:', error.message);
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting content import...\n');

  // Copy content config first
  await copyContentConfig();

  // Copy each content directory
  for (const dir of CONTENT_DIRS) {
    await copyContentDir(dir);
  }

  // Print statistics
  console.log('\n📊 Import Statistics:');
  console.log(`   Copied: ${stats.copied} files`);
  console.log(`   Optimized: ${stats.optimized} files`);
  console.log(`   Errors: ${stats.errors} files`);
  console.log('\n✨ Content import complete!');
}

main().catch(console.error);
