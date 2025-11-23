const fs = require('fs');
const path = require('path');
const https = require('https');

const CLAUDE_API_KEY = 'YOUR_API_KEY_HERE';

// Works to reclassify as VERIFIED
const worksToReclassify = [
  '1839-the-book-of-psalms-malayalam-benjamin-bailey.md',
  '1867-catechism-of-malayalam-grammar-liston-garthwaite.md',
  'a-comprehensive-dictionary-english-and-marathi-padmanji-baba.md',
  'a-dictionary-in-assamese-and-english-miles-bronson.md',
  'a-dictionary-of-kashmiri-proverbs-sayings-james-hinton-knowles.md',
  'a-practical-grammar-of-the-sanskrit-language-monier-williams.md',
  'a-primer-of-tamil-literature-purnalingam-pillai-m-s.md',
  'a-treatise-on-buddhist-philosophy-or-abidhamma-de-silva-c-l-a.md',
  'adi-granth-or-the-holy-scriptures-of-the-sikhs-trumpp-ernest.md',
  'akhlaq-e-muhammadi-sindhi-hakim-fateh-muhammad-sewhani.md'
];

const report = require('./verification-report.json');
const outputDir = './verified-works';

function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
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
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.content && parsed.content[0] && parsed.content[0].text) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('Unexpected API response'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generateDescription(work) {
  const prompt = `You are a scholarly editor for Dhwani, a digital library of Indian historical texts and works about India.

Generate a detailed, scholarly description for this work that matches the style of academic reference works.

**Work Details:**
Title: ${work.title}
Author: ${Array.isArray(work.author) ? work.author.join(', ') : work.author}
Year: ${work.year}
Genre: ${Array.isArray(work.genre) ? work.genre.join(', ') : work.genre}
Language: ${Array.isArray(work.language) ? work.language.join(', ') : work.language}

**Current Description (for reference):**
${work.description}

**Style Requirements:**
Write in the scholarly, analytical style of academic reference works. The description should be substantive and informative, similar to entries in encyclopedias of literature or library catalog descriptions.

**Content Structure (3-4 paragraphs, ~400-600 words total):**

1. **Opening Paragraph**: Introduce the work's nature, significance, and historical context. What is this work? When and where was it created? What makes it significant in its field?

2. **Content & Scholarly Contribution**: Describe the work's content, methodological approach, and intellectual contribution. What does it cover? What scholarly methods or perspectives does it employ? How does it contribute to its field?

3. **Historical & Cultural Context**: Situate the work within its historical, cultural, and intellectual context. What were the circumstances of its creation? How does it relate to broader scholarly, literary, or cultural movements of its time?

4. **Legacy & Significance** (if applicable): Discuss the work's reception, influence, and enduring significance. How was it received? What impact did it have? Why does it remain relevant?

**Tone Guidelines:**
- Scholarly and analytical, not promotional
- Precise and factual, avoiding vague superlatives
- Focus on specific historical, cultural, and scholarly details
- Academic voice suitable for reference work
- Avoid marketing language
- When uncertain about details, remain general but accurate

**Format:**
Return ONLY the description text as a single flowing piece. Do NOT include headers, markdown formatting, or section labels. Write in continuous paragraphs.`;

  try {
    const description = await callClaudeAPI(prompt);
    return description.trim();
  } catch (err) {
    console.log('⚠️  Description generation failed: ' + err.message);
    return null;
  }
}

function findOriginalFile(filename) {
  for (let i = 1; i <= 8; i++) {
    const batchPath = 'batch-' + String(i).padStart(2, '0') + '/' + filename;
    const fullPath = path.join('./testing-batches', batchPath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentValue = [];
  let inMultiline = false;

  for (const line of lines) {
    if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/) && !inMultiline) {
      if (currentKey) {
        fm[currentKey] = parseValue(currentValue.join('\n'));
      }
      const colonIndex = line.indexOf(':');
      currentKey = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      if (value === '|') {
        inMultiline = true;
        currentValue = [];
      } else if (value === '[' || value.startsWith('[')) {
        currentValue = [value];
        if (!value.endsWith(']')) {
          inMultiline = true;
        } else {
          inMultiline = false;
        }
      } else {
        currentValue = [value];
        inMultiline = false;
      }
    } else if (currentKey) {
      currentValue.push(line);
      if (line.trim().endsWith(']') && currentValue.join('\n').includes('[')) {
        inMultiline = false;
      }
    }
  }

  if (currentKey) {
    fm[currentKey] = parseValue(currentValue.join('\n'));
  }

  return fm;
}

function parseValue(value) {
  value = value.trim();
  if (!value || value === '|') return '';

  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      const jsonValue = value.replace(/'/g, '"');
      return JSON.parse(jsonValue);
    } catch {
      const content = value.slice(1, -1);
      return content.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')).filter(v => v);
    }
  }

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  if (!isNaN(value) && value !== '') {
    return Number(value);
  }

  if (value === 'true') return true;
  if (value === 'false') return false;

  return value;
}

function updateDescription(content, newDescription) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return content;

  const frontmatter = match[1];
  const descPattern = /description:\s*\|[\s\S]*?(?=\n[a-zA-Z_]|\ncollections:)/;
  const updatedFrontmatter = frontmatter.replace(descPattern, 'description: |\n  ' + newDescription);

  return content.replace(match[1], updatedFrontmatter);
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('RECLASSIFYING INCORRECTLY REJECTED WORKS');
  console.log('='.repeat(70));
  console.log('\nProcessing ' + worksToReclassify.length + ' works...\n');

  let processed = 0;
  const results = [];

  for (const filename of worksToReclassify) {
    console.log((processed + 1) + '. ' + filename);

    const originalPath = findOriginalFile(filename);
    if (!originalPath) {
      console.log('   ❌ Original file not found');
      continue;
    }

    const content = fs.readFileSync(originalPath, 'utf8');
    const work = parseFrontmatter(content);

    if (!work) {
      console.log('   ❌ Could not parse frontmatter');
      continue;
    }

    console.log('   📝 Generating improved description...');
    const newDescription = await generateDescription(work);

    if (newDescription) {
      const updatedContent = updateDescription(content, newDescription);
      const outputPath = path.join(outputDir, filename);
      fs.writeFileSync(outputPath, updatedContent, 'utf8');
      console.log('   ✅ Added to verified-works');
      processed++;
      results.push({
        filename,
        title: work.title,
        author: work.author,
        year: work.year,
        descriptionLength: newDescription.length
      });
    } else {
      console.log('   ⚠️  Using original (description generation failed)');
      const outputPath = path.join(outputDir, filename);
      fs.writeFileSync(outputPath, content, 'utf8');
      processed++;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ RECLASSIFICATION COMPLETE');
  console.log('='.repeat(70));
  console.log('\nProcessed: ' + processed + ' works');
  console.log('Added to: ' + path.resolve(outputDir));
  console.log('\nNew total in verified-works: ' + fs.readdirSync(outputDir).filter(f => f.endsWith('.md')).length);
  console.log('\n' + '='.repeat(70));
}

main().catch(console.error);
