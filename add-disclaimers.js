#!/usr/bin/env node

/**
 * Add disclaimer to all unique works
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DISCLAIMER = `

---

**Note**: This description was generated with assistance from Claude (Anthropic) to ensure scholarly accuracy and comprehensive coverage. To the best of our knowledge, this work is in the public domain. If you believe there are any copyright concerns, please contact us immediately.`;

async function addDisclaimers() {
  const uniqueWorksPath = path.join(__dirname, 'unique-works');

  console.log('Adding disclaimers to unique works...\n');

  const files = await fs.readdir(uniqueWorksPath);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  for (const file of mdFiles) {
    const filePath = path.join(uniqueWorksPath, file);
    let content = await fs.readFile(filePath, 'utf-8');

    // Check if disclaimer already exists
    if (content.includes('This description was generated with assistance from Claude')) {
      console.log(`⊘ ${file} - already has disclaimer`);
      continue;
    }

    // Add disclaimer at the end
    content = content.trim() + DISCLAIMER + '\n';

    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✓ ${file} - disclaimer added`);
  }

  console.log('\n✅ Done! All works now have disclaimers.');
}

addDisclaimers().catch(console.error);
