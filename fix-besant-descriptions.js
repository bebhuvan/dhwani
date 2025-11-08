#!/usr/bin/env node

/**
 * Fix Annie Besant work descriptions
 * Her works are theosophical/philosophical, not social reform like Ambedkar
 */

import fs from 'fs';
import path from 'path';

const worksDir = './new-gutenberg-works-2025';

// Correct description for Annie Besant theosophical works
const besantDescription = (title, year) => `"${title}" by Annie Besant, published in ${year}, represents the theosophical and philosophical writings of one of the most influential figures in the late nineteenth and early twentieth-century theosophical movement. Besant, originally a British social reformer and freethinker, became a prominent leader of the Theosophical Society after her conversion to theosophy in 1889, eventually serving as the Society's international president from 1907 until her death in 1933. Her extensive writings on theosophy, occultism, and esoteric spirituality combined Eastern philosophical traditions—particularly Hindu and Buddhist concepts—with Western esoteric thought, creating synthetic spiritual frameworks that attracted widespread international interest during a period of growing Western engagement with Asian religious and philosophical systems.

  Besant's theosophical works characteristically addressed topics including the nature of consciousness, spiritual evolution, karma and reincarnation, occult chemistry, thought-forms and their visualization, the hidden structures of matter and energy, and the synthesis of science and spirituality. Her writings demonstrated considerable erudition, drawing on diverse sources including Hindu scriptures, Buddhist philosophy, Western mysticism, and contemporary scientific developments, though her interpretations often departed significantly from orthodox understandings of these traditions. While based in London for much of her theosophical career, Besant maintained strong connections to India, where the Theosophical Society had significant influence, and she eventually became deeply involved in Indian nationalist politics, serving as president of the Indian National Congress in 1917 and advocating for Indian self-governance within the British Empire.

  For contemporary readers and scholars, Besant's theosophical works provide valuable primary sources for understanding the late nineteenth and early twentieth-century occult revival, the Western reception and reinterpretation of Asian religious thought, and the complex relationships between spiritualism, theosophy, feminism, and anti-colonial politics. Her writings illuminate how alternative spiritual movements challenged both orthodox Christianity and scientific materialism while constructing hybrid philosophical systems that claimed to reconcile Eastern wisdom with Western rationality. Though her theosophical claims about occult phenomena, invisible planes of existence, and esoteric hierarchies remain controversial and scientifically unsubstantiated, her works' historical significance for understanding the period's intellectual and spiritual currents, the globalization of religious ideas, and the emergence of modern New Age thought ensures their continued relevance for scholars of religious studies, intellectual history, and the cultural history of British India.`;

// Get all Besant files
const files = fs.readdirSync(worksDir)
  .filter(f => f.includes('annie-besant.md'));

console.log(`Found ${files.length} Annie Besant works to update\n`);

let updated = 0;

files.forEach(file => {
  const filePath = path.join(worksDir, file);
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
  const newDesc = besantDescription(title, year);

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

console.log(`\n✅ Updated ${updated} Annie Besant works`);
