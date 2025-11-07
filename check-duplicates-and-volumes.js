#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('\n🔍 DUPLICATE & MULTI-VOLUME CHECKER\n');
console.log('═'.repeat(70));

const existingDir = './src/content/works';
const candidatesDir = './potential-candidates';

// Helper to extract frontmatter
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return null;

  const fm = match[1];
  const titleMatch = fm.match(/^title:\s*"([^"]+)"/m);
  const authorMatch = fm.match(/^author:\s*\[([^\]]+)\]/m);
  const yearMatch = fm.match(/^year:\s*(\d+)/m);
  const identifierMatch = fm.match(/_identifier:\s*"([^"]+)"/m);

  return {
    title: titleMatch ? titleMatch[1] : '',
    author: authorMatch ? authorMatch[1].replace(/"/g, '') : '',
    year: yearMatch ? parseInt(yearMatch[1]) : 0,
    identifier: identifierMatch ? identifierMatch[1] : ''
  };
}

// Helper to normalize title for comparison
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to detect volume information
function extractVolumeInfo(title) {
  const patterns = [
    /vol(?:ume)?\.?\s*(\d+)/i,
    /part\s*(\d+)/i,
    /book\s*(\d+)/i,
    /\bv\.?\s*(\d+)\b/i,
    /\bp(?:ar)?t\.?\s*(\d+)\b/i
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return {
        hasVolume: true,
        volumeNumber: parseInt(match[1]),
        baseTitle: title.replace(pattern, '').replace(/[,\s]+$/, '').trim()
      };
    }
  }

  return { hasVolume: false, volumeNumber: null, baseTitle: title };
}

console.log('📖 Loading existing Dhwani collection...');

// Load existing works
let existingWorks = [];
if (fs.existsSync(existingDir)) {
  const existingFiles = fs.readdirSync(existingDir).filter(f => f.endsWith('.md'));
  existingWorks = existingFiles.map(file => {
    const content = fs.readFileSync(path.join(existingDir, file), 'utf-8');
    const metadata = extractFrontmatter(content);
    return metadata ? { ...metadata, filename: file } : null;
  }).filter(w => w !== null);

  console.log(`✓ Loaded ${existingWorks.length} existing works`);
} else {
  console.log('⚠️  No existing works directory found');
}

console.log('📚 Loading candidate works...');

// Load candidates
const candidateFiles = fs.readdirSync(candidatesDir).filter(f => f.endsWith('.md'));
const candidates = candidateFiles.map(file => {
  const content = fs.readFileSync(path.join(candidatesDir, file), 'utf-8');
  const metadata = extractFrontmatter(content);
  return metadata ? { ...metadata, filename: file } : null;
}).filter(w => w !== null);

console.log(`✓ Loaded ${candidates.length} candidate works\n`);

console.log('═'.repeat(70));
console.log('🔎 CHECKING FOR DUPLICATES\n');

const duplicates = {
  exactIdentifier: [],
  titleAndAuthor: [],
  titleSimilarity: []
};

// Build maps for efficient lookup
const existingByIdentifier = new Map();
const existingByTitleAuthor = new Map();

existingWorks.forEach(work => {
  if (work.identifier) {
    existingByIdentifier.set(work.identifier, work);
  }
  const key = `${normalizeTitle(work.title)}|${work.author.toLowerCase()}`;
  existingByTitleAuthor.set(key, work);
});

// Check each candidate
candidates.forEach(candidate => {
  // Check 1: Exact identifier match
  if (candidate.identifier && existingByIdentifier.has(candidate.identifier)) {
    duplicates.exactIdentifier.push({
      candidate: candidate.filename,
      candidateTitle: candidate.title,
      existing: existingByIdentifier.get(candidate.identifier).filename,
      existingTitle: existingByIdentifier.get(candidate.identifier).title,
      identifier: candidate.identifier
    });
  }

  // Check 2: Title + Author match
  const key = `${normalizeTitle(candidate.title)}|${candidate.author.toLowerCase()}`;
  if (existingByTitleAuthor.has(key)) {
    const existing = existingByTitleAuthor.get(key);
    // Only add if not already caught by identifier match
    if (!candidate.identifier || candidate.identifier !== existing.identifier) {
      duplicates.titleAndAuthor.push({
        candidate: candidate.filename,
        candidateTitle: candidate.title,
        existing: existing.filename,
        existingTitle: existing.title,
        author: candidate.author
      });
    }
  }

  // Check 3: Highly similar titles (same author, similar title)
  const candidateNorm = normalizeTitle(candidate.title);
  existingWorks.forEach(existing => {
    if (candidate.author.toLowerCase() === existing.author.toLowerCase()) {
      const existingNorm = normalizeTitle(existing.title);
      // Check for substring match (one title contains the other)
      if (candidateNorm.includes(existingNorm) || existingNorm.includes(candidateNorm)) {
        // Only flag if significant overlap and not already caught
        if (candidateNorm !== existingNorm &&
            !duplicates.titleAndAuthor.some(d => d.candidate === candidate.filename)) {
          duplicates.titleSimilarity.push({
            candidate: candidate.filename,
            candidateTitle: candidate.title,
            existing: existing.filename,
            existingTitle: existing.title,
            author: candidate.author
          });
        }
      }
    }
  });
});

