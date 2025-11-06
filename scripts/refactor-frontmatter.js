#!/usr/bin/env node

/**
 * Frontmatter Refactoring Tool
 *
 * Optimizes work frontmatter by:
 * 1. Extracting long descriptions (>100 words)
 * 2. Generating concise summaries (50-75 words) for frontmatter
 * 3. Moving detailed context to body "## Historical Context" section
 * 4. Preserving all information
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKS_DIR = path.join(__dirname, '../src/content/works');

/**
 * Generate concise summary from long description
 * Strategy: Extract first 2-3 sentences or first ~50-75 words
 */
function generateConciseSummary(longDescription) {
  const words = longDescription.split(/\s+/);

  if (words.length <= 75) {
    return longDescription; // Already concise
  }

  // Try to find natural break at sentence boundaries within first 75 words
  const firstPart = words.slice(0, 90).join(' ');
  const sentenceEnds = [...firstPart.matchAll(/[.!?]\s+/g)];

  if (sentenceEnds.length >= 2) {
    // Take first 2 sentences
    const secondSentenceEnd = sentenceEnds[1].index + 1;
    return firstPart.substring(0, secondSentenceEnd).trim();
  } else if (sentenceEnds.length === 1) {
    // Take first sentence
    const firstSentenceEnd = sentenceEnds[0].index + 1;
    const firstSentence = firstPart.substring(0, firstSentenceEnd).trim();

    // If first sentence is very short (<30 words), try to add more
    if (firstSentence.split(/\s+/).length < 30) {
      return words.slice(0, 75).join(' ') + '...';
    }
    return firstSentence;
  }

  // No good sentence breaks, just truncate at word boundary
  return words.slice(0, 75).join(' ') + '...';
}

/**
 * Check if body already has a Historical Context section
 */
function hasHistoricalContext(bodyContent) {
  return /^##\s+(Historical Context|About This Work|About This Edition)/m.test(bodyContent);
}

/**
 * Refactor a single work file
 */
function refactorWork(filePath, options = {}) {
  const { dryRun = false } = options;

  const content = fs.readFileSync(filePath, 'utf8');
  const { data, content: body } = matter(content);

  const description = data.description || '';
  const wordCount = description.split(/\s+/).filter(w => w.length > 0).length;

  // Skip if already concise or missing description
  if (wordCount <= 100) {
    return { status: 'skipped', reason: 'already_concise', wordCount };
  }

  // Skip if body already has historical context (already refactored)
  if (hasHistoricalContext(body)) {
    return { status: 'skipped', reason: 'already_has_context', wordCount };
  }

  // Generate concise summary
  const conciseSummary = generateConciseSummary(description);
  const newWordCount = conciseSummary.split(/\s+/).filter(w => w.length > 0).length;

  // Create new body with Historical Context section
  const historicalContextSection = `## Historical Context

${description.trim()}

---

`;

  const newBody = historicalContextSection + body.trim();

  // Update frontmatter
  const newData = {
    ...data,
    description: conciseSummary
  };

  // Generate new file content
  const newContent = matter.stringify(newBody, newData);

  if (!dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }

  return {
    status: 'refactored',
    oldWordCount: wordCount,
    newWordCount: newWordCount,
    reduction: wordCount - newWordCount,
    reductionPercent: Math.round((1 - newWordCount / wordCount) * 100)
  };
}

/**
 * Refactor all works matching criteria
 */
function refactorAll(options = {}) {
  const { dryRun = false, limit = null } = options;

  const files = fs.readdirSync(WORKS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const results = {
    total: files.length,
    refactored: 0,
    skipped: 0,
    errors: 0,
    totalReduction: 0,
    files: []
  };

  for (let i = 0; i < files.length; i++) {
    if (limit && results.refactored >= limit) break;

    const file = files[i];
    const filePath = path.join(WORKS_DIR, file);

    try {
      const result = refactorWork(filePath, { dryRun });
      results.files.push({ file, ...result });

      if (result.status === 'refactored') {
        results.refactored++;
        results.totalReduction += result.reduction;
        console.log(`✓ [${i + 1}/${files.length}] ${file}`);
        console.log(`  ${result.oldWordCount} → ${result.newWordCount} words (-${result.reductionPercent}%)`);
      } else if (result.status === 'skipped') {
        results.skipped++;
        if (!options.quiet) {
          console.log(`⊘ [${i + 1}/${files.length}] ${file} (${result.reason})`);
        }
      }
    } catch (error) {
      results.errors++;
      console.error(`✗ [${i + 1}/${files.length}] ${file}: ${error.message}`);
    }
  }

  return results;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const quiet = args.includes('--quiet');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

  console.log('\n=== FRONTMATTER REFACTORING ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will modify files)'}`);
  if (limit) console.log(`Limit: ${limit} files`);
  console.log('');

  const results = refactorAll({ dryRun, limit, quiet });

  console.log('\n=== SUMMARY ===\n');
  console.log(`Total files: ${results.total}`);
  console.log(`Refactored: ${results.refactored}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Errors: ${results.errors}`);
  console.log(`Total word reduction: ${results.totalReduction} words`);
  console.log(`Average reduction per file: ${Math.round(results.totalReduction / results.refactored)} words`);

  // Save detailed results
  const reportPath = path.join(__dirname, '../FRONTMATTER_REFACTORING_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${reportPath}\n`);
}

export { refactorWork, refactorAll, generateConciseSummary };
