import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { z } from 'astro/zod';

// Define the exact schema from src/content/config.ts
const VALID_COLLECTION_VALUES = [
  'academic-journals',
  'ancient-history',
  'ancient-wisdom',
  'archaeology',
  'archival-sources',
  'arts-texts',
  'astronomy',
  'buddhist-texts',
  'classical-literature',
  'colonial-india',
  'comparative-religion',
  'court-chronicles',
  'devotional-literature',
  'devotional-poetry',
  'epigraphy',
  'epic-poetry',
  'ethnographic-studies',
  'ethnography',
  'folklore',
  'folklore-collection',
  'genealogy',
  'historical-literature',
  'historical-texts',
  'indology',
  'jain-literature',
  'jain-texts',
  'legal-texts',
  'linguistic-works',
  'mathematics',
  'medical-texts',
  'medieval-india',
  'modern-literature',
  'mughal-history',
  'mughal-india',
  'musicology',
  'numismatics',
  'oral-literature',
  'pali-literature',
  'philosophical-works',
  'philosophy',
  'poetry-collection',
  'political-philosophy',
  'reference-texts',
  'reference-works',
  'regional-history',
  'regional-literature',
  'regional-voices',
  'religious-texts',
  'ritual-texts',
  'sanskrit-drama',
  'scholarly-translations',
  'science',
  'scientific-texts',
  'scientific-works',
  'spiritual-texts',
  'technical-manuals',
  'tribal-studies',
];

const VALID_SOURCE_TYPES = ['gutenberg', 'archive', 'sacred', 'other'];
const VALID_REFERENCE_TYPES = ['wikipedia', 'wikisource', 'openlibrary', 'other'];

// Create the Zod schema exactly as in config.ts
const worksSchema = z.object({
  title: z.string(),
  author: z.array(z.string()),
  year: z.number().optional(),
  language: z.array(z.string()),
  genre: z.array(z.string()),
  description: z.string(),
  collections: z.array(z.enum([
    'academic-journals',
    'ancient-history',
    'ancient-wisdom',
    'archaeology',
    'archival-sources',
    'arts-texts',
    'astronomy',
    'buddhist-texts',
    'classical-literature',
    'colonial-india',
    'comparative-religion',
    'court-chronicles',
    'devotional-literature',
    'devotional-poetry',
    'epigraphy',
    'epic-poetry',
    'ethnographic-studies',
    'ethnography',
    'folklore',
    'folklore-collection',
    'genealogy',
    'historical-literature',
    'historical-texts',
    'indology',
    'jain-literature',
    'jain-texts',
    'legal-texts',
    'linguistic-works',
    'mathematics',
    'medical-texts',
    'medieval-india',
    'modern-literature',
    'mughal-history',
    'mughal-india',
    'musicology',
    'numismatics',
    'oral-literature',
    'pali-literature',
    'philosophical-works',
    'philosophy',
    'poetry-collection',
    'political-philosophy',
    'reference-texts',
    'reference-works',
    'regional-history',
    'regional-literature',
    'regional-voices',
    'religious-texts',
    'ritual-texts',
    'sanskrit-drama',
    'scholarly-translations',
    'science',
    'scientific-texts',
    'scientific-works',
    'spiritual-texts',
    'technical-manuals',
    'tribal-studies',
  ])).default([]),
  sources: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(['gutenberg', 'archive', 'sacred', 'other']),
  })),
  references: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(['wikipedia', 'wikisource', 'openlibrary', 'other']),
  })).default([]),
  featured: z.boolean().default(false),
  publishDate: z.date(),
  tags: z.array(z.string()).default([]),
});

function validateWork(filePath, fileName) {
  const errors = [];

  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);

    // Convert publishDate string to Date if needed
    if (typeof data.publishDate === 'string') {
      data.publishDate = new Date(data.publishDate);
    }

    // Try to validate with the Zod schema
    const result = worksSchema.safeParse(data);

    if (!result.success) {
      // Parse Zod errors
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        const message = issue.message;

        if (issue.code === 'invalid_enum_value') {
          errors.push(`${path}: Invalid enum value "${issue.received}". Expected one of: ${issue.options.join(', ')}`);
        } else if (issue.code === 'invalid_type') {
          errors.push(`${path}: Expected ${issue.expected}, received ${issue.received}`);
        } else if (issue.code === 'too_small') {
          if (issue.minimum === 1) {
            errors.push(`${path}: Array cannot be empty`);
          } else {
            errors.push(`${path}: ${message}`);
          }
        } else {
          errors.push(`${path}: ${message}`);
        }
      });
    }

  } catch (error) {
    errors.push(`Failed to parse file: ${error.message}`);
  }

  return errors;
}

