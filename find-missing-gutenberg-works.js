#!/usr/bin/env node

/**
 * Script to identify missing Indian works from Project Gutenberg
 * by comparing known Gutenberg IDs in the repository against a list
 * of potentially Indian-related works
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

// Potential Indian works found through searches
// This is a curated list based on manual searches and bookshelf browsing
const potentialIndianWorks = [
  // From Lala Lajpat Rai
  { id: 41819, title: 'The Political Future of India', author: 'Lala Lajpat Rai' },
  { id: 49329, title: 'Young India', author: 'Lala Lajpat Rai' },
  { id: 39874, title: 'An Open Letter to the Right Honorable David Lloyd George', author: 'Lala Lajpat Rai' },

  // From India bookshelf
  { id: 18237, title: 'A Bird Calendar for Northern India', author: 'Douglas Dewar' },

  // From India -- Fiction subject
  { id: 236, title: 'The Jungle Book', author: 'Rudyard Kipling' },
  { id: 2226, title: 'Kim', author: 'Rudyard Kipling' },
  { id: 1937, title: 'The Second Jungle Book', author: 'Rudyard Kipling' },
  { id: 5315, title: 'Told in the East', author: 'Talbot Mundy' },
  { id: 6428, title: 'The Surgeon\'s Daughter', author: 'Walter Scott' },
  { id: 13340, title: 'Mr. Isaacs, A Tale of Modern India', author: 'F. Marion Crawford' },
  { id: 34813, title: 'Caravans By Night: A Romance of India', author: 'Harry Hervey' },
  { id: 62346, title: 'In Black and White', author: 'Rudyard Kipling' },
  { id: 5153, title: 'Rung Ho! A Novel', author: 'Talbot Mundy' },

  // From India -- Description and travel
  { id: 46440, title: 'A Journal of the First Voyage of Vasco da Gama 1497-1499', author: 'Vasco da Gama' },
  { id: 55593, title: 'Travels in Peru and India', author: 'Sir Clements R. Markham' },
  { id: 27260, title: 'East of Suez', author: 'Frederic Courtland Penfield' },
  { id: 22749, title: 'From Edinburgh to India & Burmah', author: 'W. G. Burn Murdoch' },
  { id: 46823, title: 'Ten Years in India, in the 16th Queen\'s Lancers', author: 'W. J. D. Gould' },
  { id: 74042, title: 'Wanderings of a pilgrim in search of the picturesque, Volume 1', author: 'Fanny Parkes Parlby' },
  { id: 27113, title: 'Narrative of a Voyage to India', author: 'W. B. Cramp' },
  { id: 46260, title: 'Up the Country: Letters from Upper Provinces of India', author: 'Emily Eden' },
  { id: 52896, title: 'Life and Travel in India', author: 'Anna Harriette Leonowens' },
  { id: 71505, title: 'Through India and Burmah with pen and brush', author: 'A. Hugh Fisher' },
  { id: 74043, title: 'Wanderings of a pilgrim in search of the picturesque, Volume 2', author: 'Fanny Parkes Parlby' },
  { id: 24416, title: 'Life and Work in Benares and Kumaon, 1839-1877', author: 'James Kennedy' },
  { id: 44968, title: 'Peeps at Many Lands—India', author: 'John Finnemore' },
  { id: 56853, title: 'Journal of a Cavalry Officer', author: 'W. W. W. Humbley' },
  { id: 57153, title: 'Enchanted India', author: 'Bozidar Karadordevic' },
  { id: 43997, title: 'Wanderings in India', author: 'John Lang' },
  { id: 49177, title: 'India under Ripon: A Private Diary', author: 'Wilfrid Scawen Blunt' },
  { id: 60006, title: 'Grand moving diorama of Hindostan', author: 'Fanny Parkes Parlby' },
  { id: 10974, title: 'A Ride to India across Persia and Baluchistán', author: 'Harry De Windt' },
];

// Find missing works
const missingWorks = potentialIndianWorks.filter(work => !existingIds.includes(work.id));

console.log('\n=== MISSING INDIAN WORKS FROM PROJECT GUTENBERG ===\n');
console.log(`Found ${missingWorks.length} potentially missing works:\n`);

missingWorks.sort((a, b) => a.id - b.id);

missingWorks.forEach((work, index) => {
  console.log(`${index + 1}. [eBook #${work.id}] ${work.title}`);
  console.log(`   Author: ${work.author}`);
  console.log(`   URL: https://www.gutenberg.org/ebooks/${work.id}\n`);
});

console.log(`\nTotal existing Gutenberg IDs in repository: ${existingIds.length}`);
console.log(`Potential Indian works checked: ${potentialIndianWorks.length}`);
console.log(`Missing works found: ${missingWorks.length}`);

// Save to JSON file
const report = {
  generated: new Date().toISOString(),
  existingCount: existingIds.length,
  checkedCount: potentialIndianWorks.length,
  missingCount: missingWorks.length,
  missingWorks: missingWorks
};

fs.writeFileSync(
  path.join(__dirname, 'missing-gutenberg-works.json'),
  JSON.stringify(report, null, 2)
);

console.log('\nReport saved to: missing-gutenberg-works.json\n');
