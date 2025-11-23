import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const worksDir = path.join(__dirname, 'src/content/works');
const outputFile = path.join(__dirname, 'WORKS_DIRECTORY.md');

// Read all markdown files from works directory
const files = fs.readdirSync(worksDir).filter(file => file.endsWith('.md'));

console.log(`Found ${files.length} works files`);

let worksData = [];

// Parse each file to extract frontmatter
files.forEach(file => {
    const filePath = path.join(worksDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Extract frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (match) {
        const frontmatter = match[1];
        const work = {
            file: file,
            slug: file.replace('.md', '')
        };

        // Parse frontmatter fields
        const lines = frontmatter.split('\n');
        let currentKey = null;
        let currentValue = '';

        lines.forEach(line => {
            const keyMatch = line.match(/^([a-zA-Z_]+):\s*(.*)/);
            if (keyMatch) {
                // Save previous key-value if exists
                if (currentKey) {
                    work[currentKey] = currentValue.trim();
                }
                currentKey = keyMatch[1];
                currentValue = keyMatch[2];
            } else if (currentKey) {
                // Continuation of previous value
                currentValue += '\n' + line;
            }
        });

        // Save last key-value
        if (currentKey) {
            work[currentKey] = currentValue.trim();
        }

        // Clean up values
        if (work.title) work.title = work.title.replace(/^["']|["']$/g, '');
        if (work.author) work.author = work.author.replace(/^["']|["']$/g, '');
        if (work.year) work.year = work.year.replace(/^["']|["']$/g, '');
        if (work.category) work.category = work.category.replace(/^["']|["']$/g, '');
        if (work.language) work.language = work.language.replace(/^["']|["']$/g, '');
        if (work.tags) {
            // Handle array format
            work.tags = work.tags.replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
        }

        worksData.push(work);
    }
});

console.log(`Parsed ${worksData.length} works`);

// Sort by title
worksData.sort((a, b) => {
    const titleA = (a.title || a.slug).toLowerCase();
    const titleB = (b.title || b.slug).toLowerCase();
    return titleA.localeCompare(titleB);
});

// Generate markdown output
let markdown = `# Works Directory

This file contains a comprehensive list of all works available on the Dhwani Digital Library site.

**Total Works:** ${worksData.length}

**Last Updated:** ${new Date().toISOString().split('T')[0]}

---

## Complete Works List

`;

worksData.forEach((work, index) => {
    markdown += `### ${index + 1}. ${work.title || work.slug}\n\n`;
    markdown += `- **File:** \`${work.file}\`\n`;
    markdown += `- **Slug:** \`${work.slug}\`\n`;
    if (work.author) markdown += `- **Author:** ${work.author}\n`;
    if (work.year) markdown += `- **Year:** ${work.year}\n`;
    if (work.category) markdown += `- **Category:** ${work.category}\n`;
    if (work.language) markdown += `- **Language:** ${work.language}\n`;
    if (work.tags && Array.isArray(work.tags) && work.tags.length > 0) {
        markdown += `- **Tags:** ${work.tags.filter(t => t).join(', ')}\n`;
    }
    if (work.description) markdown += `- **Description:** ${work.description}\n`;
    markdown += '\n';
});

// Add statistics section
markdown += `---

## Statistics by Category

`;

const categories = {};
worksData.forEach(work => {
    const cat = work.category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
});

Object.keys(categories).sort().forEach(cat => {
    markdown += `- **${cat}:** ${categories[cat]} works\n`;
});

markdown += `\n---

## Statistics by Language

`;

const languages = {};
worksData.forEach(work => {
    const lang = work.language || 'Unknown';
    languages[lang] = (languages[lang] || 0) + 1;
});

Object.keys(languages).sort().forEach(lang => {
    markdown += `- **${lang}:** ${languages[lang]} works\n`;
});

markdown += `\n---

## Statistics by Author

`;

const authors = {};
worksData.forEach(work => {
    const auth = work.author || 'Unknown';
    authors[auth] = (authors[auth] || 0) + 1;
});

// Sort authors by number of works (descending)
const sortedAuthors = Object.entries(authors).sort((a, b) => b[1] - a[1]);

sortedAuthors.forEach(([auth, count]) => {
    markdown += `- **${auth}:** ${count} work${count > 1 ? 's' : ''}\n`;
});

// Write to file
fs.writeFileSync(outputFile, markdown, 'utf-8');

console.log(`\nWORKS_DIRECTORY.md has been updated successfully!`);
console.log(`Total works documented: ${worksData.length}`);
console.log(`Categories: ${Object.keys(categories).length}`);
console.log(`Languages: ${Object.keys(languages).length}`);
console.log(`Authors: ${Object.keys(authors).length}`);
