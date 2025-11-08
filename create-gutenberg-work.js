#!/usr/bin/env node

/**
 * Create properly formatted work files for Dhwani
 * With link validation and scholarly descriptions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to fetch URL and check if it exists
async function validateUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const urlObj = new URL(url);

    const options = {
      method: 'HEAD',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DhwaniBot/1.0)'
      },
      timeout: 10000
    };

    const req = protocol.request(options, (res) => {
      resolve({
        url,
        valid: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode
      });
    });

    req.on('error', () => resolve({ url, valid: false, status: 'error' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ url, valid: false, status: 'timeout' });
    });
    req.end();
  });
}

// Helper to slugify title for filename
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to escape YAML strings
function escapeYaml(str) {
  if (!str) return '';
  if (str.includes("'") || str.includes(':') || str.includes('\n')) {
    return str.replace(/'/g, "''");
  }
  return str;
}

// Generate scholarly description (this is a template - will be customized per work)
function generateDescription(work) {
  // This will need to be customized for each work
  // For now, return a placeholder that indicates manual work needed
  return {
    short: `${work.title} by ${work.author}, published in ${work.year}, is a significant work in Indian literary heritage.`,
    full: `[DESCRIPTION NEEDS SCHOLARLY RESEARCH]\n\n  This work requires a detailed scholarly description covering:\n  1. Historical context and significance\n  2. Author background and their contribution to Indian literature/thought\n  3. The work's impact on Indian cultural, political, or social movements\n  4. Its place in the broader context of Indian heritage\n  \n  The description should be 250-400 words, academic in tone, with no marketing fluff or SEO language.`
  };
}

// Create work file
async function createWork(workData) {
  const {
    gutenbergId,
    title,
    author,
    year,
    language = ['English'],
    genre = [],
    collections = [],
    archiveLinks = [],
    wikiLinks = [],
    customDescription = null
  } = workData;

  console.log(`\n📖 Creating work: ${title}`);
  console.log(`   Author: ${author}`);
  console.log(`   Gutenberg ID: ${gutenbergId}`);

  // Build sources
  const sources = [
    {
      name: 'Project Gutenberg',
      url: `https://www.gutenberg.org/ebooks/${gutenbergId}`,
      type: 'other'
    }
  ];

  // Add archive.org links
  for (const archiveUrl of archiveLinks) {
    sources.push({
      name: 'Internet Archive',
      url: archiveUrl,
      type: 'other'
    });
  }

  // Build references
  const references = [];

  for (const wikiLink of wikiLinks) {
    references.push({
      name: wikiLink.name,
      url: wikiLink.url,
      type: 'wikipedia'
    });
  }

  // Add Open Library reference
  const olQuery = encodeURIComponent(`${title} ${author} ${year}`);
  references.push({
    name: 'Open Library',
    url: `https://openlibrary.org/search?q=${olQuery}`,
    type: 'other'
  });

  // Validate all links
  console.log('   Validating links...');
  const allLinks = [
    ...sources.map(s => s.url),
    ...references.map(r => r.url)
  ];

  const validationResults = await Promise.all(
    allLinks.map(url => validateUrl(url))
  );

  const invalidLinks = validationResults.filter(r => !r.valid);
  if (invalidLinks.length > 0) {
    console.warn('   ⚠️  Invalid links found:');
    invalidLinks.forEach(r => console.warn(`      ${r.url} (${r.status})`));
  } else {
    console.log('   ✅ All links validated');
  }

  // Generate description
  const desc = customDescription || generateDescription(workData);

  // Create frontmatter
  const frontmatter = {
    title: escapeYaml(title),
    author: Array.isArray(author) ? author : [author],
    year,
    language,
    genre,
    description: desc.full || desc.short,
    collections,
    sources,
    references,
    featured: false,
    publishDate: new Date().toISOString().split('T')[0]
  };

  // Build YAML
  let yaml = '---\n';
  yaml += `title: '${frontmatter.title}'\n`;
  yaml += 'author:\n';
  frontmatter.author.forEach(a => yaml += `- ${a}\n`);
  yaml += `year: ${frontmatter.year}\n`;
  yaml += 'language:\n';
  frontmatter.language.forEach(l => yaml += `- ${l}\n`);
  yaml += 'genre:\n';
  frontmatter.genre.forEach(g => yaml += `- ${g}\n`);

  // Description with pipe notation for multiline
  yaml += 'description: |\n';
  const descLines = frontmatter.description.split('\n');
  descLines.forEach(line => yaml += `  ${line}\n`);

  yaml += 'collections:\n';
  frontmatter.collections.forEach(c => yaml += `- ${c}\n`);

  yaml += 'sources:\n';
  frontmatter.sources.forEach(s => {
    yaml += `- name: '${s.name}'\n`;
    yaml += `  url: ${s.url}\n`;
    yaml += `  type: ${s.type}\n`;
  });

  yaml += 'references:\n';
  frontmatter.references.forEach(r => {
    yaml += `- name: '${r.name}'\n`;
    yaml += `  url: ${r.url}\n`;
    yaml += `  type: ${r.type}\n`;
  });

  yaml += `featured: ${frontmatter.featured}\n`;
  yaml += `publishDate: ${frontmatter.publishDate}\n`;
  yaml += '---\n\n';

  // Add body content placeholder
  const body = `## About This Work

[Add detailed sections about the work here, following the pattern of existing works]

## Historical Context

[Add historical context]

## Significance

[Add significance and impact]

---

*Content generated with assistance from Claude (Anthropic)*
`;

  const fullContent = yaml + body;

  // Create filename
  const authorSlug = slugify(Array.isArray(author) ? author[0] : author);
  const titleSlug = slugify(title);
  const filename = `${titleSlug}-${authorSlug}.md`;
  const filepath = path.join(__dirname, 'new-gutenberg-works-2025', filename);

  // Write file
  fs.writeFileSync(filepath, fullContent, 'utf8');
  console.log(`   ✅ Created: ${filename}`);

  return {
    filename,
    filepath,
    valid: invalidLinks.length === 0,
    invalidLinks
  };
}

// Export for use in other scripts
export { createWork, validateUrl, slugify };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Dhwani Work File Generator');
  console.log('Usage: import and call createWork(workData) from another script');
}
