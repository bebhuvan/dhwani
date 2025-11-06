#!/usr/bin/env node

/**
 * Enhanced audit with quality checks for descriptions
 *
 * Checks for:
 * - Length (word count)
 * - Generic/template descriptions
 * - Missing Indian relevance
 * - Missing historical context
 * - Marketing language
 * - Vague language
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  worksPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/audit-report-v2.json',
};

class EnhancedAuditor {
  constructor() {
    this.issues = {
      clumsyTitles: [],
      missingContent: [],
      longDescriptions: [],
      shortDescriptions: [],
      catalogingMetadata: [],
      genericDescriptions: [],
      noIndianRelevance: [],
      noHistoricalContext: [],
      marketingLanguage: [],
      vagueBrief: [],
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

  // TITLE CHECKS
  hasCatalogingMetadata(title) {
    return /\$[a-z]/i.test(title);
  }

  isTitleTooLong(title) {
    return title.length > 100;
  }

  hasExcessiveSubtitles(title) {
    const colons = (title.match(/:/g) || []).length;
    const semicolons = (title.match(/;/g) || []).length;
    return colons > 2 || semicolons > 3;
  }

  // CONTENT CHECKS
  isMissingContent(content) {
    if (!content || content.length < 50) return true;
    if (!content.includes('##') && !content.includes('#')) return true;
    return false;
  }

  getWordCount(text) {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  // DESCRIPTION QUALITY CHECKS

  isGenericDescription(description) {
    // Check for generic template phrases
    const genericPhrases = [
      /^This (?:work|book|text|edition) (?:is|was|presents)/i,
      /is a (?:work|book|text)/i,
      /(?:provides|offers) (?:a|an) (?:comprehensive|detailed|thorough)/i,
      /digitized from original sources/i,
      /available on archive\.org/i,
      /preserved through digitization/i,
    ];

    let genericScore = 0;
    for (const phrase of genericPhrases) {
      if (phrase.test(description)) genericScore++;
    }

    // If more than 2 generic phrases, likely template
    return genericScore >= 2;
  }

  lacksIndianRelevance(description, title) {
    // Check if description explains Indian connection
    const indianKeywords = [
      /india/i,
      /indian/i,
      /sanskrit/i,
      /hindu/i,
      /bengal/i,
      /tamil/i,
      /punjab/i,
      /maharashtra/i,
      /mughal/i,
      /british (?:india|raj)/i,
      /subcontinent/i,
      /indology/i,
      /vedic/i,
      /buddhist/i,
      /jain/i,
    ];

    // Title has Indian context, but description doesn't mention it
    const titleHasIndian = indianKeywords.some(kw => kw.test(title));
    const descHasIndian = indianKeywords.some(kw => kw.test(description));

    return titleHasIndian && !descHasIndian;
  }

  lacksHistoricalContext(description) {
    // Check for temporal/historical information
    const contextIndicators = [
      /\d{2,4}\s*(?:CE|AD|BC|century)/i,  // Dates
      /(?:during|in the|published|written|composed)/i,  // Temporal markers
      /(?:period|era|age|reign)/i,  // Historical periods
      /(?:author|scholar|translator)/i,  // Attribution
      /(?:significance|important|influence)/i,  // Impact
    ];

    const contextScore = contextIndicators.filter(ind => ind.test(description)).length;
    return contextScore < 2;  // Needs at least 2 context indicators
  }

  hasMarketingLanguage(description) {
    // Check for empty superlatives
    const marketingPhrases = [
      /essential (?:reading|resource|work)/i,
      /must-read/i,
      /(?:invaluable|indispensable) (?:resource|work|text)/i,
      /(?:comprehensive|definitive) (?:guide|work|study)/i,
      /timeless (?:classic|work)/i,
      /(?:highly|widely) acclaimed/i,
    ];

    // Also check if superlative is unsubstantiated
    const unsubstantiatedSuperlatives = [
      /(?:most|best) (?:important|significant|comprehensive)/i,
    ];

    return marketingPhrases.some(phrase => phrase.test(description)) ||
           unsubstantiatedSuperlatives.some(phrase => phrase.test(description));
  }

  isVagueOrBrief(description, wordCount) {
    // Even if length is OK, check for vague language
    const vagueIndicators = [
      /various (?:aspects|topics|subjects)/i,
      /different (?:aspects|areas|topics)/i,
      /(?:deals with|discusses|explores) (?:a|the) (?:wide|broad) range/i,
      /(?:among other (?:things|topics))/i,
      /etc\./,
    ];

    const vagueScore = vagueIndicators.filter(ind => ind.test(description)).length;

    // If word count is OK but uses many vague phrases
    return wordCount >= 100 && wordCount <= 350 && vagueScore >= 2;
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

      // TITLE CHECKS
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

      // CONTENT CHECKS
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

      // DESCRIPTION LENGTH CHECKS
      const descWordCount = this.getWordCount(description);

      if (descWordCount > 350) {
        workIssues.push('description-too-long');
        this.issues.longDescriptions.push({
          filename,
          title: title.substring(0, 60),
          wordCount: descWordCount,
          issue: `${descWordCount} words (should be < 350)`,
        });
        hasIssue = true;
      }

      if (descWordCount < 100) {
        workIssues.push('description-too-short');
        this.issues.shortDescriptions.push({
          filename,
          title: title.substring(0, 60),
          wordCount: descWordCount,
          issue: `${descWordCount} words (should be 150-300)`,
        });
        hasIssue = true;
      }

      // DESCRIPTION QUALITY CHECKS
      if (this.isGenericDescription(description)) {
        workIssues.push('generic-description');
        this.issues.genericDescriptions.push({
          filename,
          title: title.substring(0, 60),
          issue: 'Generic/template language',
          preview: description.substring(0, 100),
        });
        hasIssue = true;
      }

      if (this.lacksIndianRelevance(description, title)) {
        workIssues.push('no-indian-relevance');
        this.issues.noIndianRelevance.push({
          filename,
          title: title.substring(0, 60),
          issue: 'Indian relevance not explained',
        });
        hasIssue = true;
      }

      if (this.lacksHistoricalContext(description)) {
        workIssues.push('no-historical-context');
        this.issues.noHistoricalContext.push({
          filename,
          title: title.substring(0, 60),
          issue: 'Missing historical context',
        });
        hasIssue = true;
      }

      if (this.hasMarketingLanguage(description)) {
        workIssues.push('marketing-language');
        this.issues.marketingLanguage.push({
          filename,
          title: title.substring(0, 60),
          issue: 'Contains marketing/superlative language',
        });
        hasIssue = true;
      }

      if (this.isVagueOrBrief(description, descWordCount)) {
        workIssues.push('vague-description');
        this.issues.vagueBrief.push({
          filename,
          title: title.substring(0, 60),
          issue: 'Vague language despite adequate length',
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
    console.log('Enhanced Audit with Quality Checks');
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
        // Technical issues
        catalogingMetadata: this.issues.catalogingMetadata.length,
        clumsyTitles: this.issues.clumsyTitles.length,
        missingContent: this.issues.missingContent.length,

        // Length issues
        longDescriptions: this.issues.longDescriptions.length,
        shortDescriptions: this.issues.shortDescriptions.length,

        // Quality issues
        genericDescriptions: this.issues.genericDescriptions.length,
        noIndianRelevance: this.issues.noIndianRelevance.length,
        noHistoricalContext: this.issues.noHistoricalContext.length,
        marketingLanguage: this.issues.marketingLanguage.length,
        vagueBrief: this.issues.vagueBrief.length,
      },
      issues: this.issues,
    };

    await fs.writeFile(
      CONFIG.outputPath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );

    console.log('\n' + '='.repeat(60));
    console.log('Enhanced Audit Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal works: ${this.stats.total}`);
    console.log(`Clean: ${this.stats.clean} (${report.summary.percentClean}%)`);
    console.log(`Has issues: ${this.stats.hasIssues}`);

    console.log('\n📐 Technical Issues:');
    console.log(`  • Cataloging metadata: ${report.issueBreakdown.catalogingMetadata}`);
    console.log(`  • Clumsy titles: ${report.issueBreakdown.clumsyTitles}`);
    console.log(`  • Missing content: ${report.issueBreakdown.missingContent}`);

    console.log('\n📏 Length Issues:');
    console.log(`  • Short descriptions (<100w): ${report.issueBreakdown.shortDescriptions}`);
    console.log(`  • Long descriptions (>350w): ${report.issueBreakdown.longDescriptions}`);

    console.log('\n🎯 Quality Issues:');
    console.log(`  • Generic/template descriptions: ${report.issueBreakdown.genericDescriptions}`);
    console.log(`  • No Indian relevance explained: ${report.issueBreakdown.noIndianRelevance}`);
    console.log(`  • No historical context: ${report.issueBreakdown.noHistoricalContext}`);
    console.log(`  • Marketing language: ${report.issueBreakdown.marketingLanguage}`);
    console.log(`  • Vague despite OK length: ${report.issueBreakdown.vagueBrief}`);

    console.log(`\n📄 Detailed report: ${CONFIG.outputPath}`);
    console.log('\n📊 View commands:');
    console.log(`  cat audit-report-v2.json | jq .summary`);
    console.log(`  cat audit-report-v2.json | jq .issueBreakdown`);
    console.log(`  cat audit-report-v2.json | jq .issues.genericDescriptions`);
  }

  async run() {
    await this.audit();
  }
}

const auditor = new EnhancedAuditor();
auditor.run().catch(console.error);

export default EnhancedAuditor;
