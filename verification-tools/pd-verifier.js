#!/usr/bin/env node

/**
 * Public Domain Verifier
 * Calculates PD certainty levels based on dates and legal rules
 */

import fs from 'fs';
import path from 'path';

const CURRENT_YEAR = 2025;
const US_PD_CUTOFF_YEAR = 1929; // Published before 1929 = PD in US
const INDIA_PD_YEARS_AFTER_DEATH = 60; // India: 60 years after author death
const GENERAL_PD_YEARS_AFTER_DEATH = 95; // Conservative: 95 years after death

/**
 * Parse year from various formats
 */
function parseYear(yearStr) {
  if (!yearStr) return null;
  const match = yearStr.toString().match(/\d{4}/);
  return match ? parseInt(match[0]) : null;
}

/**
 * Extract author death year from Wikipedia summary
 */
function extractDeathYear(wikipediaSummary) {
  if (!wikipediaSummary) return null;

  // Pattern: (YYYY–YYYY) or (YYYY-YYYY) or (born YYYY, died YYYY)
  const patterns = [
    /\((\d{4})[-–](\d{4})\)/,
    /born\s+\d{4}[,\s]+died\s+(\d{4})/i,
    /\d{4}[-–](\d{4})/
  ];

  for (const pattern of patterns) {
    const match = wikipediaSummary.match(pattern);
    if (match) {
      return parseInt(match[match.length - 1]);
    }
  }

  return null;
}

/**
 * Calculate PD certainty level
 */
function calculatePDCertainty(publicationYear, authorDeathYear = null, countryOfOrigin = 'India') {
  const pubYear = parseYear(publicationYear);

  if (!pubYear) {
    return {
      certainty: 'UNKNOWN',
      level: 0,
      reason: 'No publication year available',
      publicDomain: false
    };
  }

  // Rule 1: Published before 1929 (US PD)
  if (pubYear < US_PD_CUTOFF_YEAR) {
    return {
      certainty: 'CERTAIN',
      level: 100,
      reason: `Published in ${pubYear}, before 1929 US cutoff`,
      publicDomain: true,
      rules: ['US pre-1929']
    };
  }

  // Rule 2: Author died >95 years ago (conservative international PD)
  if (authorDeathYear) {
    const deathYear = parseYear(authorDeathYear);
    const yearsSinceDeath = CURRENT_YEAR - deathYear;

    if (yearsSinceDeath >= GENERAL_PD_YEARS_AFTER_DEATH) {
      return {
        certainty: 'CERTAIN',
        level: 100,
        reason: `Author died in ${deathYear}, ${yearsSinceDeath} years ago (>95 years)`,
        publicDomain: true,
        rules: ['Author death >95 years']
      };
    }

    // Rule 3: India-specific (60 years after death)
    if (countryOfOrigin === 'India' && yearsSinceDeath >= INDIA_PD_YEARS_AFTER_DEATH) {
      return {
        certainty: 'LIKELY',
        level: 85,
        reason: `Author died in ${deathYear}, ${yearsSinceDeath} years ago (India: >60 years)`,
        publicDomain: true,
        rules: ['India PD law (60 years)']
      };
    }

    // Rule 4: Author died but within PD window
    if (yearsSinceDeath < INDIA_PD_YEARS_AFTER_DEATH) {
      return {
        certainty: 'REJECT',
        level: 0,
        reason: `Author died in ${deathYear}, only ${yearsSinceDeath} years ago (<60 years)`,
        publicDomain: false,
        rules: []
      };
    }
  }

  // Rule 5: Old enough publication (likely PD)
  const age = CURRENT_YEAR - pubYear;
  if (age >= 100) {
    return {
      certainty: 'LIKELY',
      level: 80,
      reason: `Published ${age} years ago (${pubYear}), likely PD but author uncertain`,
      publicDomain: true,
      rules: ['Old publication (>100 years)']
    };
  }

  if (age >= 80) {
    return {
      certainty: 'PROBABLE',
      level: 60,
      reason: `Published ${age} years ago (${pubYear}), possibly PD but needs verification`,
      publicDomain: true,
      rules: ['Old publication (>80 years)']
    };
  }

  // Rule 6: Recent publication
  if (age < 60) {
    return {
      certainty: 'REJECT',
      level: 0,
      reason: `Published in ${pubYear}, too recent (<60 years)`,
      publicDomain: false,
      rules: []
    };
  }

  // Rule 7: Uncertain
  return {
    certainty: 'UNCERTAIN',
    level: 40,
    reason: `Published in ${pubYear}, author death unknown, needs legal review`,
    publicDomain: false,
    rules: []
  };
}

