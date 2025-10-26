#!/usr/bin/env node

/**
 * Description Quality Validator - STRICT MODE
 * Ultra-strict validation for descriptions - NO fluff, NO filler, ONLY substance
 */

import fs from 'fs';
import path from 'path';

// Comprehensive blacklist of fluff/filler phrases
const FORBIDDEN_PHRASES = [
  // Generic scholarly fluff
  'While detailed biographical information may be limited',
  'notable figure whose contributions',
  'scholarly value and historical importance',
  'transformative period in global history',
  'contemporary scholars and interested readers',
  'valuable primary source for research',
  'made accessible through efforts',
  'free public access to historical texts',
  'protected from physical deterioration',
  'is a significant work',
  'Digitized from original sources',
  'available on Archive.org',

  // Generic descriptors (useless without specifics)
  'significant contribution',
  'important work',
  'valuable insights',
  'rich cultural heritage',
  'deep exploration',
  'comprehensive overview',
  'extensive coverage',
  'detailed examination',
  'thorough analysis',
  'profound impact',

  // Vague historical references
  'during a time of',
  'emerged during',
  'reflects the concerns',
  'addresses themes in',
  'contributes to our understanding',
  'sheds light on',
  'offers perspective on',

  // Empty modifiers
  'highly regarded',
  'widely recognized',
  'well-known',
  'celebrated',
  'renowned',
  'esteemed',
  'distinguished',

  // Generic preservation language
  'preservation and digitization ensure',
  'efforts to preserve',
  'made accessible to a global audience',
  'students and general readers',

  // Redundant phrases
  'first issued in',
  'originally published in',
  'work by',
  'authored by',
  'written by',
  'composed by'
];

// Filler words that indicate fluff
const FILLER_WORDS = [
  'very', 'really', 'quite', 'rather', 'somewhat', 'fairly',
  'relatively', 'comparatively', 'generally', 'basically',
  'essentially', 'fundamentally', 'particularly', 'especially',
  'notably', 'significantly', 'importantly'
];

// Red flag patterns (regex)
const RED_FLAG_PATTERNS = [
  /\.\.\.$/, // Truncation
  /\bis a (significant|important|valuable|notable) work\b/i,
  /\b(provides|offers|gives|presents) (valuable|important|useful) (insights?|perspectives?|information)\b/i,
  /\b(well|widely) (known|recognized|regarded|respected)\b/i,
  /\bhas been (preserved|digitized|made accessible)\b/i,
  /\bthis work (explores|examines|discusses|addresses)\b/i,
  /\breaders (interested in|seeking|exploring)\b/i,
  /\b(students?|scholars?|researchers?) and (general )?readers?\b/i,
  /\bmade available (to|through)\b/i,
  /\bdigital (age|era|preservation)\b/i,
  /\b(during|in) (a time|an era|a period) of\b/i
];

// Required elements for quality
const REQUIRED_ELEMENTS = {
  specificDates: /\b(1[0-9]{3}|20[0-2][0-9])\b/, // Actual years
  properNouns: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Capitalized names/places
  specificTerms: /\b(composed|compiled|translated|authored|treatise|commentary|sutra|kavya|shastra|purana|veda)\b/i,
  specificGeography: /\b(India|Sanskrit|Tamil|Bengali|Hindi|Tibet|Nepal|Ceylon|Gupta|Maurya|Mughal)\b/i
};

/**
 * Check if description contains forbidden phrases
 */
function checkForbiddenPhrases(description) {
  const violations = [];

  FORBIDDEN_PHRASES.forEach(phrase => {
    if (description.includes(phrase)) {
      violations.push({
        type: 'forbidden_phrase',
        phrase,
        severity: 'critical'
      });
    }
  });

  return violations;
}

/**
 * Check for filler words
 */
function checkFillerWords(description) {
  const violations = [];
  const words = description.toLowerCase().split(/\s+/);

  FILLER_WORDS.forEach(filler => {
    const count = words.filter(w => w === filler).length;
    if (count > 0) {
      violations.push({
        type: 'filler_word',
        word: filler,
        count,
        severity: count > 2 ? 'major' : 'minor'
      });
    }
  });

  return violations;
}

/**
 * Check for red flag patterns
 */
function checkRedFlags(description) {
  const violations = [];

  RED_FLAG_PATTERNS.forEach((pattern, i) => {
    const match = description.match(pattern);
    if (match) {
      violations.push({
        type: 'red_flag_pattern',
        pattern: pattern.toString(),
        match: match[0],
        severity: 'major'
      });
    }
  });

  return violations;
}

/**
 * Check for required substantive elements
 */
function checkRequiredElements(description) {
  const missing = [];

  // Check for specific dates
  if (!REQUIRED_ELEMENTS.specificDates.test(description)) {
    missing.push({
      type: 'missing_element',
      element: 'specific_date',
      severity: 'major',
      reason: 'No specific year mentioned'
    });
  }

  // Check for proper nouns (names, places)
  const properNouns = description.match(REQUIRED_ELEMENTS.properNouns) || [];
  if (properNouns.length < 2) {
    missing.push({
      type: 'missing_element',
      element: 'proper_nouns',
      severity: 'major',
      reason: `Only ${properNouns.length} proper noun(s) found, need at least 2`
    });
  }

  // Check for specific terminology
  if (!REQUIRED_ELEMENTS.specificTerms.test(description)) {
    missing.push({
      type: 'missing_element',
      element: 'specific_terminology',
      severity: 'minor',
      reason: 'No specific literary/scholarly terms'
    });
  }

  return missing;
}

/**
 * Calculate specificity score
 */
