#!/usr/bin/env node

/**
 * Enhance short descriptions (< 100 words) to 200-280 words
 * Uses AI to expand while maintaining scholarly tone
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  auditReportPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/audit-report.json',
  worksPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works',
  batchSize: 10,
  delayBetweenBatches: 3000,
};

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class DescriptionEnhancer {
  constructor() {
    this.stats = {
      total: 0,
      enhanced: 0,
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

  async enhanceDescription(work) {
    const fm = work.frontmatter;

    const prompt = `You are enhancing a description for an Indian literary/cultural heritage work. The current description is too short and needs to be expanded to 200-280 words while maintaining scholarly accuracy.

CURRENT SHORT DESCRIPTION (${this.getWordCount(fm.description)} words):
${fm.description}

WORK METADATA:
Title: ${fm.title}
Author: ${Array.isArray(fm.author) ? fm.author.join(', ') : fm.author}
Year: ${fm.year || 'Unknown'}
Language: ${Array.isArray(fm.language) ? fm.language.join(', ') : fm.language}
Genre: ${Array.isArray(fm.genre) ? fm.genre.join(', ') : fm.genre}

TASK: Expand this description to 200-280 words. Add:
- Historical context and period
- Author background (if known)
- Significance for Indian studies/heritage
- Key themes, contributions, or contents
- Why this work matters
- Connection to Indian culture/literature

REQUIREMENTS:
- Scholarly, precise tone (like academic encyclopedia)
- No marketing language or superlatives without substance
- Specific details and examples
- Clear explanation of Indian relevance
- Single continuous paragraph
- 200-280 words target
- Do NOT include any preamble - start immediately with the description

Enhanced description:`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      });

      return message.content[0].text.trim();
    } catch (error) {
      console.error(`  API Error: ${error.message}`);
      return null;
    }
  }

  getWordCount(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  generateMarkdown(work) {
    const fm = work.frontmatter;

    let md = '---\n';
    md += `title: ${typeof fm.title === 'string' && fm.title.includes(':') ? `'${fm.title}'` : `'${fm.title}'`}\n`;

    // Author
    if (Array.isArray(fm.author)) {
      md += `author:\n${fm.author.map(a => `- ${a}`).join('\n')}\n`;
    } else if (fm.author) {
      md += `author:\n- ${fm.author}\n`;
    }

    if (fm.year) md += `year: ${fm.year}\n`;

    // Language
    if (Array.isArray(fm.language)) {
      md += `language:\n${fm.language.map(l => `- ${l}`).join('\n')}\n`;
    } else if (fm.language) {
      md += `language:\n- ${fm.language}\n`;
    }

    // Genre
    if (Array.isArray(fm.genre)) {
      md += `genre:\n${fm.genre.map(g => `- ${g}`).join('\n')}\n`;
    } else if (fm.genre) {
      md += `genre:\n- ${fm.genre}\n`;
    }

    // Description (use | for multi-line)
    md += `description: |\n`;
    const descLines = fm.description.split('\n');
    descLines.forEach(line => {
      md += `  ${line}\n`;
    });

    // Collections
    if (Array.isArray(fm.collections)) {
      md += `collections:\n${fm.collections.map(c => `- ${c}`).join('\n')}\n`;
    } else if (fm.collections) {
      md += `collections:\n- ${fm.collections}\n`;
    }

    // Sources
    if (fm.sources && fm.sources.length > 0) {
      md += 'sources:\n';
      fm.sources.forEach(source => {
        md += `- name: '${source.name}'\n`;
        md += `  url: ${source.url}\n`;
        md += `  type: ${source.type}\n`;
      });
    }

    // References
    if (fm.references && fm.references.length > 0) {
      md += 'references:\n';
      fm.references.forEach(ref => {
        md += `- name: '${ref.name}'\n`;
        md += `  url: ${ref.url}\n`;
        md += `  type: ${ref.type}\n`;
      });
    }

    md += `featured: ${fm.featured || false}\n`;
    md += `publishDate: ${fm.publishDate}\n`;
    md += '---\n\n';
    md += work.content;

    return md;
  }

  async enhanceWork(filename) {
    try {
      const filePath = path.join(CONFIG.worksPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      const parsed = this.parseFrontmatter(content);
      if (!parsed) {
        console.log(`⚠ ${filename} - could not parse`);
        this.stats.errors++;
        return false;
      }

      const fm = parsed.frontmatter;
      const currentWordCount = this.getWordCount(fm.description);

      console.log(`\n✨ Enhancing: ${fm.title.substring(0, 50)}...`);
      console.log(`   Current: ${currentWordCount} words`);

      const enhanced = await this.enhanceDescription(parsed);
      if (!enhanced) {
        console.log(`✗ ${filename} - failed to enhance`);
        this.stats.errors++;
        return false;
      }

      const newWordCount = this.getWordCount(enhanced);
      fm.description = enhanced;

      const updated = { frontmatter: fm, content: parsed.content };
      const markdown = this.generateMarkdown(updated);
      await fs.writeFile(filePath, markdown, 'utf-8');

      console.log(`✓ ${filename}`);
      console.log(`   New: ${newWordCount} words (+${newWordCount - currentWordCount})`);

      this.stats.enhanced++;
      return true;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  async enhance() {
    console.log('='.repeat(60));
    console.log('Enhancing Short Descriptions');
    console.log('='.repeat(60));
    console.log();

    // Load audit report
    const reportContent = await fs.readFile(CONFIG.auditReportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    const shortDescWorks = report.issues.shortDescriptions;
    this.stats.total = shortDescWorks.length;

    console.log(`Found ${shortDescWorks.length} works with short descriptions\n`);

    // Process in batches
    for (let i = 0; i < shortDescWorks.length; i += CONFIG.batchSize) {
      const batch = shortDescWorks.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(shortDescWorks.length / CONFIG.batchSize);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} works)`);
      console.log('='.repeat(60));

      for (const work of batch) {
        await this.enhanceWork(work.filename);
      }

      if (i + CONFIG.batchSize < shortDescWorks.length) {
        console.log(`\nWaiting ${CONFIG.delayBetweenBatches/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Enhancement Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Enhanced: ${this.stats.enhanced}`);
    console.log(`Errors: ${this.stats.errors}`);
  }

  async run() {
    await this.enhance();
  }
}

const enhancer = new DescriptionEnhancer();
enhancer.run().catch(console.error);

export default DescriptionEnhancer;
