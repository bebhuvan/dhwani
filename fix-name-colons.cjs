const fs = require('fs');
const path = require('path');

const worksDir = path.join(__dirname, 'src/content/works');

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
let totalFixes = 0;

recentFiles.forEach(fileName => {
  const filePath = path.join(worksDir, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fixes = 0;

  // Fix unquoted name values that contain colons
  // Match: "  - name: Something: Something Else"
  // But NOT: "  - name: "Something: Something Else""
  // And NOT: "  - name: 'Something: Something Else'"

  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    // Match lines like "  - name: XXX" where XXX is not quoted and contains ":"
    if (line.match(/^\s+- name: [^"'][^"'\n]*:[^"\n]*$/)) {
      const match = line.match(/^(\s+- name: )(.+)$/);
      if (match) {
        const [, prefix, value] = match;
        fixes++;
        return `${prefix}"${value}"`;
      }
    }
    return line;
  });

  if (fixes > 0) {
    content = fixedLines.join('\n');
    console.log(`🔧 ${fileName}: Quoted ${fixes} name values with colons`);
    modified = true;
    totalFixes += fixes;
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
  }
});

console.log(`\n📊 Fixed ${totalFixes} name values in ${fixedCount} file(s)`);
console.log('\n✅ Name quoting complete!');
