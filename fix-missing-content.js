#!/usr/bin/env node

/**
 * Add body content to works that have none
 *
 * Generates 500-800 word overview including:
 * - Historical context
 * - Author background
 * - Key themes and contributions
 * - Significance for Indian studies
 * - Structure/Contents summary
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  auditReportPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/audit-report-v2.json',
  worksPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works',
  batchSize: 5,
  delayBetweenBatches: 3000,
};

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class ContentGenerator {
  constructor() {
    this.stats = {
      total: 0,
      generated: 0,
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

  async generateContent(work) {
    const fm = work.frontmatter;

    const prompt = `You are writing body content for a work in the Dhwani digital library (a Project Gutenberg for India).

WORK METADATA:
Title: ${fm.title}
Author: ${Array.isArray(fm.author) ? fm.author.join(', ') : fm.author}
Year: ${fm.year || 'Unknown'}
Language: ${Array.isArray(fm.language) ? fm.language.join(', ') : fm.language}
Genre: ${Array.isArray(fm.genre) ? fm.genre.join(', ') : fm.genre}
Description: ${fm.description}

TASK: Write 500-800 words of body content for this work's page. Structure it with markdown sections (## headers) covering:

## Historical Context
- When and where this work was created
- Historical period and its significance
- Cultural and political context of the time

## About the Author
- Author's background and life
- Their contributions to the field
- Other notable works

## Key Themes and Content
- Main subjects and themes explored
- Important arguments or ideas presented
- Notable chapters or sections

## Significance
- Why this work matters for Indian studies/culture/history
- Its influence on subsequent scholarship or literature
- Contemporary relevance

## Structure and Contents
- Overview of how the work is organized
- Key sections or chapters
- Notable features (illustrations, appendices, etc.)

REQUIREMENTS:
- Use ## markdown headers for each section
- Write in scholarly, encyclopedic tone
- Be specific with dates, names, and facts
- 500-800 words total
- Do NOT include any preamble - start directly with the first ## heading
- Focus on Indian relevance and context

Body content:`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2048,
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
    md += `title: '${fm.title}'\n`;

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

  async generateForWork(filename) {
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
      const currentLength = parsed.content.length;

      console.log(`\n✨ Generating content: ${fm.title.substring(0, 50)}...`);
      console.log(`   Current: ${currentLength} chars`);

      const generated = await this.generateContent(parsed);
      if (!generated) {
        console.log(`✗ ${filename} - failed to generate`);
        this.stats.errors++;
        return false;
      }

      const newLength = generated.length;
      const wordCount = this.getWordCount(generated);

      const updated = { frontmatter: fm, content: generated };
      const markdown = this.generateMarkdown(updated);
      await fs.writeFile(filePath, markdown, 'utf-8');

      console.log(`✓ ${filename}`);
      console.log(`   Generated: ${wordCount} words (${newLength} chars)`);

      this.stats.generated++;
      return true;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  async generate() {
    console.log('='.repeat(60));
    console.log('Generating Missing Body Content');
    console.log('='.repeat(60));
    console.log();

    // Load audit report
    const reportContent = await fs.readFile(CONFIG.auditReportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    const worksNeedingContent = report.issues.missingContent;
    this.stats.total = worksNeedingContent.length;

    console.log(`Found ${worksNeedingContent.length} works missing body content\n`);

    // Process in batches
    for (let i = 0; i < worksNeedingContent.length; i += CONFIG.batchSize) {
      const batch = worksNeedingContent.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(worksNeedingContent.length / CONFIG.batchSize);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} works)`);
      console.log('='.repeat(60));

      for (const work of batch) {
        await this.generateForWork(work.filename);
      }

      if (i + CONFIG.batchSize < worksNeedingContent.length) {
        console.log(`\nWaiting ${CONFIG.delayBetweenBatches/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Content Generation Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Generated: ${this.stats.generated}`);
    console.log(`Errors: ${this.stats.errors}`);
  }

  async run() {
    await this.generate();
  }
}

const generator = new ContentGenerator();
generator.run().catch(console.error);

export default ContentGenerator;
