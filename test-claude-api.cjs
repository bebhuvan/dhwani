// Test Claude API directly
const https = require('https');

const CLAUDE_API_KEY = 'YOUR_API_KEY_HERE';

function callClaudeAPI(prompt) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
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

    console.log('Making API request...');

    const req = https.request(options, (res) => {
      let body = '';
      console.log('Status code:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Response body:', body.substring(0, 500));
        try {
          const parsed = JSON.parse(body);
          if (parsed.content?.[0]?.text) {
            resolve(parsed.content[0].text);
          } else {
            console.log('Full parsed response:', JSON.stringify(parsed, null, 2));
            reject(new Error('Unexpected API response: ' + JSON.stringify(parsed)));
          }
        } catch (err) {
          console.log('Parse error:', err.message);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.log('Request error:', err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

// Test with simple prompt
const testPrompt = 'Write a scholarly description in 100 words about the Bhagavata Purana.';

console.log('Testing Claude API...\n');

callClaudeAPI(testPrompt)
  .then(response => {
    console.log('\n✅ SUCCESS!\n');
    console.log('Response:', response);
  })
  .catch(err => {
    console.log('\n❌ FAILED\n');
    console.log('Error:', err.message);
  });
