#!/usr/bin/env node

/**
 * Enhance Set 2 transformed works
 * - Add alternative Archive.org sources
 * - Add Wikipedia/Wikisource references
 * - Generate scholarly descriptions
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  sourcePath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/transformed-set2',
  outputPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/enhanced-set2',
  delay: 2000, // 2 seconds between API calls
};

class Set2Enhancer {
  constructor() {
    this.stats = {
      total: 0,
      enhanced: 0,
      alternativeSourcesAdded: 0,
      wikipediaLinksAdded: 0,
      descriptionsGenerated: 0,
      errors: 0,
    };
  }

  parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return null;
    }

    try {
      const frontmatter = yaml.parse(match[1]);
      return {
        frontmatter,
        content: content.substring(match[0].length).trim(),
      };
    } catch (error) {
      return null;
    }
  }

  async findAlternativeSources(title, author) {
    try {
      const authorName = Array.isArray(author) ? author[0] : author;
      const query = `${title} ${authorName}`.trim();
      const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator&rows=10&output=json`;

      const response = await fetch(searchUrl);
      if (!response.ok) return [];

      const data = await response.json();
      const docs = data.response?.docs || [];

      const sources = [];
      for (const doc of docs.slice(0, 5)) {
        if (doc.identifier) {
          sources.push({
            name: `Internet Archive (${doc.identifier.substring(0, 20)}...)`,
            url: `https://archive.org/details/${doc.identifier}`,
            type: 'archive',
          });
        }
      }

      return sources;
    } catch (error) {
      console.error(`  Error finding alternative sources: ${error.message}`);
      return [];
    }
  }

  async findWikipediaLink(title, author) {
    try {
      const authorName = Array.isArray(author) ? author[0] : author;
      const queries = [
        `${title} ${authorName}`,
        `${title}`,
        authorName,
      ];

      for (const query of queries) {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json&origin=*`;

        const response = await fetch(searchUrl);
        if (!response.ok) continue;

        const data = await response.json();
        if (data[1] && data[1].length > 0 && data[3] && data[3][0]) {
          return {
            name: `Wikipedia: ${data[1][0]}`,
            url: data[3][0],
            type: 'wikipedia',
          };
        }
      }

      return null;
    } catch (error) {
      console.error(`  Error finding Wikipedia link: ${error.message}`);
      return null;
    }
  }

  async findWikisourceLink(title, author) {
    try {
      const authorName = Array.isArray(author) ? author[0] : author;
      const query = `${title} ${authorName}`;
      const searchUrl = `https://en.wikisource.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json&origin=*`;

      const response = await fetch(searchUrl);
      if (!response.ok) return null;

      const data = await response.json();
      if (data[1] && data[1].length > 0 && data[3] && data[3][0]) {
        return {
          name: `Wikisource: ${data[1][0]}`,
          url: data[3][0],
          type: 'wikisource',
        };
      }

      return null;
    } catch (error) {
      console.error(`  Error finding Wikisource link: ${error.message}`);
      return null;
    }
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

    return md;
  }

  async enhanceWork(filename) {
    try {
      const filePath = path.join(CONFIG.sourcePath, filename);
      const content = await fs.readFile(filePath, 'utf-8');

      const parsed = this.parseFrontmatter(content);
      if (!parsed) {
        console.log(`⚠ ${filename} - could not parse`);
        this.stats.errors++;
        return;
      }

      const fm = parsed.frontmatter;
      let changed = false;

      // Skip if description is already generated
      if (!fm.description || fm.description.startsWith('[NEEDS GENERATION]')) {
        console.log(`ℹ ${filename} - needs description (will be generated in batch)`);
      }

      // Add alternative Archive.org sources
      const existingUrls = new Set((fm.sources || []).map(s => s.url));
      const altSources = await this.findAlternativeSources(fm.title, fm.author);

      let addedSources = 0;
      for (const source of altSources) {
        if (!existingUrls.has(source.url) && (fm.sources || []).length < 7) {
          fm.sources = fm.sources || [];
          fm.sources.push(source);
          existingUrls.add(source.url);
          addedSources++;
          changed = true;
        }
      }

      if (addedSources > 0) {
        this.stats.alternativeSourcesAdded += addedSources;
        console.log(`  ✓ Added ${addedSources} alternative source(s)`);
      }

      await new Promise(resolve => setTimeout(resolve, CONFIG.delay));

      // Add Wikipedia link
      fm.references = fm.references || [];
      const hasWikipedia = fm.references.some(r => r.type === 'wikipedia');

      if (!hasWikipedia) {
        const wikiLink = await this.findWikipediaLink(fm.title, fm.author);
        if (wikiLink) {
          fm.references.push(wikiLink);
          this.stats.wikipediaLinksAdded++;
          console.log(`  ✓ Added Wikipedia link`);
          changed = true;
        }
      }

      await new Promise(resolve => setTimeout(resolve, CONFIG.delay));

      // Add Wikisource link
      const hasWikisource = fm.references.some(r => r.type === 'wikisource');

      if (!hasWikisource) {
        const wsLink = await this.findWikisourceLink(fm.title, fm.author);
        if (wsLink) {
          fm.references.push(wsLink);
          console.log(`  ✓ Added Wikisource link`);
          changed = true;
        }
      }

      // Save enhanced work
      if (changed) {
        const enhanced = {
          frontmatter: fm,
          content: parsed.content,
        };

        const outputPath = path.join(CONFIG.outputPath, filename);
        const markdown = this.generateMarkdown(enhanced);
        await fs.writeFile(outputPath, markdown, 'utf-8');

        console.log(`✓ ${filename}`);
        this.stats.enhanced++;
      } else {
        // Still copy to output even if no changes
        const outputPath = path.join(CONFIG.outputPath, filename);
        await fs.writeFile(outputPath, content, 'utf-8');
        console.log(`→ ${filename} (no changes)`);
      }

    } catch (error) {
      console.error(`✗ ${filename}: ${error.message}`);
      this.stats.errors++;
    }
  }

  async enhanceAll() {
    console.log('='.repeat(60));
    console.log('Enhancing Set 2 Works');
    console.log('='.repeat(60));
    console.log();

    await fs.mkdir(CONFIG.outputPath, { recursive: true });

    const files = await fs.readdir(CONFIG.sourcePath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_'));

    this.stats.total = mdFiles.length;
    console.log(`Found ${mdFiles.length} works to enhance\n`);

    for (const filename of mdFiles) {
      await this.enhanceWork(filename);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delay));
    }

    console.log('\n' + '='.repeat(60));
    console.log('Enhancement Complete!');
    console.log('='.repeat(60));
    console.log(`\nTotal: ${this.stats.total}`);
    console.log(`Enhanced: ${this.stats.enhanced}`);
    console.log(`Alternative sources added: ${this.stats.alternativeSourcesAdded}`);
    console.log(`Wikipedia links added: ${this.stats.wikipediaLinksAdded}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`\nOutput: ${CONFIG.outputPath}`);
    console.log('\nNext step: Generate descriptions for works marked [NEEDS GENERATION]');
  }

  async run() {
    await this.enhanceAll();
  }
}

const enhancer = new Set2Enhancer();
enhancer.run().catch(console.error);

export default Set2Enhancer;
