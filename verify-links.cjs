const https = require('https');
const http = require('http');

const links = [
  // Sources
  "https://archive.org/details/in.ernet.dli.2015.208888",
  "https://archive.org/details/bapusletterstomi00gand",
  "https://archive.org/details/gandhislettersto0000gand",
  // References
  "https://en.wikipedia.org/wiki/Mirabehn",
  "https://en.wikipedia.org/wiki/Mohandas_Karamchand_Gandhi",
  "https://en.wikipedia.org/wiki/Navajivan_Trust",
  "https://en.wikipedia.org/wiki/Sabarmati_Ashram",
  "https://en.wikipedia.org/wiki/Quit_India_Movement",
  "https://en.wikipedia.org/wiki/Salt_Satyagraha",
  "https://openlibrary.org/works/OL298425W",
  "https://www.mkgandhi.org/associates/Mirabehn.php"
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
  console.log('🔍 Verifying links...\n');

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
