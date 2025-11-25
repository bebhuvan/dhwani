#!/usr/bin/env node

/**
 * Dhwani Work Generator (Enhanced with URL Fetching)
 * Creates new work entries with actual content fetching to prevent hallucinations
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fetch URL content with redirects
async function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchURL(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract text from HTML (simple extraction)
function extractTextFromHTML(html) {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Limit length (Claude has token limits)
  return text.substring(0, 100000);
}

// Fetch and prepare source content
async function fetchSourceContent(archiveUrl, wikiUrl, openLibUrl) {
  const sources = {};

  console.log('📥 Fetching source content...\n');

  if (archiveUrl) {
    try {
      console.log('   Fetching Archive.org...');
      const html = await fetchURL(archiveUrl);
      sources.archive = extractTextFromHTML(html).substring(0, 15000);
      console.log(`   ✅ Archive.org (${sources.archive.length} chars)`);
    } catch (error) {
      console.log(`   ⚠️  Archive.org failed: ${error.message}`);
      sources.archive = null;
    }
  }

  if (wikiUrl) {
    try {
      console.log('   Fetching Wikipedia...');
      const html = await fetchURL(wikiUrl);
      sources.wiki = extractTextFromHTML(html).substring(0, 15000);
      console.log(`   ✅ Wikipedia (${sources.wiki.length} chars)`);
    } catch (error) {
      console.log(`   ⚠️  Wikipedia failed: ${error.message}`);
      sources.wiki = null;
    }
  }

  if (openLibUrl) {
    try {
      console.log('   Fetching Open Library...');
      const html = await fetchURL(openLibUrl);
      sources.openlib = extractTextFromHTML(html).substring(0, 15000);
      console.log(`   ✅ Open Library (${sources.openlib.length} chars)`);
    } catch (error) {
      console.log(`   ⚠️  Open Library failed: ${error.message}`);
      sources.openlib = null;
    }
  }

  console.log('');
  return sources;
}

// Generate filename
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

// Escape YAML values
function escapeYAML(text) {
  if (!text) return text;

  const needsQuotes = /[:\[\]{}&*#?|<>=!%@`]/.test(text) ||
                      /^[-?:,\[\]{}#&*!|>'"%@`]/.test(text) ||
                      /^\s|\s$/.test(text);

  if (needsQuotes) {
    return `'${text.replace(/'/g, "''")}'`;
  }

  return text;
}

// Generate work using Claude with fetched content
async function generateWorkContent(archiveUrl, wikiUrl, openLibUrl, sources) {
  console.log('🤖 Generating work content with Claude...\n');

  const sourcesSection = [];
  if (sources.archive) sourcesSection.push(`<archive_content>\n${sources.archive}\n</archive_content>`);
  if (sources.wiki) sourcesSection.push(`<wikipedia_content>\n${sources.wiki}\n</wikipedia_content>`);
  if (sources.openlib) sourcesSection.push(`<openlibrary_content>\n${sources.openlib}\n</openlibrary_content>`);

  const prompt = `You are creating a new work entry for the Dhwani digital library, which aggregates Indian works in the public domain.

Below is the ACTUAL CONTENT fetched from the provided URLs. Use ONLY this information to create the work entry. DO NOT add information not present in these sources.

${sourcesSection.join('\n\n')}

PROVIDED URLs:
${archiveUrl ? `- Internet Archive: ${archiveUrl}` : ''}
${wikiUrl ? `- Wikipedia: ${wikiUrl}` : ''}
${openLibUrl ? `- Open Library: ${openLibUrl}` : ''}

CRITICAL REQUIREMENTS:

1. **STRICT NO HALLUCINATION POLICY**:
   - ONLY use facts explicitly stated in the content above
   - If you cannot find a piece of information, either:
     * Mark it as [VERIFY: description of what needs verification]
     * Omit it entirely
   - DO NOT infer dates, publishers, or biographical details not in the sources
   - When in doubt, be conservative - less information is better than wrong information

2. **Description Style**:
   - Scholarly and factual tone
   - NO marketing language: avoid "masterpiece", "brilliant", "must-read", "essential"
   - NO superlatives unless directly quoted from a reliable source
   - Focus on verifiable facts: publication details, contents, historical context
   - Be comprehensive but objective

3. **YAML Formatting**:
   - All strings with special characters must be properly escaped
   - Use single quotes for problematic strings
   - Validate colons, quotes, brackets

4. **Required Structure**:

Return a JSON object with these fields:

{
  "title": "Full work title from sources",
  "author": ["Author name(s) from sources"],
  "year": Publication year (number, from sources, or null if not found),
  "language": ["English"] or as stated in sources,
  "genre": [2-4 relevant genres from: "Historical Literature", "Literary Criticism", "Philosophy", "Religious Texts", "Classical Literature", "Poetry", "Drama", "Indology", "Reference Works", "Linguistic Works", "Biography", "Travel Literature", "Political Literature"],
  "description": "Single comprehensive paragraph (200-300 words) covering: work's significance, historical/cultural context, author's background (if available), key themes, contribution to field. Must be factual and derived from sources. NO marketing language.",
  "collections": [1-3 from: "classical-literature", "modern-literature", "reference-works", "linguistic-works", "religious-texts", "historical-works"],
  "sources": [
    // Include all provided URLs with appropriate names
    {"name": "Internet Archive", "url": "archive_url", "type": "other"},
    {"name": "Project Gutenberg", "url": "gutenberg_url", "type": "other"} // if mentioned
  ],
  "references": [
    // Include all provided reference URLs
    {"name": "Wikipedia: Topic", "url": "wiki_url", "type": "wikipedia"},
    {"name": "Open Library: Title", "url": "openlib_url", "type": "other"}
  ],
  "publishDate": "2025-11-16",
  "body": "Markdown content with these sections:

# [Title]

## Overview

[2-3 paragraphs introducing the work, its publication context, and significance. ONLY facts from sources.]

## About the Author

[2-3 paragraphs on author's life, other works, and credentials. ONLY facts from sources. If minimal info available, keep this section brief.]

## The Work

[3-4 paragraphs analyzing the work's content, structure, methodology, and key themes. ONLY facts from sources.]

## Significance

[2-3 paragraphs on the work's historical impact, reception, and scholarly value. ONLY facts from sources.]

## Digital Access

[1 paragraph listing where the work can be accessed online, referencing the provided URLs.]

---

**Note**: This description was generated with assistance from Claude (Anthropic), Anthropic's AI assistant, as part of the Dhwani digital library project."
}

IMPORTANT:
- Output ONLY valid JSON
- Ensure all quotes and special characters are properly escaped
- Double-check that all information comes from the provided sources
- Mark uncertain information with [VERIFY: ...] tags`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16000,
      temperature: 0.2, // Very low temperature for factual accuracy
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;

    // Extract JSON
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(jsonText);

    // Hallucination checks
    const warnings = [];

    if (data.description.includes('[VERIFY')) {
      warnings.push('⚠️  Description contains [VERIFY] tags - needs manual verification');
    }

    if (!data.year) {
      warnings.push('⚠️  Publication year not found in sources');
    } else if (data.year < 1000 || data.year > 2025) {
      warnings.push('⚠️  Publication year seems incorrect: ' + data.year);
    }

    if (!data.author || data.author.length === 0) {
      warnings.push('⚠️  No author information found');
    }

    if (data.body.includes('[VERIFY')) {
      warnings.push('⚠️  Body content contains [VERIFY] tags - needs manual verification');
    }

    if (warnings.length > 0) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                    VERIFICATION WARNINGS                   ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      warnings.forEach(w => console.log(w));
      console.log('');
    }

    return data;

  } catch (error) {
    console.error('❌ Error generating content:', error.message);
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

// Check for duplicates in existing works
async function checkDuplicates(title, author, worksDir) {
  console.log('🔍 Checking for duplicates...\n');

  try {
    const files = await fs.readdir(worksDir);
    const duplicates = [];

    const normalizeTitle = (t) => t.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const normalizeAuthor = (a) => a.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const searchTitle = normalizeTitle(title);
    const searchAuthor = author ? normalizeAuthor(Array.isArray(author) ? author[0] : author) : '';

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filepath = path.join(worksDir, file);
      const content = await fs.readFile(filepath, 'utf-8');

      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) continue;

      const frontmatter = frontmatterMatch[1];

      // Extract title and author from frontmatter
      const titleMatch = frontmatter.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
      const authorMatch = frontmatter.match(/^author:\s*\n-\s*['"]?(.+?)['"]?\s*$/m);

      if (titleMatch) {
        const existingTitle = normalizeTitle(titleMatch[1]);
        const existingAuthor = authorMatch ? normalizeAuthor(authorMatch[1]) : '';

        // Check for title match
        const titleSimilarity = existingTitle === searchTitle ||
                               existingTitle.includes(searchTitle) ||
                               searchTitle.includes(existingTitle);

        // Check for author match
        const authorSimilarity = searchAuthor && existingAuthor &&
                                (existingAuthor === searchAuthor ||
                                 existingAuthor.includes(searchAuthor) ||
                                 searchAuthor.includes(existingAuthor));

        if (titleSimilarity && (!searchAuthor || authorSimilarity)) {
          duplicates.push({
            file,
            title: titleMatch[1],
            author: authorMatch ? authorMatch[1] : 'Unknown'
          });
        }
      }
    }

    if (duplicates.length > 0) {
      console.log('⚠️  POTENTIAL DUPLICATES FOUND:');
      console.log('═'.repeat(70));
      duplicates.forEach((dup, i) => {
        console.log(`${i + 1}. ${dup.file}`);
        console.log(`   Title: ${dup.title}`);
        console.log(`   Author: ${dup.author}`);
        console.log('');
      });
      console.log('═'.repeat(70));
      console.log('\n⚠️  Warning: This work may already exist in the database.');
      console.log('   Please review the duplicates before proceeding.\n');

      return duplicates;
    } else {
      console.log('✅ No duplicates found\n');
      return [];
    }

  } catch (error) {
    console.log(`⚠️  Could not check duplicates: ${error.message}\n`);
    return [];
  }
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Dhwani Enhanced Work Generator v2.0                 ║');
  console.log('║  With URL fetching and hallucination prevention           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node create-work-enhanced.cjs [options]');
    console.log('\nOptions:');
    console.log('  --archive <url>    Internet Archive URL');
    console.log('  --wiki <url>       Wikipedia URL');
    console.log('  --openlib <url>    Open Library URL');
    console.log('\nExample:');
    console.log('  node create-work-enhanced.cjs --archive https://archive.org/details/... --wiki https://en.wikipedia.org/wiki/...');
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

  console.log('📋 Provided URLs:');
  if (archiveUrl) console.log(`   📚 Archive: ${archiveUrl}`);
  if (wikiUrl) console.log(`   📖 Wikipedia: ${wikiUrl}`);
  if (openLibUrl) console.log(`   📕 Open Library: ${openLibUrl}`);
  console.log('');

  try {
    // Fetch source content
    const sources = await fetchSourceContent(archiveUrl, wikiUrl, openLibUrl);

    // Generate work
    const data = await generateWorkContent(archiveUrl, wikiUrl, openLibUrl, sources);

    console.log('✅ Content generated successfully\n');
    console.log(`📖 Title: ${data.title}`);
    console.log(`👤 Author: ${Array.isArray(data.author) ? data.author.join(', ') : data.author}`);
    console.log(`📅 Year: ${data.year || 'Not found'}`);
    console.log('');

    // Check for duplicates
    const worksDir = path.join(__dirname, 'src', 'content', 'works');
    const duplicates = await checkDuplicates(data.title, data.author, worksDir);

    // Create markdown
    const markdown = createFrontmatter(data);

    // Generate filename
    const filename = generateFilename(data.title, Array.isArray(data.author) ? data.author[0] : data.author);
    const filepath = path.join(worksDir, filename);

    // If duplicates found, ask user confirmation
    if (duplicates.length > 0) {
      console.log('❓ Do you want to proceed anyway? The file will be saved with a prefix.');
      console.log('   (Proceeding automatically in 3 seconds...)\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Check if file exists
    try {
      await fs.access(filepath);
      console.log(`⚠️  File already exists: ${filename}`);
      const newFilepath = path.join(worksDir, 'NEW-' + filename);
      await fs.writeFile(newFilepath, markdown, 'utf-8');
      console.log(`✅ Saved as: NEW-${filename}`);
    } catch {
      await fs.writeFile(filepath, markdown, 'utf-8');
      console.log(`✅ Work created: ${filename}`);
    }

    // Show preview
    console.log('\n' + '='.repeat(70));
    console.log('PREVIEW (frontmatter + first few paragraphs):');
    console.log('='.repeat(70));
    const lines = markdown.split('\n').slice(0, 60);
    console.log(lines.join('\n'));
    if (markdown.split('\n').length > 60) {
      console.log('\n... [content continues] ...\n');
    }
    console.log('='.repeat(70));

    console.log('\n✨ Done!');
    console.log('📝 IMPORTANT: Please manually verify:');
    console.log('   • All dates and facts against original sources');
    console.log('   • Author names and biographical details');
    console.log('   • Publication information');
    console.log('   • Any [VERIFY] tags in the content');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
