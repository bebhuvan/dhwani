#!/usr/bin/env node

/**
 * Quality Scorer
 * Scores work quality based on multiple criteria
 */

import fs from 'fs';
import path from 'path';

const BOILERPLATE_PHRASES = [
  'While detailed biographical information may be limited',
  'notable figure whose contributions have been preserved',
  'scholarly value and historical importance',
  'transformative period in global history',
  'contemporary scholars and interested readers',
  'valuable primary source for research',
  'made accessible through efforts to preserve',
  'free public access to historical texts',
  'protected from physical deterioration',
  'is a significant work',
  'Digitized from original sources'
];

const TEMPLATE_SECTIONS = [
  'Literary Significance',
  'Major Themes',
  'Digital Preservation',
  'About the Author',
  'Historical Context',
  'Significance'
];

/**
 * Extract frontmatter and content
 */
function parseMarkdown(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  return {
    frontmatter: parseFrontmatter(match[1]),
    body: match[2]
  };
}

function parseFrontmatter(text) {
  const fm = {};
  const lines = text.split('\n');
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    if (line.match(/^[a-zA-Z]/)) {
      if (currentKey) {
        fm[currentKey] = currentValue.join('\n').trim();
      }
      const [key, ...valueParts] = line.split(':');
      currentKey = key.trim();
      currentValue = [valueParts.join(':').trim()];
    } else {
      currentValue.push(line);
    }
  }

  if (currentKey) {
    fm[currentKey] = currentValue.join('\n').trim();
  }

  return fm;
}

/**
 * Count proper nouns (capitalized words)
 */
function countProperNouns(text) {
  const words = text.split(/\s+/);
  const properNouns = words.filter(w =>
    /^[A-Z][a-z]+/.test(w) &&
    !['The', 'A', 'An', 'In', 'On', 'At', 'Of', 'For', 'To', 'From'].includes(w)
  );
  return properNouns.length;
}

/**
 * Check for dates in text (YYYY or specific date patterns)
 */
function hasDates(text) {
  return /\b\d{4}\b|\b\d{1,2}(st|nd|rd|th)?\s+(century|Century)/.test(text);
}

/**
 * Score description quality (0-100)
 */
function scoreDescription(description) {
  if (!description) return 0;

  let score = 0;
  const length = description.length;

  // Length score (15 points)
  if (length >= 150 && length <= 300) {
    score += 15;
  } else if (length >= 100 && length < 150) {
    score += 10;
  } else if (length >= 50 && length < 100) {
    score += 5;
  }

  // Specificity - proper nouns (25 points)
  const properNounCount = countProperNouns(description);
  score += Math.min(25, properNounCount * 5);

  // Uniqueness - avoid boilerplate (25 points)
  const boilerplateCount = BOILERPLATE_PHRASES.filter(phrase =>
    description.includes(phrase)
  ).length;
  score += Math.max(0, 25 - (boilerplateCount * 10));

  // Context - dates/places (20 points)
  if (hasDates(description)) score += 10;
  if (/\b[A-Z][a-z]+\s+(India|China|Tibet|Nepal|Sanskrit|Tamil|Bengali)/.test(description)) {
    score += 10;
  }

  // Relevance - not truncated (15 points)
  if (!description.endsWith('...')) score += 15;

  return Math.min(100, score);
}

/**
 * Score author bio quality (0-100)
 */
