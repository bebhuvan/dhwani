#!/usr/bin/env node

/**
 * Fix clumsy titles - remove cataloging metadata and clean up
 *
 * Fixes:
 * - Remove MARC codes ($a, $b, $c, etc.)
 * - Trim excessive subtitles
 * - Proper title casing
 * - Keep only essential parts
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  auditReportPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/audit-report-v2.json',
  worksPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works',
};

class TitleFixer {
  constructor() {
    this.stats = {
      total: 0,
      fixed: 0,
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

  cleanTitle(title) {
    let cleaned = title;

    // Remove MARC cataloging codes ($a, $b, $c, etc.)
    cleaned = cleaned.replace(/\s*\$[a-z]\s*/gi, ' ');

    // Remove content after cataloging indicators
    cleaned = cleaned.replace(/\s*:\s*\$b.*$/i, '');

    // Clean up multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Trim excessive subtitles (keep max 2 colons)
    const parts = cleaned.split(':');
    if (parts.length > 3) {
      cleaned = parts.slice(0, 3).join(':');
    }

    // Remove trailing punctuation except period
    cleaned = cleaned.replace(/[;,:\s]+$/, '');

    // Trim
    cleaned = cleaned.trim();

    return cleaned;
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

  async fixWork(filename, originalTitle) {
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
      const oldTitle = fm.title;
      const newTitle = this.cleanTitle(oldTitle);

      if (oldTitle === newTitle) {
        console.log(`⚠ ${filename} - no changes needed`);
        return false;
      }

      console.log(`\n✨ Fixing: ${filename}`);
      console.log(`   Old: ${oldTitle.substring(0, 80)}${oldTitle.length > 80 ? '...' : ''}`);
      console.log(`   New: ${newTitle.substring(0, 80)}${newTitle.length > 80 ? '...' : ''}`);

      fm.title = newTitle;

      const updated = { frontmatter: fm, content: parsed.content };
      const markdown = this.generateMarkdown(updated);
      await fs.writeFile(filePath, markdown, 'utf-8');

      console.log(`✓ Fixed`);

      this.stats.fixed++;
      return true;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  async fix() {
    console.log('='.repeat(60));
    console.log('Fixing Clumsy Titles');
    console.log('='.repeat(60));
    console.log();

    // Load audit report
    const reportContent = await fs.readFile(CONFIG.auditReportPath, 'utf-8');
    const report = JSON.parse(reportContent);

    // Combine cataloging metadata and clumsy titles
    const catalogingWorks = report.issues.catalogingMetadata || [];
    const clumsyWorks = report.issues.clumsyTitles || [];

    // Create a unique set
    const worksMap = new Map();
    catalogingWorks.forEach(w => worksMap.set(w.filename, w.title));
    clumsyWorks.forEach(w => worksMap.set(w.filename, w.title));

    const allWorks = Array.from(worksMap.entries()).map(([filename, title]) => ({
      filename,
      title
    }));

    this.stats.total = allWorks.length;

    console.log(`Found ${allWorks.length} works with title issues\n`);

    for (const work of allWorks) {
      await this.fixWork(work.filename, work.title);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Title Fixing Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Fixed: ${this.stats.fixed}`);
    console.log(`Errors: ${this.stats.errors}`);
  }

  async run() {
    await this.fix();
  }
}

const fixer = new TitleFixer();
fixer.run().catch(console.error);

export default TitleFixer;
