#!/usr/bin/env node

/**
 * Dhwani Collection Fixer
 *
 * Automatically fixes invalid collection names in candidate works
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_COLLECTIONS = [
  'academic-journals', 'ancient-history', 'ancient-wisdom', 'archaeology',
  'archival-sources', 'arts-texts', 'astronomy', 'buddhist-texts',
  'classical-literature', 'colonial-india', 'comparative-religion', 'court-chronicles',
  'devotional-literature', 'devotional-poetry', 'epigraphy', 'epic-poetry',
  'ethnographic-studies', 'ethnography', 'folklore', 'folklore-collection',
  'genealogy', 'historical-literature', 'historical-texts', 'indology',
  'jain-literature', 'jain-texts', 'legal-texts', 'linguistic-works',
  'mathematics', 'medical-texts', 'medieval-india', 'modern-literature',
  'mughal-history', 'mughal-india', 'musicology', 'numismatics',
  'oral-literature', 'pali-literature', 'philosophical-works', 'philosophy',
  'poetry-collection', 'political-philosophy', 'reference-texts', 'reference-works',
  'regional-history', 'regional-literature', 'regional-voices', 'religious-texts',
  'ritual-texts', 'sanskrit-drama', 'scholarly-translations', 'science',
  'scientific-texts', 'scientific-works', 'spiritual-texts', 'technical-manuals',
  'tribal-studies',
];

// Mapping of invalid collections to their correct equivalents
const COLLECTION_FIXES = {
  'ancient-scriptures': 'ancient-wisdom',
  'sacred-texts': 'religious-texts',
  'devotional-texts': 'devotional-literature',
  'philosophical-texts': 'philosophical-works',
  'religious-literature': 'religious-texts',
  'historical-works': 'historical-texts',
  'scientific-literature': 'scientific-texts',
  'classical-texts': 'classical-literature',
  'reference-literature': 'reference-texts',
  'technical-texts': 'technical-manuals',
  'scholarly-works': 'scholarly-translations',
  'linguistics': 'linguistic-works',
  'history': 'historical-texts',
  'buddhist-literature': 'buddhist-texts',
  'jain-literature': 'jain-texts',
  'reference': 'reference-texts',
  'sanskrit': 'reference-texts', // Sanskrit grammar/reference works
};

class CollectionFixer {
  constructor(batchNumber) {
    this.batchNumber = batchNumber;
    this.batchPath = path.join(
      '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/candidate-batches',
      `batch-${batchNumber}`
    );
    this.stats = {
      processed: 0,
      fixed: 0,
      errors: 0,
      collectionsFixed: 0,
    };
  }

  parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('No frontmatter found');
    }

    const frontmatter = yaml.parse(match[1]);
    return {
      frontmatter,
      content: content.substring(match[0].length).trim(),
    };
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
    md += `publishDate: ${fm.publishDate || new Date().toISOString().split('T')[0]}\n`;
    md += `tags: [${fm.tags.map(t => `"${t}"`).join(', ')}]\n`;
    md += '---\n\n';
    md += work.content;

    return md;
  }

  fixCollections(collections) {
    const fixed = [];
    const changes = [];

    for (const collection of collections) {
      if (VALID_COLLECTIONS.includes(collection)) {
        fixed.push(collection);
      } else if (COLLECTION_FIXES[collection]) {
        const newCollection = COLLECTION_FIXES[collection];
        fixed.push(newCollection);
        changes.push({ old: collection, new: newCollection });
      } else {
        // Unknown invalid collection - try to suggest best match
        const suggestion = this.findBestMatch(collection);
        if (suggestion) {
          fixed.push(suggestion);
          changes.push({ old: collection, new: suggestion, confidence: 'low' });
        } else {
          // Keep it but flag for manual review
          fixed.push(collection);
          changes.push({ old: collection, new: collection, error: 'no valid match found' });
        }
      }
    }

    // Remove duplicates
    return {
      collections: [...new Set(fixed)],
      changes,
    };
  }

  findBestMatch(invalid) {
    // Simple similarity matching
    const words = invalid.split('-');

    for (const valid of VALID_COLLECTIONS) {
      const validWords = valid.split('-');
      const commonWords = words.filter(w => validWords.includes(w));

      if (commonWords.length >= words.length / 2) {
        return valid;
      }
    }

    return null;
  }

  async processWork(filename) {
    const workPath = path.join(this.batchPath, 'works', filename);

    try {
      const content = await fs.readFile(workPath, 'utf-8');
      const parsed = this.parseFrontmatter(content);

      const work = {
        filename,
        frontmatter: parsed.frontmatter,
        content: parsed.content,
      };

      const originalCollections = work.frontmatter.collections || [];
      const result = this.fixCollections(originalCollections);

      if (result.changes.length > 0) {
        console.log(`\n${filename}:`);
        for (const change of result.changes) {
          if (change.error) {
            console.log(`  ⚠ "${change.old}" - ${change.error}`);
          } else if (change.confidence === 'low') {
            console.log(`  ? "${change.old}" → "${change.new}" (please verify)`);
          } else {
            console.log(`  ✓ "${change.old}" → "${change.new}"`);
          }
        }

        work.frontmatter.collections = result.collections;
        const updatedContent = this.generateMarkdown(work);
        await fs.writeFile(workPath, updatedContent, 'utf-8');

        this.stats.fixed++;
        this.stats.collectionsFixed += result.changes.length;
      }

      this.stats.processed++;

    } catch (error) {
      console.error(`Error processing ${filename}: ${error.message}`);
      this.stats.errors++;
    }
  }

  async run() {
    console.log('='.repeat(60));
    console.log(`Fixing Collections in Batch ${this.batchNumber}`);
    console.log('='.repeat(60));

    const worksPath = path.join(this.batchPath, 'works');
    const files = await fs.readdir(worksPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    console.log(`\nFound ${mdFiles.length} works to check\n`);

    for (const filename of mdFiles) {
      await this.processWork(filename);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Collection Fix Complete!');
    console.log('='.repeat(60));
    console.log(`\nProcessed: ${this.stats.processed}`);
    console.log(`Fixed: ${this.stats.fixed}`);
    console.log(`Collections updated: ${this.stats.collectionsFixed}`);
    console.log(`Errors: ${this.stats.errors}`);
  }
}

// CLI
const batchNumber = process.argv[2] || '1';

const fixer = new CollectionFixer(batchNumber);
fixer.run().catch(console.error);

export default CollectionFixer;
