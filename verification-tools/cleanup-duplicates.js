#!/usr/bin/env node

/**
 * Cleanup Duplicates and Non-PD Works
 * Removes duplicates and certain rejects from the new works directory
 */

import fs from 'fs';
import path from 'path';

const DUPLICATES_TO_REMOVE = [
  'README.md',
  // Exact duplicates (12)
  'akbar-the-great-mogul-1542-1605-vincent-arthur-smith.md',
  'hindu-superiority-an-attempt-to-determine-the-position-of-the-hindu-race-in-the-scale-of-nations-sarda.md',
  'hindu-widow-re-marriage-other-tracts-gandhi.md',
  'puranic-encyclopaedia-a-comprehensive-dictionary-with-special-reference-to-the-epic-and-puranic-literature-mani-vettam-1921.md',
  'puranic-encyclopaedia-a-comprehensive-dictionary-with-special-reference-to-the-epic-and-puranic-literature-mani.md',
  'si-yu-ki-buddhist-records-of-the-western-world-xuanzang.md',
  'south-indian-images-of-gods-and-goddesses-krishna-sastri.md',
  'a-classical-dictionary-of-hindu-mythology-and-religion-geography-history-and-literature-john-dowson.md',
  'hind-swaraj-or-indian-home-rule-mahatma-gandhi.md',
  'literary-history-of-ancient-india-in-relation-to-its-racial-and-linguistic-affiliations-chandra-chakraberty.md',
  'our-educational-problem-dayal-har.md',
  'sati-a-write-up-on-the-historical-and-social-study-sharma.md',
  // Fuzzy duplicates (4)
  'the-art-of-war-the-oldest-military-treatise-in-the-world-sun-tzu.md',
  'gitanjali-song-offerings-a-collection-of-prose-translations-made-by-the-author-from-the-original-bengali-rabindranath-tagore.md',
  'the-kama-sutra-of-vatsyayana-vatsyayana.md',
  'indian-home-rule-reprinted-with-a-new-foreword-by-the-author-gandhi-mahatma-1869-1948.md'
];

const NON_PD_REJECTS = [
  'jurisprudence-and-legal-theory-dr-mahajan-v-d-1.md',
  'jurisprudence-and-legal-theory-dr-mahajan-v-d-2.md',
  'raghuvansh-mahakavya-mahakavi-kalidas.md',
  'srimad-bhagavad-gita-sanskrit-hindi-and-english-kaushik-ashok.md',
  'srimad-bhagavad-gita-sanskrit-hindi-and-english-kaushik.md',
  'tyag-patra-jainendra-kumar-1.md',
  'tyag-patra-jainendra-kumar-2.md'
];

/**
 * Create backup and remove files
 */
function cleanupWorks(worksDir, dryRun = false) {
  const allToRemove = [...new Set([...DUPLICATES_TO_REMOVE, ...NON_PD_REJECTS])];

  console.log(`Cleanup Mode: ${dryRun ? 'DRY RUN (no files will be deleted)' : 'LIVE'}\n`);
  console.log(`Files to remove: ${allToRemove.length}`);
  console.log(`  - Duplicates: ${DUPLICATES_TO_REMOVE.length}`);
  console.log(`  - Non-PD rejects: ${NON_PD_REJECTS.length}\n`);

  const removed = [];
  const notFound = [];

  allToRemove.forEach((file, i) => {
    const filePath = path.join(worksDir, file);

    if (fs.existsSync(filePath)) {
      if (!dryRun) {
        fs.unlinkSync(filePath);
      }
      removed.push(file);
      console.log(`[${i + 1}/${allToRemove.length}] ${dryRun ? 'Would remove' : 'Removed'}: ${file}`);
    } else {
      notFound.push(file);
      console.log(`[${i + 1}/${allToRemove.length}] NOT FOUND: ${file}`);
    }
  });

  return {
    removed,
    notFound,
    total: allToRemove.length
  };
}

/**
 * Get remaining works count
 */
function getRemainingCount(worksDir) {
  const files = fs.readdirSync(worksDir).filter(f => f.endsWith('.md'));
  return files.length;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const worksDir = process.argv[2] || '/home/bhuvanesh/dhwani-new-works';
  const dryRun = process.argv[3] === '--dry-run';

  const initialCount = getRemainingCount(worksDir);
  console.log(`Initial works count: ${initialCount}\n`);
  console.log('='.repeat(60));

  const result = cleanupWorks(worksDir, dryRun);

  console.log('='.repeat(60));
  console.log(`\n=== CLEANUP SUMMARY ===`);
  console.log(`Files ${dryRun ? 'to remove' : 'removed'}: ${result.removed.length}`);
  console.log(`Files not found: ${result.notFound.length}`);

  const finalCount = getRemainingCount(worksDir);
  console.log(`\nRemaining works: ${finalCount}`);
  console.log(`Change: ${initialCount} → ${finalCount} (${initialCount - finalCount} removed)`);

  if (dryRun) {
    console.log(`\n⚠️  DRY RUN MODE - No files were actually deleted`);
    console.log(`Run without --dry-run to actually remove files`);
  } else {
    console.log(`\n✅ Cleanup complete`);
  }

  if (result.notFound.length > 0) {
    console.log(`\n⚠️  ${result.notFound.length} files were not found (may have different names):`);
    result.notFound.forEach(f => console.log(`  - ${f}`));
  }
}

export { cleanupWorks };
