#!/usr/bin/env node

/**
 * Dhwani Duplicate Checker
 *
 * Checks for duplicate works between candidate-batches and main site
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  mainSitePath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works',
  candidatesPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/candidate-batches',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/DUPLICATE_REPORT.md',
};

class DuplicateChecker {
  constructor() {
    this.mainSiteWorks = new Map(); // filename -> { title, author }
    this.candidateWorks = new Map(); // filename -> { title, author, batch }
    this.duplicates = {
      byFilename: [],
      byTitle: [],
      byTitleAndAuthor: [],
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
      return frontmatter;
    } catch (error) {
      return null;
    }
  }

  normalizeTitle(title) {
    // Normalize for comparison
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeAuthor(author) {
    if (!author) return '';
    if (Array.isArray(author)) {
      return author[0].toLowerCase().trim();
    }
    return author.toLowerCase().trim();
  }

  async loadMainSiteWorks() {
    console.log('Loading main site works...');
    const files = await fs.readdir(CONFIG.mainSitePath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    for (const filename of mdFiles) {
      const filePath = path.join(CONFIG.mainSitePath, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const frontmatter = this.parseFrontmatter(content);

        if (frontmatter) {
          this.mainSiteWorks.set(filename, {
            title: frontmatter.title || '',
            normalizedTitle: this.normalizeTitle(frontmatter.title || ''),
            author: this.normalizeAuthor(frontmatter.author),
            year: frontmatter.year,
          });
        }
      } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
      }
    }

    console.log(`Loaded ${this.mainSiteWorks.size} works from main site`);
  }

  async loadCandidateWorks() {
    console.log('Loading candidate works...');

    for (let i = 1; i <= 9; i++) {
      const batchPath = path.join(CONFIG.candidatesPath, `batch-${i}`, 'works');

      try {
        const files = await fs.readdir(batchPath);
        const mdFiles = files.filter(f => f.endsWith('.md'));

        for (const filename of mdFiles) {
          const filePath = path.join(batchPath, filename);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const frontmatter = this.parseFrontmatter(content);

            if (frontmatter) {
              this.candidateWorks.set(filename, {
                title: frontmatter.title || '',
                normalizedTitle: this.normalizeTitle(frontmatter.title || ''),
                author: this.normalizeAuthor(frontmatter.author),
                year: frontmatter.year,
                batch: i,
              });
            }
          } catch (error) {
            // Skip files with errors
          }
        }
      } catch (error) {
        // Batch might not exist
      }
    }

    console.log(`Loaded ${this.candidateWorks.size} candidate works`);
  }

  findDuplicates() {
    console.log('Checking for duplicates...');

    // Check by filename
    for (const [filename, candidateWork] of this.candidateWorks.entries()) {
      if (this.mainSiteWorks.has(filename)) {
        const mainWork = this.mainSiteWorks.get(filename);
        this.duplicates.byFilename.push({
          filename,
          candidateTitle: candidateWork.title,
          mainTitle: mainWork.title,
          batch: candidateWork.batch,
        });
      }
    }

    // Check by title
    const mainTitles = new Map();
    for (const [filename, work] of this.mainSiteWorks.entries()) {
      mainTitles.set(work.normalizedTitle, { filename, ...work });
    }

    for (const [filename, candidateWork] of this.candidateWorks.entries()) {
      const mainMatch = mainTitles.get(candidateWork.normalizedTitle);

      if (mainMatch && !this.duplicates.byFilename.find(d => d.filename === filename)) {
        this.duplicates.byTitle.push({
          candidateFilename: filename,
          mainFilename: mainMatch.filename,
          title: candidateWork.title,
          batch: candidateWork.batch,
        });
      }
    }

    // Check by title + author
    const mainTitleAuthor = new Map();
    for (const [filename, work] of this.mainSiteWorks.entries()) {
      const key = `${work.normalizedTitle}|${work.author}`;
      mainTitleAuthor.set(key, { filename, ...work });
    }

    for (const [filename, candidateWork] of this.candidateWorks.entries()) {
      const key = `${candidateWork.normalizedTitle}|${candidateWork.author}`;
      const mainMatch = mainTitleAuthor.get(key);

      if (mainMatch &&
          !this.duplicates.byFilename.find(d => d.filename === filename) &&
          !this.duplicates.byTitle.find(d => d.candidateFilename === filename)) {
        this.duplicates.byTitleAndAuthor.push({
          candidateFilename: filename,
          mainFilename: mainMatch.filename,
          title: candidateWork.title,
          author: candidateWork.author,
          batch: candidateWork.batch,
        });
      }
    }

    console.log(`Found ${this.duplicates.byFilename.length} exact filename matches`);
    console.log(`Found ${this.duplicates.byTitle.length} title matches`);
    console.log(`Found ${this.duplicates.byTitleAndAuthor.length} title+author matches`);
  }

  generateReport() {
    let report = '# Dhwani Duplicate Works Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += '## Summary\n\n';
    report += `- Total Main Site Works: ${this.mainSiteWorks.size}\n`;
    report += `- Total Candidate Works: ${this.candidateWorks.size}\n`;
    report += `- Exact Filename Duplicates: ${this.duplicates.byFilename.length}\n`;
    report += `- Title Duplicates: ${this.duplicates.byTitle.length}\n`;
    report += `- Title+Author Duplicates: ${this.duplicates.byTitleAndAuthor.length}\n`;

    const totalDuplicates = this.duplicates.byFilename.length +
                           this.duplicates.byTitle.length +
                           this.duplicates.byTitleAndAuthor.length;

    report += `- **Total Duplicates: ${totalDuplicates}**\n`;
    report += `- **Unique New Works: ${this.candidateWorks.size - totalDuplicates}**\n\n`;

    if (totalDuplicates === 0) {
      report += '## 🎉 No Duplicates Found!\n\n';
      report += 'All candidate works are unique and can be added to the main site.\n';
      return report;
    }

    // Exact filename matches
    if (this.duplicates.byFilename.length > 0) {
      report += '## Exact Filename Matches\n\n';
      report += 'These files have identical filenames in both locations:\n\n';

      for (const dup of this.duplicates.byFilename) {
        report += `### ${dup.filename}\n`;
        report += `- **Batch**: ${dup.batch}\n`;
        report += `- **Candidate Title**: ${dup.candidateTitle}\n`;
        report += `- **Main Site Title**: ${dup.mainTitle}\n`;
        report += `- **Action**: Remove from batch-${dup.batch} (already on site)\n\n`;
      }
    }

    // Title matches
    if (this.duplicates.byTitle.length > 0) {
      report += '## Title Matches (Different Filenames)\n\n';
      report += 'These works have the same title but different filenames:\n\n';

      for (const dup of this.duplicates.byTitle) {
        report += `### ${dup.title}\n`;
        report += `- **Batch**: ${dup.batch}\n`;
        report += `- **Candidate File**: ${dup.candidateFilename}\n`;
        report += `- **Main Site File**: ${dup.mainFilename}\n`;
        report += `- **Action**: Review manually - may be different editions\n\n`;
      }
    }

    // Title + Author matches
    if (this.duplicates.byTitleAndAuthor.length > 0) {
      report += '## Title + Author Matches\n\n';
      report += 'These works have the same title and author:\n\n';

      for (const dup of this.duplicates.byTitleAndAuthor) {
        report += `### ${dup.title} by ${dup.author}\n`;
        report += `- **Batch**: ${dup.batch}\n`;
        report += `- **Candidate File**: ${dup.candidateFilename}\n`;
        report += `- **Main Site File**: ${dup.mainFilename}\n`;
        report += `- **Action**: Likely duplicate, remove from candidates\n\n`;
      }
    }

    // Breakdown by batch
    report += '## Duplicates by Batch\n\n';
    const byBatch = {};

    [...this.duplicates.byFilename, ...this.duplicates.byTitle, ...this.duplicates.byTitleAndAuthor]
      .forEach(dup => {
        if (!byBatch[dup.batch]) byBatch[dup.batch] = [];
        byBatch[dup.batch].push(dup);
      });

    for (let i = 1; i <= 9; i++) {
      const count = byBatch[i]?.length || 0;
      report += `- **Batch ${i}**: ${count} duplicates\n`;
    }

    report += '\n## Recommended Actions\n\n';
    report += '1. **Exact Filename Matches**: Remove from candidate batches (already on site)\n';
    report += '2. **Title Matches**: Review manually - could be different editions or translations\n';
    report += '3. **Title+Author Matches**: Likely true duplicates, remove from candidates\n';
    report += '4. **Remaining Works**: Safe to add to main site after review\n';

    return report;
  }

  async run() {
    console.log('='.repeat(60));
    console.log('Dhwani Duplicate Checker');
    console.log('='.repeat(60));
    console.log();

    await this.loadMainSiteWorks();
    await this.loadCandidateWorks();
    this.findDuplicates();

    const report = this.generateReport();

    await fs.writeFile(CONFIG.outputPath, report, 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log('Duplicate Check Complete!');
    console.log('='.repeat(60));
    console.log(`\nReport saved to: ${CONFIG.outputPath}`);
    console.log('\nSummary:');
    console.log(`- Exact filename duplicates: ${this.duplicates.byFilename.length}`);
    console.log(`- Title duplicates: ${this.duplicates.byTitle.length}`);
    console.log(`- Title+Author duplicates: ${this.duplicates.byTitleAndAuthor.length}`);

    const totalDuplicates = this.duplicates.byFilename.length +
                           this.duplicates.byTitle.length +
                           this.duplicates.byTitleAndAuthor.length;

    console.log(`- Total duplicates: ${totalDuplicates}`);
    console.log(`- Unique new works: ${this.candidateWorks.size - totalDuplicates}`);
  }
}

const checker = new DuplicateChecker();
checker.run().catch(console.error);

export default DuplicateChecker;
