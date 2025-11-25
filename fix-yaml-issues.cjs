const fs = require('fs');
const path = require('path');

const worksDir = path.join(__dirname, 'src/content/works');

// List of files from the recent commit
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

  // Fix incomplete reference entries (name without url/type)
  const lines = content.split('\n');
  let inReferences = false;
  let fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track if we're in references section
    if (line.trim() === 'references:') {
      inReferences = true;
    } else if (inReferences && line.match(/^[a-z]+:/)) {
      // Exited references section
      inReferences = false;
    }

    // Check for incomplete reference entries
    if (inReferences && line.match(/^\s+- name: ["']?Wikipedia search["']?\s*$/)) {
      // Skip this incomplete entry
      console.log(`🔧 Removing incomplete reference in ${fileName}`);
      modified = true;
      continue;
    }

    // Check for reference entries that have name but the next line doesn't have url
    if (inReferences && line.match(/^\s+- name:/) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      // If next line is another '- name:' or doesn't start with proper indentation + url/type
      if (nextLine.match(/^\s+- name:/) || (!nextLine.match(/^\s+url:/) && !nextLine.match(/^\s+type:/) && nextLine.trim() !== '')) {
        // Check if current name entry is incomplete
        if (!nextLine.match(/^\s+(url|type):/)) {
          console.log(`🔧 Found potentially incomplete reference: ${line.trim()} in ${fileName}`);
        }
      }
    }

    fixedLines.push(line);
  }

  if (modified) {
    const newContent = fixedLines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    fixedCount++;
    console.log(`✅ Fixed ${fileName}`);
  }
});

console.log(`\n📊 Fixed ${fixedCount} file(s)`);
console.log('\n✅ YAML fix complete! Run build to verify.');
