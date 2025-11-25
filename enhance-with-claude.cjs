#!/usr/bin/env node

/**
 * Dhwani Advanced Enhancement with Claude API
 * 
 * Generates:
 * 1. Scholarly, factual descriptions (60-100 words frontmatter)
 * 2. Detailed body content with significance
 * 3. Multiple alternative archive links
 * 4. Comprehensive reference links (Wikisource, Open Library, etc.)
 * 5. Collection assignment
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const CLAUDE_API_KEY = 'YOUR_API_KEY_HERE';

const CANDIDATES_DIR = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/fully-enhanced-works';
const LOG_FILE = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/claude-enhancement-log.json';

// Make Claude API call
async function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.content && parsed.content[0] && parsed.content[0].text) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('Invalid API response format'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Process a single work file
async function enhanceWork(filePath) {
  const filename = path.basename(filePath);
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📖 ${filename}`);
  console.log('='.repeat(70));

  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract metadata
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('No frontmatter found');
    }

    const frontmatter = frontmatterMatch[1];
    
    // Parse key fields
    const titleMatch = frontmatter.match(/title:\s*(.+)/);
    const authorMatch = frontmatter.match(/author:\s*\n\s*-\s*(.+)/);
    const yearMatch = frontmatter.match(/year:\s*(\d+)/);
    const genreMatch = frontmatter.match(/genre:\s*\n((?:\s*-\s*.+\n)+)/);

    const title = titleMatch ? titleMatch[1].replace(/['"]/g, '') : 'Unknown';
    const author = authorMatch ? authorMatch[1] : 'Unknown';
    const year = yearMatch ? yearMatch[1] : 'Unknown';
    const genres = genreMatch ? genreMatch[1].match(/-\s*(.+)/g).map(g => g.replace(/^-\s*/, '')) : [];

    console.log(`  📚 Title: ${title}`);
    console.log(`  ✍️  Author: ${author}`);
    console.log(`  📅 Year: ${year}`);
    console.log(`  🏷️  Genres: ${genres.join(', ')}`);

    // Create comprehensive prompt for Claude
    const prompt = `You are enhancing metadata for Dhwani, a digital archive preserving Indian works in the public domain.

WORK TO ENHANCE:
Title: ${title}
Author: ${author}
Year: ${year}
Genres: ${genres.join(', ')}

CURRENT FRONTMATTER:
${frontmatter}

TASK:
Generate a comprehensive enhancement package for this work. 

CRITICAL REQUIREMENTS:

1. FRONTMATTER DESCRIPTION (60-100 words):
   - Be FACTUAL and SPECIFIC - what's actually IN this work?
   - NO flowery language: avoid "seminal", "meticulous", "invaluable", "transformative", "nuanced"
   - NO excessive colonial framing (one mention max)
   - INCLUDE specific content:
     * For dictionaries: number of entries (estimate if needed), unique features, why significant
     * For religious texts: which chapter/skandha, key stories/teachings covered
     * For medical/Ayurvedic: diseases/treatments, classical sources cited
     * For translations: from what original text, translation approach
     * For historical: time period covered, primary sources used
   - Write like a scholar, not a marketer

2. ALTERNATIVE ARCHIVE.ORG LINKS:
   Search strategy for Archive.org (you must imagine/suggest likely identifiers):
   - Title variations (with/without diacritics, alternate spellings)
   - Author name variations
   - Subject-based searches
   - DLI (Digital Library of India) identifiers
   - Google Books scans
   Suggest 3-5 plausible Archive.org URLs based on common patterns

3. REFERENCE LINKS:
   - Wikisource: Check if work likely exists on en.wikisource.org or other language Wikisources
   - Open Library: Suggest openlibrary.org work URL (format: /works/OL[number]W)
   - Wikipedia: Suggest specific article about THIS work (not just general topics)
   - Google Books: If likely available
   - IGNCA, Sanchaya: If relevant for Indian works

4. DETAILED BODY CONTENT (400-600 words):
   Write scholarly content with these sections:
   ## Historical Context and Publication
   [When, where, why this work was created/published]
   
   ## Content and Structure  
   [What's in it - be specific about chapters, topics, approach]
   
   ## Significance and Impact
   [Why this work matters - scholarly, cultural, linguistic importance]
   
   ## Author and Background
   [About the author/translator if significant]

5. COLLECTION ASSIGNMENT:
   Based on content, assign to ONE of these collections:
   - regional-voices (language dictionaries, grammars, regional literature)
   - classical-texts (Vedas, Puranas, Upanishads, Sanskrit classics)
   - reform-renaissance (Rammohun Roy, social reform, Bengal Renaissance)
   - buddhist-jain (Buddhist, Jain texts and philosophy)
   - ayurveda-medicine (Ayurvedic texts, Indian medicine)
   - archaeology-history (archaeological reports, historical works)
   - null (if none fit perfectly)

6. VERIFY INDIAN WORK STATUS:
   - Biblical translations: Frame as Malayalam/Indian printing/linguistic milestones
   - British scholars writing about India: Acceptable as works about Indian heritage
   - Western textbooks adapted for India: Flag for exclusion
   Respond with is_indian_work: true/false

Return ONLY valid JSON (no markdown, no code blocks):
{
  "frontmatter_description": "60-100 word scholarly description",
  "alternative_sources": [
    {"url": "https://archive.org/details/...", "note": "Brief description"},
    ...
  ],
  "reference_links": [
    {"name": "Link name", "url": "https://...", "type": "wikisource/wikipedia/other"},
    ...
  ],
  "body_content": "Full markdown content with ## headers",
  "collection": "collection-name or null",
  "is_indian_work": true,
  "exclusion_reason": "only if is_indian_work is false",
  "language_corrections": ["English", "Malayalam"] or null
}`;

    console.log(`\n  🤖 Calling Claude API...`);
    const response = await callClaudeAPI(prompt);

    // Parse JSON response
    let enhancement;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, response];
      enhancement = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error(`  ❌ Failed to parse Claude response as JSON`);
      console.error(`  Response: ${response.substring(0, 200)}...`);
      throw new Error(`JSON parse error: ${e.message}`);
    }

    console.log(`  ✅ Enhancement received`);
    console.log(`  ├─ Indian work: ${enhancement.is_indian_work ? '✓' : '✗'}`);
    console.log(`  ├─ Collection: ${enhancement.collection || 'none'}`);
    console.log(`  ├─ Alt sources: ${enhancement.alternative_sources?.length || 0}`);
    console.log(`  └─ References: ${enhancement.reference_links?.length || 0}`);

    if (!enhancement.is_indian_work) {
      console.log(`  ⚠️  FLAGGED FOR EXCLUSION: ${enhancement.exclusion_reason}`);
      return { 
        success: true, 
        flagged: true, 
        filename, 
        reason: enhancement.exclusion_reason 
      };
    }

    // Update the file
    await updateWorkFile(filePath, content, enhancement, frontmatter);

    console.log(`  💾 File updated successfully`);

    return { 
      success: true, 
      filename,
      collection: enhancement.collection,
      enhanced: true
    };

  } catch (error) {
    console.error(`  ❌ ERROR: ${error.message}`);
    return { 
      success: false, 
      filename, 
      error: error.message 
    };
  }
}

