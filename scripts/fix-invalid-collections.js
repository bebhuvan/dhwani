import fs from 'fs/promises';
import { glob } from 'glob';

// Map of invalid collection names to valid ones
const collectionMapping = {
  'linguistics': 'linguistic-works',
  'history': 'historical-texts',
  'buddhist-literature': 'buddhist-texts',
  'ancient-scriptures': 'religious-texts',
  'mahayana-literature': 'buddhist-texts',
  'vedanta': 'philosophy',
  'wisdom-literature': 'ancient-wisdom',
  'reference': 'reference-works',
  'sanskrit': 'classical-literature',
  'sacred-texts': 'religious-texts',
  'epic-literature': 'epic-poetry',
  'economic-history': 'historical-texts',
  'poetry': 'poetry-collection',
  'bhakti': 'devotional-poetry',
  'bengali-literature': 'regional-literature'
};

// Map of invalid source types to valid ones
// Valid source types: 'gutenberg', 'archive', 'sacred', 'other'
const sourceTypeMapping = {
  'sacred-texts': 'sacred',
  'wikisource': 'other'  // wikisource is for references, not sources
};

// Map of invalid reference types to valid ones
// Valid types: 'wikipedia', 'wikisource', 'openlibrary', 'other'
const referenceTypeMapping = {
  'archive': 'other',
  'gutenberg': 'other',
  'sacred': 'other',
  'reference-works': 'other',
  'institutional': 'other',
  'devotional-site': 'other'
};

async function fixFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');
  let modified = false;

  // Fix collection names (both quoted and unquoted formats)
  for (const [invalid, valid] of Object.entries(collectionMapping)) {
    // Fix double-quoted format: "linguistics"
    const doubleQuotedRegex = new RegExp(`"${invalid}"`, 'g');
    if (content.match(doubleQuotedRegex)) {
      content = content.replace(doubleQuotedRegex, `"${valid}"`);
      modified = true;
      console.log(`  Fixed collection (double-quoted): "${invalid}" → "${valid}"`);
    }

    // Fix single-quoted format: 'linguistics'
    const singleQuotedRegex = new RegExp(`'${invalid}'`, 'g');
    if (content.match(singleQuotedRegex)) {
      content = content.replace(singleQuotedRegex, `'${valid}'`);
      modified = true;
      console.log(`  Fixed collection (single-quoted): '${invalid}' → '${valid}'`);
    }

    // Fix unquoted YAML array format: - linguistics
    const unquotedRegex = new RegExp(`^(\\s*-\\s+)${invalid}\\s*$`, 'gm');
    if (content.match(unquotedRegex)) {
      content = content.replace(unquotedRegex, `$1${valid}`);
      modified = true;
      console.log(`  Fixed collection (unquoted): "${invalid}" → "${valid}"`);
    }
  }

  // Fix source types (section-aware to avoid affecting references)
  for (const [invalid, valid] of Object.entries(sourceTypeMapping)) {
    // Split content by 'references:' to only fix sources section
    const referencesIndex = content.indexOf('\nreferences:');
    if (referencesIndex > -1) {
      const beforeReferences = content.substring(0, referencesIndex);
      const afterReferences = content.substring(referencesIndex);

      const regex = new RegExp(`type: "${invalid}"`, 'g');
      const newBeforeReferences = beforeReferences.replace(regex, `type: "${valid}"`);

      if (newBeforeReferences !== beforeReferences) {
        content = newBeforeReferences + afterReferences;
        modified = true;
        console.log(`  Fixed source type: "${invalid}" → "${valid}"`);
      }
    } else {
      // No references section, fix globally in sources
      const regex = new RegExp(`type: "${invalid}"`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, `type: "${valid}"`);
        modified = true;
        console.log(`  Fixed source type: "${invalid}" → "${valid}"`);
      }
    }
  }

  // Fix reference types (in references array)
  for (const [invalid, valid] of Object.entries(referenceTypeMapping)) {
    // Match both quoted and unquoted reference types in the references section
    const quotedRegex = new RegExp(`(\\s+type:\\s*)"${invalid}"`, 'g');
    if (content.match(quotedRegex)) {
      content = content.replace(quotedRegex, `$1"${valid}"`);
      modified = true;
      console.log(`  Fixed reference type: "${invalid}" → "${valid}"`);
    }
  }

  if (modified) {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

async function main() {
  const files = await glob('src/content/works/**/*.md');
  console.log(`🔍 Checking ${files.length} files...\n`);

  let fixedCount = 0;

  for (const file of files) {
    try {
      const wasFixed = await fixFile(file);
      if (wasFixed) {
        fixedCount++;
        console.log(`✓ Fixed: ${file}\n`);
      }
    } catch (error) {
      console.error(`✗ Error in ${file}:`, error.message);
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} files`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
