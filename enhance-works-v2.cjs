const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Anthropic = require('@anthropic-ai/sdk');

const CLAUDE_API_KEY = 'YOUR_API_KEY_HERE';
const anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });

const VERIFIED_DIR = './verified-works';
const OUTPUT_DIR = './fully-enhanced-works';
const TEST_MODE = process.argv.includes('--test');
const TEST_LIMIT = 5;

const RATE_LIMIT_DELAY = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse frontmatter manually (more robust than gray-matter)
function parseFrontmatter(content) {
  const lines = content.split('\n');
  let frontmatterStart = -1;
  let frontmatterEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (frontmatterStart === -1) {
        frontmatterStart = i;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }

  if (frontmatterStart === -1 || frontmatterEnd === -1) {
    throw new Error('No valid frontmatter found');
  }

  // Extract frontmatter YAML and body
  const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
  const bodyLines = lines.slice(frontmatterEnd + 1);

  // Manually build YAML (fix description block) - this fixes the lines BEFORE parsing
  const fixedYamlLines = fixDescriptionBlock(frontmatterLines);
  const yamlString = fixedYamlLines.join('\n');

  // Debug: write fixed YAML to temp file
  if (process.env.DEBUG) {
    const filename = content.split('\n')[1].match(/title: "(.+)"/)?.[1] || 'unknown';
    fs.writeFileSync(`/tmp/fixed-yaml-${filename.substring(0, 30)}.txt`, yamlString, 'utf8');
  }

  // Now parse the fixed YAML
  const data = yaml.load(yamlString);
  const body = bodyLines.join('\n');

  return { data, body };
}

