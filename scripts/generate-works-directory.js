import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';

const WORKS_DIR = 'src/content/works';
const OUTPUT_FILE = 'WORKS_DIRECTORY.md';

// Helper to slugify work titles for URLs
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Get all work files
async function getAllWorks() {
  const files = await glob(`${WORKS_DIR}/**/*.{md,mdx}`);
  const works = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const { data } = matter(content);

      // Extract filename for slug
      const filename = path.basename(file, path.extname(file));

      works.push({
        title: data.title || 'Untitled',
        author: Array.isArray(data.author) ? data.author : [data.author || 'Unknown'],
        year: data.year || null,
        language: Array.isArray(data.language) ? data.language : [data.language || 'Unknown'],
        genre: Array.isArray(data.genre) ? data.genre : [data.genre || 'Unknown'],
        description: data.description || '',
        slug: filename,
        file: file
      });
    } catch (error) {
      console.error(`Error parsing ${file}:`, error.message);
    }
  }

  return works;
}

// Group works by language
function groupByLanguage(works) {
  const grouped = {};

  works.forEach(work => {
    work.language.forEach(lang => {
      if (!grouped[lang]) {
        grouped[lang] = [];
      }
      grouped[lang].push(work);
    });
  });

  // Sort works within each language alphabetically
  Object.keys(grouped).forEach(lang => {
    grouped[lang].sort((a, b) => a.title.localeCompare(b.title));
  });

  return grouped;
}

// Generate markdown for a single work
function generateWorkMarkdown(work, index) {
  const authors = work.author.join(', ');
  const languages = work.language.join(', ');
  const genres = work.genre.join(', ');
  const year = work.year ? `**Year:** ${work.year}  ` : '';

  // Truncate description to first 2-3 sentences or ~200 chars
  let description = work.description;
  const sentences = description.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 2) {
    description = sentences.slice(0, 2).join(' ');
  } else if (description.length > 250) {
    description = description.substring(0, 250) + '...';
  }

  return `### ${index}. ${work.title}

**Author(s):** ${authors}
${year}**Language(s):** ${languages}
**Genre(s):** ${genres}
**Link:** [/works/${work.slug}](/works/${work.slug})

${description}

---
`;
}

// Generate the full markdown document
async function generateDirectory() {
  console.log('📚 Generating Works Directory...');

  const works = await getAllWorks();
  console.log(`✓ Found ${works.length} works`);

  // Sort alphabetically for main list
  const sortedWorks = [...works].sort((a, b) => a.title.localeCompare(b.title));

  // Group by language
  const byLanguage = groupByLanguage(works);
  const languages = Object.keys(byLanguage).sort();

  // Generate table of contents
  const tocByLanguage = languages.map(lang => {
    const count = byLanguage[lang].length;
    const anchor = lang.toLowerCase().replace(/\s+/g, '-');
    return `  - [${lang}](#${anchor}) (${count})`;
  }).join('\n');

  // Generate markdown
  let markdown = `# Dhwani Works Directory

A comprehensive catalog of all ${works.length} works in the Dhwani collection.

**Last Updated:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

---

## Table of Contents

- [Complete Alphabetical List](#complete-alphabetical-list) (${works.length} works)
- [By Language](#by-language)
${tocByLanguage}

---

## Complete Alphabetical List

`;

  // Add all works alphabetically
  sortedWorks.forEach((work, index) => {
    markdown += generateWorkMarkdown(work, index + 1);
    markdown += '\n';
  });

  // Add by language section
  markdown += `---

## By Language

`;

  languages.forEach(lang => {
    const langWorks = byLanguage[lang];
    markdown += `### ${lang}\n\n`;
    markdown += `**Total Works:** ${langWorks.length}\n\n`;

    langWorks.forEach((work, index) => {
      const authors = work.author.join(', ');
      const year = work.year ? ` (${work.year})` : '';
      markdown += `${index + 1}. [${work.title}](/works/${work.slug}) - ${authors}${year}\n`;
    });

    markdown += '\n---\n\n';
  });

  // Write to file
  await fs.writeFile(OUTPUT_FILE, markdown, 'utf-8');
  console.log(`✓ Generated ${OUTPUT_FILE}`);
  console.log(`✓ Total works: ${works.length}`);
  console.log(`✓ Languages: ${languages.length}`);
}

// Run
generateDirectory().catch(error => {
  console.error('Error generating directory:', error);
  process.exit(1);
});