console.log(`🔴 Exact Identifier Matches: ${duplicates.exactIdentifier.length}`);
if (duplicates.exactIdentifier.length > 0) {
  duplicates.exactIdentifier.slice(0, 10).forEach(dup => {
    console.log(`   ⚠️  ${dup.candidateTitle}`);
    console.log(`      Candidate: ${dup.candidate}`);
    console.log(`      Existing:  ${dup.existing}`);
    console.log(`      ID: ${dup.identifier}\n`);
  });
  if (duplicates.exactIdentifier.length > 10) {
    console.log(`   ... and ${duplicates.exactIdentifier.length - 10} more\n`);
  }
}

console.log(`🟡 Title + Author Matches: ${duplicates.titleAndAuthor.length}`);
if (duplicates.titleAndAuthor.length > 0) {
  duplicates.titleAndAuthor.slice(0, 10).forEach(dup => {
    console.log(`   ⚠️  ${dup.candidateTitle} (${dup.author})`);
    console.log(`      Candidate: ${dup.candidate}`);
    console.log(`      Existing:  ${dup.existing}\n`);
  });
  if (duplicates.titleAndAuthor.length > 10) {
    console.log(`   ... and ${duplicates.titleAndAuthor.length - 10} more\n`);
  }
}

console.log(`🟢 Similar Titles (Same Author): ${duplicates.titleSimilarity.length}`);
if (duplicates.titleSimilarity.length > 0) {
  duplicates.titleSimilarity.slice(0, 5).forEach(dup => {
    console.log(`   ℹ️  Candidate: ${dup.candidateTitle}`);
    console.log(`      Existing:  ${dup.existingTitle}`);
    console.log(`      Author: ${dup.author}\n`);
  });
  if (duplicates.titleSimilarity.length > 5) {
    console.log(`   ... and ${duplicates.titleSimilarity.length - 5} more\n`);
  }
}

console.log('═'.repeat(70));
console.log('📚 CHECKING MULTI-VOLUME WORKS\n');

// Analyze multi-volume works in candidates
const volumeWorks = new Map(); // baseTitle -> array of volumes

candidates.forEach(candidate => {
  const volInfo = extractVolumeInfo(candidate.title);
  if (volInfo.hasVolume) {
    const key = normalizeTitle(volInfo.baseTitle) + '|' + candidate.author.toLowerCase();
    if (!volumeWorks.has(key)) {
      volumeWorks.set(key, {
        baseTitle: volInfo.baseTitle,
        author: candidate.author,
        volumes: []
      });
    }
    volumeWorks.get(key).volumes.push({
      volumeNumber: volInfo.volumeNumber,
      fullTitle: candidate.title,
      filename: candidate.filename
    });
  }
});

// Also check existing works for volumes
existingWorks.forEach(existing => {
  const volInfo = extractVolumeInfo(existing.title);
  if (volInfo.hasVolume) {
    const key = normalizeTitle(volInfo.baseTitle) + '|' + existing.author.toLowerCase();
    if (!volumeWorks.has(key)) {
      volumeWorks.set(key, {
        baseTitle: volInfo.baseTitle,
        author: existing.author,
        volumes: []
      });
    }
    volumeWorks.get(key).volumes.push({
      volumeNumber: volInfo.volumeNumber,
      fullTitle: existing.title,
      filename: existing.filename,
      isExisting: true
    });
  }
});

console.log(`📖 Found ${volumeWorks.size} multi-volume work series\n`);

const incompleteVolumes = [];
const completeVolumes = [];

volumeWorks.forEach((work, key) => {
  const volumes = work.volumes.sort((a, b) => a.volumeNumber - b.volumeNumber);
  const volumeNumbers = volumes.map(v => v.volumeNumber);
  const minVol = Math.min(...volumeNumbers);
  const maxVol = Math.max(...volumeNumbers);

  // Check for gaps
  const expectedVolumes = [];
  for (let i = minVol; i <= maxVol; i++) {
    expectedVolumes.push(i);
  }

  const missingVolumes = expectedVolumes.filter(v => !volumeNumbers.includes(v));

  if (missingVolumes.length > 0 || volumeNumbers.length >= 3) {
    const candidateCount = volumes.filter(v => !v.isExisting).length;
    const existingCount = volumes.filter(v => v.isExisting).length;

    const series = {
      baseTitle: work.baseTitle,
      author: work.author,
      totalVolumes: volumes.length,
      candidateVolumes: candidateCount,
      existingVolumes: existingCount,
      volumeNumbers: volumeNumbers,
      missingVolumes: missingVolumes,
      volumes: volumes
    };

    if (missingVolumes.length > 0) {
      incompleteVolumes.push(series);
    } else {
      completeVolumes.push(series);
    }
  }
});

