#!/usr/bin/env node

/**
 * Audit existing works for quality issues
 *
 * Identifies:
 * - Clumsy titles (cataloging metadata, too long)
 * - Missing body content
 * - Over/under-length descriptions
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  worksPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/audit-report.json',
};

class WorksAuditor {
  constructor() {
    this.issues = {
      clumsyTitles: [],
      missingContent: [],
      longDescriptions: [],
      shortDescriptions: [],
      catalogingMetadata: [],
    };
    this.stats = {
      total: 0,
      clean: 0,
      hasIssues: 0,
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

  hasCatalogingMetadata(title) {
    // MARC field codes
    const marcCodes = /\$[a-z]/i;
    return marcCodes.test(title);
  }

  isTitleTooLong(title) {
    return title.length > 100;
  }

  hasExcessiveSubtitles(title) {
    // More than 2 colons or 3 semicolons
    const colons = (title.match(/:/g) || []).length;
    const semicolons = (title.match(/;/g) || []).length;
    return colons > 2 || semicolons > 3;
  }

  isMissingContent(content) {
    // Content is empty or very short (< 50 chars)
    // Or has no markdown sections
    if (!content || content.length < 50) return true;
    if (!content.includes('##') && !content.includes('#')) return true;
    return false;
  }

  getWordCount(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  async auditWork(filename) {
    try {
      const filePath = path.join(CONFIG.worksPath, filename);
      const fileContent = await fs.readFile(filePath, 'utf-8');

      const parsed = this.parseFrontmatter(fileContent);
      if (!parsed) {
        console.log(`⚠ ${filename} - could not parse`);
        return;
      }

      this.stats.total++;

      const fm = parsed.frontmatter;
      const title = fm.title || '';
      const description = fm.description || '';
      const bodyContent = parsed.content;

      let hasIssue = false;
      const workIssues = [];

      // Check title issues
      if (this.hasCatalogingMetadata(title)) {
        workIssues.push('cataloging-metadata');
        this.issues.catalogingMetadata.push({
          filename,
          title,
          issue: 'Contains MARC codes ($a, $b, etc.)',
        });
        hasIssue = true;
      }

      if (this.isTitleTooLong(title)) {
        workIssues.push('title-too-long');
        this.issues.clumsyTitles.push({
          filename,
          title,
          length: title.length,
          issue: 'Title over 100 characters',
        });
        hasIssue = true;
      }

      if (this.hasExcessiveSubtitles(title)) {
        workIssues.push('excessive-subtitles');
        if (!workIssues.includes('title-too-long')) {
          this.issues.clumsyTitles.push({
            filename,
            title,
            issue: 'Excessive colons/semicolons',
          });
        }
        hasIssue = true;
      }

      // Check missing content
      if (this.isMissingContent(bodyContent)) {
        workIssues.push('missing-content');
        this.issues.missingContent.push({
          filename,
          title: title.substring(0, 60),
          contentLength: bodyContent.length,
          issue: 'No substantial body content',
        });
        hasIssue = true;
      }

      // Check description length
      const descWordCount = this.getWordCount(description);

      if (descWordCount > 350) {
        workIssues.push('description-too-long');
        this.issues.longDescriptions.push({
          filename,
          title: title.substring(0, 60),
          wordCount: descWordCount,
          issue: `Description ${descWordCount} words (should be < 350)`,
        });
        hasIssue = true;
      }

      if (descWordCount < 100) {
        workIssues.push('description-too-short');
        this.issues.shortDescriptions.push({
          filename,
          title: title.substring(0, 60),
          wordCount: descWordCount,
          issue: `Description ${descWordCount} words (should be 150-300)`,
        });
        hasIssue = true;
      }

      if (hasIssue) {
        this.stats.hasIssues++;
        console.log(`⚠ ${filename}: ${workIssues.join(', ')}`);
      } else {
        this.stats.clean++;
      }

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
    }
  }

  async audit() {
    console.log('='.repeat(60));
    console.log('Auditing Existing Works');
    console.log('='.repeat(60));
    console.log();

    const files = await fs.readdir(CONFIG.worksPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    console.log(`Found ${mdFiles.length} works to audit\n`);

    for (const filename of mdFiles) {
      await this.auditWork(filename);
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.stats.total,
        clean: this.stats.clean,
        hasIssues: this.stats.hasIssues,
        percentClean: ((this.stats.clean / this.stats.total) * 100).toFixed(1),
      },
      issueBreakdown: {
        catalogingMetadata: this.issues.catalogingMetadata.length,
        clumsyTitles: this.issues.clumsyTitles.length,
        missingContent: this.issues.missingContent.length,
        longDescriptions: this.issues.longDescriptions.length,
        shortDescriptions: this.issues.shortDescriptions.length,
      },
      issues: this.issues,
    };

    await fs.writeFile(
      CONFIG.outputPath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );

    console.log('\n' + '='.repeat(60));
    console.log('Audit Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal works: ${this.stats.total}`);
    console.log(`Clean: ${this.stats.clean} (${report.summary.percentClean}%)`);
    console.log(`Has issues: ${this.stats.hasIssues}`);
    console.log('\nIssue Breakdown:');
    console.log(`  • Cataloging metadata: ${report.issueBreakdown.catalogingMetadata}`);
    console.log(`  • Clumsy titles: ${report.issueBreakdown.clumsyTitles}`);
    console.log(`  • Missing content: ${report.issueBreakdown.missingContent}`);
    console.log(`  • Long descriptions (>350w): ${report.issueBreakdown.longDescriptions}`);
    console.log(`  • Short descriptions (<100w): ${report.issueBreakdown.shortDescriptions}`);
    console.log(`\nDetailed report: ${CONFIG.outputPath}`);
    console.log('\nView summary:');
    console.log(`  cat audit-report.json | jq .summary`);
    console.log('\nView specific issues:');
    console.log(`  cat audit-report.json | jq .issues.missingContent`);
  }

  async run() {
    await this.audit();
  }
}

const auditor = new WorksAuditor();
auditor.run().catch(console.error);

export default WorksAuditor;