// Fix description block to use proper YAML formatting
function fixDescriptionBlock(lines) {
  const fixed = [];
  let inDescription = false;
  let descriptionParagraphs = []; // Array of paragraphs
  let currentParagraph = ''; // Current paragraph being accumulated

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^description:\s*\|/)) {
      inDescription = true;
      continue; // We'll rebuild this
    } else if (inDescription && line.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/)) {
      // End of description block (line is a YAML key with colon)
      // End of description block
      inDescription = false;

      // Save the current paragraph if any
      if (currentParagraph.trim()) {
        descriptionParagraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }

      // Add description with proper indentation (using > for folded scalar)
      fixed.push('description: >');

      // Debug: log description lines
      if (process.env.DEBUG) {
        console.log(`DEBUG: ${descriptionParagraphs.length} description paragraphs`);
        descriptionParagraphs.forEach((p, i) => console.log(`  Para ${i}: ${p.substring(0, 60)}...`));
      }

      // Each paragraph on its own line(s), all indented with 2 spaces
      for (let i = 0; i < descriptionParagraphs.length; i++) {
        const para = descriptionParagraphs[i];
        // Split long paragraphs into properly indented lines
        const words = para.split(' ');
        let currentLine = '';
        for (const word of words) {
          if (currentLine.length + word.length + 1 > 80) {
            fixed.push('  ' + currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        }
        if (currentLine.trim()) {
          fixed.push('  ' + currentLine.trim());
        }
        // Add blank line between paragraphs (also indented)
        if (i < descriptionParagraphs.length - 1) {
          fixed.push('');
        }
      }
      descriptionParagraphs = [];
      currentParagraph = '';

      // Add the current line
      if (!line.match(/^\s*-\s+name:\s*"Wikipedia search"\s*$/)) {
        fixed.push(line);
      }
    } else if (inDescription) {
      const trimmed = line.trim();
      if (trimmed) {
        // Add to current paragraph (with space separator)
        currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
      } else {
        // Empty line = end of paragraph
        if (currentParagraph.trim()) {
          if (process.env.DEBUG) console.log(`  Saving para: ${currentParagraph.substring(0, 40)}... (len=${currentParagraph.length})`);
          descriptionParagraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
      }
    } else {
      // Not in description
      if (!line.match(/^\s*-\s+name:\s*"Wikipedia search"\s*$/)) {
        fixed.push(line);
      }
    }
  }

  // Handle case where description is the last field
  if (inDescription) {
    // Save current paragraph if any
    if (currentParagraph.trim()) {
      descriptionParagraphs.push(currentParagraph.trim());
    }

    if (descriptionParagraphs.length > 0) {
      fixed.push('description: >');
      for (let i = 0; i < descriptionParagraphs.length; i++) {
        const para = descriptionParagraphs[i];
      const words = para.split(' ');
      let currentLine = '';
      for (const word of words) {
        if (currentLine.length + word.length + 1 > 80) {
          fixed.push('  ' + currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
        if (currentLine.trim()) {
          fixed.push('  ' + currentLine.trim());
        }
        if (i < descriptionParagraphs.length - 1) {
          fixed.push('');
        }
      }
    }
  }

  return fixed;
}

// Serialize frontmatter back to YAML
function serializeFrontmatter(data) {
  // Use yaml.dump with specific options for better formatting
  const yamlStr = yaml.dump(data, {
    indent: 2,
    lineWidth: -1, // No line wrapping
    noRefs: true,
    sortKeys: false
  });

  return `---\n${yamlStr}---`;
}

// Clean description
function cleanDescription(description) {
  if (!description) return description;

  return description
    .replace(/^Here's a scholarly description:\s*/i, '')
    .replace(/^\*\*Scholarly Description:\*\*\s*/i, '')
    .replace(/^Scholarly Description:\s*/i, '')
    .trim();
}

// Search OpenLibrary
async function searchOpenLibrary(title, author) {
  try {
    const authorStr = Array.isArray(author) ? author[0] : author;
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(authorStr)}&limit=5`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      const workKey = data.docs[0].key;
      if (workKey && workKey.startsWith('/works/')) {
        return `https://openlibrary.org${workKey}`;
      }
    }

    return null;
  } catch (error) {
    console.error('  ⚠️  OpenLibrary search failed:', error.message);
    return null;
  }
}

// Enhance description using Claude
async function enhanceDescription(title, author, year, currentDescription, genre) {
  try {
    const authorStr = Array.isArray(author) ? author.join(', ') : author;
    const genreStr = Array.isArray(genre) ? genre.join(', ') : genre;

    const prompt = `You are a scholarly expert on Indian historical texts and literature.

Write a concise, brilliant scholarly description for the Dhwani digital library.

WORK:
Title: ${title}
Author: ${authorStr}
Year: ${year}
Genre: ${genreStr}

CURRENT DESCRIPTION:
${currentDescription}

REQUIREMENTS:
- Exactly 60-100 words (count carefully!)
- Single paragraph
- Scholarly, academic tone
- Focus on historical/cultural/scholarly significance
- Be specific and substantive
- NO prefixes or headers
- Start directly with the content

Return ONLY the 60-100 word description.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });

    if (message.content && message.content[0] && message.content[0].text) {
      const enhanced = message.content[0].text.trim();
      console.log(`  ✓ Enhanced (${enhanced.split(' ').length} words, ${enhanced.length} chars)`);
      return enhanced;
    } else {
      console.log('  ⚠️  API failed, keeping original');
      return currentDescription;
    }
  } catch (error) {
    console.error('  ⚠️  Enhancement failed:', error.message);
    return currentDescription;
  }
}

// Process one file
async function processWork(filename) {
  const filepath = path.join(VERIFIED_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf8');

  console.log(`\n======================================================================`);
  console.log(`📖 ${filename}`);
  console.log(`======================================================================`);

  // Parse frontmatter
  const { data: frontmatter, body } = parseFrontmatter(content);

  // 1. Clean and enhance description
  let description = cleanDescription(frontmatter.description || '');
  console.log(`📝 Enhancing description...`);
  frontmatter.description = await enhanceDescription(
    frontmatter.title,
    frontmatter.author,
    frontmatter.year,
    description,
    frontmatter.genre
  );

  await sleep(RATE_LIMIT_DELAY);

  // 2. Add OpenLibrary
  console.log(`🔍 Searching OpenLibrary...`);
  const openLibraryUrl = await searchOpenLibrary(frontmatter.title, frontmatter.author);

  if (openLibraryUrl) {
    console.log(`  ✓ Found: ${openLibraryUrl}`);
    if (!frontmatter.references) frontmatter.references = [];

    const hasOpenLibrary = frontmatter.references.some(ref =>
      ref.name && ref.name.toLowerCase().includes('open library')
    );

    if (!hasOpenLibrary) {
      frontmatter.references.push({
        name: 'Open Library',
        url: openLibraryUrl,
        type: 'other'
      });
    }
  } else {
    console.log(`  ⚠️  Not found`);
  }

  // 3. Clean references
  if (frontmatter.references) {
    const originalLength = frontmatter.references.length;
    frontmatter.references = frontmatter.references.filter(ref => {
      if (!ref || !ref.name) return false;
      if (ref.name.toLowerCase().includes('wikipedia search') && (!ref.url || ref.url.trim() === '')) {
        return false;
      }
      return true;
    });

    const removed = originalLength - frontmatter.references.length;
    if (removed > 0) {
      console.log(`  🧹 Removed ${removed} broken reference(s)`);
    }
  }

  // 4. Write output
  const outputPath = path.join(OUTPUT_DIR, filename);
  const newContent = serializeFrontmatter(frontmatter) + '\n' + body;
  fs.writeFileSync(outputPath, newContent, 'utf8');

  console.log(`✅ ENHANCED`);
}

// Main
async function main() {
  console.log('================================================================================');
  console.log(' DHWANI WORKS ENHANCEMENT - V2');
  console.log('================================================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(VERIFIED_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const filesToProcess = TEST_MODE ? files.slice(0, TEST_LIMIT) : files;

  if (TEST_MODE) {
    console.log(`🧪 TEST MODE: Processing ${filesToProcess.length} files\n`);
  } else {
    console.log(`📚 Processing ${filesToProcess.length} files\n`);
  }

  let processed = 0;
  let failed = 0;

  for (const filename of filesToProcess) {
    try {
      await processWork(filename);
      processed++;
    } catch (error) {
      console.error(`\n❌ ERROR in ${filename}:`);
      console.error(`   ${error.message}`);
      console.error(error.stack);
      failed++;
    }
  }

  console.log('\n================================================================================');
  console.log(' COMPLETE');
  console.log('================================================================================');
  console.log(`✅ Processed: ${processed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Output: ${OUTPUT_DIR}/\n`);

  if (TEST_MODE) {
    console.log('🧪 Test complete. Review output, then run without --test to process all files.');
  }
}

main().catch(console.error);
