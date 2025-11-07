#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const candidatesDir = './potential-candidates';

console.log('🔍 QUALITY CONTROL: Validating 1,430 Candidate Works\n');
console.log('═'.repeat(70));

const issues = {
  missingFrontmatter: [],
  invalidYear: [],
  missingArchiveLink: [],
  missingTitle: [],
  missingAuthor: [],
  duplicateIdentifiers: new Map(),
  suspiciousDescriptions: [],
  total: 0
};

// Track all identifiers to find duplicates
const identifiers = new Map();

const files = fs.readdirSync(candidatesDir).filter(f => f.endsWith('.md'));
issues.total = files.length;

console.log(`📊 Scanning ${files.length} candidate files...\n`);

files.forEach((file, idx) => {
  const filepath = path.join(candidatesDir, file);
  const content = fs.readFileSync(filepath, 'utf-8');

  // Check for frontmatter
  if (!content.startsWith('---')) {
    issues.missingFrontmatter.push(file);
    return;
  }

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (!frontmatterMatch) {
    issues.missingFrontmatter.push(file);
    return;
  }

  const frontmatter = frontmatterMatch[1];

  // Check required fields
  const titleMatch = frontmatter.match(/^title:\s*"([^"]+)"/m);
  const authorMatch = frontmatter.match(/^author:\s*\[([^\]]+)\]/m);
  const yearMatch = frontmatter.match(/^year:\s*(\d+)/m);
  const archiveLinkMatch = content.match(/https:\/\/archive\.org\/details\/([^\s\)"]+)/);
  const identifierMatch = frontmatter.match(/_identifier:\s*"([^"]+)"/);

  if (!titleMatch) issues.missingTitle.push(file);
  if (!authorMatch) issues.missingAuthor.push(file);
  if (!archiveLinkMatch) issues.missingArchiveLink.push(file);

  // Validate year
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year < 1600 || year > 1923) {
      issues.invalidYear.push({ file, year });
    }
  }

  // Track identifiers for duplicates
  if (identifierMatch) {
    const id = identifierMatch[1];
    if (identifiers.has(id)) {
      identifiers.get(id).push(file);
    } else {
      identifiers.set(id, [file]);
    }
  }

  // Check for suspicious descriptions
  if (content.includes('undefined') || content.includes('null') || content.includes('[object Object]')) {
    issues.suspiciousDescriptions.push(file);
  }

  // Progress indicator
  if ((idx + 1) % 200 === 0) {
    console.log(`  ✓ Processed ${idx + 1}/${files.length} files...`);
  }
});

// Find duplicates
identifiers.forEach((fileList, id) => {
  if (fileList.length > 1) {
    issues.duplicateIdentifiers.set(id, fileList);
  }
});

console.log('\n' + '═'.repeat(70));
console.log('📋 VALIDATION RESULTS\n');

console.log(`Total Candidates Scanned:     ${issues.total}`);
console.log(`\n✅ QUALITY CHECKS:`);
console.log(`   Missing Frontmatter:       ${issues.missingFrontmatter.length}`);
console.log(`   Missing Title:             ${issues.missingTitle.length}`);
console.log(`   Missing Author:            ${issues.missingAuthor.length}`);
console.log(`   Missing Archive Link:      ${issues.missingArchiveLink.length}`);
console.log(`   Invalid Year (not 1600-1923): ${issues.invalidYear.length}`);
console.log(`   Suspicious Descriptions:   ${issues.suspiciousDescriptions.length}`);
console.log(`   Duplicate Identifiers:     ${issues.duplicateIdentifiers.size}`);

const totalIssues =
  issues.missingFrontmatter.length +
  issues.missingTitle.length +
  issues.missingAuthor.length +
  issues.missingArchiveLink.length +
  issues.invalidYear.length +
  issues.suspiciousDescriptions.length +
  issues.duplicateIdentifiers.size;

console.log(`\n📊 SUMMARY:`);
console.log(`   Files with Issues:         ${totalIssues}`);
console.log(`   Clean Files:               ${issues.total - totalIssues}`);
console.log(`   Quality Score:             ${Math.round(((issues.total - totalIssues) / issues.total) * 100)}%`);

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  totalCandidates: issues.total,
  summary: {
    cleanFiles: issues.total - totalIssues,
    filesWithIssues: totalIssues,
    qualityScore: Math.round(((issues.total - totalIssues) / issues.total) * 100)
  },
  issues: {
    missingFrontmatter: issues.missingFrontmatter,
    missingTitle: issues.missingTitle,
    missingAuthor: issues.missingAuthor,
    missingArchiveLink: issues.missingArchiveLink,
    invalidYear: issues.invalidYear,
    suspiciousDescriptions: issues.suspiciousDescriptions,
    duplicateIdentifiers: Array.from(issues.duplicateIdentifiers.entries()).map(([id, files]) => ({
      identifier: id,
      files: files
    }))
  }
};

fs.writeFileSync('./qc-validation-report.json', JSON.stringify(report, null, 2));

console.log('\n📄 Detailed report saved: qc-validation-report.json');

// Print specific issues if found
if (issues.invalidYear.length > 0) {
  console.log('\n⚠️  INVALID YEARS (should be 1600-1923):');
  issues.invalidYear.slice(0, 10).forEach(({file, year}) => {
    console.log(`   - ${file}: ${year}`);
  });
  if (issues.invalidYear.length > 10) {
    console.log(`   ... and ${issues.invalidYear.length - 10} more`);
  }
}

if (issues.duplicateIdentifiers.size > 0) {
  console.log('\n⚠️  DUPLICATE IDENTIFIERS:');
  let count = 0;
  for (const [id, fileList] of issues.duplicateIdentifiers) {
    if (count < 5) {
      console.log(`   - ${id}:`);
      fileList.forEach(f => console.log(`     • ${f}`));
    }
    count++;
  }
  if (issues.duplicateIdentifiers.size > 5) {
    console.log(`   ... and ${issues.duplicateIdentifiers.size - 5} more`);
  }
}

console.log('\n' + '═'.repeat(70));
console.log('✅ Validation complete!\n');
