#!/usr/bin/env node

/**
 * Clean up AI-generated preambles from descriptions
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  sourcePath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/final-set2',
};

// Preambles to remove
const PREAMBLES = [
  /^Here's a scholarly description for the work:\s*/i,
  /^Here is a scholarly description for the work:\s*/i,
  /^Here's a scholarly description:\s*/i,
  /^Here is a scholarly description:\s*/i,
  /^Here's a scholarly description for [^:]+:\s*/i,
  /^Here is a scholarly description for [^:]+:\s*/i,
];

class DescriptionCleaner {
  constructor() {
    this.stats = {
      total: 0,
      cleaned: 0,
      alreadyClean: 0,
    };
  }

  parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) return null;

    try {
      const frontmatter = yaml.parse(match[1]);
      return {
        frontmatter,
        content: content.substring(match[0].length).trim(),
      };
    } catch (error) {
      return null;
    }
  }

  cleanDescription(description) {
    let cleaned = description;
    let wasChanged = false;

    for (const preamble of PREAMBLES) {
      const match = cleaned.match(preamble);
      if (match) {
        cleaned = cleaned.replace(preamble, '').trim();
        wasChanged = true;
        break;
      }
    }

    return { cleaned, wasChanged };
  }

  generateMarkdown(work) {
    const fm = work.frontmatter;

    let md = '---\n';
    md += `title: "${fm.title}"\n`;
    md += `author: [${fm.author.map(a => `"${a}"`).join(', ')}]\n`;
    if (fm.year) md += `year: ${fm.year}\n`;
    md += `language: [${fm.language.map(l => `"${l}"`).join(', ')}]\n`;
    md += `genre: [${fm.genre.map(g => `"${g}"`).join(', ')}]\n`;
    md += `description: "${fm.description}"\n`;
    md += `collections: [${fm.collections.map(c => `'${c}'`).join(', ')}]\n`;

    // Sources
    md += 'sources:\n';
    for (const source of fm.sources || []) {
      md += `  - name: "${source.name}"\n`;
      md += `    url: "${source.url}"\n`;
      md += `    type: "${source.type}"\n`;
    }

    // References
    md += 'references:\n';
    for (const ref of fm.references || []) {
      md += `  - name: "${ref.name}"\n`;
      md += `    url: "${ref.url}"\n`;
      md += `    type: "${ref.type}"\n`;
    }

    md += `featured: ${fm.featured || false}\n`;
    md += `publishDate: ${fm.publishDate}\n`;
    md += `tags: [${fm.tags.map(t => `"${t}"`).join(', ')}]\n`;
    md += '---\n\n';
    md += work.content;

    return md;
  }

  async processFile(filename) {
    try {
      const filePath = path.join(CONFIG.sourcePath, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      const parsed = this.parseFrontmatter(content);
      if (!parsed) {
        console.log(`⚠ ${filename} - could not parse`);
        return;
      }

      const { cleaned, wasChanged } = this.cleanDescription(parsed.frontmatter.description);

      if (wasChanged) {
        parsed.frontmatter.description = cleaned;

        const updated = {
          frontmatter: parsed.frontmatter,
          content: parsed.content,
        };

        const markdown = this.generateMarkdown(updated);
        await fs.writeFile(filePath, markdown, 'utf-8');

        console.log(`✓ ${filename}`);
        this.stats.cleaned++;
      } else {
        this.stats.alreadyClean++;
      }

      this.stats.total++;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
    }
  }

  async cleanAll() {
    console.log('='.repeat(60));
    console.log('Cleaning Description Preambles');
    console.log('='.repeat(60));
    console.log();

    const files = await fs.readdir(CONFIG.sourcePath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    console.log(`Found ${mdFiles.length} files to check\n`);

    for (const filename of mdFiles) {
      await this.processFile(filename);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Cleanup Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Cleaned: ${this.stats.cleaned}`);
    console.log(`Already clean: ${this.stats.alreadyClean}`);
  }

  async run() {
    await this.cleanAll();
  }
}

const cleaner = new DescriptionCleaner();
cleaner.run().catch(console.error);

export default DescriptionCleaner;