/**
 * Extract frontmatter from markdown
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim().replace(/"/g, '');
      fm[key] = value;
    }
  }

  return fm;
}

/**
 * Verify PD status for a work
 */
function verifyWork(filePath, wikipediaData = null) {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatter = extractFrontmatter(content);

  const publicationYear = frontmatter.year;
  const authorDeathYear = wikipediaData ? extractDeathYear(wikipediaData) : null;

  // Heuristic: Indian origin if author/title suggests it
  const isIndian = /sanskrit|tamil|hindi|bengali|india|veda|purana|upanishad/i.test(
    `${frontmatter.title} ${frontmatter.author}`
  );

  const result = calculatePDCertainty(
    publicationYear,
    authorDeathYear,
    isIndian ? 'India' : 'International'
  );

  return {
    file: path.basename(filePath),
    title: frontmatter.title,
    author: frontmatter.author,
    year: publicationYear,
    authorDeathYear,
    ...result
  };
}

/**
 * Verify all works
 */
function verifyAllWorks(worksDir) {
  const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));
  const results = [];

  console.log(`Verifying PD status for ${files.length} works...\n`);

  files.forEach((file, i) => {
    const filePath = path.join(worksDir, file);
    const result = verifyWork(filePath);
    results.push(result);

    const emoji = result.certainty === 'CERTAIN' ? '✓' :
                  result.certainty === 'LIKELY' ? '○' :
                  result.certainty === 'PROBABLE' ? '△' :
                  result.certainty === 'UNCERTAIN' ? '?' : '✗';

    console.log(`[${i + 1}/${files.length}] ${emoji} ${file}: ${result.certainty} (${result.level}%)`);
  });

  return results;
}

/**
 * Generate PD verification report
 */
function generateReport(results) {
  const certain = results.filter(r => r.certainty === 'CERTAIN');
  const likely = results.filter(r => r.certainty === 'LIKELY');
  const probable = results.filter(r => r.certainty === 'PROBABLE');
  const uncertain = results.filter(r => r.certainty === 'UNCERTAIN');
  const reject = results.filter(r => r.certainty === 'REJECT' || r.certainty === 'UNKNOWN');

  const acceptable = [...certain, ...likely];
  const needsReview = [...probable, ...uncertain];

  return {
    summary: {
      total: results.length,
      certain: certain.length,
      likely: likely.length,
      probable: probable.length,
      uncertain: uncertain.length,
      reject: reject.length,
      acceptable: acceptable.length,
      needsReview: needsReview.length,
      acceptanceRate: `${((acceptable.length / results.length) * 100).toFixed(1)}%`
    },
    acceptable: acceptable.sort((a, b) => b.level - a.level),
    needsReview: needsReview.sort((a, b) => b.level - a.level),
    reject: reject,
    all: results.sort((a, b) => b.level - a.level)
  };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const worksDir = process.argv[2] || '/home/bhuvanesh/dhwani-new-works';

  const results = verifyAllWorks(worksDir);
  const report = generateReport(results);

  const reportPath = '/home/bhuvanesh/new-dhwani/verification-reports/pd-verification.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== PD VERIFICATION SUMMARY ===');
  console.log(`Total works: ${report.summary.total}`);
  console.log(`\nCERTAIN (100%): ${report.summary.certain}`);
  console.log(`LIKELY (85%+): ${report.summary.likely}`);
  console.log(`PROBABLE (60-80%): ${report.summary.probable}`);
  console.log(`UNCERTAIN: ${report.summary.uncertain}`);
  console.log(`REJECT/UNKNOWN: ${report.summary.reject}`);
  console.log(`\nAcceptable for upload: ${report.summary.acceptable} (${report.summary.acceptanceRate})`);
  console.log(`Needs manual review: ${report.summary.needsReview}`);
  console.log(`\nReport saved to: ${reportPath}`);
}

export { verifyWork, calculatePDCertainty, verifyAllWorks };
