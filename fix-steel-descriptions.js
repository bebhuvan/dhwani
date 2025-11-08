#!/usr/bin/env node

/**
 * Fix Flora Annie Steel work descriptions
 * Her works span late 19th to early 20th century and are serious fiction about India
 */

import fs from 'fs';
import path from 'path';

const worksDir = './new-gutenberg-works-2025';

// Improved description for Flora Annie Steel
const steelDescription = (title, year) => `"${title}" by Flora Annie Webster Steel, published in ${year}, represents the literary output of one of the most significant British women writers about colonial India during the late nineteenth and early twentieth centuries. Steel lived in India for over twenty years (1868-1889) as the wife of a colonial administrator, gaining intimate knowledge of Indian society, languages, and customs that informed her fiction. Unlike many contemporaries who wrote superficial adventure stories, Steel's works demonstrated serious engagement with Indian cultural practices, social hierarchies, and the complexities of colonial relationships, though inevitably reflecting the colonial power dynamics and racial assumptions of her era.

  Steel's fiction combined realistic social observation with romantic plots, creating narratives that brought Indian settings and characters to life for British and American readers while mediating between Victorian literary conventions and the distinctive cultural contexts of the subcontinent. Her works often featured detailed descriptions of Indian domestic life, religious practices, and social customs, demonstrating ethnographic precision unusual for popular fiction of the period. Though Steel's perspective remained fundamentally shaped by imperial ideology and her position within colonial society, her narratives occasionally acknowledged the injustices and contradictions of British rule, the dignity of Indian characters, and the moral ambiguities inherent in cross-cultural encounters during the colonial period.

  For contemporary readers and scholars, Steel's fiction provides valuable primary source material for understanding how British women writers represented India, how colonial society functioned at the domestic level, and how popular literature both reflected and shaped metropolitan attitudes toward empire. Her works remain significant for postcolonial literary studies, feminist analysis of colonial writing, and historical research into British India's social and cultural dynamics. The preservation of these texts in the public domain enables critical engagement with colonial representation while documenting an important strand of Anglo-Indian literature that influenced subsequent generations of writers addressing India's colonial experience.`;

// Get all Steel files
const files = fs.readdirSync(worksDir)
  .filter(f => f.includes('flora-annie-webster-steel.md'));

console.log(`Found ${files.length} Flora Annie Webster Steel works to update\n`);

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
  const newDesc = steelDescription(title, year);

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

console.log(`\n✅ Updated ${updated} Flora Annie Webster Steel works`);
