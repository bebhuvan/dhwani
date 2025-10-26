#!/usr/bin/env node

/**
 * Duplicate Detector
 * Detects potential duplicates between new works and existing corpus
 */

import fs from 'fs';
import path from 'path';

/**
 * Calculate Levenshtein distance
 */
function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio (0-1)
 */
function similarityRatio(a, b) {
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return 1 - (distance / maxLen);
}

/**
 * Normalize text for comparison
 */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract title and author from frontmatter
 */
function extractMetadata(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = match[1];
  const titleMatch = fm.match(/title:\s*"([^"]+)"/);
  const authorMatch = fm.match(/author:\s*\[([\s\S]*?)\]/);
  const sourceMatch = fm.match(/url:\s*"([^"]+)"/);

  return {
    title: titleMatch ? titleMatch[1] : null,
    author: authorMatch ? authorMatch[1].replace(/"/g, '').split(',').map(a => a.trim()) : [],
    source: sourceMatch ? sourceMatch[1] : null
  };
}

/**
 * Check if two works are potential duplicates
 */
function checkDuplicate(work1, work2, threshold = 0.85) {
  const meta1 = extractMetadata(work1.content);
  const meta2 = extractMetadata(work2.content);

  if (!meta1 || !meta2) return null;

  // Exact source match
  if (meta1.source && meta2.source && meta1.source === meta2.source) {
    return {
      type: 'exact_source',
      confidence: 1.0,
      reason: 'Same Archive.org URL'
    };
  }

  // Title similarity
  const titleSim = similarityRatio(
    normalize(meta1.title || ''),
    normalize(meta2.title || '')
  );

  // Author similarity
  const author1 = meta1.author.join(' ');
  const author2 = meta2.author.join(' ');
  const authorSim = similarityRatio(
    normalize(author1),
    normalize(author2)
  );

  // Combined score
  const combinedSim = (titleSim * 0.7) + (authorSim * 0.3);

  if (combinedSim >= threshold) {
    return {
      type: 'fuzzy_match',
      confidence: combinedSim,
      titleSimilarity: titleSim,
      authorSimilarity: authorSim,
      reason: `Title: ${(titleSim * 100).toFixed(1)}%, Author: ${(authorSim * 100).toFixed(1)}%`
    };
  }

  return null;
}

/**
 * Find duplicates in new works against existing corpus
 */
function findDuplicates(newWorksDir, existingWorksDir, threshold = 0.85) {
  const newFiles = fs.readdirSync(newWorksDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      file: f,
      path: path.join(newWorksDir, f),
      content: fs.readFileSync(path.join(newWorksDir, f), 'utf8')
    }));

  const existingFiles = fs.readdirSync(existingWorksDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      file: f,
      path: path.join(existingWorksDir, f),
      content: fs.readFileSync(path.join(existingWorksDir, f), 'utf8')
    }));

  const duplicates = [];

  console.log(`Checking ${newFiles.length} new works against ${existingFiles.length} existing works...\n`);

  newFiles.forEach((newWork, i) => {
    console.log(`[${i + 1}/${newFiles.length}] Checking ${newWork.file}...`);

    existingFiles.forEach(existingWork => {
      const result = checkDuplicate(newWork, existingWork, threshold);

      if (result) {
        duplicates.push({
          newWork: newWork.file,
          existingWork: existingWork.file,
          ...result
        });

        console.log(`  ⚠ Potential duplicate: ${existingWork.file} (${(result.confidence * 100).toFixed(1)}%)`);
      }
    });
  });

  return duplicates;
}

/**
 * Generate duplicate detection report
 */
function generateReport(duplicates, newCount, existingCount) {
  const exactDuplicates = duplicates.filter(d => d.type === 'exact_source');
  const fuzzyDuplicates = duplicates.filter(d => d.type === 'fuzzy_match');

  return {
    summary: {
      newWorksChecked: newCount,
      existingWorksChecked: existingCount,
      totalDuplicates: duplicates.length,
      exactDuplicates: exactDuplicates.length,
      fuzzyDuplicates: fuzzyDuplicates.length
    },
    exact: exactDuplicates,
    fuzzy: fuzzyDuplicates.sort((a, b) => b.confidence - a.confidence),
    all: duplicates.sort((a, b) => b.confidence - a.confidence)
  };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const newWorksDir = process.argv[2] || '/home/bhuvanesh/dhwani-new-works';
  const existingWorksDir = process.argv[3] || '/home/bhuvanesh/new-dhwani/src/content/works';
  const threshold = parseFloat(process.argv[4]) || 0.85;

  const newFiles = fs.readdirSync(newWorksDir).filter(f => f.endsWith('.md'));
  const existingFiles = fs.readdirSync(existingWorksDir).filter(f => f.endsWith('.md'));

  const duplicates = findDuplicates(newWorksDir, existingWorksDir, threshold);
  const report = generateReport(duplicates, newFiles.length, existingFiles.length);

  const reportPath = '/home/bhuvanesh/new-dhwani/verification-reports/duplicate-detection.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== DUPLICATE DETECTION SUMMARY ===');
  console.log(`New works checked: ${report.summary.newWorksChecked}`);
  console.log(`Existing works checked: ${report.summary.existingWorksChecked}`);
  console.log(`Total duplicates found: ${report.summary.totalDuplicates}`);
  console.log(`  Exact (same source): ${report.summary.exactDuplicates}`);
  console.log(`  Fuzzy (similar): ${report.summary.fuzzyDuplicates}`);
  console.log(`\nReport saved to: ${reportPath}`);

  if (report.summary.totalDuplicates > 0) {
    console.log('\nTop duplicates:');
    report.all.slice(0, 10).forEach(d => {
      console.log(`  ${d.newWork} ≈ ${d.existingWork}`);
      console.log(`    ${d.reason} (confidence: ${(d.confidence * 100).toFixed(1)}%)`);
    });
  }
}

export { findDuplicates, checkDuplicate };
