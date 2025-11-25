const fs = require('fs');
const path = require('path');

const worksDir = path.join(__dirname, 'src/content/works');

// List of recently added works to process
const recentWorks = [
  'indian-philosophy-radhakrishnan.md',
  'the-principal-upanisads-radhakrishnan.md',
  'eastern-religions-and-western-thought-radhakrishnan.md',
  'gautama-the-buddha-radhakrishnan.md',
  'an-idealist-view-of-life-radhakrishnan.md',
  'the-philosophy-of-rabindranath-tagore-radhakrishnan.md',
  'a-short-history-of-indian-materialism-shastri.md',
  'carvaka-lokayata-anthology-chattopadhyaya-gangopadhyaya.md',
  'letters-from-abroad-tagore.md',
  'life-and-letters-of-raja-rammohun-roy-collet.md',
  'specimens-of-old-indian-poetry-griffith.md',
  'the-ajivikas-barua.md',
  'education-as-service-krishnamurti.md',
  'the-kaveri-the-maukharis-and-the-sangam-age-aravamuthan.md',
  'education-politics-and-war-radhakrishnan.md'
];

function shortenDescription(content) {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.log('No frontmatter found');
    return content;
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Extract description
  const descMatch = frontmatter.match(/description: \|\n([\s\S]*?)(?=\n\w+:|\ncollections:)/);
  if (!descMatch) {
    console.log('No description found');
    return content;
  }

  const fullDescription = descMatch[1];

  // Get first 2-3 sentences (roughly 100-150 words)
  const sentences = fullDescription.split(/\.\s+/);
  const shortDescription = sentences.slice(0, 3).join('. ') + '.';

  // Rest goes to body
  const remainingDescription = sentences.slice(3).join('. ').trim();

  // Replace description in frontmatter
  const newFrontmatter = frontmatter.replace(
    /description: \|\n[\s\S]*?(?=\n\w+:|\ncollections:)/,
    `description: |\n  ${shortDescription}`
  );

  // Add detailed description to body if not already there
  let newBody = body;
  if (remainingDescription && !body.includes('## About This Work')) {
    newBody = `## About This Work\n\n${remainingDescription}\n\n${body}`;
  }

  return `---\n${newFrontmatter}\n---\n${newBody}`;
}

// Process each file
recentWorks.forEach(filename => {
  const filepath = path.join(worksDir, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  Skipping ${filename} - file not found`);
    return;
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const newContent = shortenDescription(content);

  fs.writeFileSync(filepath, newContent, 'utf8');
  console.log(`✅ Processed ${filename}`);
});

console.log('\n✨ Done! All descriptions shortened.');
