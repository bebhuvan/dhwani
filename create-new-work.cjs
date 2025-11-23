#!/usr/bin/env node

/**
 * Dhwani Work Generator
 * Creates new work entries from Archive.org, Wikipedia, and Open Library links
 * with comprehensive descriptions and hallucination checks
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fetch URL content
async function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract title from filename
function generateFilename(title, author) {
  const cleanTitle = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const cleanAuthor = author ? author.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() : '';

  return cleanAuthor ? `${cleanTitle}-${cleanAuthor}.md` : `${cleanTitle}.md`;
}

// Validate YAML special characters
function escapeYAML(text) {
  if (!text) return text;

  // Check if text needs quotes (contains special chars, starts with special chars, etc.)
  const needsQuotes = /[:\[\]{}&*#?|<>=!%@`]/.test(text) ||
                      /^[-?:,\[\]{}#&*!|>'"%@`]/.test(text) ||
                      /^\s|\s$/.test(text);

  if (needsQuotes) {
    // Escape existing quotes
    return `'${text.replace(/'/g, "''")}'`;
  }

  return text;
}

// Generate work content using Claude
async function generateWorkContent(archiveUrl, wikiUrl, openLibUrl) {
  console.log('\n🔍 Fetching information from provided URLs...\n');

  const prompt = `You are creating a new work entry for the Dhwani digital library, which aggregates Indian works in the public domain.

You have been provided with the following links:
${archiveUrl ? `- Internet Archive: ${archiveUrl}` : ''}
${wikiUrl ? `- Wikipedia: ${wikiUrl}` : ''}
${openLibUrl ? `- Open Library: ${openLibUrl}` : ''}

CRITICAL REQUIREMENTS:

1. **Hallucination Prevention**:
   - ONLY include information you can verify from the provided links or general knowledge
   - DO NOT make up dates, publisher information, or biographical details
   - If uncertain about any detail, indicate [VERIFY NEEDED] or omit it
   - Cross-reference information between sources when possible

2. **Description Style**:
   - NO marketing language, superlatives, or promotional tone
   - NO phrases like "masterpiece", "brilliant", "essential reading"
   - Focus on factual, scholarly information
   - Be comprehensive but objective

3. **YAML Formatting**:
   - Ensure all special characters are properly escaped
   - Use single quotes for strings with special characters
   - Double-check colons, quotes, and brackets
   - Test that the YAML is valid

4. **Structure Required**:

FRONTMATTER SECTION:
- title: The work's full title (properly escaped for YAML)
- author: Array of author names (properly escaped)
- year: Publication year (verify from sources)
- language: Array (typically ["English"] for translations/English works)
- genre: Array of 2-4 relevant genres from: Historical Literature, Literary Criticism, Philosophy, Religious Texts, Classical Literature, Poetry, Drama, Indology, Reference Works, Linguistic Works, etc.
- description: Single comprehensive paragraph (200-300 words) that:
  * Introduces the work and its significance
  * Discusses historical/cultural context
  * Explains the work's contribution to the field
  * Mentions key themes or content areas
  * Notes the author's credentials/background
  * Avoids ALL marketing language
  * Must be enclosed with | for multiline
- collections: Array of 1-3 collections (classical-literature, modern-literature, reference-works, linguistic-works, religious-texts, historical-works)
- sources: Array of source links (MUST include all provided links with proper formatting)
- references: Array of reference links (Wikipedia, Open Library, Wikisource if available)
- featured: false
- publishDate: Today's date (2025-11-16)

BODY SECTION (Markdown):
Create scholarly body content with these sections:
1. ## Overview (2-3 paragraphs on the work's significance and context)
2. ## About the Author or ## About [Author Name] (2-3 paragraphs on the author's life and other works)
3. ## The Work or ## Structure and Contents (3-4 paragraphs analyzing the work's content, methodology, themes)
4. ## Significance or ## Historical Context (2-3 paragraphs on the work's impact and reception)
5. ## Digital Access or ## Digital Availability (1 paragraph listing where the work can be accessed)

At the end, add this EXACT disclaimer:
---

**Note**: This description was generated with assistance from Claude (Anthropic), Anthropic's AI assistant, as part of the Dhwani digital library project.

5. **Output Format**:
Return ONLY a valid JSON object with this structure:
{
  "title": "Work Title",
  "author": ["Author Name"],
  "year": 1900,
  "language": ["English"],
  "genre": ["Genre1", "Genre2"],
  "description": "Single paragraph description...",
  "collections": ["collection-name"],
  "sources": [
    {"name": "Source Name", "url": "url", "type": "other"}
  ],
  "references": [
    {"name": "Reference Name", "url": "url", "type": "wikipedia"}
  ],
  "body": "# Title\\n\\n## Overview\\n\\n..."
}

IMPORTANT: Ensure the JSON is valid and all quotes/special characters are properly escaped.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.3, // Lower temperature for more factual output
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    // Extract JSON from response (might be wrapped in markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(jsonText);

    // Validation checks
    if (!data.title || !data.author || !data.description || !data.body) {
      throw new Error('Missing required fields in generated content');
    }

    // Check for common hallucination indicators
    const hallucinationWarnings = [];
    if (data.description.match(/\[VERIFY NEEDED\]/)) {
      hallucinationWarnings.push('Description contains unverified information');
    }
    if (!data.year || data.year < 1000 || data.year > 2025) {
      hallucinationWarnings.push('Publication year seems incorrect');
    }

    if (hallucinationWarnings.length > 0) {
      console.warn('⚠️  WARNINGS:');
      hallucinationWarnings.forEach(w => console.warn(`   - ${w}`));
      console.log('\n');
    }

    return data;
  } catch (error) {
    console.error('Error generating content:', error.message);
    throw error;
  }
}

// Create frontmatter
function createFrontmatter(data) {
  const authorArray = Array.isArray(data.author) ? data.author : [data.author];
  const authors = authorArray.map(a => `\n- ${escapeYAML(a)}`).join('');

  const languages = data.language.map(l => `\n- ${l}`).join('');
  const genres = data.genre.map(g => `\n- ${g}`).join('');
  const collections = data.collections.map(c => `\n- ${c}`).join('');

  const sources = data.sources.map(s =>
    `\n- name: ${escapeYAML(s.name)}\n  url: ${s.url}\n  type: ${s.type}`
  ).join('');

  const references = data.references.map(r =>
    `\n- name: ${escapeYAML(r.name)}\n  url: ${r.url}\n  type: ${r.type}`
  ).join('');

  return `---
title: ${escapeYAML(data.title)}
author:${authors}
year: ${data.year}
language:${languages}
genre:${genres}
description: |
  ${data.description}
collections:${collections}
sources:${sources}
references:${references}
featured: false
publishDate: ${data.publishDate || '2025-11-16'}
---

${data.body}
`;
}

// Validate YAML formatting
async function validateYAML(content) {
  // Basic validation checks
  const issues = [];

  // Check for unescaped colons in values
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and markdown content (after ---)
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // In frontmatter section
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      // Check if value has unescaped special chars
      if (value && !value.startsWith("'") && !value.startsWith('"') && !value.startsWith('|')) {
        if (value.match(/[:\[\]{}]/)) {
          issues.push(`Line ${i + 1}: Unescaped special character in value: ${line}`);
        }
      }
    }
  }

  return issues;
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Dhwani Work Generator                             ║');
  console.log('║  Creating new work entry for Indian public domain works   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get URLs from command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node create-new-work.cjs [options]');
    console.log('\nOptions:');
    console.log('  --archive <url>    Internet Archive URL');
    console.log('  --wiki <url>       Wikipedia URL');
    console.log('  --openlib <url>    Open Library URL');
    console.log('\nExample:');
    console.log('  node create-new-work.cjs --archive https://archive.org/details/... --wiki https://en.wikipedia.org/wiki/...');
    process.exit(1);
  }

  let archiveUrl, wikiUrl, openLibUrl;

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    if (flag === '--archive') archiveUrl = value;
    if (flag === '--wiki') wikiUrl = value;
    if (flag === '--openlib') openLibUrl = value;
  }

  if (!archiveUrl && !wikiUrl && !openLibUrl) {
    console.error('❌ Error: At least one URL must be provided');
    process.exit(1);
  }

  console.log('📋 Input URLs:');
  if (archiveUrl) console.log(`   Archive: ${archiveUrl}`);
  if (wikiUrl) console.log(`   Wikipedia: ${wikiUrl}`);
  if (openLibUrl) console.log(`   Open Library: ${openLibUrl}`);
  console.log('');

  try {
    // Generate content
    const data = await generateWorkContent(archiveUrl, wikiUrl, openLibUrl);

    console.log('✅ Content generated successfully\n');
    console.log(`📖 Title: ${data.title}`);
    console.log(`👤 Author: ${Array.isArray(data.author) ? data.author.join(', ') : data.author}`);
    console.log(`📅 Year: ${data.year}`);
    console.log('');

    // Create full markdown content
    const markdown = createFrontmatter(data);

    // Validate YAML
    console.log('🔍 Validating YAML formatting...');
    const yamlIssues = await validateYAML(markdown);

    if (yamlIssues.length > 0) {
      console.warn('⚠️  YAML validation warnings:');
      yamlIssues.forEach(issue => console.warn(`   ${issue}`));
      console.log('');
    } else {
      console.log('✅ YAML validation passed\n');
    }

    // Generate filename
    const filename = generateFilename(data.title, Array.isArray(data.author) ? data.author[0] : data.author);
    const worksDir = path.join(__dirname, 'src', 'content', 'works');
    const filepath = path.join(worksDir, filename);

    // Check if file exists
    try {
      await fs.access(filepath);
      console.log(`⚠️  File already exists: ${filename}`);
      console.log('   Saving as: NEW-' + filename);
      const newFilepath = path.join(worksDir, 'NEW-' + filename);
      await fs.writeFile(newFilepath, markdown, 'utf-8');
      console.log(`\n✅ Work created: ${newFilepath}`);
    } catch {
      // File doesn't exist, create it
      await fs.writeFile(filepath, markdown, 'utf-8');
      console.log(`\n✅ Work created: ${filepath}`);
    }

    // Show preview
    console.log('\n' + '='.repeat(60));
    console.log('PREVIEW (first 50 lines):');
    console.log('='.repeat(60));
    const lines = markdown.split('\n').slice(0, 50);
    console.log(lines.join('\n'));
    console.log('='.repeat(60));

    console.log('\n✨ Done! Please review the generated work for accuracy.');
    console.log('   Verify all dates, names, and facts against source materials.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
