#!/usr/bin/env node

/**
 * Remove marketing language from descriptions
 * - Remove superlatives without substance
 * - Remove promotional phrases
 * - Keep scholarly tone
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
  delayBetweenBatches: 2000,
};

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class MarketingRemover {
  constructor() {
    this.stats = {
      total: 0,
      cleaned: 0,
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

  async removeMarketing(work) {
    const fm = work.frontmatter;

    const prompt = `You are cleaning marketing language from a scholarly description for an Indian cultural heritage work.

CURRENT DESCRIPTION (contains marketing language):
${fm.description}

WORK METADATA:
Title: ${fm.title}
Author: ${Array.isArray(fm.author) ? fm.author.join(', ') : fm.author}
Year: ${fm.year || 'Unknown'}

TASK: Rewrite this description to remove marketing language while keeping all factual content and scholarly value.

REMOVE these types of marketing language:
- Unsubstantiated superlatives ("essential," "invaluable," "indispensable," "must-read")
- Promotional phrases ("don't miss," "treasure trove," "gem," "masterpiece" without evidence)
- Breathless enthusiasm without scholarly backing
- Claims of uniqueness without proof
- Generic praise ("wonderful," "excellent," "outstanding" without specifics)

KEEP and EXPAND:
- Specific historical facts, dates, and context
- Concrete descriptions of content and methodology
- Documented scholarly impact (cite reviews, citations if mentioned)
- Precise technical/academic terminology
- Verifiable significance (with evidence)

REQUIREMENTS:
- Maintain scholarly, encyclopedic tone
- Keep all factual information
- Replace vague praise with specific details
- If claiming importance, explain WHY with evidence
- Single continuous paragraph
- 200-280 words
- Do NOT include any preamble - start directly with content

Cleaned description:`;

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

  async processWork(filename) {
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

      console.log(`\n✨ Cleaning: ${fm.title.substring(0, 60)}...`);

      const cleaned = await this.removeMarketing(parsed);
      if (!cleaned) {
        console.log(`✗ ${filename} - failed to clean`);
        this.stats.errors++;
        return false;
      }

      fm.description = cleaned;

      const updated = { frontmatter: fm, content: parsed.content };
      const markdown = this.generateMarkdown(updated);
      await fs.writeFile(filePath, markdown, 'utf-8');

      console.log(`✓ ${filename}`);
      console.log(`  Length: ${cleaned.split(' ').length} words`);

      this.stats.cleaned++;
      return true;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  async clean() {
    console.log('='.repeat(60));
    console.log('Removing Marketing Language');
    console.log('='.repeat(60));
    console.log();

    // Load audit report
    const reportContent = await fs.readFile(CONFIG.auditReportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    const works = report.issues.marketingLanguage || [];
    this.stats.total = works.length;

    console.log(`Found ${works.length} works with marketing language\n`);

    // Process in batches
    for (let i = 0; i < works.length; i += CONFIG.batchSize) {
      const batch = works.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(works.length / CONFIG.batchSize);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} works)`);
      console.log('='.repeat(60));

      for (const work of batch) {
        await this.processWork(work.filename);
      }

      if (i + CONFIG.batchSize < works.length) {
        console.log(`\nWaiting ${CONFIG.delayBetweenBatches/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Marketing Language Removal Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Cleaned: ${this.stats.cleaned}`);
    console.log(`Errors: ${this.stats.errors}`);
  }

  async run() {
    await this.clean();
  }
}

const remover = new MarketingRemover();
remover.run().catch(console.error);

export default MarketingRemover;
