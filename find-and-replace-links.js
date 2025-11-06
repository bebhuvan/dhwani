#!/usr/bin/env node

/**
 * Archive.org Link Finder & Replacer
 *
 * This script:
 * 1. Reads broken links list
 * 2. Extracts metadata from work files
 * 3. Searches Archive.org for replacements
 * 4. Verifies metadata matches
 * 5. Documents findings
 * 6. (Optional) Adds verified links to files
 */

import fs from 'fs';
import https from 'https';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const matter = require('gray-matter');

const WORKS_DIR = 'src/content/works';
const BROKEN_LINKS_FILE = 'verification-reports/broken-links-2025-11-05.json';
const OUTPUT_REPORT = 'verification-reports/LINK_REPLACEMENT_REPORT.md';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Search Archive.org
async function searchArchive(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://archive.org/advancedsearch.php?q=${encodedQuery}&fl[]=identifier,title,creator,date,year,language,description&rows=10&page=1&output=json`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.response?.docs || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Get Archive.org metadata
async function getArchiveMetadata(identifier) {
  return new Promise((resolve, reject) => {
    const url = `https://archive.org/metadata/${identifier}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Calculate match score
function calculateMatchScore(workMeta, archiveMeta) {
  let score = 0;
  const reasons = [];

  // Title match (most important)
  const workTitle = (workMeta.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const archiveTitle = (archiveMeta.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');

  if (workTitle && archiveTitle) {
    const titleWords = workTitle.split(/\s+/).filter(w => w.length > 3);
    const archiveWords = archiveTitle.split(/\s+/);
    const matchedWords = titleWords.filter(w => archiveWords.some(aw => aw.includes(w) || w.includes(aw)));
    const titleMatch = matchedWords.length / titleWords.length;

    score += titleMatch * 50;
    reasons.push(`Title match: ${(titleMatch * 100).toFixed(0)}% (${matchedWords.length}/${titleWords.length} words)`);
  }

  // Author match
  const workAuthors = (workMeta.author || []).map(a =>
    a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).pop() // Last name
  );
  const archiveCreator = (archiveMeta.creator || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');

  if (workAuthors.length > 0 && archiveCreator) {
    const authorMatch = workAuthors.some(lastName => archiveCreator.includes(lastName));
    if (authorMatch) {
      score += 30;
      reasons.push(`Author match: ${workAuthors[0]}`);
    } else {
      reasons.push(`Author mismatch: expected ${workAuthors[0]}, got ${archiveCreator.split(/\s+/).pop()}`);
    }
  }

  // Year match (within 5 years)
  if (workMeta.year && archiveMeta.year) {
    const yearDiff = Math.abs(parseInt(workMeta.year) - parseInt(archiveMeta.year));
    if (yearDiff <= 5) {
      score += 20 - yearDiff * 2;
      reasons.push(`Year match: ${workMeta.year} ≈ ${archiveMeta.year} (diff: ${yearDiff})`);
    } else {
      reasons.push(`Year mismatch: expected ${workMeta.year}, got ${archiveMeta.year} (diff: ${yearDiff})`);
    }
  }

  return { score, reasons };
}

// Extract metadata from work file
function extractWorkMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(content);

  return {
    title: data.title,
    author: Array.isArray(data.author) ? data.author : [data.author],
    year: data.year,
    language: data.language,
    description: data.description,
    sources: data.sources || [],
    references: data.references || []
  };
}

// Main processing function
async function findReplacements() {
  console.log('═'.repeat(80));
  console.log('ARCHIVE.ORG LINK FINDER & REPLACER');
  console.log('═'.repeat(80));
  console.log();

  // Load broken links
  const brokenLinks = JSON.parse(fs.readFileSync(BROKEN_LINKS_FILE, 'utf8'));
  console.log(`Found ${brokenLinks.length} works with broken links`);
  console.log();

  const results = {
    totalWorks: brokenLinks.length,
    totalBrokenLinks: 0,
    processed: 0,
    replacementsFound: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    notFound: 0,
    details: []
  };

  // Process each work
  for (let i = 0; i < Math.min(brokenLinks.length, 10); i++) { // Start with first 10 for testing
    const work = brokenLinks[i];
    const workPath = `${WORKS_DIR}/${work.file}`;

    console.log(`[${i+1}/${brokenLinks.length}] ${work.title}`);
    console.log(`  File: ${work.file}`);

    // Extract metadata
    let workMeta;
    try {
      workMeta = extractWorkMetadata(workPath);
    } catch (e) {
      console.log(`  ⚠ Error reading file: ${e.message}`);
      results.details.push({
        work: work.title,
        file: work.file,
        status: 'error',
        error: `Failed to read file: ${e.message}`
      });
      continue;
    }

    results.totalBrokenLinks += work.brokenLinks.length;

    console.log(`  Metadata: ${workMeta.author?.[0] || 'Unknown'}, ${workMeta.year || '?'}`);
    console.log(`  Broken links: ${work.brokenLinks.length}`);
    console.log();

    // Build search query
    const authorLastName = (workMeta.author?.[0] || '').split(/\s+/).pop();
    const searchQueries = [
      `${workMeta.title} ${authorLastName}`,
      `title:(${workMeta.title}) creator:(${authorLastName})`,
      `${workMeta.title}`
    ];

    let bestMatch = null;
    let bestScore = 0;

    // Try each search query
    for (const query of searchQueries) {
      console.log(`  Searching: "${query}"`);

      try {
        const searchResults = await searchArchive(query);
        console.log(`  Found ${searchResults.length} candidates`);

        if (searchResults.length === 0) continue;

        // Score each result
        for (const result of searchResults.slice(0, 5)) { // Check top 5
          const match = calculateMatchScore(workMeta, result);

          if (match.score > bestScore) {
            bestScore = match.score;
            bestMatch = {
              identifier: result.identifier,
              title: result.title,
              creator: result.creator,
              year: result.year,
              score: match.score,
              reasons: match.reasons,
              url: `https://archive.org/details/${result.identifier}`
            };
          }
        }

        if (bestScore >= 70) break; // Good enough, stop searching

        await sleep(1500); // Rate limiting

      } catch (e) {
        console.log(`  ⚠ Search failed: ${e.message}`);
      }
    }

    // Report results
    if (bestMatch) {
      console.log(`  ✓ FOUND: ${bestMatch.title}`);
      console.log(`  Score: ${bestScore.toFixed(0)}/100`);
      console.log(`  URL: ${bestMatch.url}`);
      console.log(`  Confidence: ${bestScore >= 80 ? 'HIGH' : bestScore >= 60 ? 'MEDIUM' : 'LOW'}`);

      bestMatch.reasons.forEach(r => console.log(`    - ${r}`));

      results.replacementsFound++;
      if (bestScore >= 80) results.highConfidence++;
      else if (bestScore >= 60) results.mediumConfidence++;
      else results.lowConfidence++;

      results.details.push({
        work: work.title,
        file: work.file,
        brokenLinks: work.brokenLinks.length,
        status: 'found',
        replacement: bestMatch,
        confidence: bestScore >= 80 ? 'HIGH' : bestScore >= 60 ? 'MEDIUM' : 'LOW'
      });
    } else {
      console.log(`  ✗ NOT FOUND - No suitable replacement`);
      results.notFound++;

      results.details.push({
        work: work.title,
        file: work.file,
        brokenLinks: work.brokenLinks.length,
        status: 'not_found',
        searchQueries: searchQueries
      });
    }

    console.log();
    results.processed++;

    await sleep(2000); // Rate limiting between works
  }

  return results;
}

