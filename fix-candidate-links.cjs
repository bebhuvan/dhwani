#!/usr/bin/env node

/**
 * Fix Wikipedia and OpenLibrary Links
 *
 * Converts search URLs to actual article/work URLs
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const CONFIG = {
  candidatesDir: process.argv[2] || path.join(__dirname, 'potential-candidates'),
  apiKey: process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE',
};

/**
 * Fetch Wikipedia article for a title
 */
async function findWikipediaArticle(title, author) {
  return new Promise((resolve) => {
    const searchQuery = encodeURIComponent(`${title} ${author || ''}`);
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${searchQuery}&limit=1&format=json`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results[3] && results[3][0]) {
            resolve({ found: true, url: results[3][0], title: results[1][0] });
          } else {
            resolve({ found: false });
          }
        } catch (error) {
          resolve({ found: false, error: error.message });
        }
      });
    }).on('error', () => {
      resolve({ found: false });
    });
  });
}

/**
 * Find author Wikipedia page
 */
async function findAuthorWikipedia(author) {
  if (!author || typeof author !== 'string') return { found: false };

  return new Promise((resolve) => {
    const searchQuery = encodeURIComponent(author);
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${searchQuery}&limit=1&format=json`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results[3] && results[3][0]) {
            resolve({ found: true, url: results[3][0], title: results[1][0] });
          } else {
            resolve({ found: false });
          }
        } catch (error) {
          resolve({ found: false, error: error.message });
        }
      });
    }).on('error', () => {
      resolve({ found: false });
    });
  });
}

/**
 * Find OpenLibrary work
 */
async function findOpenLibraryWork(title, author) {
  return new Promise((resolve) => {
    const searchQuery = encodeURIComponent(`${title}`);
    const url = `https://openlibrary.org/search.json?q=${searchQuery}&limit=1`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.docs && results.docs[0] && results.docs[0].key) {
            const workKey = results.docs[0].key;
            resolve({ found: true, url: `https://openlibrary.org${workKey}`, key: workKey });
          } else {
            resolve({ found: false });
          }
        } catch (error) {
          resolve({ found: false, error: error.message });
        }
      });
    }).on('error', () => {
      resolve({ found: false });
    });
  });
}

/**
 * Check if URL is a search URL
 */
function isSearchUrl(url) {
  if (!url) return false;
  return url.includes('/Special:Search/') ||
         url.includes('wikipedia.org/wiki/Special:Search') ||
         url.includes('openlibrary.org/search?q=');
}

/**
 * Parse frontmatter
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: '', body: content };
  }

  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
    fullMatch: match[0]
  };
}

/**
 * Update references in frontmatter
 */
function updateReferences(frontmatterText, updates) {
  let updated = frontmatterText;

  // Add new references
  if (updates.length > 0) {
    const referencesIndex = updated.indexOf('references:');
    if (referencesIndex !== -1) {
      // Find the end of references section
      const lines = updated.split('\n');
      let insertIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === 'references:') {
          // Find where references section ends
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].match(/^[a-zA-Z_]/)) {
              // Found next section
              insertIndex = j;
              break;
            }
          }
          if (insertIndex === -1) {
            insertIndex = lines.length;
          }
          break;
        }
      }

      if (insertIndex !== -1) {
        const newRefs = updates.map(u => `  - name: "${u.name}"\n    url: "${u.url}"\n    type: "${u.type}"`);
        lines.splice(insertIndex, 0, ...newRefs);
        updated = lines.join('\n');
      }
    }
  }

  return updated;
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const { frontmatter, body, fullMatch } = parseFrontmatter(content);

  // Extract title and author
  const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
  const authorMatch = frontmatter.match(/author:\s*\["([^"]+)"\]/);

  if (!titleMatch) {
    return { fixed: false, reason: 'no title found' };
  }

  const title = titleMatch[1];
  const author = authorMatch ? authorMatch[1] : '';

  const updates = [];

  // Check if we need to fix links
  const hasSearchUrls = frontmatter.match(/Special:Search/) || frontmatter.match(/search\?q=/);

  if (hasSearchUrls || !frontmatter.includes('Open Library')) {
    console.log(`\n   🔍 Finding proper links for: ${title}`);

    // Find Wikipedia article
    process.stdout.write('      📖 Wikipedia article... ');
    const wikiArticle = await findWikipediaArticle(title, author);
    await new Promise(r => setTimeout(r, 500));

    if (wikiArticle.found) {
      console.log(`✓ (${wikiArticle.title})`);
      updates.push({
        name: `Wikipedia: ${wikiArticle.title}`,
        url: wikiArticle.url,
        type: 'wikipedia'
      });
    } else {
      console.log('✗ (not found)');
    }

    // Find author Wikipedia
    if (author) {
      process.stdout.write('      👤 Author Wikipedia... ');
      const authorWiki = await findAuthorWikipedia(author);
      await new Promise(r => setTimeout(r, 500));

      if (authorWiki.found) {
        console.log(`✓ (${authorWiki.title})`);
        updates.push({
          name: `Wikipedia: ${authorWiki.title}`,
          url: authorWiki.url,
          type: 'wikipedia'
        });
      } else {
        console.log('✗ (not found)');
      }
    }

    // Find OpenLibrary work
    process.stdout.write('      📚 OpenLibrary work... ');
    const olWork = await findOpenLibraryWork(title, author);
    await new Promise(r => setTimeout(r, 500));

    if (olWork.found) {
      console.log(`✓ (${olWork.key})`);
      updates.push({
        name: `Open Library: ${title}`,
        url: olWork.url,
        type: 'other'
      });
    } else {
      console.log('✗ (not found)');
    }

    if (updates.length > 0) {
      // Update frontmatter
      const updatedFrontmatter = updateReferences(frontmatter, updates);
      const updatedContent = `---\n${updatedFrontmatter}\n---${body}`;

      await fs.writeFile(filePath, updatedContent, 'utf-8');
      return { fixed: true, updates: updates.length };
    }
  }

  return { fixed: false, reason: 'no updates needed' };
}

/**
 * Main function
 */
async function main() {
  console.log('🔗 Starting Link Fixing Process\n');

  const files = await fs.readdir(CONFIG.candidatesDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`Found ${mdFiles.length} files to process\n`);

  let processed = 0;
  let fixed = 0;

  for (const file of mdFiles) {
    processed++;
    const filePath = path.join(CONFIG.candidatesDir, file);

    console.log(`[${processed}/${mdFiles.length}] ${file}`);

    try {
      const result = await processFile(filePath);
      if (result.fixed) {
        fixed++;
        console.log(`   ✅ Fixed (${result.updates} new links)`);
      } else {
        console.log(`   ⏭️  Skipped (${result.reason})`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Processed: ${processed} files`);
  console.log(`🔗 Fixed: ${fixed} files`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findWikipediaArticle, findOpenLibraryWork, processFile };
