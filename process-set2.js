#!/usr/bin/env node

/**
 * Process candidates from "new candidates-2" folder
 * All 85 are unique (no duplicates with main site)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  sourcePath: '/home/bhuvanesh.r/Dhawni experimental works/new candidates-2',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/unique-works-set2',
};

const DISCLAIMER = `

---

**Note**: This description was generated with assistance from Claude (Anthropic) to ensure scholarly accuracy and comprehensive coverage. To the best of our knowledge, this work is in the public domain. If you believe there are any copyright concerns, please contact me.`;

async function processSet2() {
  console.log('='.repeat(60));
  console.log('Processing Candidates Set 2');
  console.log('='.repeat(60));
  console.log();

  // Create output directory
  await fs.mkdir(CONFIG.outputPath, { recursive: true });

  // Get all .md files from source
  const allFiles = await fs.readdir(CONFIG.sourcePath);
  const mdFiles = allFiles.filter(f => f.endsWith('.md') && f !== 'README.md');

  console.log(`Found ${mdFiles.length} candidate works`);
  console.log(`All are unique (no duplicates with main site)\n`);

  let processed = 0;

  for (const file of mdFiles) {
    try {
      const sourcePath = path.join(CONFIG.sourcePath, file);
      let content = await fs.readFile(sourcePath, 'utf-8');

      // Add disclaimer if not present
      if (!content.includes('This description was generated with assistance from Claude')) {
        content = content.trim() + DISCLAIMER + '\n';
      }

      // Write to output
      const outputPath = path.join(CONFIG.outputPath, file);
      await fs.writeFile(outputPath, content, 'utf-8');

      processed++;
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${mdFiles.length}...`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Processing Complete!');
  console.log('='.repeat(60));
  console.log(`\nTotal processed: ${processed}`);
  console.log(`Output location: ${CONFIG.outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Review works in unique-works-set2/');
  console.log('2. Move approved works to src/content/works/');
  console.log('3. Build and deploy!');
}

processSet2().catch(console.error);
