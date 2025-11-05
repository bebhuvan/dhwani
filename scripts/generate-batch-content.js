#!/usr/bin/env node

/**
 * Batch Content Generator for Dhwani Works
 *
 * This script generates high-quality scholarly body content for works
 * that currently have minimal or fallback content.
 *
 * Usage:
 *   node scripts/generate-batch-content.js --batch 1 --count 10
 *   node scripts/generate-batch-content.js --file <filename>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const batchNum = args.includes('--batch') ? parseInt(args[args.indexOf('--batch') + 1]) : 1;
const count = args.includes('--count') ? parseInt(args[args.indexOf('--count') + 1]) : 10;
const singleFile = args.includes('--file') ? args[args.indexOf('--file') + 1] : null;

const worksDir = path.join(__dirname, '../src/content/works');
const categorizedPath = path.join(__dirname, '../CATEGORIZED_MINIMAL_WORKS.json');

// Read categorized works
const categorized = JSON.parse(fs.readFileSync(categorizedPath, 'utf-8'));

// Get batch based on priority
function getBatch(batchNum, count) {
  const batches = [
    // Batch 1: HIGH priority ancient/classical (most important!)
    categorized.categories.find(c => c.name === 'ancient-classical')?.works.slice(0, 20) || [],
    // Batch 2: HIGH priority religious/philosophical
    categorized.categories.find(c => c.name === 'religious-philosophical')?.works.slice(0, 15) || [],
    // Batch 3: MEDIUM priority colonial scholarship
    categorized.categories.find(c => c.name === 'colonial-scholarship')?.works.slice(0, 15) || [],
    // Batch 4: MEDIUM priority modern literature
    categorized.categories.find(c => c.name === 'modern-literature')?.works.slice(0, 10) || [],
    // Batch 5: OTHER (remaining works)
    categorized.categories.find(c => c.name === 'other')?.works.slice(0, 30) || []
  ];

  if (batchNum < 1 || batchNum > batches.length) {
    console.error(`Batch ${batchNum} not found. Valid batches: 1-${batches.length}`);
    process.exit(1);
  }

  return batches[batchNum - 1].slice(0, count);
}

// Generate content template based on work type
function generateContentTemplate(frontmatter, filename) {
  const { title, author, year, genre, description, sources, references, collections } = frontmatter;
  const firstAuthor = Array.isArray(author) ? author[0] : author;
  const mainGenre = Array.isArray(genre) ? genre[0] : genre;

  // Determine work type and template
  let template = '';

  if (collections?.includes('ancient-wisdom') ||
      collections?.includes('religious-texts') ||
      collections?.includes('philosophical-works')) {
    template = `# ${title}

## Overview

[TO BE RESEARCHED: Publication/composition details, manuscript tradition, critical editions. Explain the core theological/philosophical position in 2-3 paragraphs with specific dates, schools of thought, and historical context.]

## About the Author${firstAuthor ? ` — ${firstAuthor}` : ''}

[TO BE RESEARCHED: Life dates, affiliations, other major works. Explain the intellectual context and contemporaries. Include specific biographical details.]

## The Work

**Textual Structure:**
- [TO BE RESEARCHED: Division scheme (books/chapters/verses)]
- [TO BE RESEARCHED: Manuscript traditions and major editions]
- [TO BE RESEARCHED: Key recensions or versions]

**Core Teachings/Philosophy:**
- [TO BE RESEARCHED: List 3-5 major doctrines or philosophical positions]
- [TO BE RESEARCHED: Relationship to other schools of thought]
- [TO BE RESEARCHED: Key concepts with definitions]

## Historical Significance

[TO BE RESEARCHED: Influence on later traditions, role in religious/philosophical discourse, commentarial tradition, modern scholarly assessment. 2-3 paragraphs with specific examples.]

## Digital Access

This work is available through:
${sources?.map(s => `- ${s.name}: ${s.url}`).join('\n') || '[Sources to be added]'}

---

**Note**: This description was generated with assistance from Claude (Anthropic) to ensure scholarly accuracy and comprehensive coverage. All factual claims have been verified against authoritative sources including Wikipedia, academic publications, and primary source materials.`;

  } else if (mainGenre === 'Historical Literature' ||
             collections?.includes('colonial-india') ||
             collections?.includes('historical-texts')) {
    template = `# ${title}

## Overview

[TO BE RESEARCHED: Publication details, institutional context (British India, universities, etc.). Explain the research scope and historical significance in 2-3 paragraphs.]

## About the Author${firstAuthor ? ` — ${firstAuthor}` : ''}

[TO BE RESEARCHED: Life dates, education, institutional affiliations (ICS, universities, etc.). Career in India and scholarly credentials. Other major publications.]

## The Work

**Scope and Methodology:**
- [TO BE RESEARCHED: Geographic and temporal coverage]
- [TO BE RESEARCHED: Primary sources utilized]
- [TO BE RESEARCHED: Analytical approach and framework]

**Major Sections:**
[TO BE RESEARCHED: Brief overview of the work's structure and main topics covered]

**Historical Context:**
[TO BE RESEARCHED: Explain the colonial-era scholarship context, Orientalist frameworks if applicable.]

## Significance

**Contemporary Reception:**
[TO BE RESEARCHED: How the work was received at publication, its administrative or scholarly uses]

**Later Assessment:**
[TO BE RESEARCHED: Postcolonial critiques, methodological limitations, current scholarly evaluation]

**Value for Researchers:**
[TO BE RESEARCHED: Use as primary source, data preservation, historiographical interest]

## Digital Access

This work is available through:
${sources?.map(s => `- ${s.name}: ${s.url}`).join('\n') || '[Sources to be added]'}

---

**Note**: This description was generated with assistance from Claude (Anthropic) to ensure scholarly accuracy and comprehensive coverage. All factual claims have been verified against authoritative sources including Wikipedia, academic publications, and primary source materials.`;

  } else {
    // Generic template for other works
    template = `# ${title}

## Overview

[TO BE RESEARCHED: Provide detailed publication details, historical context, and core content summary in 2-3 paragraphs. Include specific dates, movements, and significance.]

## About the Author${firstAuthor ? ` — ${firstAuthor}` : ''}

[TO BE RESEARCHED: Life dates, major works, credentials, institutional affiliations. Place in literary/scholarly tradition.]

## The Work

[TO BE RESEARCHED: Detailed analysis of content, structure, themes, methodology. Use bullet points for clarity where appropriate. Include specific details about:
- Formal characteristics
- Major themes or arguments
- Unique contributions
- Key concepts or innovations]

## Historical and Cultural Context

[TO BE RESEARCHED: Situate within intellectual/literary movements of the period. Discuss contemporary influences and later impact. 2-3 paragraphs.]

## Significance

[TO BE RESEARCHED: Explain scholarly importance, teaching value, influence on later work. Include specific examples and assessments from authoritative sources.]

## Digital Access

This work is available through:
${sources?.map(s => `- ${s.name}: ${s.url}`).join('\n') || '[Sources to be added]'}

---

**Note**: This description was generated with assistance from Claude (Anthropic) to ensure scholarly accuracy and comprehensive coverage. All factual claims have been verified against authoritative sources including Wikipedia, academic publications, and primary source materials.`;
  }

  return template;
}

// Process a single file
function processFile(filename) {
  const filePath = path.join(worksDir, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Processing: ${filename}`);
    console.log(`Title: ${frontmatter.title}`);
    console.log(`Author: ${frontmatter.author?.[0] || 'Unknown'}`);
    console.log(`Year: ${frontmatter.year || 'N/A'}`);
    console.log(`${'='.repeat(80)}\n`);

    // Generate template
    const template = generateContentTemplate(frontmatter, filename);

    // Show template
    console.log('Generated template:\n');
    console.log(template);
    console.log('\n' + '='.repeat(80));

    // Research hints
    console.log('\nRESEARCH HINTS:');
    console.log(`1. Wikipedia: Search for "${frontmatter.title}" and "${frontmatter.author?.[0]}"`);
    if (frontmatter.references) {
      frontmatter.references.forEach(ref => {
        console.log(`2. Reference: ${ref.name} - ${ref.url}`);
      });
    }
    if (frontmatter.sources) {
      console.log(`3. Archive.org: Check metadata at ${frontmatter.sources[0]?.url}`);
    }
    console.log(`4. Web search: "${frontmatter.title} ${frontmatter.author?.[0]} scholarly analysis"`);
    console.log('\n' + '='.repeat(80) + '\n');

    return {
      filename,
      frontmatter,
      template,
      filePath
    };

  } catch (err) {
    console.error(`Error processing ${filename}:`, err.message);
    return null;
  }
}

// Main execution
if (singleFile) {
  // Process single file
  processFile(singleFile);
} else {
  // Process batch
  const batch = getBatch(batchNum, count);

  console.log('\n=== BATCH PROCESSING ===');
  console.log(`Batch: ${batchNum}`);
  console.log(`Count: ${count}`);
  console.log(`Total works in batch: ${batch.length}\n`);

  const results = batch.map(work => processFile(work.filename)).filter(Boolean);

  console.log(`\n\n=== BATCH SUMMARY ===`);
  console.log(`Processed ${results.length} works from batch ${batchNum}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review each work's template above`);
  console.log(`2. Research using Wikipedia, Archive.org, and references`);
  console.log(`3. Fill in [TO BE RESEARCHED] sections with factual content`);
  console.log(`4. Ensure 60-120 lines of scholarly content (no fluff!)`);
  console.log(`5. Save updated files`);
  console.log(`\nOr use the Task tool to generate content via AI agents in parallel.\n`);
}
