#!/usr/bin/env node

/**
 * Add historical context to descriptions that lack it
 *
 * Enhances descriptions by adding:
 * - Dates, periods, and temporal context
 * - Historical significance
 * - Author/publication context
 * - Impact and influence
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

class ContextEnhancer {
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

  async addHistoricalContext(work) {
    const fm = work.frontmatter;

    const prompt = `You are enhancing a description for an Indian literary/cultural heritage work. The current description lacks historical context and temporal information.

CURRENT DESCRIPTION:
${fm.description}

WORK METADATA:
Title: ${fm.title}
Author: ${Array.isArray(fm.author) ? fm.author.join(', ') : fm.author}
Year: ${fm.year || 'Unknown'}
Language: ${Array.isArray(fm.language) ? fm.language.join(', ') : fm.language}
Genre: ${Array.isArray(fm.genre) ? fm.genre.join(', ') : fm.genre}

TASK: Add 2-3 sentences of historical context to this description. Insert context naturally where it fits best (beginning, middle, or end). Add information about:
- When this work was created/published (dates, periods)
- Historical context of that time period
- Author's background and when they lived/worked
- Historical significance or impact
- How this work relates to its historical moment
- Why it matters in the context of Indian history/culture

REQUIREMENTS:
- Keep ALL existing content intact
- Add ONLY 2-3 sentences of historical/temporal context
- Use specific dates, periods, and eras (e.g., "Published in 1912 during the Bengal Renaissance...")
- Scholarly, precise tone
- Natural integration - don't add a separate "Historical Context:" section
- Single continuous paragraph
- Do NOT include any preamble - output the complete enhanced description directly

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
      const originalWordCount = this.getWordCount(fm.description);

      console.log(`\n✨ Adding context: ${fm.title.substring(0, 50)}...`);
      console.log(`   Original: ${originalWordCount} words`);

      const enhanced = await this.addHistoricalContext(parsed);
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
      console.log(`   Enhanced: ${newWordCount} words (+${newWordCount - originalWordCount})`);

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
    console.log('Adding Historical Context to Descriptions');
    console.log('='.repeat(60));
    console.log();

    // Load audit report
    const reportContent = await fs.readFile(CONFIG.auditReportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    const worksNeedingContext = report.issues.noHistoricalContext;
    this.stats.total = worksNeedingContext.length;

    console.log(`Found ${worksNeedingContext.length} works lacking historical context\n`);

    // Process in batches
    for (let i = 0; i < worksNeedingContext.length; i += CONFIG.batchSize) {
      const batch = worksNeedingContext.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(worksNeedingContext.length / CONFIG.batchSize);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} works)`);
      console.log('='.repeat(60));

      for (const work of batch) {
        await this.enhanceWork(work.filename);
      }

      if (i + CONFIG.batchSize < worksNeedingContext.length) {
        console.log(`\nWaiting ${CONFIG.delayBetweenBatches/1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Historical Context Enhancement Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Enhanced: ${this.stats.enhanced}`);
    console.log(`Errors: ${this.stats.errors}`);

    console.log('\n💡 Next Steps:');
    console.log('  1. Run enhanced audit again to verify improvements');
    console.log('  2. Fix remaining short descriptions');
    console.log('  3. Add missing body content');
    console.log('\nCommands:');
    console.log('  node audit-existing-works-v2.js');
    console.log('  node enhance-short-descriptions.js');
  }

  async run() {
    await this.enhance();
  }
}

const enhancer = new ContextEnhancer();
enhancer.run().catch(console.error);

export default ContextEnhancer;
