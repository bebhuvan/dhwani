#!/usr/bin/env node

/**
 * Transform Set 2 candidates to Dhwani format
 *
 * Transformations needed:
 * 1. Convert schema to Dhwani format
 * 2. Extract and restructure metadata
 * 3. Prepare for description generation
 * 4. Add proper structure for sources/references
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  sourcePath: '/home/bhuvanesh.r/Dhawni experimental works/new candidates-2',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/transformed-set2',
};

// Language code to full name mapping
const LANGUAGE_MAP = {
  'eng': 'English',
  'hindi': 'Hindi',
  'sanskrit': 'Sanskrit',
  'marathi': 'Marathi',
  'bengali': 'Bengali',
  'telugu': 'Telugu',
  'urdu': 'Urdu',
  'und': 'Multiple Languages',
};

// Infer genres from title/content
function inferGenres(title, author, year) {
  const genres = [];
  const titleLower = title.toLowerCase();

  // Historical works
  if (titleLower.includes('history') || titleLower.includes('historical')) {
    genres.push('History');
  }

  // Dictionaries and reference
  if (titleLower.includes('dictionary') || titleLower.includes('grammar')) {
    genres.push('Reference Works', 'Linguistic Works');
  }

  // Religious texts
  if (titleLower.includes('bible') || titleLower.includes('veda') ||
      titleLower.includes('purana') || titleLower.includes('sutra')) {
    genres.push('Religious Texts');
  }

  // Literature
  if (titleLower.includes('poem') || titleLower.includes('story') ||
      titleLower.includes('novel')) {
    genres.push('Literature');
  }

  // Medical
  if (titleLower.includes('medical') || titleLower.includes('ayurved') ||
      titleLower.includes('homoeopathic')) {
    genres.push('Medical Texts');
  }

  // If old work, likely classical
  if (year && year < 1800) {
    genres.push('Classical Literature');
  }

  // Default if nothing else
  if (genres.length === 0) {
    genres.push('Historical Texts');
  }

  return [...new Set(genres)];
}

// Infer collections
function inferCollections(genres, year, language) {
  const collections = [];

  for (const genre of genres) {
    if (genre === 'History') collections.push('historical-texts');
    if (genre === 'Reference Works') collections.push('reference-works');
    if (genre === 'Linguistic Works') collections.push('linguistic-works');
    if (genre === 'Religious Texts') collections.push('religious-texts');
    if (genre === 'Classical Literature') collections.push('classical-literature');
    if (genre === 'Medical Texts') collections.push('medical-texts');
  }

  // Add based on year
  if (year && year < 1800) {
    collections.push('ancient-history');
  } else if (year && year >= 1800 && year < 1950) {
    collections.push('modern-literature');
  }

  // Add indology for scholarly works
  collections.push('indology');

  return [...new Set(collections)];
}

// Generate description prompt for AI
function generateDescriptionPrompt(work) {
  return `Generate a scholarly description (150-300 words) for this work:

Title: ${work.title}
Author: ${work.author}
Year: ${work.year}
Language: ${work.language}
Topics: ${work.topics || 'Not specified'}

Current description: ${work.currentDescription}

Requirements:
- Scholarly tone without marketing fluff
- Explain historical context and significance
- Mention key themes or contributions
- Explain relevance to Indian literary/cultural heritage
- If this is about India, emphasize that connection
- If not directly Indian, explain its relevance to Indian studies
- No superlatives without substance

Format: Single paragraph, 150-300 words.`;
}

class Set2Transformer {
  constructor() {
    this.stats = {
      total: 0,
      transformed: 0,
      errors: 0,
    };
    this.needsDescriptions = [];
  }

  parseFrontmatter(content, filename) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return null;
    }

    try {
      // Fix problematic quotes in URLs before parsing
      // The issue: URLs like "...+"Full view"" have unescaped nested quotes
      let yamlContent = match[1];

      // Replace +"Full view"" with +\"Full view\" (escaping inner quotes)
      yamlContent = yamlContent.replace(/\+"Full view""/g, '+\\"Full view\\"');

      const frontmatter = yaml.parse(yamlContent);
      return {
        frontmatter,
        content: content.substring(match[0].length).trim(),
      };
    } catch (error) {
      console.error(`Error parsing ${filename}: ${error.message}`);
      return null;
    }
  }

  transformWork(parsed, filename) {
    const old = parsed.frontmatter;
    const oldContent = parsed.content;

    // Extract metadata
    const title = old.title || '';
    const author = Array.isArray(old.author) ? old.author : [old.author || 'Unknown'];
    const year = parseInt(old.publication_year || old.author_death_year || 1900);
    const originalLang = old.original_language || 'eng';
    const language = [LANGUAGE_MAP[originalLang] || 'English'];

    // Generate genres and collections
    const genres = inferGenres(title, author[0], year);
    const collections = inferCollections(genres, year, language[0]);

    // Extract current description
    const currentDescription = oldContent.split('\n\n')[0] || oldContent.substring(0, 300);

    // Build sources array
    const sources = [];
    if (old.links?.internet_archive) {
      sources.push({
        name: 'Internet Archive',
        url: old.links.internet_archive,
        type: 'archive',
      });
    }

    // Build references
    const references = [];
    references.push({
      name: 'OpenLibrary Search',
      url: `https://openlibrary.org/search?q=${encodeURIComponent(title + ' ' + author[0])}`,
      type: 'openlibrary',
    });

    // Create transformed work
    const transformed = {
      filename,
      frontmatter: {
        title,
        author,
        year,
        language,
        genre: genres,
        description: `[NEEDS GENERATION] ${currentDescription}`, // Placeholder
        collections,
        sources,
        references,
        featured: false,
        publishDate: new Date().toISOString().split('T')[0],
        tags: [], // Will be generated with description
      },
      content: oldContent,
      needsDescription: true,
      descriptionPrompt: generateDescriptionPrompt({
        title,
        author: author[0],
        year,
        language: language[0],
        topics: old.topics,
        currentDescription,
      }),
    };

    return transformed;
  }

  generateMarkdown(work) {
    const fm = work.frontmatter;

    let md = '---\n';
    md += `title: "${fm.title}"\n`;
    md += `author: [${fm.author.map(a => `"${a}"`).join(', ')}]\n`;
    if (fm.year) md += `year: ${fm.year}\n`;
    md += `language: [${fm.language.map(l => `"${l}"`).join(', ')}]\n`;
    md += `genre: [${fm.genre.map(g => `"${g}"`).join(', ')}]\n`;
    md += `description: "${fm.description}"\n`;
    md += `collections: [${fm.collections.map(c => `'${c}'`).join(', ')}]\n`;

    // Sources
    md += 'sources:\n';
    for (const source of fm.sources || []) {
      md += `  - name: "${source.name}"\n`;
      md += `    url: "${source.url}"\n`;
      md += `    type: "${source.type}"\n`;
    }

    // References
    md += 'references:\n';
    for (const ref of fm.references || []) {
      md += `  - name: "${ref.name}"\n`;
      md += `    url: "${ref.url}"\n`;
      md += `    type: "${ref.type}"\n`;
    }

    md += `featured: ${fm.featured || false}\n`;
    md += `publishDate: ${fm.publishDate}\n`;
    md += `tags: [${fm.tags.map(t => `"${t}"`).join(', ')}]\n`;
    md += '---\n\n';
    md += work.content;

    // Add disclaimer
    md += '\n\n---\n\n';
    md += '**Note**: This description was generated with assistance from Claude (Anthropic) to ensure scholarly accuracy and comprehensive coverage. To the best of our knowledge, this work is in the public domain. If you believe there are any copyright concerns, please contact me.\n';

    return md;
  }

  async transformAll() {
    console.log('='.repeat(60));
    console.log('Transforming Set 2 to Dhwani Format');
    console.log('='.repeat(60));
    console.log();

    await fs.mkdir(CONFIG.outputPath, { recursive: true });

    const files = await fs.readdir(CONFIG.sourcePath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('backup_') && !f.startsWith('archive_'));

    this.stats.total = mdFiles.length;
    console.log(`Found ${mdFiles.length} works to transform\n`);

    for (const filename of mdFiles) {
      try {
        const filePath = path.join(CONFIG.sourcePath, filename);
        const content = await fs.readFile(filePath, 'utf-8');

        const parsed = this.parseFrontmatter(content, filename);
        if (!parsed) {
          console.log(`⚠ ${filename} - no frontmatter`);
          this.stats.errors++;
          continue;
        }

        const transformed = this.transformWork(parsed, filename);

        // Save transformed work
        const outputPath = path.join(CONFIG.outputPath, filename);
        const markdown = this.generateMarkdown(transformed);
        await fs.writeFile(outputPath, markdown, 'utf-8');

        // Save description prompt for AI generation
        if (transformed.needsDescription) {
          const promptPath = path.join(CONFIG.outputPath, filename + '.prompt.txt');
          await fs.writeFile(promptPath, transformed.descriptionPrompt, 'utf-8');
          this.needsDescriptions.push({
            filename,
            prompt: transformed.descriptionPrompt,
          });
        }

        console.log(`✓ ${filename}`);
        this.stats.transformed++;

      } catch (error) {
        console.error(`✗ ${filename}: ${error.message}`);
        this.stats.errors++;
      }
    }

    // Save list of works needing descriptions
    const needsDescPath = path.join(CONFIG.outputPath, '_NEEDS_DESCRIPTIONS.json');
    await fs.writeFile(
      needsDescPath,
      JSON.stringify(this.needsDescriptions, null, 2),
      'utf-8'
    );

    console.log('\n' + '='.repeat(60));
    console.log('Transformation Complete!');
    console.log('='.repeat(60));
    console.log(`\nTransformed: ${this.stats.transformed}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`\nOutput: ${CONFIG.outputPath}`);
    console.log(`\nNext step: Generate ${this.needsDescriptions.length} descriptions using AI`);
    console.log(`Prompts saved as: *.prompt.txt files`);
  }

  async run() {
    await this.transformAll();
  }
}

const transformer = new Set2Transformer();
transformer.run().catch(console.error);

export default Set2Transformer;
