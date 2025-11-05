import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const worksDir = path.join(__dirname, '../src/content/works');
const reportPath = path.join(__dirname, '../MINIMAL_CONTENT_REPORT.json');

// Read the minimal works list
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

// Categories with priority
const categories = {
  'ancient-classical': { priority: 'HIGH', works: [] },
  'religious-philosophical': { priority: 'HIGH', works: [] },
  'colonial-scholarship': { priority: 'MEDIUM', works: [] },
  'modern-literature': { priority: 'MEDIUM', works: [] },
  'dictionaries-reference': { priority: 'LOW', works: [] },
  'natural-history': { priority: 'LOW', works: [] },
  'other': { priority: 'LOW', works: [] }
};

// Keywords for categorization
const patterns = {
  'ancient-classical': [
    'veda', 'upanishad', 'purana', 'mahabharata', 'ramayana', 'arthashastra',
    'yoga-sutra', 'bhagavad-gita', 'ashtadhyayi', 'panini', 'patanjali',
    'sutras', 'karika', 'samhita', 'tantra'
  ],
  'religious-philosophical': [
    'buddhist', 'jain', 'kalpa-sutra', 'milinda', 'shankara', 'vedanta',
    'nyaya', 'mimamsa', 'vaisheshika', 'samkhya', 'gita', 'bhakti'
  ],
  'colonial-scholarship': [
    'history-of', 'annals', 'gazetteer', 'travels-in', 'tribes', 'castes',
    'grammar-of', 'architecture', 'imperial', 'british', 'elliot', 'risley',
    'hunter', 'fergusson', 'briggs', 'firishta', 'heber', 'roe'
  ],
  'modern-literature': [
    'tagore', 'gandhi', 'naidu', 'nationalism', 'swaraj', 'hind-swaraj',
    'unrest', 'besant', 'speeches', 'thug', 'clive'
  ],
  'dictionaries-reference': [
    'dictionary', 'glossary', 'hobson-jobson', 'sanskrit-english',
    'urdu', 'telugu-english'
  ],
  'natural-history': [
    'flora', 'fauna', 'birds', 'mammalia', 'natural-history', 'grasses'
  ]
};

// Categorize each minimal work
report.minimalWorks.forEach(filename => {
  const filePath = path.join(worksDir, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);

    const workInfo = {
      filename,
      title: frontmatter.title,
      author: frontmatter.author?.[0] || 'Unknown',
      year: frontmatter.year,
      genre: frontmatter.genre?.[0] || 'Unknown',
      collections: frontmatter.collections || []
    };

    // Categorize based on filename and metadata
    let categorized = false;
    const lowerFilename = filename.toLowerCase();

    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => lowerFilename.includes(keyword))) {
        categories[category].works.push(workInfo);
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories['other'].works.push(workInfo);
    }
  } catch (err) {
    console.error(`Error processing ${filename}:`, err.message);
  }
});

// Sort categories by priority and count
const sortedCategories = Object.entries(categories)
  .map(([name, data]) => ({
    name,
    priority: data.priority,
    count: data.works.length,
    works: data.works.sort((a, b) => (a.year || 0) - (b.year || 0))
  }))
  .sort((a, b) => {
    const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

// Print report
console.log('\n=== CATEGORIZED MINIMAL WORKS ===\n');

sortedCategories.forEach(({ name, priority, count, works }) => {
  console.log(`\n## ${name.toUpperCase()} [${priority} PRIORITY] - ${count} works\n`);

  works.slice(0, 10).forEach((work, idx) => {
    console.log(`${idx + 1}. ${work.title}`);
    console.log(`   File: ${work.filename}`);
    console.log(`   Author: ${work.author} | Year: ${work.year || 'N/A'}`);
  });

  if (works.length > 10) {
    console.log(`   ... and ${works.length - 10} more\n`);
  }
});

// Save categorized report
const categorizedReport = {
  timestamp: new Date().toISOString(),
  summary: {
    total: report.needingContent,
    byPriority: {
      HIGH: sortedCategories.filter(c => c.priority === 'HIGH').reduce((sum, c) => sum + c.count, 0),
      MEDIUM: sortedCategories.filter(c => c.priority === 'MEDIUM').reduce((sum, c) => sum + c.count, 0),
      LOW: sortedCategories.filter(c => c.priority === 'LOW').reduce((sum, c) => sum + c.count, 0)
    }
  },
  categories: sortedCategories
};

fs.writeFileSync(
  path.join(__dirname, '../CATEGORIZED_MINIMAL_WORKS.json'),
  JSON.stringify(categorizedReport, null, 2)
);

console.log('\n✓ Categorized report saved to CATEGORIZED_MINIMAL_WORKS.json\n');

// Generate suggested batches
console.log('\n=== SUGGESTED BATCH PROCESSING ORDER ===\n');

console.log('BATCH 1 (HIGH PRIORITY - Ancient/Classical): Start here');
const batch1 = categories['ancient-classical'].works.slice(0, 20);
batch1.forEach((w, i) => console.log(`  ${i+1}. ${w.filename}`));

console.log('\nBATCH 2 (HIGH PRIORITY - Religious/Philosophical):');
const batch2 = categories['religious-philosophical'].works.slice(0, 15);
batch2.forEach((w, i) => console.log(`  ${i+1}. ${w.filename}`));

console.log('\nBATCH 3 (MEDIUM PRIORITY - Colonial Scholarship):');
const batch3 = categories['colonial-scholarship'].works.slice(0, 15);
batch3.forEach((w, i) => console.log(`  ${i+1}. ${w.filename}`));

console.log('\n');
