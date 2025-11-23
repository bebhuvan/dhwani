#!/usr/bin/env node

/**
 * Smart Link Finder using Claude AI
 *
 * Uses AI to find relevant Wikipedia articles based on the work's content
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const CONFIG = {
  inputDir: process.argv[2] || path.join(__dirname, 'test-candidates'),
  apiKey: process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE',
  model: 'claude-3-5-haiku-20241022',
};

/**
 * Use Claude to suggest relevant Wikipedia articles
 */
async function findRelevantWikipediaArticles(work) {
  const { title, author, genre, description, year } = work.frontmatter;

  const prompt = `You are a research librarian helping to find relevant Wikipedia and Wikisource links for Indian historical works.

**Work:**
Title: ${title}
Author: ${Array.isArray(author) ? author.join(', ') : author}
Year: ${year}
Genre: ${Array.isArray(genre) ? genre.join(', ') : genre}
Description: ${description?.substring(0, 500)}...

**Task:**
Suggest 2-4 relevant Wikipedia article titles that would be useful reference links for this work. Focus on:
1. The main subject/topic of the work (e.g., "Bhagavata Purana" not the specific edition)
2. The author (if notable)
3. Related topics (e.g., language, region, genre)
4. Wikisource page if the work might be there

**Requirements:**
- Suggest actual Wikipedia article titles (not search queries)
- Use exact Wikipedia article names (e.g., "Bhagavata_Purana" not "Bhagavata Purana")
- Include underscores in multi-word titles
- Prioritize articles that actually exist on Wikipedia
- For Malayalam/Tamil works, suggest the language Wikipedia article
- For religious texts, suggest the main text article (not specific editions)

**Respond with JSON only:**
{
  "suggested_articles": [
    {
      "title": "Bhagavata_Purana",
      "reason": "Main subject of this work",
      "type": "wikipedia"
    },
    {
      "title": "Benjamin_Bailey_(missionary)",
      "reason": "Author biography",
      "type": "wikipedia"
    }
  ]
}`;

  try {
    const response = await callClaudeAPI(prompt);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    return result.suggested_articles || [];
  } catch (error) {
    console.error(`   ⚠️  AI suggestion error: ${error.message}`);
    return [];
  }
}

/**
 * Verify Wikipedia article exists
 */
async function verifyWikipediaArticle(articleTitle) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'en.wikipedia.org',
      path: `/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&format=json`,
      headers: {
        'User-Agent': 'DhwaniBot/1.0 (https://github.com/dhwani; contact@dhwani.org) Node.js'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const pages = result.query.pages;
          const pageId = Object.keys(pages)[0];

          if (pageId !== '-1') {
            // Article exists
            const actualTitle = pages[pageId].title.replace(/ /g, '_');
            resolve({
              exists: true,
              url: `https://en.wikipedia.org/wiki/${actualTitle}`,
              title: pages[pageId].title
            });
          } else {
            resolve({ exists: false });
          }
        } catch (error) {
          resolve({ exists: false, error: error.message });
        }
      });
    }).on('error', () => {
      resolve({ exists: false });
    });
  });
}

/**
 * Check Wikisource
 */
async function checkWikisource(title, author) {
  return new Promise((resolve) => {
    const searchQuery = encodeURIComponent(`${title} ${author || ''}`);
    const options = {
      hostname: 'en.wikisource.org',
      path: `/w/api.php?action=opensearch&search=${searchQuery}&limit=1&format=json`,
      headers: {
        'User-Agent': 'DhwaniBot/1.0 (https://github.com/dhwani; contact@dhwani.org) Node.js'
      }
    };

    https.get(options, (res) => {
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
          resolve({ found: false });
        }
      });
    }).on('error', () => {
      resolve({ found: false });
    });
  });
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

  // Simple YAML parser
  const frontmatter = {};
  let inDescription = false;
  let descriptionText = '';

  frontmatterText.split('\n').forEach(line => {
    if (line.startsWith('description: |')) {
      inDescription = true;
      descriptionText = '';
    } else if (inDescription && line.match(/^[a-z_]/)) {
      frontmatter.description = descriptionText.trim();
      inDescription = false;
    } else if (inDescription) {
      descriptionText += line.replace(/^\s{2}/, '') + '\n';
    }

    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
    if (match && !inDescription) {
      const key = match[1];
      let value = match[2].trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        frontmatter[key] = value.slice(1, -1);
      } else if (value.startsWith('[')) {
        try {
          frontmatter[key] = JSON.parse(value);
        } catch {
          frontmatter[key] = value;
        }
      } else if (value && value !== '|') {
        frontmatter[key] = value;
      }
    }
  });

  if (inDescription) {
    frontmatter.description = descriptionText.trim();
  }

  return { frontmatter, body, raw: frontmatterText };
}

