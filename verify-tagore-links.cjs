const https = require('https');
const http = require('http');

const links = [
  // Sources
  "https://archive.org/details/in.ernet.dli.2015.97031",
  "https://archive.org/details/LettersfromAbroad",
  "https://archive.org/details/letterstofriend0000tago",
  "https://archive.org/details/in.ernet.dli.2015.52214",
  // References
  "https://en.wikipedia.org/wiki/Rabindranath_Tagore",
  "https://en.wikipedia.org/wiki/Charles_Freer_Andrews",
  "https://en.wikipedia.org/wiki/Visva-Bharati_University",
  "https://en.wikipedia.org/wiki/Victoria_Ocampo",
  "https://en.wikipedia.org/wiki/Bengal_Renaissance",
  "https://en.wikipedia.org/wiki/May_Fourth_Movement",
  "https://openlibrary.org/works/OL42642330W"
];

function checkLink(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
      },
      timeout: 10000
    }, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    });

    req.on('error', (err) => {
      resolve({ url, status: 'ERROR', ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT', ok: false });
    });
  });
}

async function verifyAll() {
  console.log('🔍 Verifying Tagore "Letters from Abroad" links...\n');

  for (const link of links) {
    const result = await checkLink(link);
    const icon = result.ok ? '✅' : '❌';
    const status = result.error ? result.error : result.status;
    console.log(`${icon} ${status} - ${link}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  console.log('\n✅ Link verification complete!');
}

verifyAll().catch(console.error);