function calculateSpecificity(description) {
  let score = 0;

  // Proper nouns (max 30 points)
  const properNouns = description.match(REQUIRED_ELEMENTS.properNouns) || [];
  score += Math.min(30, properNouns.length * 3);

  // Specific dates (20 points)
  const dates = description.match(/\b\d{4}\b/g) || [];
  score += Math.min(20, dates.length * 10);

  // Specific terminology (20 points)
  const terms = description.match(REQUIRED_ELEMENTS.specificTerms) || [];
  score += Math.min(20, terms.length * 5);

  // Geographic specificity (15 points)
  if (REQUIRED_ELEMENTS.specificGeography.test(description)) {
    score += 15;
  }

  // Numbers/quantities (15 points)
  const numbers = description.match(/\b\d+\b/g) || [];
  score += Math.min(15, numbers.length * 3);

  return score;
}

/**
 * Calculate conciseness score
 */
function calculateConciseness(description) {
  const words = description.split(/\s+/).length;
  const length = description.length;

  // Ideal: 150-300 chars, 25-50 words
  let score = 100;

  // Length penalty
  if (length < 150 || length > 300) {
    score -= 20;
  }

  // Word count penalty
  if (words < 25 || words > 50) {
    score -= 20;
  }

  // Average word length (should be substantive)
  const avgWordLength = length / words;
  if (avgWordLength < 5) {
    score -= 20; // Too many short words = filler
  }

  return Math.max(0, score);
}

/**
 * Comprehensive description validation
 */
function validateDescription(description) {
  if (!description) {
    return {
      valid: false,
      score: 0,
      violations: [{
        type: 'missing',
        severity: 'critical',
        message: 'No description provided'
      }]
    };
  }

  const violations = [
    ...checkForbiddenPhrases(description),
    ...checkFillerWords(description),
    ...checkRedFlags(description),
    ...checkRequiredElements(description)
  ];

  const specificity = calculateSpecificity(description);
  const conciseness = calculateConciseness(description);

  // Critical violations = auto-fail
  const criticalViolations = violations.filter(v => v.severity === 'critical');
  const majorViolations = violations.filter(v => v.severity === 'major');
  const minorViolations = violations.filter(v => v.severity === 'minor');

  // Calculate final score
  let score = (specificity * 0.6) + (conciseness * 0.4);

  // Penalties
  score -= (criticalViolations.length * 30);
  score -= (majorViolations.length * 15);
  score -= (minorViolations.length * 5);

  score = Math.max(0, Math.min(100, score));

  // Strict passing criteria
  const valid = score >= 80 && criticalViolations.length === 0 && majorViolations.length <= 1;

  return {
    valid,
    score: Math.round(score),
    specificity,
    conciseness,
    violations,
    summary: {
      critical: criticalViolations.length,
      major: majorViolations.length,
      minor: minorViolations.length,
      total: violations.length
    }
  };
}

/**
 * Validate all works
 */
function validateAllDescriptions(worksDir) {
  const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));
  const results = [];

  console.log(`Validating descriptions for ${files.length} works (STRICT MODE)...\n`);

  files.forEach((file, i) => {
    const filePath = path.join(worksDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      results.push({
        file,
        valid: false,
        score: 0,
        error: 'No frontmatter found'
      });
      return;
    }

    const descMatch = match[1].match(/description:\s*"([^"]+)"/);
    const description = descMatch ? descMatch[1] : null;

    const result = validateDescription(description);
    results.push({
      file,
      description,
      ...result
    });

    const emoji = result.valid ? '✅' :
                  result.score >= 60 ? '⚠️' : '❌';

    console.log(`[${i + 1}/${files.length}] ${emoji} ${file}`);
    console.log(`    Score: ${result.score}/100 | Violations: ${result.summary.total} (${result.summary.critical}C ${result.summary.major}M ${result.summary.minor}m)`);

    if (!result.valid && result.violations.length > 0) {
      result.violations.slice(0, 3).forEach(v => {
        console.log(`    ⚠️  ${v.type}: ${v.phrase || v.word || v.element || v.match}`);
      });
    }
  });

  return results;
}

/**
 * Generate strict validation report
 */
function generateReport(results) {
  const valid = results.filter(r => r.valid);
  const needsWork = results.filter(r => !r.valid);

  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;

  return {
    summary: {
      total: results.length,
      valid: valid.length,
      needsWork: needsWork.length,
      passRate: `${((valid.length / results.length) * 100).toFixed(1)}%`,
      avgScore: Math.round(avgScore)
    },
    valid: valid.sort((a, b) => b.score - a.score),
    needsWork: needsWork.sort((a, b) => a.score - b.score),
    all: results.sort((a, b) => b.score - a.score)
  };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const worksDir = process.argv[2] || '/home/bhuvanesh/dhwani-new-works';

  const results = validateAllDescriptions(worksDir);
  const report = generateReport(results);

  const reportPath = '/home/bhuvanesh/new-dhwani/verification-reports/description-quality-strict.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== STRICT DESCRIPTION VALIDATION ===');
  console.log(`Total works: ${report.summary.total}`);
  console.log(`Valid (score 80+, minimal violations): ${report.summary.valid}`);
  console.log(`Needs work: ${report.summary.needsWork}`);
  console.log(`Pass rate: ${report.summary.passRate}`);
  console.log(`Average score: ${report.summary.avgScore}/100`);
  console.log(`\nReport saved to: ${reportPath}`);

  if (report.summary.needsWork > 0) {
    console.log(`\n⚠️  ${report.summary.needsWork} descriptions need improvement`);
    console.log('All descriptions must pass strict validation before upload.');
  } else {
    console.log('\n✅ All descriptions pass strict validation!');
  }
}

export { validateDescription, validateAllDescriptions };