/**
 * Update references in frontmatter
 */
function updateReferences(frontmatterText, newRefs) {
  const lines = frontmatterText.split('\n');
  let inReferences = false;
  let refEndIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'references:') {
      inReferences = true;
    } else if (inReferences && lines[i].match(/^[a-zA-Z_]/)) {
      refEndIndex = i;
      break;
    }
  }

  if (refEndIndex === -1) {
    refEndIndex = lines.length;
  }

  // Remove old search references and add new ones
  const newRefLines = newRefs.map(ref =>
    `  - name: "${ref.name}"\n    url: "${ref.url}"\n    type: "${ref.type}"`
  );

  // Find and remove existing search URLs
  const filteredLines = [];
  let skipNext = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Special:Search') || lines[i].includes('search?q=')) {
      // Skip this reference block (usually 3 lines)
      skipNext = 3;
    }

    if (skipNext > 0) {
      skipNext--;
      continue;
    }

    filteredLines.push(lines[i]);
  }

  // Insert new references
  for (let i = 0; i < filteredLines.length; i++) {
    if (filteredLines[i].trim() === 'references:') {
      filteredLines.splice(i + 1, 0, ...newRefLines);
      break;
    }
  }

  return filteredLines.join('\n');
}

/**
 * Call Claude API
 */
async function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CONFIG.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.content && response.content[0]) {
            resolve(response.content[0].text);
          } else {
            reject(new Error(response.error?.message || 'Invalid API response'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = parseFrontmatter(content);

  if (!parsed.frontmatter.title) {
    return { processed: false, reason: 'no title' };
  }

  console.log(`\n   🤖 Using AI to find relevant links...`);

  // Get AI suggestions
  const suggestions = await findRelevantWikipediaArticles(parsed);
  await new Promise(r => setTimeout(r, 1000));

  if (suggestions.length === 0) {
    return { processed: false, reason: 'no suggestions' };
  }

  console.log(`   📋 Got ${suggestions.length} suggestions`);

  const verifiedLinks = [];

  // Verify each suggestion
  for (const suggestion of suggestions) {
    process.stdout.write(`      Checking ${suggestion.title}... `);

    if (suggestion.type === 'wikipedia') {
      const check = await verifyWikipediaArticle(suggestion.title);
      await new Promise(r => setTimeout(r, 500));

      if (check.exists) {
        console.log(`✓`);
        verifiedLinks.push({
          name: `Wikipedia: ${check.title}`,
          url: check.url,
          type: 'wikipedia'
        });
      } else {
        console.log(`✗`);
      }
    }
  }

  // Check Wikisource
  process.stdout.write(`      Checking Wikisource... `);
  const wikisourceCheck = await checkWikisource(
    parsed.frontmatter.title,
    Array.isArray(parsed.frontmatter.author) ? parsed.frontmatter.author[0] : parsed.frontmatter.author
  );
  await new Promise(r => setTimeout(r, 500));

  if (wikisourceCheck.found) {
    console.log(`✓`);
    verifiedLinks.push({
      name: `Wikisource: ${wikisourceCheck.title}`,
      url: wikisourceCheck.url,
      type: 'other'
    });
  } else {
    console.log(`✗`);
  }

  if (verifiedLinks.length > 0) {
    // Update file
    const updatedFrontmatter = updateReferences(parsed.raw, verifiedLinks);
    const updatedContent = `---\n${updatedFrontmatter}\n---${parsed.body}`;

    await fs.writeFile(filePath, updatedContent, 'utf-8');

    return {
      processed: true,
      added: verifiedLinks.length,
      links: verifiedLinks
    };
  }

  return { processed: false, reason: 'no verified links' };
}

/**
 * Main function
 */
async function main() {
  console.log('🔗 Smart Link Finder (AI-Powered)\n');

  const files = await fs.readdir(CONFIG.inputDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`Found ${mdFiles.length} files to process\n`);

  let processed = 0;
  let linksAdded = 0;

  for (const file of mdFiles) {
    processed++;
    const filePath = path.join(CONFIG.inputDir, file);

    console.log(`[${processed}/${mdFiles.length}] ${file}`);

    try {
      const result = await processFile(filePath);

      if (result.processed) {
        linksAdded += result.added;
        console.log(`   ✅ Added ${result.added} verified links`);
      } else {
        console.log(`   ⏭️  Skipped (${result.reason})`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Processed: ${processed} files`);
  console.log(`🔗 Links added: ${linksAdded}`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processFile, findRelevantWikipediaArticles };