// Generate markdown report
function generateReport(results) {
  let md = `# Archive.org Link Replacement Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| Total works processed | ${results.processed} of ${results.totalWorks} |\n`;
  md += `| Total broken links | ${results.totalBrokenLinks} |\n`;
  md += `| Replacements found | ${results.replacementsFound} |\n`;
  md += `| - High confidence (≥80%) | ${results.highConfidence} |\n`;
  md += `| - Medium confidence (60-79%) | ${results.mediumConfidence} |\n`;
  md += `| - Low confidence (<60%) | ${results.lowConfidence} |\n`;
  md += `| Not found | ${results.notFound} |\n\n`;

  md += `## High Confidence Replacements (≥80% match)\n\n`;
  md += `These can be added automatically:\n\n`;

  results.details
    .filter(d => d.status === 'found' && d.confidence === 'HIGH')
    .forEach((d, idx) => {
      md += `### ${idx + 1}. ${d.work}\n\n`;
      md += `- **File:** \`${d.file}\`\n`;
      md += `- **Broken links:** ${d.brokenLinks}\n`;
      md += `- **Replacement:** [${d.replacement.title}](${d.replacement.url})\n`;
      md += `- **Match score:** ${d.replacement.score.toFixed(0)}/100\n`;
      md += `- **Verification:**\n`;
      d.replacement.reasons.forEach(r => md += `  - ${r}\n`);
      md += `\n`;
    });

  md += `## Medium Confidence Replacements (60-79% match)\n\n`;
  md += `These should be manually reviewed:\n\n`;

  results.details
    .filter(d => d.status === 'found' && d.confidence === 'MEDIUM')
    .forEach((d, idx) => {
      md += `### ${idx + 1}. ${d.work}\n\n`;
      md += `- **File:** \`${d.file}\`\n`;
      md += `- **Replacement:** [${d.replacement.title}](${d.replacement.url})\n`;
      md += `- **Match score:** ${d.replacement.score.toFixed(0)}/100\n`;
      md += `- **Verification:**\n`;
      d.replacement.reasons.forEach(r => md += `  - ${r}\n`);
      md += `\n`;
    });

  md += `## Low Confidence / Not Found\n\n`;
  md += `These require manual searching:\n\n`;

  results.details
    .filter(d => d.status === 'not_found' || (d.status === 'found' && d.confidence === 'LOW'))
    .forEach((d, idx) => {
      md += `### ${idx + 1}. ${d.work}\n\n`;
      md += `- **File:** \`${d.file}\`\n`;
      if (d.status === 'found') {
        md += `- **Low confidence match:** [${d.replacement.title}](${d.replacement.url}) (${d.replacement.score.toFixed(0)}/100)\n`;
      } else {
        md += `- **Status:** No suitable replacement found\n`;
      }
      md += `\n`;
    });

  return md;
}

// Run the script
console.log('Starting Archive.org link replacement search...\n');

findReplacements()
  .then(results => {
    console.log('═'.repeat(80));
    console.log('SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Processed: ${results.processed}/${results.totalWorks} works`);
    console.log(`Replacements found: ${results.replacementsFound}`);
    console.log(`  High confidence: ${results.highConfidence}`);
    console.log(`  Medium confidence: ${results.mediumConfidence}`);
    console.log(`  Low confidence: ${results.lowConfidence}`);
    console.log(`Not found: ${results.notFound}`);
    console.log();

    // Save results
    fs.writeFileSync(
      'verification-reports/link-replacement-results.json',
      JSON.stringify(results, null, 2)
    );

    const report = generateReport(results);
    fs.writeFileSync(OUTPUT_REPORT, report);

    console.log(`✓ Results saved to: verification-reports/link-replacement-results.json`);
    console.log(`✓ Report saved to: ${OUTPUT_REPORT}`);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