function scoreAuthorBio(body) {
  const authorSection = body.match(/##\s*About\s+.+?\n([\s\S]*?)(?=\n##|$)/i);
  if (!authorSection) return 0;

  const bioText = authorSection[1];
  let score = 0;

  // Not generic template (40 points)
  const hasGeneric = BOILERPLATE_PHRASES.some(phrase => bioText.includes(phrase));
  if (!hasGeneric) score += 40;

  // Has specific dates (20 points)
  if (hasDates(bioText)) score += 20;

  // Has proper nouns (20 points)
  const properNounCount = countProperNouns(bioText);
  score += Math.min(20, properNounCount * 2);

  // Reasonable length (20 points)
  if (bioText.length > 200) score += 20;

  return score;
}

/**
 * Score content depth (0-100)
 */
function scoreContentDepth(body) {
  let score = 0;

  // Count sections
  const sections = (body.match(/^##\s+.+$/gm) || []).length;
  score += Math.min(40, sections * 4);

  // Total length
  const lines = body.split('\n').filter(l => l.trim()).length;
  if (lines >= 150) score += 30;
  else if (lines >= 100) score += 20;
  else if (lines >= 50) score += 10;

  // Not template sections
  const templateCount = TEMPLATE_SECTIONS.filter(section =>
    new RegExp(`^##\\s*${section}\\s*$`, 'mi').test(body)
  ).length;
  score += Math.max(0, 30 - (templateCount * 5));

  return score;
}

/**
 * Score references (0-100)
 */
function scoreReferences(frontmatter) {
  const referencesText = frontmatter.references || '';
  const referenceCount = (referencesText.match(/- name:/g) || []).length;

  let score = 0;

  // Count (60 points)
  if (referenceCount >= 5) score += 60;
  else if (referenceCount >= 3) score += 45;
  else if (referenceCount >= 2) score += 30;
  else if (referenceCount >= 1) score += 15;

  // Diversity (40 points)
  const hasWikipedia = /wikipedia\.org/i.test(referencesText);
  const hasWikidata = /wikidata\.org/i.test(referencesText);
  const hasWikisource = /wikisource\.org/i.test(referencesText);
  const hasOpenLibrary = /openlibrary\.org/i.test(referencesText);

  if (hasWikipedia) score += 10;
  if (hasWikidata) score += 10;
  if (hasWikisource) score += 10;
  if (hasOpenLibrary) score += 10;

  return score;
}

/**
 * Score genre classification (0-100)
 */
function scoreGenre(frontmatter) {
  const genre = frontmatter.genre || '';

  let score = 50; // Default

  // Penalty for generic genres
  if (/General|City|Unknown/i.test(genre)) {
    score = 0;
  }

  // Bonus for specific genres
  if (genre.includes('[') && genre.includes(']')) {
    const genres = genre.match(/"([^"]+)"/g) || [];
    if (genres.length >= 2) score += 25;
    if (genres.length >= 3) score += 25;
  }

  return score;
}

/**
 * Score tags (0-100)
 */
function scoreTags(frontmatter) {
  const tagsText = frontmatter.tags || '';
  const tags = (tagsText.match(/"([^"]+)"/g) || []).map(t => t.replace(/"/g, ''));

  let score = 0;

  // Count (40 points)
  if (tags.length >= 8 && tags.length <= 15) score += 40;
  else if (tags.length >= 5) score += 25;
  else if (tags.length >= 3) score += 15;

  // Specificity (30 points) - has proper nouns
  const properNounTags = tags.filter(t => /^[A-Z]/.test(t));
  score += Math.min(30, properNounTags.length * 5);

  // Diversity (30 points) - not all generic
  const genericTags = ['general', 'literature', 'classical-literature', 'history'];
  const specificTags = tags.filter(t => !genericTags.includes(t.toLowerCase()));
  score += Math.min(30, (specificTags.length / tags.length) * 30);

  return score;
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseMarkdown(content);

  const scores = {
    description: scoreDescription(frontmatter.description),
    authorBio: scoreAuthorBio(body),
    contentDepth: scoreContentDepth(body),
    references: scoreReferences(frontmatter),
    genre: scoreGenre(frontmatter),
    tags: scoreTags(frontmatter)
  };

  // Weighted average
  const weights = {
    description: 0.20,
    authorBio: 0.15,
    contentDepth: 0.30,
    references: 0.20,
    genre: 0.05,
    tags: 0.10
  };

  const overall = Object.keys(scores).reduce((sum, key) => {
    return sum + (scores[key] * weights[key]);
  }, 0);

  return {
    overall: Math.round(overall),
    breakdown: scores,
    weights
  };
}

/**
 * Score all works
 */
function scoreAllWorks(worksDir) {
  const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));
  const results = [];

  console.log(`Scoring ${files.length} works...\n`);

  files.forEach((file, i) => {
    const filePath = path.join(worksDir, file);

    try {
      const score = calculateQualityScore(filePath);
      results.push({
        file,
        ...score
      });

      const grade = score.overall >= 80 ? 'A' :
                   score.overall >= 70 ? 'B' :
                   score.overall >= 60 ? 'C' :
                   score.overall >= 50 ? 'D' : 'F';

      console.log(`[${i + 1}/${files.length}] ${file}: ${score.overall}/100 (${grade})`);
    } catch (error) {
      console.error(`Error scoring ${file}:`, error.message);
      results.push({
        file,
        overall: 0,
        error: error.message
      });
    }
  });

  return results;
}

/**
 * Generate quality report
 */
function generateReport(results) {
  const sorted = [...results].sort((a, b) => b.overall - a.overall);

  const tiers = {
    tier1: sorted.filter(r => r.overall >= 80),
    tier2: sorted.filter(r => r.overall >= 60 && r.overall < 80),
    tier3: sorted.filter(r => r.overall >= 40 && r.overall < 60),
    tier4: sorted.filter(r => r.overall < 40)
  };

  const avgScore = results.reduce((sum, r) => sum + r.overall, 0) / results.length;

  return {
    summary: {
      total: results.length,
      averageScore: Math.round(avgScore),
      tier1: tiers.tier1.length,
      tier2: tiers.tier2.length,
      tier3: tiers.tier3.length,
      tier4: tiers.tier4.length
    },
    tiers,
    all: sorted
  };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const worksDir = process.argv[2] || '/home/bhuvanesh/dhwani-new-works';

  const results = scoreAllWorks(worksDir);
  const report = generateReport(results);

  const reportPath = '/home/bhuvanesh/new-dhwani/verification-reports/quality-scores.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== QUALITY SUMMARY ===');
  console.log(`Total works: ${report.summary.total}`);
  console.log(`Average score: ${report.summary.averageScore}/100`);
  console.log(`\nTier 1 (80+): ${report.summary.tier1} works`);
  console.log(`Tier 2 (60-79): ${report.summary.tier2} works`);
  console.log(`Tier 3 (40-59): ${report.summary.tier3} works`);
  console.log(`Tier 4 (<40): ${report.summary.tier4} works`);
  console.log(`\nReport saved to: ${reportPath}`);
}

export { calculateQualityScore, scoreAllWorks };
