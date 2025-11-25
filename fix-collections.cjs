const fs = require('fs');
const path = require('path');

const worksDir = path.join(__dirname, 'src/content/works');

// Valid collection values from the schema
const validCollections = [
  'academic-journals', 'ancient-history', 'ancient-wisdom', 'archaeology', 'archival-sources',
  'arts-texts', 'astronomy', 'buddhist-texts', 'classical-literature', 'colonial-india',
  'comparative-religion', 'court-chronicles', 'devotional-literature', 'devotional-poetry',
  'epigraphy', 'epic-poetry', 'ethnographic-studies', 'ethnography', 'folklore',
  'folklore-collection', 'genealogy', 'historical-literature', 'historical-texts',
  'indology', 'jain-literature', 'jain-texts', 'legal-texts', 'linguistic-works',
  'mathematics', 'medical-texts', 'medieval-india', 'modern-literature', 'mughal-history',
  'mughal-india', 'musicology', 'numismatics', 'oral-literature', 'pali-literature',
  'philosophical-works', 'philosophy', 'poetry-collection', 'political-philosophy',
  'reference-texts', 'reference-works', 'regional-history', 'regional-literature',
  'regional-voices', 'religious-texts', 'ritual-texts', 'sanskrit-drama',
  'scholarly-translations', 'science', 'scientific-texts', 'scientific-works',
  'spiritual-texts', 'technical-manuals', 'tribal-studies'
];

// Mapping of invalid to valid collections
const collectionMapping = {
  'historical-works': 'historical-literature',
  'modern-works': 'modern-literature',
  'scholarly-works': 'reference-works',
  'poetry': 'poetry-collection',
  'religious-works': 'religious-texts',
  'linguistic-studies': 'linguistic-works'
};

// List of recent files from the commit
const recentFiles = [
  'a-dictionary-of-the-bengali-language-carey-w.md',
  'a-freelance-in-kashmir-macmunn-george-fletcher.md',
  'a-history-of-hindu-chemistry-vol-1-praphulla-chandra-ray.md',
  'a-history-of-hindu-civilisation-during-british-rule-pramatha-nath-bose.md',
  'a-history-of-the-sikhs-joseph-davey-cunningham.md',
  'a-literary-history-of-india-frazer-r-w-robert-watson.md',
  'a-personal-narrative-of-a-visit-to-ghuzni-kabul-and-afghanistan-vigne-godfrey-thomas.md',
  'ain-i-akbari-administration-of-mughal-emperor-akbar-volume-1-abul-fazl.md',
  'antiquities-of-indian-tibet-pt-1-francke-a-h.md',
  'catalogue-sanskrit-pali-books-british-museum.md',
  'jeevanadi-a-n-krishnarao.md',
  'kaalayaana-bharateesutha.md',
  'maadana-magalu-m-v-seetharamiah.md',
  'tamil-bhagavata-purana-complete-a-v-narasimhacharya.md',
  'whos-who-of-indian-writers-sahitya-akademi.md',
  '1829-malayalam-new-testament-benjamin-bailey.md'
];

let fixedCount = 0;

recentFiles.forEach(fileName => {
  const filePath = path.join(worksDir, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix collection values
  Object.entries(collectionMapping).forEach(([invalid, valid]) => {
    const regex = new RegExp(`^- ${invalid}$`, 'gm');
    if (content.match(regex)) {
      content = content.replace(regex, `- ${valid}`);
      console.log(`🔧 ${fileName}: Replaced '${invalid}' with '${valid}'`);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
  }
});

console.log(`\n📊 Fixed ${fixedCount} file(s)`);
console.log('\n✅ Collection fix complete!');
