#!/usr/bin/env node

/**
 * Frontmatter Description Analyzer
 *
 * Analyzes description lengths in work frontmatter to identify files needing optimization
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKS_DIR = path.join(__dirname, '../src/content/works');

function analyzeDescriptions() {
  const files = fs.readdirSync(WORKS_DIR).filter(f => f.endsWith('.md'));
  const analysis = [];

  for (const file of files) {
    const filePath = path.join(WORKS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    try {
      const { data } = matter(content);
      const description = data.description || '';
      const wordCount = description.split(/\s+/).filter(w => w.length > 0).length;
      const charCount = description.length;

      analysis.push({
        file,
        wordCount,
        charCount,
        title: data.title || 'Untitled'
      });
    } catch (error) {
      console.error(`Error parsing ${file}:`, error.message);
    }
  }

  // Sort by word count descending
  analysis.sort((a, b) => b.wordCount - a.wordCount);

  return analysis;
}

function generateReport(analysis) {
  console.log('\n=== FRONTMATTER DESCRIPTION ANALYSIS ===\n');
  console.log(`Total files: ${analysis.length}`);

  const avgWords = Math.round(analysis.reduce((sum, a) => sum + a.wordCount, 0) / analysis.length);
  const medianWords = analysis[Math.floor(analysis.length / 2)].wordCount;

  console.log(`Average words: ${avgWords}`);
  console.log(`Median words: ${medianWords}`);

  const longDescriptions = analysis.filter(a => a.wordCount > 100);
  const veryLongDescriptions = analysis.filter(a => a.wordCount > 200);

  console.log(`\nDescriptions > 100 words: ${longDescriptions.length} (${Math.round(longDescriptions.length / analysis.length * 100)}%)`);
  console.log(`Descriptions > 200 words: ${veryLongDescriptions.length} (${Math.round(veryLongDescriptions.length / analysis.length * 100)}%)`);

  console.log('\n=== TOP 20 LONGEST DESCRIPTIONS ===\n');
  analysis.slice(0, 20).forEach((a, i) => {
    console.log(`${i + 1}. ${a.wordCount} words - ${a.title}`);
    console.log(`   ${a.file}`);
  });

  console.log('\n=== RECOMMENDATIONS ===\n');
  console.log('Target: 50-75 word descriptions (concise, essential context only)');
  console.log(`Files needing optimization: ${longDescriptions.length}`);
  console.log('Strategy: Move detailed context to body "Historical Context" section');

  return {
    total: analysis.length,
    needsOptimization: longDescriptions.length,
    critical: veryLongDescriptions.length,
    analysis
  };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const analysis = analyzeDescriptions();
  const report = generateReport(analysis);

  // Save detailed report
  const reportPath = path.join(__dirname, '../FRONTMATTER_ANALYSIS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}\n`);
}

export { analyzeDescriptions, generateReport };
