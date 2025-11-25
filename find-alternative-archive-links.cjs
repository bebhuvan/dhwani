#!/usr/bin/env node

/**
 * Find Alternative Archive.org Links
 *
 * Searches for alternative copies of the same work on Archive.org
 * for redundancy (in case links get taken down)
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const CONFIG = {
  inputDir: process.argv[2] || path.join(__dirname, 'verified-batches'),
  apiKey: process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE',
};

/**
 * Search Archive.org for alternative copies
 */
async function searchArchiveOrg(title, author, year) {
  return new Promise((resolve) => {
    // Build search query
    const query = encodeURIComponent(`${title} ${author || ''}`);
    const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier,title,creator,year&rows=10&output=json`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.response && results.response.docs) {
            const matches = results.response.docs.map(doc => ({
              identifier: doc.identifier,
              title: doc.title,
              creator: doc.creator,
              year: doc.year,
              url: `https://archive.org/details/${doc.identifier}`
            }));
            resolve({ found: true, matches });
          } else {
            resolve({ found: false, matches: [] });
          }
        } catch (error) {
          resolve({ found: false, error: error.message, matches: [] });
        }
      });
    }).on('error', (error) => {
      resolve({ found: false, error: error.message, matches: [] });
    });
  });
}

/**
 * Check if identifier is different from existing sources
 */
function isNewSource(identifier, existingSources) {
  const existingIds = existingSources
    .map(s => {
      const match = s.url?.match(/archive\.org\/details\/([^/?]+)/);
      return match ? match[1] : null;
    })
    .filter(Boolean);

  return !existingIds.includes(identifier);
}

/**
 * Parse frontmatter
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content, raw: '' };
  }

  const frontmatterText = match[1];
  const body = content.slice(match[0].length);

  // Parse YAML simply
  const frontmatter = {};
  const lines = frontmatterText.split('\n');

  let currentKey = null;
  let currentArray = null;
  let inSources = false;
  const sources = [];

  for (const line of lines) {
    if (line.trim() === 'sources:') {
      inSources = true;
      currentArray = [];
      continue;
    }

    if (inSources) {
      if (line.match(/^[a-zA-Z_]/)) {
        // End of sources section
        inSources = false;
        frontmatter.sources = sources;
      } else if (line.trim().startsWith('- name:')) {
        // Start of new source
        const nameMatch = line.match(/name:\s*"([^"]+)"/);
        if (nameMatch) {
          const currentSource = { name: nameMatch[1] };
          sources.push(currentSource);
        }
      } else if (line.trim().startsWith('url:') && sources.length > 0) {
        const urlMatch = line.match(/url:\s*"([^"]+)"/);
        if (urlMatch) {
          sources[sources.length - 1].url = urlMatch[1];
        }
      } else if (line.trim().startsWith('type:') && sources.length > 0) {
        const typeMatch = line.match(/type:\s*"([^"]+)"/);
        if (typeMatch) {
          sources[sources.length - 1].type = typeMatch[1];
        }
      }
    }

    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
    if (keyMatch && !inSources) {
      const key = keyMatch[1];
      let value = keyMatch[2].trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        frontmatter[key] = value.slice(1, -1);
      } else if (value.startsWith('[')) {
        try {
          frontmatter[key] = JSON.parse(value);
        } catch {
          frontmatter[key] = value;
        }
      } else if (value) {
        frontmatter[key] = value;
      }
    }
  }

  if (sources.length > 0) {
    frontmatter.sources = sources;
  }

  return { frontmatter, body, raw: frontmatterText };
}

/**
 * Add alternative sources to frontmatter
 */
function addAlternativeSources(frontmatterText, newSources) {
  // Find the sources section
  const lines = frontmatterText.split('\n');
  let sourcesEndIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'sources:') {
      // Find where sources section ends
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^[a-zA-Z_]/)) {
          sourcesEndIndex = j;
          break;
        }
      }
      if (sourcesEndIndex === -1) {
        sourcesEndIndex = lines.length;
      }
      break;
    }
  }

  if (sourcesEndIndex !== -1 && newSources.length > 0) {
    const newSourcesYaml = newSources.map(source =>
      `  - name: "${source.name}"\n    url: "${source.url}"\n    type: "${source.type}"`
    );

    lines.splice(sourcesEndIndex, 0, ...newSourcesYaml);
    return lines.join('\n');
  }

  return frontmatterText;
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const { frontmatter, body, raw } = parseFrontmatter(content);

  if (!frontmatter.title) {
    return { processed: false, reason: 'no title found' };
  }

  const title = frontmatter.title;
  const author = Array.isArray(frontmatter.author) ? frontmatter.author[0] : frontmatter.author;
  const year = frontmatter.year;

  console.log(`\n   🔍 Searching for alternative copies...`);

  // Search Archive.org
  const searchResults = await searchArchiveOrg(title, author, year);

  if (searchResults.found && searchResults.matches.length > 0) {
    console.log(`   📚 Found ${searchResults.matches.length} potential matches`);

    // Filter out existing sources
    const newSources = searchResults.matches
      .filter(match => isNewSource(match.identifier, frontmatter.sources || []))
      .slice(0, 3) // Limit to 3 additional sources
      .map(match => ({
        name: `Internet Archive (${match.identifier})`,
        url: match.url,
        type: 'other'
      }));

    if (newSources.length > 0) {
      console.log(`   ✓ Adding ${newSources.length} new alternative sources`);

      // Update frontmatter
      const updatedFrontmatter = addAlternativeSources(raw, newSources);
      const updatedContent = `---\n${updatedFrontmatter}\n---${body}`;

      await fs.writeFile(filePath, updatedContent, 'utf-8');

      return {
        processed: true,
        added: newSources.length,
        sources: newSources
      };
    } else {
      console.log(`   ⏭️  No new sources (all existing sources already listed)`);
      return { processed: false, reason: 'no new sources' };
    }
  } else {
    console.log(`   ⏭️  No alternative copies found`);
    return { processed: false, reason: 'no matches found' };
  }
}

/**
 * Process all files in directory recursively
 */
async function processDirectory(dir) {
  const stats = await fs.stat(dir);

  if (stats.isFile() && dir.endsWith('.md')) {
    return [dir];
  }

  if (stats.isDirectory()) {
    const entries = await fs.readdir(dir);
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const entryStats = await fs.stat(fullPath);

      if (entryStats.isFile() && entry.endsWith('.md')) {
        files.push(fullPath);
      } else if (entryStats.isDirectory()) {
        const subFiles = await processDirectory(fullPath);
        files.push(...subFiles);
      }
    }

    return files;
  }

  return [];
}

/**
 * Main function
 */
async function main() {
  console.log('🔗 Finding Alternative Archive.org Links\n');

  // Get all markdown files
  const files = await processDirectory(CONFIG.inputDir);
  console.log(`Found ${files.length} files to process\n`);

  let processed = 0;
  let sourcesAdded = 0;

  for (const file of files) {
    const filename = path.basename(file);
    processed++;

    console.log(`[${processed}/${files.length}] ${filename}`);

    try {
      const result = await processFile(file);

      if (result.processed) {
        sourcesAdded += result.added;
        console.log(`   ✅ Added ${result.added} alternative sources`);
      } else {
        console.log(`   ⏭️  ${result.reason}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Processed: ${processed} files`);
  console.log(`🔗 Total alternative sources added: ${sourcesAdded}`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { searchArchiveOrg, processFile };