console.log(`✅ Complete Volume Sets: ${completeVolumes.length}`);
completeVolumes.slice(0, 5).forEach(series => {
  console.log(`\n   📚 ${series.baseTitle} (${series.author})`);
  console.log(`      Volumes: ${series.volumeNumbers.join(', ')}`);
  console.log(`      Total: ${series.totalVolumes} volumes (${series.candidateVolumes} candidates, ${series.existingVolumes} existing)`);
});
if (completeVolumes.length > 5) {
  console.log(`\n   ... and ${completeVolumes.length - 5} more complete sets`);
}

console.log(`\n⚠️  Incomplete Volume Sets: ${incompleteVolumes.length}`);
incompleteVolumes.forEach(series => {
  console.log(`\n   📖 ${series.baseTitle} (${series.author})`);
  console.log(`      Have: Volumes ${series.volumeNumbers.join(', ')}`);
  console.log(`      Missing: Volumes ${series.missingVolumes.join(', ')}`);
  console.log(`      Details: ${series.candidateVolumes} candidates, ${series.existingVolumes} existing`);
  series.volumes.forEach(vol => {
    console.log(`         • Vol ${vol.volumeNumber}: ${vol.filename}${vol.isExisting ? ' (existing)' : ''}`);
  });
});

console.log('\n' + '═'.repeat(70));
console.log('💾 SAVING REPORTS\n');

// Save comprehensive report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalExisting: existingWorks.length,
    totalCandidates: candidates.length,
    duplicates: {
      exactIdentifier: duplicates.exactIdentifier.length,
      titleAndAuthor: duplicates.titleAndAuthor.length,
      titleSimilarity: duplicates.titleSimilarity.length,
      total: duplicates.exactIdentifier.length + duplicates.titleAndAuthor.length
    },
    multiVolume: {
      totalSeries: volumeWorks.size,
      completeSeries: completeVolumes.length,
      incompleteSeries: incompleteVolumes.length
    }
  },
  duplicates: duplicates,
  multiVolume: {
    complete: completeVolumes,
    incomplete: incompleteVolumes
  }
};

fs.writeFileSync('./duplicate-volume-report.json', JSON.stringify(report, null, 2));
console.log('✓ Saved: duplicate-volume-report.json');

// Generate removal list for duplicate candidates
if (duplicates.exactIdentifier.length > 0 || duplicates.titleAndAuthor.length > 0) {
  const toRemove = [
    ...duplicates.exactIdentifier.map(d => d.candidate),
    ...duplicates.titleAndAuthor.map(d => d.candidate)
  ];
  fs.writeFileSync('./duplicates-to-remove.txt', toRemove.join('\n'));
  console.log('✓ Saved: duplicates-to-remove.txt');
}

// Generate list of volumes to search for on Archive.org
if (incompleteVolumes.length > 0) {
  const searchQueries = incompleteVolumes.map(series => {
    const queries = series.missingVolumes.map(volNum =>
      `${series.baseTitle} Volume ${volNum} ${series.author}`
    );
    return {
      series: series.baseTitle,
      author: series.author,
      missingVolumes: series.missingVolumes,
      searchQueries: queries
    };
  });
  fs.writeFileSync('./missing-volumes-to-search.json', JSON.stringify(searchQueries, null, 2));
  console.log('✓ Saved: missing-volumes-to-search.json');
}

console.log('\n' + '═'.repeat(70));
console.log('📊 SUMMARY\n');

console.log(`Total Duplicates Found: ${duplicates.exactIdentifier.length + duplicates.titleAndAuthor.length}`);
console.log(`  • Exact identifier matches: ${duplicates.exactIdentifier.length}`);
console.log(`  • Title + Author matches: ${duplicates.titleAndAuthor.length}`);
console.log(`  • Similar titles (review needed): ${duplicates.titleSimilarity.length}`);

console.log(`\nMulti-Volume Works: ${volumeWorks.size} series`);
console.log(`  • Complete series: ${completeVolumes.length}`);
console.log(`  • Incomplete series: ${incompleteVolumes.length}`);

const realDuplicates = duplicates.exactIdentifier.length + duplicates.titleAndAuthor.length;
const adjustedCandidates = candidates.length - realDuplicates;
const projectedTotal = existingWorks.length + adjustedCandidates;

console.log(`\n🎯 ADJUSTED TOTALS:`);
console.log(`  Existing works: ${existingWorks.length}`);
console.log(`  Candidates: ${candidates.length}`);
console.log(`  Duplicates to remove: ${realDuplicates}`);
console.log(`  ─────────────────────────────`);
console.log(`  Adjusted candidates: ${adjustedCandidates}`);
console.log(`  Projected total: ${projectedTotal} works`);

if (realDuplicates > 0) {
  console.log(`\n⚠️  ACTION REQUIRED:`);
  console.log(`  Review duplicates-to-remove.txt and remove ${realDuplicates} duplicate candidates`);
}

if (incompleteVolumes.length > 0) {
  console.log(`\n📖 VOLUME GAPS:`);
  console.log(`  Found ${incompleteVolumes.length} incomplete series`);
  console.log(`  See missing-volumes-to-search.json for Archive.org search queries`);
}

console.log('\n✅ Analysis complete!\n');
