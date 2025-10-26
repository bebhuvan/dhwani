#!/usr/bin/env node

/**
 * Archive.org API Validator
 * Fetches and validates metadata from Archive.org for each work
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

/**
 * Fetch Archive.org metadata
 */
function fetchArchiveMetadata(archiveId) {
  return new Promise((resolve, reject) => {
    const url = `https://archive.org/metadata/${archiveId}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const metadata = JSON.parse(data);
          resolve(metadata);
        } catch (e) {
          reject(new Error(`Failed to parse JSON for ${archiveId}: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Extract Archive.org ID from URL
 */
function extractArchiveId(url) {
  const match = url.match(/archive\.org\/details\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Validate work metadata against Archive.org
 */
async function validateWork(workFile, archiveUrl) {
  const archiveId = extractArchiveId(archiveUrl);

  if (!archiveId) {
    return {
      valid: false,
      error: 'Could not extract Archive.org ID from URL',
      archiveUrl
    };
  }

  try {
    const metadata = await fetchArchiveMetadata(archiveId);

    if (metadata.error) {
      return {
        valid: false,
        error: `Archive.org error: ${metadata.error}`,
        archiveId
      };
    }

    const meta = metadata.metadata || {};

    return {
      valid: true,
      archiveId,
      metadata: {
        title: meta.title || 'N/A',
        creator: meta.creator || meta.author || 'N/A',
        date: meta.date || meta.year || 'N/A',
        language: meta.language || 'N/A',
        description: meta.description || 'N/A',
        subject: meta.subject || [],
        publisher: meta.publisher || 'N/A',
        identifier: meta.identifier || archiveId
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      archiveId
    };
  }
}

/**
 * Extract frontmatter from markdown file
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentValue = [];

  for (const line of lines) {
    if (line.match(/^[a-zA-Z]/)) {
      if (currentKey) {
        frontmatter[currentKey] = currentValue.join('\n').trim();
      }
      const [key, ...valueParts] = line.split(':');
      currentKey = key.trim();
      currentValue = [valueParts.join(':').trim()];
    } else {
      currentValue.push(line);
    }
  }

  if (currentKey) {
    frontmatter[currentKey] = currentValue.join('\n').trim();
  }

  return frontmatter;
}

/**
 * Parse sources from frontmatter
 */
function parseSources(frontmatter) {
  const sourcesText = frontmatter.sources || '';
  const urls = sourcesText.match(/url:\s*"([^"]+)"/g) || [];
  return urls.map(u => u.match(/url:\s*"([^"]+)"/)[1]);
}

/**
 * Validate all works in directory
 */
async function validateAllWorks(worksDir) {
  const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));
  const results = [];

  console.log(`Validating ${files.length} works against Archive.org...\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(worksDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) {
      results.push({
        file,
        valid: false,
        error: 'No frontmatter found'
      });
      continue;
    }

    const sources = parseSources(frontmatter);
    const archiveUrls = sources.filter(url => url.includes('archive.org'));

    if (archiveUrls.length === 0) {
      results.push({
        file,
        valid: false,
        error: 'No Archive.org URL found'
      });
      continue;
    }

    // Validate against first Archive.org URL
    const result = await validateWork(file, archiveUrls[0]);
    results.push({
      file,
      ...result
    });

    // Rate limiting
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[${i + 1}/${files.length}] ${file}: ${result.valid ? '✓' : '✗'}`);
  }

  return results;
}

/**
 * Generate validation report
 */
function generateReport(results) {
  const valid = results.filter(r => r.valid);
  const invalid = results.filter(r => !r.valid);

  const report = {
    summary: {
      total: results.length,
      valid: valid.length,
      invalid: invalid.length,
      validationRate: `${((valid.length / results.length) * 100).toFixed(1)}%`
    },
    valid: valid.map(r => ({
      file: r.file,
      archiveId: r.archiveId,
      metadata: r.metadata
    })),
    invalid: invalid.map(r => ({
      file: r.file,
      error: r.error,
      archiveId: r.archiveId || 'N/A'
    }))
  };

  return report;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const worksDir = process.argv[2] || '/home/bhuvanesh/dhwani-new-works';

  validateAllWorks(worksDir)
    .then(results => {
      const report = generateReport(results);

      // Save report
      const reportPath = '/home/bhuvanesh/new-dhwani/verification-reports/archive-validation.json';
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log('\n=== VALIDATION SUMMARY ===');
      console.log(`Total works: ${report.summary.total}`);
      console.log(`Valid: ${report.summary.valid} (${report.summary.validationRate})`);
      console.log(`Invalid: ${report.summary.invalid}`);
      console.log(`\nReport saved to: ${reportPath}`);

      if (report.summary.invalid > 0) {
        console.log('\nInvalid works:');
        report.invalid.forEach(w => {
          console.log(`  - ${w.file}: ${w.error}`);
        });
      }
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

export { validateWork, validateAllWorks, fetchArchiveMetadata };
