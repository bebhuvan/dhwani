#!/usr/bin/env node

/**
 * Fix early Annie Besant works (pre-theosophy period)
 * Works from before 1889 need different descriptions
 */

import fs from 'fs';
import path from 'path';

const worksDir = './new-gutenberg-works-2025';

// Description for early Besant (freethought/social reform period)
const earlyBesantDescription = (title, year) => `"${title}" by Annie Besant, published in ${year}, represents the early freethought and social reform period of one of Victorian Britain's most controversial and influential public intellectuals. During the 1870s and 1880s, before her conversion to theosophy in 1889, Besant distinguished herself as a radical secularist, socialist, women's rights advocate, and birth control activist, working closely with Charles Bradlaugh in the National Secular Society and facing prosecution for publishing literature on contraception. Her writings from this period challenged orthodox Christianity, advocated for women's economic and sexual autonomy, critiqued marriage and family structures that subordinated women, and argued for rational, scientific approaches to social organization. Besant's fearless public advocacy, despite facing social ostracism, legal persecution, and the loss of custody of her children due to her heterodox views, established her as a pioneering voice for secularism and women's emancipation.

  The intellectual and political significance of Besant's early works lies in their articulation of Victorian freethought principles, their fusion of secularism with socialist economic analysis, and their proto-feminist critiques of patriarchal institutions. Her writings combined philosophical arguments against religious belief with practical advocacy for social reforms including workers' rights, women's education, birth control access, and marriage law reform. Though Besant's later conversion to theosophy and eventual involvement in Indian nationalist politics represented a dramatic shift in her worldview, her early secular and socialist commitments shaped her lifelong dedication to social transformation and opposition to institutional authority, whether religious, economic, or imperial.

  For contemporary readers and scholars, Besant's early writings provide essential primary sources for understanding Victorian secularism, the women's movement's radical wing, and the complex relationships between freethought, socialism, feminism, and sexual reform in late nineteenth-century Britain. Her trajectory from atheist firebrand to theosophical mystic and Indian nationalist exemplifies the era's diverse paths toward social critique and transformation. Her works remain significant for historians of secularism, feminism, and radical politics, documenting arguments and activism that contributed to gradual liberalization of British society regarding religious orthodoxy, women's rights, and sexual morality, even as her own philosophical commitments evolved dramatically over her long and varied career.`;

// Early works (before 1889 theosophy conversion)
const earlyWorks = [
  'my-path-to-atheism-annie-besant.md', // 1878
  'marriage-as-it-was-as-it-is-and-as-it-should-be-annie-besant.md' // 1882
];

console.log(`Fixing ${earlyWorks.length} early Annie Besant works (pre-theosophy period)\n`);

let updated = 0;

earlyWorks.forEach(file => {
  const filePath = path.join(worksDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Extract title and year
  const titleMatch = content.match(/^title: '(.+)'$/m);
  const yearMatch = content.match(/^year: (\d+)$/m);

  if (!titleMatch || !yearMatch) {
    console.log(`⚠️  Skipping ${file} - couldn't extract title/year`);
    return;
  }

  const title = titleMatch[1];
  const year = yearMatch[1];

  // Generate new description
  const newDesc = earlyBesantDescription(title, year);

  // Replace description section
  const descPattern = /description: \|[\s\S]*?(?=collections:)/;
  const replacement = `description: |\n  ${newDesc.split('\n').join('\n  ')}\n`;

  const newContent = content.replace(descPattern, replacement);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Updated: ${file}`);
    updated++;
  } else {
    console.log(`⚠️  No changes: ${file}`);
  }
});

console.log(`\n✅ Updated ${updated} early Annie Besant works`);
