#!/usr/bin/env node

/**
 * Simple preamble removal - just strip the preamble text from descriptions
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  sourcePath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/final-set2',
};

class PreambleRemover {
  constructor() {
    this.stats = {
      total: 0,
      fixed: 0,
      unchanged: 0,
    };
  }

  async processFile(filename) {
    try {
      const filePath = path.join(CONFIG.sourcePath, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      // Simple regex replacement - find and remove preamble patterns
      const preambles = [
        /description:\s*"Here's a scholarly description for the work:\s*/i,
        /description:\s*"Here is a scholarly description for the work:\s*/i,
        /description:\s*"Here's a scholarly description:\s*/i,
        /description:\s*"Here is a scholarly description:\s*/i,
        /description:\s*"Here's a scholarly description for [^:]+:\s*/i,
        /description:\s*"Based on the provided context and requirements, here is a scholarly description:\s*/i,
      ];

      let updated = content;
      let changed = false;

      for (const preamble of preambles) {
        const before = updated;
        updated = updated.replace(preamble, 'description: "');
        if (updated !== before) {
          changed = true;
        }
      }

      if (changed) {
        await fs.writeFile(filePath, updated, 'utf-8');
        console.log(`✓ ${filename}`);
        this.stats.fixed++;
      } else {
        console.log(`- ${filename} (no preamble found)`);
        this.stats.unchanged++;
      }

      return true;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      return false;
    }
  }

  async run() {
    console.log('='.repeat(60));
    console.log('Removing Preambles from Set 2 Descriptions');
    console.log('='.repeat(60));
    console.log();

    const files = await fs.readdir(CONFIG.sourcePath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    this.stats.total = mdFiles.length;
    console.log(`Found ${mdFiles.length} works to process\n`);

    for (const filename of mdFiles) {
      await this.processFile(filename);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Preamble Removal Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Fixed: ${this.stats.fixed}`);
    console.log(`Unchanged: ${this.stats.unchanged}`);
  }
}

const remover = new PreambleRemover();
remover.run().catch(console.error);

export default PreambleRemover;
