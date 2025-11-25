import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const worksDir = 'src/content/works';

// List of files that need references added
const filesToFix = [
  'hutchinsons-story-of-the-nations.md',
  'literary-history-ancient-india-chakraberty.md',
  'racial-history-india-chakraberty.md',
  'ramakrishna-kathamrita.md',
  'the-hindu-yogi-science-of-breath-atkinson-william-walker.md',
  'the-influence-of-india-and-persia-on-the-poetry-of-germany-remy-arthur-f-j.md',
  'the-mystery-of-cloomber-doyle-arthur-conan.md',
  'the-old-east-indiamen-chatterton-e-keble-edward-keble.md',
  'the-panjab-north-west-frontier-province-and-kashmir-douie-james-mccrone-sir.md',
  'the-peoples-of-india-anderson-j-d-james-drummond.md',
  'the-pirates-of-malabar-and-an-englishwoman-in-india-two-hundred-years-ago-biddulph-j-john.md',
  'the-popular-religion-and-folk-lore-of-northern-india-crooke-william.md',
  'the-red-year-a-story-of-the-indian-mutiny-tracy-louis.md'
];

function generateWikipediaTitle(title) {
  // Clean up title for Wikipedia URL
  return title
    .replace(/[,:;()]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

function generateOpenLibraryQuery(title) {
  // Clean up title for Open Library search
  return encodeURIComponent(title.replace(/[,:;()]/g, ' ').replace(/\s+/g, ' ').trim());
}

function generateReferences(title, author) {
  const references = [];

  // Add Wikipedia link for the title
  const wikiTitle = generateWikipediaTitle(title);
  references.push({
    name: `Wikipedia: ${title.length > 50 ? title.substring(0, 47) + '...' : title}`,
    url: `https://en.wikipedia.org/wiki/${wikiTitle}`,
    type: 'other'
  });

  // Add Open Library search link
  const olQuery = generateOpenLibraryQuery(title);
  references.push({
    name: `Open Library: ${title.length > 40 ? title.substring(0, 37) + '...' : title}`,
    url: `https://openlibrary.org/search?q=${olQuery}`,
    type: 'other'
  });

  return references;
}

let filesFixed = 0;

filesToFix.forEach(file => {
  const filePath = path.join(worksDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    console.log(`⚠️  Could not parse frontmatter: ${file}`);
    return;
  }

  try {
    const frontmatter = yaml.load(match[1]);
    const bodyContent = match[2];

    // Check if references already exist
    if (frontmatter.references && frontmatter.references.length > 0) {
      console.log(`ℹ️  Already has references: ${file}`);
      return;
    }

    // Generate references
    const references = generateReferences(frontmatter.title, frontmatter.author);
    frontmatter.references = references;

    // Write back to file
    const newYaml = yaml.dump(frontmatter, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });

    const newContent = `---\n${newYaml}---\n${bodyContent}`;
    fs.writeFileSync(filePath, newContent, 'utf-8');

    filesFixed++;
    console.log(`✅ Added references to: ${file}`);

  } catch (e) {
    console.log(`❌ Error processing ${file}: ${e.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${filesToFix.length}`);
console.log(`   Files fixed: ${filesFixed}`);
