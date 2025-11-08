#!/usr/bin/env node

/**
 * Comprehensive report of missing Indian works from Project Gutenberg
 * Generated: November 2025
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Current Gutenberg IDs in repository (extracted from works)
const existingIds = [
323, 680, 1470, 1858, 2014, 2017, 2124, 2163, 2290, 2388, 2400, 2500, 2502, 2518, 2526,
2821, 3283, 3310, 3639, 4278, 4838, 5777, 5972, 6066, 6145, 6519, 6520, 6521, 6522, 6523,
6524, 6686, 6687, 6712, 6842, 7128, 7164, 7166, 7169, 7176, 7229, 7297, 7452, 7518, 7846,
7864, 7951, 7964, 7965, 7971, 8649, 10071, 10366, 10946, 10956, 10999, 11167, 11212, 11310,
11399, 11738, 11894, 11897, 11924, 11938, 12058, 12064, 12085, 12169, 12286, 12333, 12370,
12617, 12820, 12863, 12956, 13268, 13402, 13539, 13746, 14134, 14294, 14499, 14867, 15255,
15474, 15475, 15476, 15477, 15483, 15540, 15586, 15720, 16295, 16382, 16444, 16528, 16546,
16578, 16659, 16847, 16996, 16997, 17455, 17711, 17730, 17928, 18051, 18285, 18307, 18813,
18833, 19529, 19550, 19630, 20479, 20583, 20640, 20668, 20847, 21020, 21557, 21918, 22010,
22217, 22514, 22599, 22885, 23136, 23245, 24063, 24461, 24562, 24607, 24869, 25119, 25965,
26000, 26202, 26621, 27270, 27827, 27886, 28117, 28262, 31572, 31696, 31968, 32125, 32231,
32763, 33131, 33186, 33426, 33525, 34125, 34757, 34862, 35555, 35997, 36254, 36478, 36696,
37364, 37782, 38016, 38174, 38488, 38511, 39232, 39442, 39448, 39642, 39848, 40140, 40155,
40461, 40517, 40588, 40708, 40766, 40920, 41128, 41421, 41424, 41489, 41563, 41954, 42674,
42991, 43681, 43682, 44250, 44424, 44608, 44881, 45158, 45159, 45247, 46151, 46531, 46803,
46989, 47214, 47228, 47380, 47814, 48511, 48666, 48854, 48996, 49166, 49544, 50619, 51880,
52309, 52473, 52643, 52739, 52994, 53093, 53360, 53400, 53491, 53674, 53716, 53717, 54027,
54183, 54561, 54652, 55054, 55465, 55940, 56144, 57068, 57175, 57265, 57317, 57374, 57375,
57376, 57667, 57772, 57826, 58074, 58529, 58816, 59595, 60188, 60590, 61178, 61724, 61937,
62496, 62508, 62514, 62798, 63275, 64247, 64622, 64623, 64786, 65351, 65425, 65541, 66208,
66386, 66870, 68641, 68996, 69173, 69383, 69552, 70025, 70057, 70177, 71063, 71064, 71095,
71248, 71249, 71326, 72368, 73070, 73417, 74050, 74314, 74620, 74664, 74751, 75863, 76145,
76982
];

const existingSet = new Set(existingIds);

// Comprehensive list of potentially missing Indian works
const categories = {
  'Indian Nationalist Leaders': [
    { id: 41819, title: 'The Political Future of India', author: 'Lala Lajpat Rai', priority: 'HIGH' },
    { id: 49329, title: 'Young India', author: 'Lala Lajpat Rai', priority: 'HIGH' },
    { id: 39874, title: 'An Open Letter to the Right Honorable David Lloyd George', author: 'Lala Lajpat Rai', priority: 'HIGH' },
  ],

  'Classic Indian Fiction by Western Authors': [
    { id: 236, title: 'The Jungle Book', author: 'Rudyard Kipling', priority: 'HIGH' },
    { id: 2226, title: 'Kim', author: 'Rudyard Kipling', priority: 'HIGH' },
    { id: 1937, title: 'The Second Jungle Book', author: 'Rudyard Kipling', priority: 'HIGH' },
    { id: 62346, title: 'In Black and White', author: 'Rudyard Kipling', priority: 'MEDIUM' },
    { id: 61221, title: 'A Passage to India', author: 'E. M. Forster', priority: 'HIGH' },
  ],

  'Talbot Mundy - India Adventure Novels': [
    { id: 5315, title: 'Told in the East', author: 'Talbot Mundy', priority: 'MEDIUM' },
    { id: 5153, title: 'Rung Ho! A Novel', author: 'Talbot Mundy', priority: 'MEDIUM' },
    { id: 6751, title: 'The Winds of the World', author: 'Talbot Mundy', priority: 'MEDIUM' },
    { id: 5606, title: 'Guns of the Gods: A Story of Yasmini\'s Youth', author: 'Talbot Mundy', priority: 'MEDIUM' },
    { id: 18970, title: 'Caves of Terror', author: 'Talbot Mundy', priority: 'LOW' },
    { id: 4400, title: 'Hira Singh: when India came to fight in Flanders', author: 'Talbot Mundy', priority: 'MEDIUM' },
    { id: 69586, title: 'Om: The secret of Ahbor Valley', author: 'Talbot Mundy', priority: 'LOW' },
    { id: 5194, title: 'The Ivory Trail', author: 'Talbot Mundy', priority: 'LOW' },
    { id: 10551, title: 'Affair in Araby', author: 'Talbot Mundy', priority: 'LOW' },
    { id: 5241, title: 'The Eye of Zeitoon', author: 'Talbot Mundy', priority: 'LOW' },
  ],

  'Flora Annie Steel - India Fiction & Tales': [
    { id: 40045, title: 'Voices in the Night', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39832, title: 'In the Permanent Way', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39813, title: 'A Sovereign Remedy', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39795, title: 'In the Guardianship of God', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 40142, title: 'Miss Stuart\'s Legacy', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39810, title: 'A Prince of Dreamers', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 40136, title: 'The Mercy of the Lord', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39987, title: 'The Flower of Forgiveness', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 40141, title: 'Red Rowans', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39985, title: 'The Potter\'s Thumb', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39821, title: 'From the Five Rivers', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39794, title: 'King-Errant', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39991, title: 'The Hosts of the Lord', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39857, title: 'Marmaduke', author: 'Flora Annie Webster Steel', priority: 'LOW' },
    { id: 39847, title: 'In the Tideway', author: 'Flora Annie Webster Steel', priority: 'LOW' },
  ],

  'Douglas Dewar - Indian Natural History': [
    { id: 18237, title: 'A Bird Calendar for Northern India', author: 'Douglas Dewar', priority: 'MEDIUM' },
    { id: 23755, title: 'Birds of the Indian Hills', author: 'Douglas Dewar', priority: 'MEDIUM' },
    { id: 46394, title: 'Birds of the Plains', author: 'Douglas Dewar', priority: 'MEDIUM' },
    { id: 46318, title: 'Jungle Folk: Indian Natural History Sketches', author: 'Douglas Dewar', priority: 'MEDIUM' },
    { id: 46017, title: 'Indian Birds: A Key to the Common Birds of the Plains of India', author: 'Douglas Dewar', priority: 'MEDIUM' },
    { id: 46425, title: 'Glimpses of Indian Birds', author: 'Douglas Dewar', priority: 'MEDIUM' },
  ],

  'Travel Narratives & Memoirs': [
    { id: 46440, title: 'A Journal of the First Voyage of Vasco da Gama 1497-1499', author: 'Vasco da Gama', priority: 'MEDIUM' },
    { id: 55593, title: 'Travels in Peru and India', author: 'Sir Clements R. Markham', priority: 'LOW' },
    { id: 27260, title: 'East of Suez', author: 'Frederic Courtland Penfield', priority: 'LOW' },
    { id: 22749, title: 'From Edinburgh to India & Burmah', author: 'W. G. Burn Murdoch', priority: 'LOW' },
    { id: 46823, title: 'Ten Years in India, in the 16th Queen\'s Lancers', author: 'W. J. D. Gould', priority: 'LOW' },
    { id: 74042, title: 'Wanderings of a pilgrim in search of the picturesque, Volume 1', author: 'Fanny Parkes Parlby', priority: 'MEDIUM' },
    { id: 74043, title: 'Wanderings of a pilgrim in search of the picturesque, Volume 2', author: 'Fanny Parkes Parlby', priority: 'MEDIUM' },
    { id: 27113, title: 'Narrative of a Voyage to India', author: 'W. B. Cramp', priority: 'LOW' },
    { id: 46260, title: 'Up the Country: Letters from Upper Provinces of India', author: 'Emily Eden', priority: 'MEDIUM' },
    { id: 52896, title: 'Life and Travel in India', author: 'Anna Harriette Leonowens', priority: 'LOW' },
    { id: 71505, title: 'Through India and Burmah with pen and brush', author: 'A. Hugh Fisher', priority: 'LOW' },
    { id: 24416, title: 'Life and Work in Benares and Kumaon, 1839-1877', author: 'James Kennedy', priority: 'LOW' },
    { id: 44968, title: 'Peeps at Many Lands—India', author: 'John Finnemore', priority: 'LOW' },
    { id: 56853, title: 'Journal of a Cavalry Officer', author: 'W. W. W. Humbley', priority: 'LOW' },
    { id: 57153, title: 'Enchanted India', author: 'Bozidar Karadordevic', priority: 'LOW' },
    { id: 43997, title: 'Wanderings in India', author: 'John Lang', priority: 'LOW' },
    { id: 49177, title: 'India under Ripon: A Private Diary', author: 'Wilfrid Scawen Blunt', priority: 'MEDIUM' },
    { id: 60006, title: 'Grand moving diorama of Hindostan', author: 'Fanny Parkes Parlby', priority: 'LOW' },
    { id: 10974, title: 'A Ride to India across Persia and Baluchistán', author: 'Harry De Windt', priority: 'LOW' },
  ],

  'Fiction Set in India': [
    { id: 13340, title: 'Mr. Isaacs, A Tale of Modern India', author: 'F. Marion Crawford', priority: 'LOW' },
    { id: 34813, title: 'Caravans By Night: A Romance of India', author: 'Harry Hervey', priority: 'LOW' },
    { id: 6428, title: 'The Surgeon\'s Daughter', author: 'Walter Scott', priority: 'LOW' },
  ],

  'Indian Folklore & Culture': [
    { id: 35690, title: 'Omens and Superstitions of Southern India', author: 'Edgar Thurston', priority: 'HIGH' },
  ],

  'Epic Poetry': [
    { id: 32528, title: 'The Lusiad; Or, The Discovery of India, an Epic Poem', author: 'Luís de Camões', priority: 'MEDIUM' },
  ],
};

// Flatten all works
const allPotentialWorks = [];
for (const [category, works] of Object.entries(categories)) {
  works.forEach(work => {
    allPotentialWorks.push({ ...work, category });
  });
}

// Find missing works
const missingWorks = allPotentialWorks.filter(work => !existingSet.has(work.id));

// Group by category and priority
const report = {
  generated: new Date().toISOString(),
  summary: {
    existingCount: existingIds.length,
    totalChecked: allPotentialWorks.length,
    missingCount: missingWorks.length,
    byPriority: {
      HIGH: missingWorks.filter(w => w.priority === 'HIGH').length,
      MEDIUM: missingWorks.filter(w => w.priority === 'MEDIUM').length,
      LOW: missingWorks.filter(w => w.priority === 'LOW').length,
    }
  },
  missingByCategory: {},
  missingByPriority: {
    HIGH: [],
    MEDIUM: [],
    LOW: []
  },
  allMissing: missingWorks.sort((a, b) => a.id - b.id)
};

// Group by category
for (const work of missingWorks) {
  if (!report.missingByCategory[work.category]) {
    report.missingByCategory[work.category] = [];
  }
  report.missingByCategory[work.category].push(work);
  report.missingByPriority[work.priority].push(work);
}

// Console output
console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
console.log('║   COMPREHENSIVE MISSING INDIAN WORKS FROM PROJECT GUTENBERG            ║');
console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

console.log('📊 SUMMARY');
console.log('─────────────────────────────────────────────────────────────────────────');
console.log(`  Existing Gutenberg IDs in repository:  ${existingIds.length}`);
console.log(`  Total potential Indian works checked:  ${allPotentialWorks.length}`);
console.log(`  Missing works found:                   ${missingWorks.length}\n`);

console.log('  By Priority:');
console.log(`    🔴 HIGH Priority:    ${report.summary.byPriority.HIGH} works`);
console.log(`    🟡 MEDIUM Priority:  ${report.summary.byPriority.MEDIUM} works`);
console.log(`    ⚪ LOW Priority:     ${report.summary.byPriority.LOW} works`);
console.log('');

// Print by priority
for (const priority of ['HIGH', 'MEDIUM', 'LOW']) {
  const works = report.missingByPriority[priority];
  if (works.length === 0) continue;

  const icon = priority === 'HIGH' ? '🔴' : priority === 'MEDIUM' ? '🟡' : '⚪';
  console.log(`\n${icon} ${priority} PRIORITY WORKS (${works.length})`);
  console.log('═════════════════════════════════════════════════════════════════════════\n');

  // Group by category within priority
  const byCategory = {};
  for (const work of works) {
    if (!byCategory[work.category]) byCategory[work.category] = [];
    byCategory[work.category].push(work);
  }

  for (const [category, categoryWorks] of Object.entries(byCategory)) {
    console.log(`  ${category}:`);
    categoryWorks.sort((a, b) => a.id - b.id).forEach(work => {
      console.log(`    • [#${work.id}] ${work.title}`);
      console.log(`      ${work.author}`);
      console.log(`      https://www.gutenberg.org/ebooks/${work.id}\n`);
    });
  }
}

console.log('\n═════════════════════════════════════════════════════════════════════════');
console.log(`\n✅ Total of ${missingWorks.length} potentially valuable Indian works found missing from Dhwani!\n`);

// Save detailed JSON report
fs.writeFileSync(
  path.join(__dirname, 'comprehensive-missing-gutenberg-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('📄 Detailed report saved to: comprehensive-missing-gutenberg-report.json\n');
