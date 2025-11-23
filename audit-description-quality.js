#!/usr/bin/env node

/**
 * AI-powered description quality audit
 *
 * Evaluates each description for:
 * - Scholarly tone and precision
 * - Historical context and specificity
 * - Marketing language absence
 * - Indian cultural relevance
 * - Appropriate length
 * - Factual accuracy indicators
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  worksPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/src/content/works',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/quality-audit-report.json',
  batchSize: 10,
  delayBetweenBatches: 1000,
  sampleSize: 50, // Sample works for faster audit
};

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable not set');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class QualityAuditor {
  constructor() {
    this.stats = {
      total: 0,
      audited: 0,
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      errors: 0,
    };
    this.results = [];
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

  async auditDescription(work) {
    const fm = work.frontmatter;

    const prompt = `You are auditing the quality of a scholarly description for an Indian cultural heritage work.

DESCRIPTION TO AUDIT:
${fm.description}

WORK METADATA:
Title: ${fm.title}
Author: ${Array.isArray(fm.author) ? fm.author.join(', ') : fm.author}
Year: ${fm.year || 'Unknown'}
Language: ${Array.isArray(fm.language) ? fm.language.join(', ') : fm.language}

TASK: Evaluate this description on the following criteria and provide a JSON response.

EVALUATION CRITERIA:

1. SCHOLARLY_TONE (0-10): Academic, encyclopedic language
   - 10: Sophisticated academic vocabulary, precise terminology
   - 5: Adequate but could be more scholarly
   - 0: Informal, casual, or promotional tone

2. HISTORICAL_CONTEXT (0-10): Dates, periods, temporal information
   - 10: Rich historical context with specific dates/periods
   - 5: Some temporal information
   - 0: No historical context

3. SPECIFICITY (0-10): Concrete facts, names, details
   - 10: Highly specific with many concrete details
   - 5: Some specifics but also generalities
   - 0: Entirely vague and generic

4. INDIAN_RELEVANCE (0-10): Connection to Indian culture/history
   - 10: Clearly articulates Indian cultural/historical significance
   - 5: Mentions India but weak connection
   - 0: No Indian context

5. MARKETING_FREE (0-10): Absence of promotional language
   - 10: Completely free of marketing language
   - 5: Some superlatives but mostly scholarly
   - 0: Heavy marketing/promotional language

6. PREAMBLE_FREE (0-10): Starts directly with content
   - 10: No preamble, direct start
   - 0: Has preamble like "Here's a description:"

7. LENGTH_APPROPRIATE (0-10): 200-300 words is ideal
   - 10: 200-300 words
   - 8: 150-200 or 300-350 words
   - 5: 100-150 or 350-400 words
   - 2: 50-100 or 400+ words
   - 0: Under 50 words

RESPOND WITH ONLY THIS JSON (no markdown, no explanation):
{
  "scholarly_tone": <score>,
  "historical_context": <score>,
  "specificity": <score>,
  "indian_relevance": <score>,
  "marketing_free": <score>,
  "preamble_free": <score>,
  "length_appropriate": <score>,
  "word_count": <actual word count>,
  "overall_score": <average of all scores>,
  "grade": "<EXCELLENT|GOOD|FAIR|POOR>",
  "key_strengths": ["<strength 1>", "<strength 2>"],
  "key_weaknesses": ["<weakness 1>", "<weakness 2>"],
  "one_sentence_feedback": "<concise feedback>"
}

Grade criteria:
- EXCELLENT: overall_score >= 8.5
- GOOD: overall_score >= 7.0
- FAIR: overall_score >= 5.0
- POOR: overall_score < 5.0`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const response = message.content[0].text.trim();

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      console.error(`  Audit Error: ${error.message}`);
      return null;
    }
  }

  async auditWork(filename) {
    try {
      const filePath = path.join(CONFIG.worksPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      const parsed = this.parseFrontmatter(content);
      if (!parsed) {
        this.stats.errors++;
        return null;
      }

      const fm = parsed.frontmatter;
      const audit = await this.auditDescription(parsed);

      if (!audit) {
        this.stats.errors++;
        return null;
      }

      // Update stats
      this.stats.audited++;
      switch (audit.grade) {
        case 'EXCELLENT': this.stats.excellent++; break;
        case 'GOOD': this.stats.good++; break;
        case 'FAIR': this.stats.fair++; break;
        case 'POOR': this.stats.poor++; break;
      }

      const result = {
        filename,
        title: fm.title.substring(0, 80),
        ...audit,
      };

      this.results.push(result);

      // Display result
      const gradeEmoji = {
        'EXCELLENT': '🌟',
        'GOOD': '✓',
        'FAIR': '⚠',
        'POOR': '✗'
      };

      console.log(`${gradeEmoji[audit.grade]} ${audit.grade} (${audit.overall_score.toFixed(1)}/10) - ${fm.title.substring(0, 50)}...`);
      console.log(`   ${audit.one_sentence_feedback}`);

      return result;

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      this.stats.errors++;
      return null;
    }
  }

  async audit() {
    console.log('='.repeat(70));
    console.log('AI-Powered Description Quality Audit');
    console.log('='.repeat(70));
    console.log();

    // Get all works
    const files = await fs.readdir(CONFIG.worksPath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    // Sample random works if sampleSize is set
    let worksToAudit = mdFiles;
    if (CONFIG.sampleSize && mdFiles.length > CONFIG.sampleSize) {
      worksToAudit = mdFiles
        .sort(() => Math.random() - 0.5)
        .slice(0, CONFIG.sampleSize);
      console.log(`Sampling ${CONFIG.sampleSize} random works from ${mdFiles.length} total\n`);
    } else {
      console.log(`Auditing all ${mdFiles.length} works\n`);
    }

    this.stats.total = worksToAudit.length;

    // Process in batches
    for (let i = 0; i < worksToAudit.length; i += CONFIG.batchSize) {
      const batch = worksToAudit.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(worksToAudit.length / CONFIG.batchSize);

      console.log(`\n${'='.repeat(70)}`);
      console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} works)`);
      console.log('='.repeat(70));

      for (const filename of batch) {
        await this.auditWork(filename);
      }

      if (i + CONFIG.batchSize < worksToAudit.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }

    // Calculate statistics
    const avgScores = {
      scholarly_tone: 0,
      historical_context: 0,
      specificity: 0,
      indian_relevance: 0,
      marketing_free: 0,
      preamble_free: 0,
      length_appropriate: 0,
      overall_score: 0,
    };

    this.results.forEach(r => {
      Object.keys(avgScores).forEach(key => {
        avgScores[key] += r[key] || 0;
      });
    });

    Object.keys(avgScores).forEach(key => {
      avgScores[key] = (avgScores[key] / this.stats.audited).toFixed(2);
    });

    // Identify best and worst
    const sorted = [...this.results].sort((a, b) => b.overall_score - a.overall_score);
    const best = sorted.slice(0, 5);
    const worst = sorted.slice(-5).reverse();

    // Generate report
    const report = {
      audit_date: new Date().toISOString(),
      sample_size: this.stats.total,
      total_works: mdFiles.length,
      statistics: {
        audited: this.stats.audited,
        excellent: this.stats.excellent,
        good: this.stats.good,
        fair: this.stats.fair,
        poor: this.stats.poor,
        errors: this.stats.errors,
      },
      average_scores: avgScores,
      grade_distribution: {
        excellent: `${((this.stats.excellent / this.stats.audited) * 100).toFixed(1)}%`,
        good: `${((this.stats.good / this.stats.audited) * 100).toFixed(1)}%`,
        fair: `${((this.stats.fair / this.stats.audited) * 100).toFixed(1)}%`,
        poor: `${((this.stats.poor / this.stats.audited) * 100).toFixed(1)}%`,
      },
      best_descriptions: best,
      worst_descriptions: worst,
      all_results: this.results,
    };

    // Save report
    await fs.writeFile(CONFIG.outputPath, JSON.stringify(report, null, 2), 'utf-8');

    // Display summary
    console.log('\n' + '='.repeat(70));
    console.log('Quality Audit Complete!');
    console.log('='.repeat(70));
    console.log(`\nAudited: ${this.stats.audited}/${this.stats.total} works`);
    console.log('\nGrade Distribution:');
    console.log(`  🌟 EXCELLENT: ${this.stats.excellent} (${report.grade_distribution.excellent})`);
    console.log(`  ✓  GOOD:      ${this.stats.good} (${report.grade_distribution.good})`);
    console.log(`  ⚠  FAIR:      ${this.stats.fair} (${report.grade_distribution.fair})`);
    console.log(`  ✗  POOR:      ${this.stats.poor} (${report.grade_distribution.poor})`);
    console.log('\nAverage Scores (out of 10):');
    console.log(`  Overall:           ${avgScores.overall_score}`);
    console.log(`  Scholarly Tone:    ${avgScores.scholarly_tone}`);
    console.log(`  Historical Context: ${avgScores.historical_context}`);
    console.log(`  Specificity:       ${avgScores.specificity}`);
    console.log(`  Indian Relevance:  ${avgScores.indian_relevance}`);
    console.log(`  Marketing Free:    ${avgScores.marketing_free}`);
    console.log(`  Preamble Free:     ${avgScores.preamble_free}`);
    console.log(`  Length:            ${avgScores.length_appropriate}`);

    console.log('\n📊 Full report saved to: quality-audit-report.json');
    console.log('\nView with: cat quality-audit-report.json | jq');
  }

  async run() {
    await this.audit();
  }
}

const auditor = new QualityAuditor();
auditor.run().catch(console.error);

export default QualityAuditor;
