#!/usr/bin/env node

/**
 * Generate scholarly descriptions for Set 2 works using Claude API
 *
 * This script:
 * 1. Reads enhanced works that need descriptions
 * 2. Uses Claude API to generate scholarly 150-300 word descriptions
 * 3. Updates works with generated descriptions
 * 4. Generates appropriate tags based on content
 *
 * Requirements:
 * - ANTHROPIC_API_KEY environment variable must be set
 * - npm install @anthropic-ai/sdk
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  sourcePath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/enhanced-set2',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/final-set2',
  batchSize: 5, // Process 5 at a time to avoid rate limits
  delayBetweenBatches: 2000, // 2 seconds between batches
};

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  console.error('\nPlease set it with:');
  console.error('export ANTHROPIC_API_KEY=your-api-key-here');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class DescriptionGenerator {
  constructor() {
    this.stats = {
      total: 0,
      generated: 0,
      skipped: 0,
      errors: 0,
    };
  }

  parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return null;
    }

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

  async generateDescription(work) {
    const fm = work.frontmatter;
    const currentDesc = fm.description.replace('[NEEDS GENERATION] ', '');

    // Create prompt based on the work's metadata
    const prompt = `Generate a scholarly description (150-300 words) for this work:

Title: ${fm.title}
Author: ${fm.author.join(', ')}
Year: ${fm.year}
Language: ${fm.language.join(', ')}
Genre: ${fm.genre.join(', ')}

Current description: ${currentDesc}

Requirements:
- Scholarly tone without marketing fluff
- Explain historical context and significance
- Mention key themes or contributions
- Explain relevance to Indian literary/cultural heritage
- If this work is about India, emphasize that connection
- If not directly Indian (e.g., Alexander's campaigns), explain its relevance to Indian studies
- No superlatives without substance
- Be specific and informative
- Match the style of high-quality academic descriptions

Examples of good descriptions to match the style:

Example 1 (for Sanskrit drama):
"Harsha's Priyadarshika presents sophisticated court intrigue in a four-act natika (minor drama) exploring romantic complications, political maneuvering, and jealousy at King Vatsa's palace. Composed by Emperor Harshavardhana alongside his other dramatic works, this play demonstrates refined psychological portrayal within Sanskrit dramatic conventions..."

Example 2 (for historical scholarship):
"Sir Jadunath Sarkar's monumental five-volume History of Aurangzib, published between 1912-1924, stands as the most authoritative and comprehensive account of the Mughal emperor Aurangzeb's reign (1658-1707), revolutionizing Indian historiography through unprecedented use of original Persian and Marathi sources and rigorous critical methodology..."

Format: Single continuous paragraph, 150-300 words. Do not include section headings or bullet points.`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      return message.content[0].text.trim();
    } catch (error) {
      console.error(`  API Error: ${error.message}`);
      return null;
    }
  }

  async generateTags(work) {
    const fm = work.frontmatter;

    // Extract key terms from title and author
    const tags = [];

    // Add normalized title
    const titleWords = fm.title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['the', 'and', 'for', 'with', 'from'].includes(w));

    // Add first 3-4 significant title words
    tags.push(...titleWords.slice(0, 4));

    // Add authors
    fm.author.forEach(author => {
      if (author !== 'Unknown' && author !== 'Not available') {
        tags.push(author.toLowerCase());
      }
    });

    // Add genres (normalized)
    fm.genre.forEach(genre => {
      tags.push(genre.toLowerCase().replace(/\s+/g, '-'));
    });

    // Add collections
    tags.push(...fm.collections);

    // Add century tag
    if (fm.year) {
      const century = Math.floor((fm.year - 1) / 100) + 1;
      if (century >= 17 && century <= 21) {
        tags.push(`${century}th-century`);
      }
    }

    // Add "public domain" tag
    tags.push('public domain');

    // Remove duplicates and limit to 15 tags
    return [...new Set(tags)].slice(0, 15);
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

      // Skip if description is already generated
      if (!fm.description.startsWith('[NEEDS GENERATION]')) {
        console.log(`→ ${filename} - already has description`);
        this.stats.skipped++;
        return false;
      }

      console.log(`\n📝 Generating description for: ${fm.title.substring(0, 60)}...`);

      // Generate description
      const description = await this.generateDescription(parsed);

      if (!description) {
        console.log(`✗ ${filename} - failed to generate description`);
        this.stats.errors++;
        return false;
      }

      // Update frontmatter
      fm.description = description;
      fm.tags = await this.generateTags(parsed);

      // Save updated work
      const updated = {
        frontmatter: fm,
        content: parsed.content,
      };

      const outputPath = path.join(CONFIG.outputPath, filename);
      const markdown = this.generateMarkdown(updated);
      await fs.writeFile(outputPath, markdown, 'utf-8');

      console.log(`✓ ${filename}`);
      console.log(`  Description: ${description.substring(0, 100)}...`);
      console.log(`  Tags: ${fm.tags.slice(0, 5).join(', ')}...`);

      this.stats.generated++;
      return true;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  async generateAll() {
    console.log('='.repeat(60));
    console.log('Generating Descriptions for Set 2');
    console.log('='.repeat(60));
    console.log();

    await fs.mkdir(CONFIG.outputPath, { recursive: true });

    const files = await fs.readdir(CONFIG.sourcePath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    this.stats.total = mdFiles.length;
    console.log(`Found ${mdFiles.length} works to process\n`);

    // Process in batches to respect rate limits
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

      // Wait between batches
      if (i + CONFIG.batchSize < mdFiles.length) {
        console.log(`\nWaiting ${CONFIG.delayBetweenBatches/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Description Generation Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Generated: ${this.stats.generated}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`\nOutput: ${CONFIG.outputPath}`);
    console.log('\nNext steps:');
    console.log('1. Review generated descriptions in final-set2/');
    console.log('2. Combine with unique-works/ (Set 1)');
    console.log('3. Move all to src/content/works/');
    console.log('4. Build and deploy!');
  }

  async run() {
    await this.generateAll();
  }
}

const generator = new DescriptionGenerator();
generator.run().catch(console.error);

export default DescriptionGenerator;
