const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Anthropic = require('@anthropic-ai/sdk');

const CLAUDE_API_KEY = 'YOUR_API_KEY_HERE';
const anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });

const VERIFIED_DIR = './verified-works';
const OUTPUT_DIR = './fully-enhanced-works';
const TEST_MODE = process.argv.includes('--test');
const TEST_LIMIT = 5;

// Rate limiting
const RATE_LIMIT_DELAY = 1000; // 1 second between API calls

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean description by removing prefixes
function cleanDescription(description) {
  if (!description) return description;

  // Remove common prefixes
  let cleaned = description
    .replace(/^Here's a scholarly description:\s*/i, '')
    .replace(/^\*\*Scholarly Description:\*\*\s*/i, '')
    .replace(/^Scholarly Description:\s*/i, '')
    .trim();

  return cleaned;
}

// Search OpenLibrary for actual work page
async function searchOpenLibrary(title, author) {
  try {
    const authorStr = Array.isArray(author) ? author[0] : author;
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(authorStr)}&limit=5`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      // Get the first work key
      const workKey = data.docs[0].key;
      if (workKey && workKey.startsWith('/works/')) {
        return `https://openlibrary.org${workKey}`;
      }
    }

    // If no work found, return null (we won't add OpenLibrary link)
    return null;
  } catch (error) {
    console.error('  ⚠️  OpenLibrary search failed:', error.message);
    return null;
  }
}

// Enhance description using Claude API
async function enhanceDescription(title, author, year, currentDescription, genre) {
  try {
    const authorStr = Array.isArray(author) ? author.join(', ') : author;
    const genreStr = Array.isArray(genre) ? genre.join(', ') : genre;

    const prompt = `You are a scholarly expert on Indian historical texts and literature.

I need you to write a concise but brilliant scholarly description for a work in the Dhwani digital library (a library of public domain Indian works).

WORK DETAILS:
Title: ${title}
Author: ${authorStr}
Year: ${year}
Genre: ${genreStr}

CURRENT DESCRIPTION (may need improvement):
${currentDescription}

TASK:
Write a concise, high-quality scholarly description of exactly 60-100 words that captures the work's significance.

REQUIREMENTS:
- Exactly 60-100 words (this is critical - count carefully!)
- Single paragraph
- Scholarly, academic tone (no marketing language)
- Focus on what makes this work historically/culturally/scholarly significant
- Mention key features, contributions, or impact
- Be specific and substantive
- NO prefixes like "Here's a description:" or "Scholarly Description:"
- Start directly with the content

Return ONLY the description text (60-100 words), nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    if (message.content && message.content[0] && message.content[0].text) {
      const enhanced = message.content[0].text.trim();
      console.log(`  ✓ Enhanced description (${enhanced.length} chars)`);
      return enhanced;
    } else {
      console.log('  ⚠️  Unexpected API response, keeping original');
      return currentDescription;
    }
  } catch (error) {
    console.error('  ⚠️  Description enhancement failed:', error.message);
    return currentDescription;
  }
}

// Fix YAML frontmatter indentation for description blocks
function fixYAMLIndentation(content) {
  const lines = content.split('\n');
  const fixed = [];
  let inDescription = false;
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track frontmatter boundaries
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        inFrontmatter = false;
      }
      fixed.push(line);
      continue;
    }

    if (!inFrontmatter) {
      fixed.push(line);
      continue;
    }

    // Start of description block
    if (line.match(/^description:\s*\|/)) {
      inDescription = true;
      fixed.push(line);
      continue;
    }

    // End of description block (next top-level key)
    if (inDescription && line.match(/^[a-zA-Z_]/)) {
      inDescription = false;
    }

    // If in description and line isn't empty, ensure it's indented
    if (inDescription) {
      if (line.trim() === '') {
        fixed.push('');
      } else if (!line.match(/^\s\s/)) {
        // Not indented, add 2 spaces
        fixed.push('  ' + line.trim());
      } else {
        fixed.push(line);
      }
    } else {
      // Remove incomplete Wikipedia search references
      if (line.match(/^\s*-\s+name:\s*"Wikipedia search"\s*$/)) {
        continue;
      }
      fixed.push(line);
    }
  }

  return fixed.join('\n');
}

// Process a single work file
async function processWork(filename) {
  const filepath = path.join(VERIFIED_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix YAML formatting issues
  content = fixYAMLIndentation(content);

  // Debug: write fixed content to temp file
  if (process.env.DEBUG) {
    fs.writeFileSync(`/tmp/debug-${filename}`, content, 'utf8');
  }

  const { data: frontmatter, content: bodyContent } = matter(content);

  console.log(`\n======================================================================`);
  console.log(`📖 ${filename}`);
  console.log(`======================================================================`);

  // 1. Clean and enhance description
  let description = frontmatter.description || '';
  description = cleanDescription(description);

  console.log(`📝 Enhancing description...`);
  const enhancedDescription = await enhanceDescription(
    frontmatter.title,
    frontmatter.author,
    frontmatter.year,
    description,
    frontmatter.genre
  );
  frontmatter.description = enhancedDescription;

  await sleep(RATE_LIMIT_DELAY);

  // 2. Search and add OpenLibrary work link
  console.log(`🔍 Searching OpenLibrary...`);
  const openLibraryUrl = await searchOpenLibrary(frontmatter.title, frontmatter.author);

  if (openLibraryUrl) {
    console.log(`  ✓ Found: ${openLibraryUrl}`);

    // Add to references if not already present
    if (!frontmatter.references) {
      frontmatter.references = [];
    }

    // Check if OpenLibrary already exists
    const hasOpenLibrary = frontmatter.references.some(ref =>
      ref.name && ref.name.toLowerCase().includes('open library')
    );

    if (!hasOpenLibrary) {
      frontmatter.references.push({
        name: 'Open Library',
        url: openLibraryUrl,
        type: 'other'
      });
      console.log(`  ✓ Added OpenLibrary reference`);
    }
  } else {
    console.log(`  ⚠️  No OpenLibrary work found`);
  }

  // 3. Clean up references - remove broken "Wikipedia search" entries
  if (frontmatter.references) {
    const originalLength = frontmatter.references.length;
    frontmatter.references = frontmatter.references.filter(ref => {
      // Remove entries that are just "Wikipedia search" without URL or with empty URL
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

  // 4. Write to output directory
  const outputPath = path.join(OUTPUT_DIR, filename);
  const newContent = matter.stringify(bodyContent, frontmatter);
  fs.writeFileSync(outputPath, newContent, 'utf8');

  console.log(`✅ ENHANCED`);

  return true;
}

// Main function
async function main() {
  console.log('================================================================================');
  console.log(' DHWANI WORKS ENHANCEMENT - FINAL VERSION');
  console.log('================================================================================\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get all markdown files
  const files = fs.readdirSync(VERIFIED_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const totalFiles = TEST_MODE ? Math.min(TEST_LIMIT, files.length) : files.length;
  const filesToProcess = TEST_MODE ? files.slice(0, TEST_LIMIT) : files;

  if (TEST_MODE) {
    console.log(`🧪 TEST MODE: Processing ${totalFiles} files\n`);
  } else {
    console.log(`📚 Processing ${totalFiles} files\n`);
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
      failed++;
    }
  }

  console.log('\n================================================================================');
  console.log(' ENHANCEMENT COMPLETE');
  console.log('================================================================================');
  console.log(`✅ Processed: ${processed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Output: ${OUTPUT_DIR}/\n`);

  if (TEST_MODE) {
    console.log('🧪 Test mode complete. Review the output, then run without --test flag to process all files.');
  }
}

main().catch(console.error);
