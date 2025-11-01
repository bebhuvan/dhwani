#!/usr/bin/env node

/**
 * Content Checkpoint Validator
 * Multi-stage validation with mandatory checkpoints
 */

import fs from 'fs';
import path from 'path';

/**
 * CHECKPOINT 1: Metadata Integrity
 */
function checkpoint1_MetadataIntegrity(content, frontmatter) {
  const issues = [];

  // Required fields
  const required = ['title', 'author', 'year', 'language', 'genre', 'description', 'sources'];
  required.forEach(field => {
    if (!frontmatter[field] || frontmatter[field].trim() === '') {
      issues.push({
        checkpoint: 1,
        severity: 'critical',
        field,
        issue: 'Required field missing or empty'
      });
    }
  });

  // Title quality
  const titleMatch = frontmatter.title?.match(/"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : '';
  if (title.length < 5) {
    issues.push({
      checkpoint: 1,
      severity: 'critical',
      field: 'title',
      issue: 'Title too short (< 5 chars)'
    });
  }

  // Year validation
  const yearMatch = frontmatter.year?.match(/\d{4}/);
  if (!yearMatch) {
    issues.push({
      checkpoint: 1,
      severity: 'major',
      field: 'year',
      issue: 'No valid 4-digit year found'
    });
  } else {
    const year = parseInt(yearMatch[0]);
    if (year < 1000 || year > 2025) {
      issues.push({
        checkpoint: 1,
        severity: 'major',
        field: 'year',
        issue: `Suspicious year: ${year}`
      });
    }
  }

  // Author validation
  const authorMatch = frontmatter.author?.match(/\[([\s\S]*?)\]/);
  if (!authorMatch || authorMatch[1].trim() === '') {
    issues.push({
      checkpoint: 1,
      severity: 'critical',
      field: 'author',
      issue: 'No author specified'
    });
  }

  // Language validation
  const langMatch = frontmatter.language?.match(/\[([\s\S]*?)\]/);
  if (!langMatch || langMatch[1].trim() === '') {
    issues.push({
      checkpoint: 1,
      severity: 'critical',
      field: 'language',
      issue: 'No language specified'
    });
  }

  return issues;
}

/**
 * CHECKPOINT 2: Source Verification
 */
function checkpoint2_SourceVerification(frontmatter) {
  const issues = [];

  const sourcesText = frontmatter.sources || '';
  const urls = sourcesText.match(/url:\s*"([^"]+)"/g) || [];

  if (urls.length === 0) {
    issues.push({
      checkpoint: 2,
      severity: 'critical',
      field: 'sources',
      issue: 'No source URLs found'
    });
    return issues;
  }

  urls.forEach((urlMatch, i) => {
    const url = urlMatch.match(/url:\s*"([^"]+)"/)[1];

    // Must be from trusted sources
    const trustedDomains = [
      'archive.org',
      'gutenberg.org',
      'sacred-texts.com',
      'dli.ernet.in',
      'ignca.gov.in'
    ];

    const isTrusted = trustedDomains.some(domain => url.includes(domain));
    if (!isTrusted) {
      issues.push({
        checkpoint: 2,
        severity: 'major',
        field: 'sources',
        issue: `Untrusted source domain: ${url}`,
        url
      });
    }

    // URL format validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      issues.push({
        checkpoint: 2,
        severity: 'critical',
        field: 'sources',
        issue: `Invalid URL format: ${url}`,
        url
      });
    }
  });

  return issues;
}

/**
 * CHECKPOINT 3: Reference Quality
 */
function checkpoint3_ReferenceQuality(frontmatter) {
  const issues = [];

  const referencesText = frontmatter.references || '';
  const references = (referencesText.match(/- name:/g) || []).length;

  if (references === 0) {
    issues.push({
      checkpoint: 3,
      severity: 'major',
      field: 'references',
      issue: 'No references found (target: 3+ required)'
    });
    return issues;
  }

  if (references < 3) {
    issues.push({
      checkpoint: 3,
      severity: 'minor',
      field: 'references',
      issue: `Only ${references} reference(s), target is 3+`
    });
  }

  // Check for reference diversity
  const hasWikipedia = /wikipedia\.org/i.test(referencesText);
  const hasWikidata = /wikidata\.org/i.test(referencesText);
  const hasOpenLibrary = /openlibrary\.org/i.test(referencesText);

  const diversity = [hasWikipedia, hasWikidata, hasOpenLibrary].filter(Boolean).length;

  if (diversity < 2) {
    issues.push({
      checkpoint: 3,
      severity: 'minor',
      field: 'references',
      issue: 'Low reference diversity (need Wikipedia, Wikidata, and/or OpenLibrary)'
    });
  }

  return issues;
}