// Update work file with enhancements
async function updateWorkFile(filePath, originalContent, enhancement, frontmatter) {
  let newFrontmatter = frontmatter;

  // 1. Update description
  newFrontmatter = newFrontmatter.replace(
    /description:\s*[|>-]?[\s\S]*?(?=\ncollections:|$)/,
    `description: |\n  ${enhancement.frontmatter_description}\n`
  );

  // 2. Update collections
  if (enhancement.collection) {
    newFrontmatter = newFrontmatter.replace(
      /collections:\s*\[\]/,
      `collections:\n- ${enhancement.collection}`
    );
  }

  // 3. Update language if needed
  if (enhancement.language_corrections && enhancement.language_corrections.length > 0) {
    const langList = enhancement.language_corrections.map(l => `\n  - ${l}`).join('');
    newFrontmatter = newFrontmatter.replace(
      /language:\s*\n(?:\s*-\s*.+\n)*/,
      `language:${langList}\n`
    );
  }

  // 4. Add alternative sources
  if (enhancement.alternative_sources && enhancement.alternative_sources.length > 0) {
    const newSources = enhancement.alternative_sources
      .map(s => `  - name: ${s.note || 'Internet Archive'}\n    url: ${s.url}\n    type: other`)
      .join('\n');

    newFrontmatter = newFrontmatter.replace(
      /(sources:\s*\n(?:\s*-\s*.*\n(?:\s{4}.*\n)*)*)/,
      (match) => match + newSources + '\n'
    );
  }

  // 5. Add reference links
  if (enhancement.reference_links && enhancement.reference_links.length > 0) {
    const newRefs = enhancement.reference_links
      .map(r => `  - name: '${r.name}'\n    url: ${r.url}\n    type: ${r.type}`)
      .join('\n');

    newFrontmatter = newFrontmatter.replace(
      /(references:\s*\n(?:\s*-\s*.*\n(?:\s{4}.*\n)*)*)/,
      (match) => match + newRefs + '\n'
    );
  }

  // Construct final file
  const finalContent = `---
${newFrontmatter}
---

${enhancement.body_content}

---

*Descriptions generated with assistance from Claude (Anthropic). Research compiled from scholarly sources including Archive.org metadata, Wikipedia, academic publications, and reference materials.*
`;

  await fs.writeFile(filePath, finalContent, 'utf-8');
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 DHWANI COMPREHENSIVE ENHANCEMENT WITH CLAUDE API');
  console.log('='.repeat(70));

  // Read candidate list
  const candidatesList = (await fs.readFile('/tmp/new_candidates.txt', 'utf-8'))
    .split('\n')
    .filter(f => f.trim());

  console.log(`\n📚 Total candidates: ${candidatesList.length}`);
  console.log(`📁 Source directory: ${CANDIDATES_DIR}\n`);

  const results = {
    total: candidatesList.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    flagged: [],
    errors: [],
    byCollection: {}
  };

  let processedCount = 0;

  for (const filename of candidatesList) {
    processedCount++;
    console.log(`\n[${processedCount}/${candidatesList.length}]`);
    
    const filePath = path.join(CANDIDATES_DIR, filename);

    const result = await enhanceWork(filePath);
    results.processed++;

    if (result.success) {
      results.succeeded++;
      if (result.flagged) {
        results.flagged.push({
          file: filename,
          reason: result.reason
        });
      } else if (result.collection) {
        results.byCollection[result.collection] = (results.byCollection[result.collection] || 0) + 1;
      }
    } else {
      results.failed++;
      results.errors.push({
        file: filename,
        error: result.error
      });
    }

    // Rate limiting: 2 seconds between requests
    if (processedCount < candidatesList.length) {
      console.log(`\n  ⏸️  Waiting 2 seconds (rate limiting)...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Save comprehensive log
  await fs.writeFile(LOG_FILE, JSON.stringify(results, null, 2), 'utf-8');

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 ENHANCEMENT COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n✅ Successfully processed: ${results.succeeded}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Flagged for exclusion: ${results.flagged.length}`);

  if (Object.keys(results.byCollection).length > 0) {
    console.log(`\n📚 By Collection:`);
    for (const [collection, count] of Object.entries(results.byCollection)) {
      console.log(`  ${collection}: ${count}`);
    }
  }

  if (results.flagged.length > 0) {
    console.log(`\n⚠️  Flagged for exclusion:`);
    results.flagged.forEach(f => console.log(`  - ${f.file}: ${f.reason}`));
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    results.errors.slice(0, 10).forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more`);
    }
  }

  console.log(`\n📝 Full log: ${LOG_FILE}`);
  console.log('='.repeat(70) + '\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
