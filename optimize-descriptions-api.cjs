const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = 'YOUR_API_KEY_HERE';

async function callClaude(description, title, currentWordCount) {
  const payload = {
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are helping optimize frontmatter descriptions for a digital library of Indian public domain works.

CURRENT DESCRIPTION (${currentWordCount} words):
${description}

TASK: Rewrite this to 100-200 words while:
- Maintaining scholarly accuracy and tone
- Preserving key facts (author, date, significance, influence)
- Removing redundancy and excessive detail
- Keeping the most important contextual information
- Being informative and engaging

Title: ${title}

OUTPUT ONLY THE OPTIMIZED DESCRIPTION TEXT, NO EXPLANATIONS OR PREAMBLES.`
    }]
  };

  const data = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(`API Error: ${response.error.message || JSON.stringify(response.error)}`));
          } else if (response.content && response.content[0]) {
            resolve(response.content[0].text.trim());
          } else {
            console.error('Unexpected response:', JSON.stringify(response, null, 2));
            reject(new Error('Invalid API response structure'));
          }
        } catch (e) {
          console.error('Parse error. Body:', body.substring(0, 500));
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function optimizeWork(filename) {
  const filepath = path.join('./src/content/works', filename);
  const content = fs.readFileSync(filepath, 'utf-8');

  // Extract title
  const titleMatch = content.match(/title:\s*['"](.+?)['"]/);
  const title = titleMatch ? titleMatch[1] : filename;

  // Extract description
  const descMatch = content.match(/description:\s*\|([\s\S]*?)\n(?=\w+:)/);
  if (!descMatch) {
    console.log(`❌ No description found in ${filename}`);
    return null;
  }

  const description = descMatch[1].trim();
  const wordCount = description.split(/\s+/).length;

  if (wordCount < 100 || wordCount > 200) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 ${title}`);
    console.log(`📊 Current: ${wordCount} words`);
    console.log(`🔄 Optimizing...`);

    try {
      const optimized = await callClaude(description, title, wordCount);
      const newWordCount = optimized.split(/\s+/).length;

      console.log(`✅ Optimized: ${newWordCount} words`);
      console.log(`\n${optimized.substring(0, 200)}...`);

      return {
        filename,
        title,
        original: description,
        optimized,
        originalWords: wordCount,
        optimizedWords: newWordCount
      };
    } catch (e) {
      console.error(`❌ API Error: ${e.message}`);
      return null;
    }
  }

  return null;
}

async function main() {
  // Get list of works with long descriptions
  const worksDir = './src/content/works';
  const files = fs.readdirSync(worksDir);

  const longDescWorks = [];

  files.forEach(file => {
    if (!file.endsWith('.md')) return;
    const content = fs.readFileSync(path.join(worksDir, file), 'utf-8');
    const match = content.match(/description: \|([\s\S]*?)\n(?=\w+:)/);
    if (match && match[1]) {
      const wordCount = match[1].trim().split(/\s+/).length;
      if (wordCount > 200) {
        longDescWorks.push({ file, wordCount });
      }
    }
  });

  longDescWorks.sort((a, b) => b.wordCount - a.wordCount);

  console.log(`Found ${longDescWorks.length} works with descriptions > 200 words\n`);

  // Process top 10 for now
  const results = [];
  for (let i = 0; i < Math.min(10, longDescWorks.length); i++) {
    const result = await optimizeWork(longDescWorks[i].file);
    if (result) {
      results.push(result);
    }
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Save results
  fs.writeFileSync('./description-optimizations.json', JSON.stringify(results, null, 2));
  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ Optimized ${results.length} descriptions`);
  console.log(`📝 Results saved to description-optimizations.json`);
}

main().catch(console.error);
