#!/usr/bin/env node

/**
 * Generate Related Works Metadata
 *
 * Pre-computes related works for all works in the collection at build time.
 * Outputs JSON that can be uploaded to Cloudflare KV or served statically.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load all works from markdown files
 */
async function loadWorks() {
  const contentDir = path.join(__dirname, '../src/content/works');
  const files = await glob('**/*.md', { cwd: contentDir });

  const works = [];
  for (const file of files) {
    const filePath = path.join(contentDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);

    works.push({
      slug: file.replace('.md', ''),
      data: data,
    });
  }

  return works;
}

/**
 * Compute similarity score between two works
 */
function computeSimilarity(work1, work2) {
  let score = 0;
  const reasons = [];

  // Author match (strongest signal)
  const sharedAuthors = work1.data.author.filter(a =>
    work2.data.author.some(ta => ta.toLowerCase() === a.toLowerCase())
  );
  if (sharedAuthors.length > 0) {
    score += 10 * sharedAuthors.length;
    reasons.push(`Same author: ${sharedAuthors.join(', ')}`);
  }

  // Collection match
  if (work1.data.collections && work2.data.collections) {
    const sharedCollections = work1.data.collections.filter(c =>
      work2.data.collections.includes(c)
    );
    if (sharedCollections.length > 0) {
      score += 5 * sharedCollections.length;
      reasons.push('Same collection');
    }
  }

  // Genre match
  const sharedGenres = work1.data.genre.filter(g =>
    work2.data.genre.some(tg => tg.toLowerCase() === g.toLowerCase())
  );
  if (sharedGenres.length > 0) {
    score += 3 * sharedGenres.length;
    reasons.push('Similar genre');
  }

  // Language match
  const sharedLanguages = work1.data.language.filter(l =>
    work2.data.language.some(tl => tl.toLowerCase() === l.toLowerCase())
  );
  if (sharedLanguages.length > 0) {
    score += 2 * sharedLanguages.length;
    reasons.push('Same language');
  }

  return { score, reasons };
}

/**
 * Find related works for a given work
 */
function findRelatedWorks(targetWork, allWorks, limit = 5) {
  const scores = [];

  for (const work of allWorks) {
    if (work.slug === targetWork.slug) continue;

    const { score, reasons } = computeSimilarity(targetWork, work);

    if (score > 0) {
      scores.push({
        slug: work.slug,
        title: work.data.title,
        author: work.data.author,
        reason: reasons.join(', '),
        score,
      });
    }
  }

  // Sort by score and return top N
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, limit);
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Loading all works from content directory...');

  const works = await loadWorks();
  console.log(`✅ Loaded ${works.length} works`);

  console.log('🔄 Computing related works for each work...');

  const relatedWorksMap = {};
  let processedCount = 0;

  for (const work of works) {
    const relatedWorks = findRelatedWorks(work, works, 5);
    relatedWorksMap[work.slug] = {
      slug: work.slug,
      relatedWorks,
      computedAt: new Date().toISOString(),
    };

    processedCount++;
    if (processedCount % 50 === 0) {
      console.log(`   Processed ${processedCount}/${works.length} works...`);
    }
  }

  console.log(`✅ Computed related works for ${works.length} works`);

  // Output directory
  const outputDir = path.join(__dirname, '../dist/related-works');
  await fs.mkdir(outputDir, { recursive: true });

  // Write individual JSON files for each work (for static serving)
  console.log('🔄 Writing individual JSON files...');
  for (const [slug, data] of Object.entries(relatedWorksMap)) {
    const filePath = path.join(outputDir, `${slug}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  // Write combined file (for KV upload)
  const combinedPath = path.join(__dirname, '../dist/related-works-all.json');
  await fs.writeFile(combinedPath, JSON.stringify(relatedWorksMap, null, 2));

  console.log(`✅ Written ${works.length} individual files to dist/related-works/`);
  console.log(`✅ Written combined file to dist/related-works-all.json`);

  // Statistics
  const avgRelated = Object.values(relatedWorksMap).reduce(
    (sum, item) => sum + item.relatedWorks.length,
    0
  ) / works.length;
  const worksWithRelated = Object.values(relatedWorksMap).filter(
    item => item.relatedWorks.length > 0
  ).length;

  console.log('\n📊 Statistics:');
  console.log(`   Total works: ${works.length}`);
  console.log(`   Works with related works: ${worksWithRelated} (${((worksWithRelated / works.length) * 100).toFixed(1)}%)`);
  console.log(`   Average related works per work: ${avgRelated.toFixed(1)}`);
  console.log('\n✨ Done!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
