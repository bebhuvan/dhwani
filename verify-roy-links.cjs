const https = require('https');
const http = require('http');

const links = [
  // Sources
  "https://archive.org/details/lifelettersofraj00collrich",
  "https://archive.org/details/dli.ernet.237852",
  "https://archive.org/details/lifelettersofraj00coll",
  "https://archive.org/details/lifeandlettersr00collgoog",
  // References
  "https://en.wikipedia.org/wiki/Raja_Ram_Mohan_Roy",
  "https://en.wikipedia.org/wiki/Brahmo_Samaj",
  "https://en.wikipedia.org/wiki/Sadharan_Brahmo_Samaj",
  "https://en.wikipedia.org/wiki/Sati_(practice)",
  "https://en.wikipedia.org/wiki/Bengal_Renaissance",
  "https://openlibrary.org/works/OL7897786W",
  "https://www.britannica.com/biography/Ram-Mohan-Roy",
  "https://www.thebrahmosamaj.net/samajes/sadharansamaj.html"
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
  console.log('🔍 Verifying Raja Rammohun Roy links...\n');

  for (const link of links) {
    const result = await checkLink(link);
    const icon = result.ok ? '✅' : '❌';
    const status = result.error ? result.error : result.status;
    console.log(`${icon} ${status} - ${link}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ Link verification complete!');
}

verifyAll().catch(console.error);
