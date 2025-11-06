#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const matter = require('gray-matter');

const WORKS_DIR = 'src/content/works';
const BROKEN_LINKS = JSON.parse(readFileSync('verification-reports/broken-links-2025-11-05.json', 'utf8'));
const PROBLEM_LINKS = JSON.parse(readFileSync('verification-reports/problem-links-robust-2025-11-05.json', 'utf8'));

// Patterns that indicate "fluffy" or filler content
const FLUFF_PATTERNS = [
  /stands as (?:a|an|one of the)/gi,
  /represents (?:a|an|one of the)/gi,
  /this (?:comprehensive|remarkable|significant|important|invaluable|extraordinary|exceptional) (?:work|text|collection|volume)/gi,
  /offers unprecedented/gi,
  /provides (?:invaluable|critical|essential|crucial) insights/gi,
  /demonstrates (?:remarkable|extraordinary|exceptional|unprecedented)/gi,
  /particularly significant in/gi,
  /not only .+ but also/gi,
  /transcends simple categorization/gi,
  /offering contemporary scholars/gi,
  /by systematically/gi,
];

// Count fluff score
function calculateFluffScore(text) {
  let score = 0;
  FLUFF_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) score += matches.length;
  });
  return score;
}

// Analyze all works
function analyzeWorks() {
  const files = readdirSync(WORKS_DIR).filter(f => f.endsWith('.md'));

  const stats = {
    total: files.length,
    withBrokenLinks: 0,
    withProblematicLinks: 0,
    singleSourceOnly: 0,
    multipleBackups: 0,
    noReferences: 0,
    highFluffScore: 0,
    veryLongDescriptions: 0,
    shortDescriptions: 0,
    veryLongBodies: 0,
    emptyBodies: 0,
    fluffExamples: [],
    singleSourceExamples: [],
    brokenLinkExamples: [],
    descriptionLengths: [],
    bodyLengths: [],
    fluffScores: [],
  };

  const brokenFileMap = new Map();
  BROKEN_LINKS.forEach(entry => {
    if (entry.file) brokenFileMap.set(entry.file, true);
  });

  const problemFileMap = new Map();
  PROBLEM_LINKS.forEach(entry => {
    if (entry.file) problemFileMap.set(entry.file, true);
  });

  files.forEach(file => {
    const path = join(WORKS_DIR, file);
    const content = readFileSync(path, 'utf8');
    const { data, content: body } = matter(content);

    // Check links
    if (brokenFileMap.has(file)) {
      stats.withBrokenLinks++;
      if (stats.brokenLinkExamples.length < 10) {
        stats.brokenLinkExamples.push({
          file,
          title: data.title,
        });
      }
    }

    if (problemFileMap.has(file)) {
      stats.withProblematicLinks++;
    }

    // Check source backup availability
    const sources = data.sources || [];
    if (sources.length === 1) {
      stats.singleSourceOnly++;
      if (stats.singleSourceExamples.length < 15) {
        stats.singleSourceExamples.push({
          file,
          title: data.title,
          source: sources[0],
        });
      }
    } else if (sources.length > 1) {
      stats.multipleBackups++;
    }

    // Check references
    const references = data.references || [];
    if (references.length === 0) {
      stats.noReferences++;
    }

    // Check description quality
    const description = data.description || '';
    const descLength = description.length;
    stats.descriptionLengths.push(descLength);

    if (descLength < 150) {
      stats.shortDescriptions++;
    } else if (descLength > 1500) {
      stats.veryLongDescriptions++;
    }

    // Check fluff
    const fluffScore = calculateFluffScore(description);
    stats.fluffScores.push(fluffScore);

    if (fluffScore >= 5) {
      stats.highFluffScore++;
      if (stats.fluffExamples.length < 15) {
        stats.fluffExamples.push({
          file,
          title: data.title,
          score: fluffScore,
          description: description.substring(0, 300) + '...',
        });
      }
    }

    // Check body content
    const bodyLength = body.trim().length;
    stats.bodyLengths.push(bodyLength);

    if (bodyLength === 0) {
      stats.emptyBodies++;
    } else if (bodyLength > 10000) {
      stats.veryLongBodies++;
    }
  });

  // Calculate statistics
  const avgDescLength = stats.descriptionLengths.reduce((a, b) => a + b, 0) / stats.total;
  const avgBodyLength = stats.bodyLengths.reduce((a, b) => a + b, 0) / stats.total;
  const avgFluffScore = stats.fluffScores.reduce((a, b) => a + b, 0) / stats.total;

  const medianDescLength = stats.descriptionLengths.sort((a, b) => a - b)[Math.floor(stats.total / 2)];
  const medianBodyLength = stats.bodyLengths.sort((a, b) => a - b)[Math.floor(stats.total / 2)];

  console.log('\n='.repeat(80));
  console.log('DHWANI PORTAL ANALYSIS REPORT');
  console.log('='.repeat(80));
  console.log();

  console.log('📊 OVERALL STATISTICS');
  console.log('-'.repeat(80));
  console.log(`Total works: ${stats.total}`);
  console.log();

  console.log('🔗 LINK QUALITY');
  console.log('-'.repeat(80));
  console.log(`Works with broken links: ${stats.withBrokenLinks} (${(stats.withBrokenLinks/stats.total*100).toFixed(1)}%)`);
  console.log(`Works with problematic links: ${stats.withProblematicLinks} (${(stats.withProblematicLinks/stats.total*100).toFixed(1)}%)`);
  console.log();

  console.log('💾 BACKUP AVAILABILITY');
  console.log('-'.repeat(80));
  console.log(`Works with single source only: ${stats.singleSourceOnly} (${(stats.singleSourceOnly/stats.total*100).toFixed(1)}%)`);
  console.log(`Works with multiple backups: ${stats.multipleBackups} (${(stats.multipleBackups/stats.total*100).toFixed(1)}%)`);
  console.log(`Works with no references: ${stats.noReferences} (${(stats.noReferences/stats.total*100).toFixed(1)}%)`);
  console.log();

  console.log('📝 DESCRIPTION QUALITY');
  console.log('-'.repeat(80));
  console.log(`Average description length: ${avgDescLength.toFixed(0)} characters`);
  console.log(`Median description length: ${medianDescLength} characters`);
  console.log(`Short descriptions (<150 chars): ${stats.shortDescriptions} (${(stats.shortDescriptions/stats.total*100).toFixed(1)}%)`);
  console.log(`Very long descriptions (>1500 chars): ${stats.veryLongDescriptions} (${(stats.veryLongDescriptions/stats.total*100).toFixed(1)}%)`);
  console.log();
  console.log(`Average fluff score: ${avgFluffScore.toFixed(1)}`);
  console.log(`High fluff score (≥5): ${stats.highFluffScore} (${(stats.highFluffScore/stats.total*100).toFixed(1)}%)`);
  console.log();

  console.log('📄 BODY CONTENT');
  console.log('-'.repeat(80));
  console.log(`Average body length: ${avgBodyLength.toFixed(0)} characters`);
  console.log(`Median body length: ${medianBodyLength} characters`);
  console.log(`Empty bodies: ${stats.emptyBodies} (${(stats.emptyBodies/stats.total*100).toFixed(1)}%)`);
  console.log(`Very long bodies (>10000 chars): ${stats.veryLongBodies} (${(stats.veryLongBodies/stats.total*100).toFixed(1)}%)`);
  console.log();

  console.log('🔴 EXAMPLES: WORKS WITH BROKEN LINKS (first 10)');
  console.log('-'.repeat(80));
  stats.brokenLinkExamples.forEach((ex, i) => {
    console.log(`${i+1}. ${ex.title}`);
    console.log(`   File: ${ex.file}`);
  });
  console.log();

  console.log('💿 EXAMPLES: WORKS WITH SINGLE SOURCE ONLY (first 15)');
  console.log('-'.repeat(80));
  stats.singleSourceExamples.forEach((ex, i) => {
    console.log(`${i+1}. ${ex.title}`);
    console.log(`   Source: ${ex.source.name} - ${ex.source.url}`);
  });
  console.log();

  console.log('🎈 EXAMPLES: HIGH FLUFF SCORE (first 15)');
  console.log('-'.repeat(80));
  stats.fluffExamples.forEach((ex, i) => {
    console.log(`${i+1}. ${ex.title} (score: ${ex.score})`);
    console.log(`   ${ex.description}`);
    console.log();
  });

  console.log('='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80));
}

analyzeWorks();
