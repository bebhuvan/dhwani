#!/usr/bin/env node

/**
 * Generate Scholarly Descriptions using Claude API
 *
 * Creates high-quality, scholarly descriptions for works
 * without marketing fluff or filler
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

const CONFIG = {
  candidatesDir: process.argv[2] || path.join(__dirname, 'potential-candidates'),
  apiKey: process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE',
  model: 'claude-3-5-haiku-20241022',
};

/**
 * Call Claude API
 */
async function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CONFIG.model,
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-api-key': CONFIG.apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.content && response.content[0] && response.content[0].text) {
            resolve(response.content[0].text);
          } else if (response.error) {
            reject(new Error(response.error.message || 'API error'));
          } else {
            reject(new Error('Invalid API response'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Generate scholarly description
 */
async function generateDescription(work) {
  const { title, author, year, genre, description: currentDesc } = work.frontmatter;

  const prompt = `You are a scholar writing for an academic digital library focused on Indian literary and cultural heritage. Generate a comprehensive, scholarly description for this work.

**Work Details:**
Title: ${title}
Author: ${Array.isArray(author) ? author.join(', ') : author}
Year: ${year}
Genre: ${Array.isArray(genre) ? genre.join(', ') : genre}
Current Description: ${currentDesc}

**Requirements:**
1. Write in a scholarly, academic tone
2. NO marketing language, promotional content, or filler
3. NO phrases like "this groundbreaking work", "essential reading", "must-have", etc.
4. Focus on factual, historical, and literary significance
5. Include relevant context about the work's place in Indian literature/history
6. Discuss the work's scholarly importance without hyperbole
7. If it's a translation or adaptation, mention the original work
8. Mention the historical context and why this work matters for Indian studies
9. For dictionaries/grammars: emphasize their role in language preservation and study
10. For historical works: provide context about the period and scholarly significance
11. Length: 2-4 comprehensive paragraphs (similar to scholarly encyclopedia entries)

**Style Guidelines:**
- Use precise, academic language
- Avoid superlatives unless factually accurate
- Focus on "what" and "why" rather than "how great"
- Include specific details about content, methodology, and significance
- Mention reception, influence, or scholarly importance where relevant
- For colonial-era works: acknowledge historical context and perspectives critically

Generate the description now:`;

  const description = await callClaudeAPI(prompt);
  return description.trim();
}

/**
 * Quality check description
 */
function checkDescriptionQuality(description) {
  const issues = [];

  // Check for marketing fluff
  const fluffPatterns = [
    /\bgroundbreaking\b/i,
    /\bessential reading\b/i,
    /\bmust-have\b/i,
    /\bmust read\b/i,
    /\bindispensable\b/i,
    /\bunparalleled\b/i,
    /\bunprecedented\b/i,
    /\btruly remarkable\b/i,
    /\bextraordinary journey\b/i,
    /\btimeless classic\b/i,
    /\bmasterpiece\b/i,
  ];

  for (const pattern of fluffPatterns) {
    if (pattern.test(description)) {
      issues.push(`Marketing fluff detected: ${pattern.source}`);
    }
  }

  // Check length
  if (description.length < 500) {
    issues.push('Description too short (< 500 chars)');
  }

  // Check for academic tone
  if (!description.match(/\b(historical|scholarly|academic|literature|cultural|significant)\b/i)) {
    issues.push('Lacks scholarly vocabulary');
  }

  return {
    passed: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 20))
  };
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

  // Simple parser
  const frontmatter = {};
  frontmatterText.split('\n').forEach(line => {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
    if (match) {
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
      } else {
        frontmatter[key] = value;
      }
    }
  });

  return {
    frontmatter,
    body,
    raw: frontmatterText
  };
}

/**
 * Update description in frontmatter
 */
function updateDescription(frontmatterText, newDescription) {
  // Replace description field
  const descPattern = /description:\s*"[^"]*"/;
  const multilineDescPattern = /description:\s*\|[\s\S]*?(?=\n[a-zA-Z_])/;

  // Use pipe-style for multi-paragraph descriptions
  const formattedDesc = `description: |\n  ${newDescription.split('\n\n').join('\n\n  ')}`;

  if (multilineDescPattern.test(frontmatterText)) {
    return frontmatterText.replace(multilineDescPattern, formattedDesc);
  } else if (descPattern.test(frontmatterText)) {
    return frontmatterText.replace(descPattern, formattedDesc);
  } else {
    // Add description field
    return frontmatterText + `\n${formattedDesc}`;
  }
}

/**
 * Process file
 */
async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = parseFrontmatter(content);

  if (!parsed.frontmatter.title) {
    return { generated: false, reason: 'no title found' };
  }

  console.log(`\n   🤖 Generating scholarly description...`);

  try {
    const description = await generateDescription(parsed);

    console.log(`   📝 Description generated (${description.length} chars)`);

    // Quality check
    const quality = checkDescriptionQuality(description);
    console.log(`   🔍 Quality score: ${quality.score}/100`);

    if (!quality.passed) {
      console.log(`   ⚠️  Quality issues:`);
      quality.issues.forEach(issue => console.log(`      - ${issue}`));
    }

    // Update file
    const updatedFrontmatter = updateDescription(parsed.raw, description);
    const updatedContent = `---\n${updatedFrontmatter}\n---${parsed.body}`;

    await fs.writeFile(filePath, updatedContent, 'utf-8');

    return {
      generated: true,
      quality: quality.score,
      length: description.length,
      issues: quality.issues
    };
  } catch (error) {
    return {
      generated: false,
      error: error.message
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('📝 Starting Scholarly Description Generation\n');

  const files = await fs.readdir(CONFIG.candidatesDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`Found ${mdFiles.length} files to process\n`);

  let processed = 0;
  let generated = 0;
  const qualityScores = [];

  for (const file of mdFiles) {
    processed++;
    const filePath = path.join(CONFIG.candidatesDir, file);

    console.log(`[${processed}/${mdFiles.length}] ${file}`);

    try {
      const result = await processFile(filePath);

      if (result.generated) {
        generated++;
        qualityScores.push(result.quality);
        console.log(`   ✅ Generated (quality: ${result.quality}/100)`);
      } else {
        console.log(`   ⏭️  Skipped (${result.reason || result.error})`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    // Rate limiting - be conservative with API
    await new Promise(r => setTimeout(r, 2000));
  }

  const avgQuality = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
    : 0;

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Processed: ${processed} files`);
  console.log(`📝 Generated: ${generated} descriptions`);
  console.log(`📊 Average quality: ${avgQuality}/100`);
  console.log('='.repeat(60));
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateDescription, checkDescriptionQuality };