// Main execution
const worksDir = join(process.cwd(), 'src/content/works');
const files = readdirSync(worksDir).filter(f => f.endsWith('.md'));

console.log(`\n=== Validating ${files.length} work files against Astro/Zod schema ===\n`);

const results = {
  passed: [],
  failed: []
};

files.forEach(fileName => {
  const filePath = join(worksDir, fileName);
  const errors = validateWork(filePath, fileName);

  if (errors.length === 0) {
    results.passed.push(fileName);
  } else {
    results.failed.push({ fileName, errors });
  }
});

// Print summary
console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Total works: ${files.length}`);
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);
console.log(`\n${'='.repeat(50)}\n`);

if (results.failed.length > 0) {
  console.log(`\n=== FAILED WORKS (${results.failed.length}) ===\n`);

  // Group errors by type
  const errorsByType = {};

  results.failed.forEach(({ fileName, errors }) => {
    console.log(`\n${fileName}:`);
    errors.forEach(error => {
      console.log(`  - ${error}`);

      // Categorize error
      const errorKey = error.split(':')[0].trim();
      if (!errorsByType[errorKey]) {
        errorsByType[errorKey] = [];
      }
      errorsByType[errorKey].push({ fileName, error });
    });
  });

  // Print error summary by type
  console.log(`\n\n=== ERROR SUMMARY BY TYPE ===\n`);
  Object.entries(errorsByType)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([errorType, occurrences]) => {
      console.log(`${errorType}: ${occurrences.length} occurrences`);
    });

  // Print specific problematic values for enum errors
  console.log(`\n\n=== INVALID ENUM VALUES ===\n`);

  const invalidCollections = new Set();
  const invalidSourceTypes = new Set();
  const invalidReferenceTypes = new Set();

  results.failed.forEach(({ fileName, errors }) => {
    errors.forEach(error => {
      // Extract invalid collection values
      const collectionMatch = error.match(/collections\.(\d+).*Invalid enum value "([^"]+)"/);
      if (collectionMatch) {
        invalidCollections.add(collectionMatch[2]);
      }

      // Extract invalid source types
      const sourceMatch = error.match(/sources\.(\d+)\.type.*Invalid enum value "([^"]+)"/);
      if (sourceMatch) {
        invalidSourceTypes.add(sourceMatch[2]);
      }

      // Extract invalid reference types
      const refMatch = error.match(/references\.(\d+)\.type.*Invalid enum value "([^"]+)"/);
      if (refMatch) {
        invalidReferenceTypes.add(refMatch[2]);
      }
    });
  });

  if (invalidCollections.size > 0) {
    console.log(`\nInvalid collection values found:`);
    Array.from(invalidCollections).sort().forEach(val => {
      const count = results.failed.filter(({ errors }) =>
        errors.some(e => e.includes(`"${val}"`))
      ).length;
      console.log(`  - "${val}" (used in ${count} files)`);
    });
  }

  if (invalidSourceTypes.size > 0) {
    console.log(`\nInvalid source types found:`);
    Array.from(invalidSourceTypes).sort().forEach(val => {
      const count = results.failed.filter(({ errors }) =>
        errors.some(e => e.includes(`sources`) && e.includes(`"${val}"`))
      ).length;
      console.log(`  - "${val}" (used in ${count} files)`);
    });
  }

  if (invalidReferenceTypes.size > 0) {
    console.log(`\nInvalid reference types found:`);
    Array.from(invalidReferenceTypes).sort().forEach(val => {
      const count = results.failed.filter(({ errors }) =>
        errors.some(e => e.includes(`references`) && e.includes(`"${val}"`))
      ).length;
      console.log(`  - "${val}" (used in ${count} files)`);
    });
  }

  // Show first 10 failing files in detail
  console.log(`\n\n=== SAMPLE FAILING FILES (first 10) ===\n`);
  results.failed.slice(0, 10).forEach(({ fileName, errors }) => {
    console.log(`\n${fileName}:`);
    errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  });
}

console.log('\n');

// Exit with error code if any failed
if (results.failed.length > 0) {
  process.exit(1);
}
