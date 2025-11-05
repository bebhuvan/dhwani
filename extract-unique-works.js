#!/usr/bin/env node

/**
 * Extract only unique works and delete duplicates
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  candidatesPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/candidate-batches',
  mainSitePath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/unique-works',
};

async function extractUniqueWorks() {
  console.log('='.repeat(60));
  console.log('Extracting Unique Works');
  console.log('='.repeat(60));
  console.log();

  // Get main site filenames
  console.log('Loading main site works...');
  const mainFiles = await fs.readdir(CONFIG.mainSitePath);
  const mainMdFiles = new Set(mainFiles.filter(f => f.endsWith('.md')));
  console.log(`Found ${mainMdFiles.size} works on main site`);

  // Get candidate filenames
  console.log('Loading candidate works...');
  const uniqueWorks = [];

  for (let i = 1; i <= 9; i++) {
    const batchPath = path.join(CONFIG.candidatesPath, `batch-${i}`, 'works');

    try {
      const files = await fs.readdir(batchPath);

      for (const file of files) {
        if (file.endsWith('.md') && !mainMdFiles.has(file)) {
          uniqueWorks.push({
            filename: file,
            batch: i,
            sourcePath: path.join(batchPath, file),
          });
        }
      }
    } catch (error) {
      // Batch might not exist
    }
  }

  console.log(`Found ${uniqueWorks.length} unique works\n`);

  if (uniqueWorks.length === 0) {
    console.log('No unique works found! All candidates are already on main site.');
    return;
  }

  // Create output directory
  await fs.mkdir(CONFIG.outputPath, { recursive: true });

  // Copy unique works
  console.log('Copying unique works to unique-works folder...\n');
  for (const work of uniqueWorks) {
    console.log(`✓ ${work.filename} (from batch-${work.batch})`);
    await fs.copyFile(
      work.sourcePath,
      path.join(CONFIG.outputPath, work.filename)
    );
  }

  console.log('\n' + '='.repeat(60));
  console.log('Extraction Complete!');
  console.log('='.repeat(60));
  console.log(`\nUnique works saved to: ${CONFIG.outputPath}`);
  console.log(`Total unique works: ${uniqueWorks.length}`);

  return uniqueWorks;
}

async function deleteDuplicateBatches() {
  console.log('\n' + '='.repeat(60));
  console.log('Cleaning Up Duplicate Batches');
  console.log('='.repeat(60));
  console.log('\nDeleting candidate-batches folder...');

  await fs.rm(CONFIG.candidatesPath, { recursive: true, force: true });

  console.log('✓ Deleted candidate-batches/');
  console.log('\nCleanup complete!');
}

async function run() {
  const uniqueWorks = await extractUniqueWorks();

  if (uniqueWorks && uniqueWorks.length > 0) {
    console.log('\nReady to delete duplicate batches?');
    console.log('The unique works are safely copied to unique-works/');

    await deleteDuplicateBatches();

    console.log('\n' + '='.repeat(60));
    console.log('DONE!');
    console.log('='.repeat(60));
    console.log(`\nNext steps:`);
    console.log(`1. Review the ${uniqueWorks.length} unique works in: unique-works/`);
    console.log(`2. Enhance them: node enhance-candidates.js unique-works`);
    console.log(`3. Move to main site: mv unique-works/*.md src/content/works/`);
  }
}

run().catch(console.error);
