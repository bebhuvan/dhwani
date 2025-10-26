#!/usr/bin/env node
/**
 * Content Validation Script
 * Validates all markdown content for common issues
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../src/content');

const errors = [];
const warnings = [];
let filesChecked = 0;

/**
 * Validate YAML frontmatter syntax
 */
function validateYAML(content, filepath) {
  const issues = [];

  // Check for frontmatter existence
  if (!content.startsWith('---\n')) {
    issues.push('Missing frontmatter delimiter at start');
    return issues;
  }

  const endMatch = content.indexOf('\n---', 4);
  if (endMatch === -1) {
    issues.push('Missing frontmatter closing delimiter');
    return issues;
  }

  const frontmatter = content.substring(4, endMatch);
  const lines = frontmatter.split('\n');

  // Check for common YAML issues
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 2; // +2 because we start after first ---

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // Check for unescaped quotes in string values
    if (line.includes('"') && !line.match(/^[^:]+:\s*"[^"]*"$/)) {
      const hasUnescapedQuote = line.match(/:\s*"[^"]*"[^"]*"/) ||
                                line.match(/:\s*[^"]*"[^"]*$/);
      if (hasUnescapedQuote) {
        issues.push(`Line ${lineNum}: Unescaped quote in value - wrap entire value in quotes`);
      }
    }

    // Check for tabs (YAML requires spaces)
    if (line.includes('\t')) {
      issues.push(`Line ${lineNum}: Contains tabs - YAML requires spaces for indentation`);
    }

    // Check for incorrect list indentation
    if (line.trim().startsWith('-')) {
      const indentation = line.match(/^(\s*)-/)[1].length;
      if (indentation % 2 !== 0) {
        issues.push(`Line ${lineNum}: Incorrect indentation (must be multiple of 2 spaces)`);
      }
    }

    // Check for missing space after colon
    if (line.includes(':') && !line.match(/:\s/) && !line.endsWith(':')) {
      issues.push(`Line ${lineNum}: Missing space after colon`);
    }

    // Check for common field issues
    if (line.match(/^(title|description):\s*$/)) {
      issues.push(`Line ${lineNum}: Empty required field`);
    }
  }

  return issues;
}

/**
 * Validate required fields
 */
function validateRequiredFields(content, filepath, contentType) {
  const issues = [];
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) return ['No valid frontmatter found'];

  const frontmatter = frontmatterMatch[1];

  const requiredFields = {
    works: ['title', 'author', 'language', 'genre', 'description', 'sources', 'publishDate'],
    authors: ['name', 'bio'],
    blog: ['title', 'description', 'publishDate'],
    collections: ['name', 'description']
  };

  const required = requiredFields[contentType] || [];

  for (const field of required) {
    const regex = new RegExp(`^${field}:\\s*.+`, 'm');
    if (!regex.test(frontmatter)) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  return issues;
}

/**
 * Validate URLs
 */
function validateURLs(content, filepath) {
  const issues = [];
  const urlPattern = /url:\s*["']?(https?:\/\/[^\s"']+)["']?/g;

  let match;
  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[1];

    // Check for common issues
    if (url.includes(' ')) {
      issues.push(`Invalid URL (contains space): ${url}`);
    }
    if (!url.match(/^https?:\/\/.+\..+/)) {
      issues.push(`Malformed URL: ${url}`);
    }
  }

  return issues;
}

/**
 * Validate description length
 */
function validateDescription(content, filepath) {
  const issues = [];
  const descMatch = content.match(/description:\s*["'](.+?)["']/s);

  if (descMatch) {
    const desc = descMatch[1];

    if (desc.length < 50) {
      issues.push(`Description too short (${desc.length} chars, min 50)`);
    }

    if (desc.length > 500) {
      issues.push(`Description too long (${desc.length} chars, max 500 for SEO)`);
    }
  }

  return issues;
}

/**
 * Check for tech debt patterns
 */
function checkTechDebt(content, filepath) {
  const issues = [];

  // Check for TODO/FIXME comments
  if (content.match(/TODO|FIXME|HACK|XXX/i)) {
    issues.push('Contains TODO/FIXME comments - resolve before production');
  }

  // Check for hardcoded URLs that should be configurable
  if (content.match(/localhost|127\.0\.0\.1/)) {
    issues.push('Contains localhost URLs - use site config instead');
  }

  // Check for console logs
  if (content.match(/console\.(log|warn|error)/)) {
    issues.push('Contains console statements - remove for production');
  }

  // Check for duplicate spacing
  if (content.match(/\n{4,}/)) {
    issues.push('Contains excessive blank lines (4+) - clean up formatting');
  }

  return issues;
}

/**
 * Validate a single file
 */
async function validateFile(filepath, contentType) {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    const filename = path.basename(filepath);
    const issues = [];

    // YAML validation
    const yamlIssues = validateYAML(content, filepath);
    if (yamlIssues.length > 0) {
      errors.push({ file: filename, type: 'YAML Syntax', issues: yamlIssues });
    }

    // Required fields validation
    const fieldIssues = validateRequiredFields(content, filepath, contentType);
    if (fieldIssues.length > 0) {
      errors.push({ file: filename, type: 'Required Fields', issues: fieldIssues });
    }

    // URL validation
    const urlIssues = validateURLs(content, filepath);
    if (urlIssues.length > 0) {
      warnings.push({ file: filename, type: 'URLs', issues: urlIssues });
    }

    // Description validation
    const descIssues = validateDescription(content, filepath);
    if (descIssues.length > 0) {
      warnings.push({ file: filename, type: 'Description', issues: descIssues });
    }

    // Tech debt check
    const debtIssues = checkTechDebt(content, filepath);
    if (debtIssues.length > 0) {
      warnings.push({ file: filename, type: 'Tech Debt', issues: debtIssues });
    }

    filesChecked++;
  } catch (error) {
    errors.push({
      file: path.basename(filepath),
      type: 'File Read Error',
      issues: [error.message]
    });
  }
}

/**
 * Validate all content in a directory
 */
async function validateContentDir(dirName) {
  const dirPath = path.join(CONTENT_DIR, dirName);

  try {
    const files = await glob('**/*.{md,mdx}', { cwd: dirPath });

    for (const file of files) {
      await validateFile(path.join(dirPath, file), dirName);
    }
  } catch (error) {
    console.error(`Error validating ${dirName}:`, error.message);
  }
}

/**
 * Main validation function
 */
async function main() {
  console.log('🔍 Starting content validation...\n');

  const contentTypes = ['works', 'authors', 'blog', 'collections'];

  for (const type of contentTypes) {
    await validateContentDir(type);
  }

  // Print results
  console.log(`📊 Validation Results:`);
  console.log(`   Files checked: ${filesChecked}`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}\n`);

  // Print errors
  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix):');
    errors.forEach(({ file, type, issues }) => {
      console.log(`\n📄 ${file} (${type}):`);
      issues.forEach(issue => console.log(`   • ${issue}`));
    });
    console.log('');
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (should fix):');
    warnings.forEach(({ file, type, issues }) => {
      console.log(`\n📄 ${file} (${type}):`);
      issues.forEach(issue => console.log(`   • ${issue}`));
    });
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All content validated successfully!');
  } else {
    console.log(`\n💡 Summary:`);
    if (errors.length > 0) {
      console.log(`   Fix ${errors.length} error(s) before building`);
    }
    if (warnings.length > 0) {
      console.log(`   Consider fixing ${warnings.length} warning(s) for better quality`);
    }
  }

  // Exit with error code if there are errors
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(console.error);
