#!/usr/bin/env node

/**
 * Polish and enhance AI-generated descriptions
 * - Remove preambles
 * - Enhance depth and detail
 * - Match style of best existing works
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  sourcePath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/final-set2',
  batchSize: 5,
  delayBetweenBatches: 2000,
};

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class DescriptionPolisher {
  constructor() {
    this.stats = {
      total: 0,
      polished: 0,
      errors: 0,
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

  async polishDescription(work) {
    const fm = work.frontmatter;

    // Remove common preambles first
    let currentDesc = fm.description;
    const preambles = [
      /^Here's a scholarly description for the work:\s*/i,
      /^Here is a scholarly description for the work:\s*/i,
      /^Here's a scholarly description:\s*/i,
      /^Here is a scholarly description:\s*/i,
      /^Here's a scholarly description for [^:]+:\s*/i,
    ];

    for (const preamble of preambles) {
      currentDesc = currentDesc.replace(preamble, '').trim();
    }

    const prompt = `You are enhancing a scholarly description for a work in an Indian literary/cultural heritage digital library.

CURRENT DESCRIPTION (needs polish and enhancement):
${currentDesc}

WORK METADATA:
Title: ${fm.title}
Author: ${fm.author.join(', ')}
Year: ${fm.year}
Language: ${fm.language.join(', ')}
Genre: ${fm.genre.join(', ')}

TASK: Rewrite and enhance this description to match the style and depth of these exemplary descriptions:

EXEMPLAR 1 (Sanskrit drama):
"Harsha's Priyadarshika presents sophisticated court intrigue in a four-act natika (minor drama) exploring romantic complications, political maneuvering, and jealousy at King Vatsa's palace. Composed by Emperor Harshavardhana alongside his other dramatic works, this play demonstrates refined psychological portrayal within Sanskrit dramatic conventions, focusing on King Vatsa's infatuation with captive princess Priyadarshika while managing Queen Vasavadatta's jealousy and minister Yaugandharayana's political schemes..."

EXEMPLAR 2 (Historical scholarship):
"Sir Jadunath Sarkar's monumental five-volume History of Aurangzib, published between 1912-1924, stands as the most authoritative and comprehensive account of the Mughal emperor Aurangzeb's reign (1658-1707), revolutionizing Indian historiography through unprecedented use of original Persian and Marathi sources and rigorous critical methodology. Sarkar (1870-1958), who began learning Persian from scratch to access primary chronicles..."

REQUIREMENTS FOR ENHANCED DESCRIPTION:
1. **Remove all preambles** - Start directly with the content
2. **Scholarly precision** - Use specific details, dates, proper nouns
3. **Rich context** - Explain historical period, cultural significance, methodology
4. **Indian connection** - Clearly articulate relevance to Indian studies/heritage
5. **Depth** - Include author background, work's reception, scholarly impact
6. **Sophisticated vocabulary** - Use academic terminology appropriately
7. **No marketing language** - Avoid "essential," "invaluable" unless substantiated
8. **Concrete examples** - Give specific themes, chapters, or contributions
9. **Length** - Aim for 250-300 words (more substantial than current)
10. **Single paragraph** - No line breaks, smooth flowing prose

CRITICAL:
- Do NOT include any preamble like "Here's the enhanced description:"
- Start IMMEDIATELY with the first sentence of the description
- Match the sophisticated, detailed style of the exemplars
- Be specific about WHY this work matters for Indian studies

Enhanced description:`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      let polished = message.content[0].text.trim();

      // Extra safety: remove any remaining preambles
      for (const preamble of preambles) {
        polished = polished.replace(preamble, '').trim();
      }

      // Remove "Enhanced description:" if present
      polished = polished.replace(/^Enhanced description:\s*/i, '').trim();

      return polished;
    } catch (error) {
      console.error(`  API Error: ${error.message}`);
      return null;
    }
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

  async processWork(filename) {
    try {
      const filePath = path.join(CONFIG.sourcePath, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      const parsed = this.parseFrontmatter(content);
      if (!parsed) {
        console.log(`⚠ ${filename} - could not parse`);
        this.stats.errors++;
        return false;
      }

      const fm = parsed.frontmatter;

      console.log(`\n✨ Polishing: ${fm.title.substring(0, 60)}...`);

      // Polish description
      const polished = await this.polishDescription(parsed);

      if (!polished) {
        console.log(`✗ ${filename} - failed to polish`);
        this.stats.errors++;
        return false;
      }

      // Update frontmatter
      fm.description = polished;

      // Save updated work
      const updated = {
        frontmatter: fm,
        content: parsed.content,
      };

      const markdown = this.generateMarkdown(updated);
      await fs.writeFile(filePath, markdown, 'utf-8');

      console.log(`✓ ${filename}`);
      console.log(`  Length: ${polished.split(' ').length} words`);
      console.log(`  Preview: ${polished.substring(0, 100)}...`);

      this.stats.polished++;
      return true;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  async polishAll() {
    console.log('='.repeat(60));
    console.log('Polishing Descriptions - Second Pass');
    console.log('='.repeat(60));
    console.log();
    console.log('This will:');
    console.log('  • Remove all preambles');
    console.log('  • Enhance depth and detail');
    console.log('  • Match exemplar quality');
    console.log('  • Target 250-300 words per description');
    console.log();

    const files = await fs.readdir(CONFIG.sourcePath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    this.stats.total = mdFiles.length;
    console.log(`Found ${mdFiles.length} works to polish\n`);

    // Process in batches
    for (let i = 0; i < mdFiles.length; i += CONFIG.batchSize) {
      const batch = mdFiles.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(mdFiles.length / CONFIG.batchSize);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} works)`);
      console.log('='.repeat(60));

      for (const filename of batch) {
        await this.processWork(filename);
      }

      if (i + CONFIG.batchSize < mdFiles.length) {
        console.log(`\nWaiting ${CONFIG.delayBetweenBatches/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Polishing Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Polished: ${this.stats.polished}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`\nAll descriptions enhanced and ready for deployment!`);
  }

  async run() {
    await this.polishAll();
  }
}

const polisher = new DescriptionPolisher();
polisher.run().catch(console.error);

export default DescriptionPolisher;