/**
 * CHECKPOINT 4: Content Depth & Structure
 */
function checkpoint4_ContentDepth(body) {
  const issues = [];

  // Section count
  const sections = (body.match(/^##\s+.+$/gm) || []).length;
  if (sections < 6) {
    issues.push({
      checkpoint: 4,
      severity: 'critical',
      field: 'content',
      issue: `Only ${sections} sections found, minimum 6 required`
    });
  }

  // Content length
  const lines = body.split('\n').filter(l => l.trim()).length;
  if (lines < 80) {
    issues.push({
      checkpoint: 4,
      severity: 'critical',
      field: 'content',
      issue: `Only ${lines} lines, minimum 80 required (target 150+)`
    });
  } else if (lines < 150) {
    issues.push({
      checkpoint: 4,
      severity: 'minor',
      field: 'content',
      issue: `${lines} lines, target is 150+`
    });
  }

  // Check for required sections
  const requiredSections = [
    /^##\s+Overview/im,
    /^##\s+About\s+/im,
    /^##\s+(Historical|The Work|Significance)/im
  ];

  requiredSections.forEach((pattern, i) => {
    if (!pattern.test(body)) {
      issues.push({
        checkpoint: 4,
        severity: 'major',
        field: 'content',
        issue: `Missing required section type: ${pattern.source}`
      });
    }
  });

  return issues;
}

/**
 * CHECKPOINT 5: Content Quality (No Fluff)
 */
function checkpoint5_ContentQuality(body, frontmatter) {
  const issues = [];

  const fullText = body + ' ' + (frontmatter.description || '');

  // Forbidden boilerplate phrases
  const boilerplate = [
    'While detailed biographical information may be limited',
    'scholarly value and historical importance',
    'made accessible through efforts',
    'contemporary scholars and interested readers',
    'valuable primary source for research',
    'transformative period in global history'
  ];

  boilerplate.forEach(phrase => {
    if (fullText.includes(phrase)) {
      issues.push({
        checkpoint: 5,
        severity: 'critical',
        field: 'content_quality',
        issue: `Forbidden boilerplate phrase: "${phrase.substring(0, 50)}..."`
      });
    }
  });

  // Check for generic placeholder sections
  const genericSections = [
    /^##\s+Literary Significance\s*\n\n"[^"]*" holds considerable importance/im,
    /^##\s+Digital Preservation\s*\n\n"[^"]*" has been digitized/im,
    /^##\s+Major Themes\s*\n\nThe work explores/im
  ];

  genericSections.forEach(pattern => {
    if (pattern.test(body)) {
      issues.push({
        checkpoint: 5,
        severity: 'major',
        field: 'content_quality',
        issue: 'Generic template section detected (needs specific content)'
      });
    }
  });

  // Check for substantive content (not just fluff)
  const properNouns = (fullText.match(/\b[A-Z][a-z]+\b/g) || []).length;
  const totalWords = fullText.split(/\s+/).length;
  const properNounRatio = properNouns / totalWords;

  if (properNounRatio < 0.1) {
    issues.push({
      checkpoint: 5,
      severity: 'major',
      field: 'content_quality',
      issue: `Low specificity: only ${(properNounRatio * 100).toFixed(1)}% proper nouns (target: 10%+)`
    });
  }

  return issues;
}

/**
 * CHECKPOINT 6: Factual Consistency
 */
function checkpoint6_FactualConsistency(frontmatter, body) {
  const issues = [];

  const titleMatch = frontmatter.title?.match(/"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : '';

  // Title should appear in body
  if (title && !body.includes(title)) {
    issues.push({
      checkpoint: 6,
      severity: 'minor',
      field: 'consistency',
      issue: 'Work title not found in body content'
    });
  }

  // Year consistency
  const frontmatterYear = frontmatter.year?.match(/\d{4}/)?.[0];
  if (frontmatterYear) {
    const bodyYears = body.match(/\b\d{4}\b/g) || [];
    const hasMatchingYear = bodyYears.some(y => Math.abs(parseInt(y) - parseInt(frontmatterYear)) <= 5);

    if (!hasMatchingYear && bodyYears.length > 0) {
      issues.push({
        checkpoint: 6,
        severity: 'minor',
        field: 'consistency',
        issue: `Frontmatter year (${frontmatterYear}) not mentioned in body`
      });
    }
  }

  // Author mentioned in body
  const authorMatch = frontmatter.author?.match(/\[([\s\S]*?)\]/);
  if (authorMatch) {
    const authors = authorMatch[1].split(',').map(a => a.trim().replace(/"/g, ''));
    const authorMentioned = authors.some(author => {
      const lastName = author.split(/\s+/).pop();
      return body.includes(lastName);
    });

    if (!authorMentioned) {
      issues.push({
        checkpoint: 6,
        severity: 'minor',
        field: 'consistency',
        issue: 'Author name not clearly mentioned in body'
      });
    }
  }

  return issues;
}

/**
 * Run all checkpoints
 */
function runAllCheckpoints(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    const issue = {
      checkpoint: 1,
      severity: 'critical',
      field: 'frontmatter',
      issue: 'Invalid file format (no frontmatter)'
    };
    return {
      file: path.basename(filePath),
      passed: false,
      issues: [issue],
      summary: {
        critical: 1,
        major: 0,
        minor: 0,
        total: 1
      },
      checkpoints: {
        1: [issue],
        2: [],
        3: [],
        4: [],
        5: [],
        6: []
      }
    };
  }

  const frontmatter = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    if (line.match(/^[a-zA-Z]/)) {
      if (currentKey) {
        frontmatter[currentKey] = currentValue.join('\n');
      }
      const colonIndex = line.indexOf(':');
      currentKey = line.substring(0, colonIndex).trim();
      currentValue = [line.substring(colonIndex + 1)];
    } else {
      currentValue.push(line);
    }
  }
  if (currentKey) {
    frontmatter[currentKey] = currentValue.join('\n');
  }

  const body = match[2];

  // Run all checkpoints
  const allIssues = [
    ...checkpoint1_MetadataIntegrity(content, frontmatter),
    ...checkpoint2_SourceVerification(frontmatter),
    ...checkpoint3_ReferenceQuality(frontmatter),
    ...checkpoint4_ContentDepth(body),
    ...checkpoint5_ContentQuality(body, frontmatter),
    ...checkpoint6_FactualConsistency(frontmatter, body)
  ];

  const critical = allIssues.filter(i => i.severity === 'critical');
  const major = allIssues.filter(i => i.severity === 'major');
  const minor = allIssues.filter(i => i.severity === 'minor');

  // Pass criteria: 0 critical, ≤2 major, any minor
  const passed = critical.length === 0 && major.length <= 2;

  return {
    file: path.basename(filePath),
    passed,
    issues: allIssues,
    summary: {
      critical: critical.length,
      major: major.length,
      minor: minor.length,
      total: allIssues.length
    },
    checkpoints: {
      1: allIssues.filter(i => i.checkpoint === 1),
      2: allIssues.filter(i => i.checkpoint === 2),
      3: allIssues.filter(i => i.checkpoint === 3),
      4: allIssues.filter(i => i.checkpoint === 4),
      5: allIssues.filter(i => i.checkpoint === 5),
      6: allIssues.filter(i => i.checkpoint === 6)
    }
  };
}

/**
 * Validate all works through checkpoints
 */
function validateAllWorks(worksDir) {
  const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));
  const results = [];

  console.log(`Running 6-checkpoint validation on ${files.length} works...\n`);

  files.forEach((file, i) => {
    const filePath = path.join(worksDir, file);
    const result = runAllCheckpoints(filePath);
    results.push(result);

    const emoji = result.passed ? '✅' :
                  result.summary.critical > 0 ? '❌' : '⚠️';

    console.log(`[${i + 1}/${files.length}] ${emoji} ${file}`);
    console.log(`    Issues: ${result.summary.total} (${result.summary.critical}C ${result.summary.major}M ${result.summary.minor}m)`);

    if (result.summary.critical > 0) {
      result.issues.filter(i => i.severity === 'critical').slice(0, 2).forEach(issue => {
        console.log(`    ❌ CP${issue.checkpoint}: ${issue.issue}`);
      });
    }
  });

  return results;
}

/**
 * Generate checkpoint report
 */
function generateReport(results) {
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);

  return {
    summary: {
      total: results.length,
      passed: passed.length,
      failed: failed.length,
      passRate: `${((passed.length / results.length) * 100).toFixed(1)}%`
    },
    passed: passed.sort((a, b) => a.summary.total - b.summary.total),
    failed: failed.sort((a, b) => b.summary.critical - a.summary.critical),
    all: results
  };
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const worksDir = process.argv[2] || '/home/bhuvanesh/dhwani-new-works';

  const results = validateAllWorks(worksDir);
  const report = generateReport(results);

  const reportPath = '/home/bhuvanesh/new-dhwani/verification-reports/checkpoint-validation.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n=== CHECKPOINT VALIDATION SUMMARY ===');
  console.log(`Total works: ${report.summary.total}`);
  console.log(`Passed: ${report.summary.passed} (${report.summary.passRate})`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`\nReport saved to: ${reportPath}`);

  if (report.summary.failed > 0) {
    console.log(`\n⚠️  ${report.summary.failed} works failed checkpoint validation`);
    console.log('These works need improvement before upload.');
  }
}

export { runAllCheckpoints, validateAllWorks };
