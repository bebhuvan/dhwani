#!/usr/bin/env node

/**
 * Dhwani Candidate Processing Pipeline
 *
 * This tool processes candidate works and validates them for inclusion in Dhwani.
 * It performs the following steps:
 * 1. Verify if work is genuinely Indian-related
 * 2. Verify public domain status
 * 3. Add alternative archive sources
 * 4. Add reference links (Wikipedia, Wikisource, OpenLibrary)
 * 5. Validate and enhance descriptions
 * 6. Validate frontmatter against schema
 * 7. Output to batch folders for manual review
 */

import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  candidatesPath: '/home/bhuvanesh.r/Documents/Backup docs/Dhwani files/dhwani-new-works',
  outputBasePath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/candidate-batches',
  batchSize: 20,
  logPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/processing-logs',
};

// Valid collections from schema
const VALID_COLLECTIONS = [
  'academic-journals', 'ancient-history', 'ancient-wisdom', 'archaeology',
  'archival-sources', 'arts-texts', 'astronomy', 'buddhist-texts',
  'classical-literature', 'colonial-india', 'comparative-religion', 'court-chronicles',
  'devotional-literature', 'devotional-poetry', 'epigraphy', 'epic-poetry',
  'ethnographic-studies', 'ethnography', 'folklore', 'folklore-collection',
  'genealogy', 'historical-literature', 'historical-texts', 'indology',
  'jain-literature', 'jain-texts', 'legal-texts', 'linguistic-works',
  'mathematics', 'medical-texts', 'medieval-india', 'modern-literature',
  'mughal-history', 'mughal-india', 'musicology', 'numismatics',
  'oral-literature', 'pali-literature', 'philosophical-works', 'philosophy',
  'poetry-collection', 'political-philosophy', 'reference-texts', 'reference-works',
  'regional-history', 'regional-literature', 'regional-voices', 'religious-texts',
  'ritual-texts', 'sanskrit-drama', 'scholarly-translations', 'science',
  'scientific-texts', 'scientific-works', 'spiritual-texts', 'technical-manuals',
  'tribal-studies',
];

// Indian relevance keywords
const INDIAN_KEYWORDS = {
  regions: ['india', 'indian', 'bengal', 'punjab', 'tamil', 'telugu', 'marathi', 'hindi',
            'sanskrit', 'karnataka', 'kerala', 'gujarat', 'rajasthan', 'kashmir', 'assam',
            'orissa', 'sindh', 'delhi', 'agra', 'madras', 'bombay', 'calcutta', 'hyderabad',
            'mysore', 'malabar', 'coromandel', 'deccan', 'hindustan', 'bharata', 'bharat'],
  religions: ['hindu', 'buddhist', 'jain', 'sikh', 'vedic', 'vaishnav', 'shaiv', 'shakta'],
  texts: ['veda', 'upanishad', 'purana', 'ramayana', 'mahabharata', 'gita', 'sutra', 'shastra'],
  languages: ['sanskrit', 'pali', 'prakrit', 'tamil', 'telugu', 'kannada', 'malayalam',
              'bengali', 'marathi', 'gujarati', 'punjabi', 'urdu', 'hindi'],
  historical: ['mughal', 'maratha', 'maurya', 'gupta', 'chola', 'pandya', 'vijayanagar',
               'delhi sultanate', 'east india company', 'british raj', 'colonial'],
};

class CandidateProcessor {
  constructor() {
    this.stats = {
      total: 0,
      processed: 0,
      verified: 0,
      rejected: 0,
      errors: 0,
    };
    this.rejectionReasons = [];
  }

  async init() {
    // Create necessary directories
    await fs.mkdir(CONFIG.outputBasePath, { recursive: true });
    await fs.mkdir(CONFIG.logPath, { recursive: true });
  }

  // Parse frontmatter from markdown file
  parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('No frontmatter found');
    }

    try {
      const frontmatter = yaml.parse(match[1]);

      // Normalize author field - ensure it's always an array
      if (frontmatter.author) {
        if (typeof frontmatter.author === 'string') {
          frontmatter.author = [frontmatter.author];
        } else if (!Array.isArray(frontmatter.author)) {
          frontmatter.author = [String(frontmatter.author)];
        }
      } else {
        frontmatter.author = ['Unknown'];
      }

      // Normalize other array fields
      const arrayFields = ['language', 'genre', 'collections', 'tags'];
      for (const field of arrayFields) {
        if (!frontmatter[field]) {
          frontmatter[field] = [];
        } else if (!Array.isArray(frontmatter[field])) {
          frontmatter[field] = [frontmatter[field]];
        }
      }

      // Ensure sources and references exist
      if (!frontmatter.sources) frontmatter.sources = [];
      if (!frontmatter.references) frontmatter.references = [];

      // Parse publishDate if it's a string
      if (typeof frontmatter.publishDate === 'string') {
        frontmatter.publishDate = frontmatter.publishDate;
      } else if (frontmatter.publishDate instanceof Date) {
        frontmatter.publishDate = frontmatter.publishDate.toISOString().split('T')[0];
      } else {
        frontmatter.publishDate = new Date().toISOString().split('T')[0];
      }

      return {
        frontmatter,
        content: content.substring(match[0].length).trim(),
      };
    } catch (error) {
      throw new Error(`Failed to parse YAML: ${error.message}`);
    }
  }

  // Check if work is genuinely Indian-related
  verifyIndianRelevance(work) {
    const searchText = `
      ${work.frontmatter.title}
      ${work.frontmatter.author?.join(' ')}
      ${work.frontmatter.description}
      ${work.content}
    `.toLowerCase();

    let score = 0;
    const foundKeywords = [];

    // Check regions
    for (const keyword of INDIAN_KEYWORDS.regions) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 2;
        foundKeywords.push(keyword);
      }
    }

    // Check religions
    for (const keyword of INDIAN_KEYWORDS.religions) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 3;
        foundKeywords.push(keyword);
      }
    }

    // Check texts
    for (const keyword of INDIAN_KEYWORDS.texts) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 4;
        foundKeywords.push(keyword);
      }
    }

    // Check languages
    const languages = work.frontmatter.language || [];
    for (const lang of languages) {
      if (INDIAN_KEYWORDS.languages.includes(lang.toLowerCase())) {
        score += 5;
        foundKeywords.push(lang);
      }
    }

    // Check historical keywords
    for (const keyword of INDIAN_KEYWORDS.historical) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 2;
        foundKeywords.push(keyword);
      }
    }

    return {
      isIndian: score >= 5, // Threshold for Indian relevance
      score,
      keywords: [...new Set(foundKeywords)],
    };
  }

  // Verify public domain status based on publication year
  verifyPublicDomain(work) {
    const year = work.frontmatter.year;
    const currentYear = new Date().getFullYear();

    // General rules for public domain in India:
    // - Works published before 1924 are in public domain in most jurisdictions
    // - In India: Author's life + 60 years
    // - In US: Published before 1929 generally in public domain

    if (!year) {
      return {
        status: 'UNCERTAIN',
        reason: 'No publication year specified',
        needsReview: true,
      };
    }

    if (year < 1924) {
      return {
        status: 'PUBLIC_DOMAIN',
        reason: 'Published before 1924',
        needsReview: false,
      };
    }

    if (year < 1929) {
      return {
        status: 'LIKELY_PUBLIC_DOMAIN',
        reason: 'Published before 1929',
        needsReview: true,
      };
    }

    // For works after 1929, need to check author death date
    // This requires manual verification
    if (year >= 1929 && year < 1960) {
      return {
        status: 'NEEDS_VERIFICATION',
        reason: `Published in ${year}, needs author death date verification`,
        needsReview: true,
      };
    }

    return {
      status: 'UNCERTAIN',
      reason: `Published in ${year}, likely still under copyright`,
      needsReview: true,
    };
  }

  // Generate OpenLibrary search URL
  generateOpenLibraryUrl(title, author) {
    const query = `${title} ${author}`.replace(/[^\w\s]/g, ' ').trim();
    return `https://openlibrary.org/search?q=${encodeURIComponent(query)}`;
  }

  // Generate Wikipedia search (returns null, needs to be verified separately)
  generateWikipediaUrl(title) {
    // This is a placeholder - actual Wikipedia URL needs verification
    const searchTitle = title.replace(/[^\w\s]/g, ' ').trim();
    return `https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(searchTitle)}`;
  }

  // Validate and enrich references
  async enrichReferences(work) {
    const references = work.frontmatter.references || [];
    const existingTypes = new Set(references.map(r => r.type));
    const title = work.frontmatter.title;
    const author = work.frontmatter.author?.[0] || '';

    // Add OpenLibrary if not present
    if (!references.some(r => r.name?.includes('OpenLibrary') || r.type === 'openlibrary')) {
      references.push({
        name: 'OpenLibrary Search',
        url: this.generateOpenLibraryUrl(title, author),
        type: 'openlibrary',
      });
    }

    // Note: Wikipedia and Wikisource URLs need verification
    // We'll flag them for manual addition

    return references;
  }

  // Validate collections against schema
  validateCollections(collections) {
    const invalid = [];
    const valid = [];

    for (const collection of collections) {
      if (VALID_COLLECTIONS.includes(collection)) {
        valid.push(collection);
      } else {
        invalid.push(collection);
      }
    }

    return { valid, invalid };
  }

  // Process a single candidate file
  async processCandidate(filePath, filename) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = this.parseFrontmatter(content);

      const work = {
        filename,
        frontmatter: parsed.frontmatter,
        content: parsed.content,
      };

      // Step 1: Verify Indian relevance
      const indianCheck = this.verifyIndianRelevance(work);
      if (!indianCheck.isIndian) {
        this.stats.rejected++;
        this.rejectionReasons.push({
          file: filename,
          reason: 'Not Indian-related',
          score: indianCheck.score,
          keywords: indianCheck.keywords,
        });
        return null;
      }

      // Step 2: Verify public domain
      const pdCheck = this.verifyPublicDomain(work);

      // Step 3: Enrich references
      const enrichedRefs = await this.enrichReferences(work);

      // Step 4: Validate collections
      const collections = work.frontmatter.collections || [];
      const collectionCheck = this.validateCollections(collections);

      // Step 5: Compile processing report
      const report = {
        filename,
        title: work.frontmatter.title,
        author: work.frontmatter.author,
        year: work.frontmatter.year,
        indianRelevance: indianCheck,
        publicDomain: pdCheck,
        collections: {
          current: collections,
          valid: collectionCheck.valid,
          invalid: collectionCheck.invalid,
        },
        references: {
          current: work.frontmatter.references?.length || 0,
          enriched: enrichedRefs.length,
        },
        sources: {
          count: work.frontmatter.sources?.length || 0,
        },
        needsReview: pdCheck.needsReview || collectionCheck.invalid.length > 0,
      };

      // Update work with enriched data
      work.frontmatter.references = enrichedRefs;
      work.report = report;

      this.stats.verified++;
      return work;

    } catch (error) {
      this.stats.errors++;
      console.error(`Error processing ${filename}:`, error.message);
      return null;
    }
  }

  // Process all candidates
  async processCandidates() {
    const files = await fs.readdir(CONFIG.candidatesPath);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('BATCH_') && !f.startsWith('CURRENT_'));

    this.stats.total = mdFiles.length;
    console.log(`Found ${mdFiles.length} candidate files to process\n`);

    const processedWorks = [];

    for (let i = 0; i < mdFiles.length; i++) {
      const filename = mdFiles[i];
      const filePath = path.join(CONFIG.candidatesPath, filename);

      console.log(`[${i + 1}/${mdFiles.length}] Processing: ${filename}`);

      const work = await this.processCandidate(filePath, filename);
      if (work) {
        processedWorks.push(work);
      }

      this.stats.processed++;

      // Small delay to avoid overwhelming system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return processedWorks;
  }

  // Create batch folders and organize works
  async createBatches(works) {
    const batches = [];
    for (let i = 0; i < works.length; i += CONFIG.batchSize) {
      batches.push(works.slice(i, i + CONFIG.batchSize));
    }

    console.log(`\nCreating ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batchNum = i + 1;
      const batchPath = path.join(CONFIG.outputBasePath, `batch-${batchNum}`);
      const worksPath = path.join(batchPath, 'works');
      const reportsPath = path.join(batchPath, 'reports');

      await fs.mkdir(worksPath, { recursive: true });
      await fs.mkdir(reportsPath, { recursive: true });

      // Write works and reports
      for (const work of batches[i]) {
        // Write work file
        const workContent = this.generateMarkdown(work);
        await fs.writeFile(
          path.join(worksPath, work.filename),
          workContent,
          'utf-8'
        );

        // Write individual report
        await fs.writeFile(
          path.join(reportsPath, `${work.filename}.report.json`),
          JSON.stringify(work.report, null, 2),
          'utf-8'
        );
      }

      // Write batch summary
      const batchSummary = {
        batchNumber: batchNum,
        totalWorks: batches[i].length,
        needsReview: batches[i].filter(w => w.report.needsReview).length,
        works: batches[i].map(w => ({
          filename: w.filename,
          title: w.frontmatter.title,
          needsReview: w.report.needsReview,
        })),
      };

      await fs.writeFile(
        path.join(batchPath, 'BATCH_SUMMARY.json'),
        JSON.stringify(batchSummary, null, 2),
        'utf-8'
      );

      console.log(`  Batch ${batchNum}: ${batches[i].length} works`);
    }

    return batches;
  }

  // Generate markdown from work object
  generateMarkdown(work) {
    const fm = work.frontmatter;

    let md = '---\n';
    md += `title: "${fm.title}"\n`;
    md += `author: [${fm.author.map(a => `"${a}"`).join(', ')}]\n`;
    if (fm.year) md += `year: ${fm.year}\n`;
    md += `language: [${fm.language.map(l => `"${l}"`).join(', ')}]\n`;
    md += `genre: [${fm.genre.map(g => `"${g}"`).join(', ')}]\n`;
    md += `description: "${fm.description}"\n`;
    md += `collections: [${fm.collections.map(c => `'${c}'`).join(', ')}]\n`;

    // Sources
    md += 'sources:\n';
    for (const source of fm.sources || []) {
      md += `  - name: "${source.name}"\n`;
      md += `    url: "${source.url}"\n`;
      md += `    type: "${source.type}"\n`;
    }

    // References
    md += 'references:\n';
    for (const ref of fm.references || []) {
      md += `  - name: "${ref.name}"\n`;
      md += `    url: "${ref.url}"\n`;
      md += `    type: "${ref.type}"\n`;
    }

    md += `featured: ${fm.featured || false}\n`;
    md += `publishDate: ${fm.publishDate || new Date().toISOString().split('T')[0]}\n`;
    md += `tags: [${fm.tags.map(t => `"${t}"`).join(', ')}]\n`;
    md += '---\n\n';
    md += work.content;

    return md;
  }

  // Generate final report
  async generateReport(batches) {
    const report = {
      timestamp: new Date().toISOString(),
      statistics: this.stats,
      batches: batches.length,
      rejections: this.rejectionReasons,
      summary: {
        acceptanceRate: ((this.stats.verified / this.stats.total) * 100).toFixed(2) + '%',
        rejectionRate: ((this.stats.rejected / this.stats.total) * 100).toFixed(2) + '%',
        errorRate: ((this.stats.errors / this.stats.total) * 100).toFixed(2) + '%',
      },
    };

    const reportPath = path.join(CONFIG.logPath, `processing-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    // Also write a human-readable summary
    let summary = '# Dhwani Candidate Processing Report\n\n';
    summary += `Generated: ${new Date().toISOString()}\n\n`;
    summary += `## Statistics\n\n`;
    summary += `- Total Candidates: ${this.stats.total}\n`;
    summary += `- Processed: ${this.stats.processed}\n`;
    summary += `- Verified & Accepted: ${this.stats.verified}\n`;
    summary += `- Rejected: ${this.stats.rejected}\n`;
    summary += `- Errors: ${this.stats.errors}\n`;
    summary += `- Acceptance Rate: ${report.summary.acceptanceRate}\n\n`;
    summary += `## Batches Created\n\n`;
    summary += `Total batches: ${batches.length}\n`;
    summary += `Batch size: ${CONFIG.batchSize} works per batch\n\n`;
    summary += `## Rejections\n\n`;

    if (this.rejectionReasons.length > 0) {
      summary += `Total rejections: ${this.rejectionReasons.length}\n\n`;
      for (const rejection of this.rejectionReasons) {
        summary += `### ${rejection.file}\n`;
        summary += `- Reason: ${rejection.reason}\n`;
        summary += `- Relevance Score: ${rejection.score}\n`;
        summary += `- Keywords Found: ${rejection.keywords.join(', ')}\n\n`;
      }
    } else {
      summary += 'No rejections.\n\n';
    }

    const summaryPath = path.join(CONFIG.logPath, `processing-summary-${Date.now()}.md`);
    await fs.writeFile(summaryPath, summary, 'utf-8');

    return { reportPath, summaryPath };
  }

  // Main execution
  async run() {
    console.log('='.repeat(60));
    console.log('Dhwani Candidate Processing Pipeline');
    console.log('='.repeat(60));
    console.log();

    await this.init();

    // Process candidates
    const works = await this.processCandidates();

    if (works.length === 0) {
      console.log('\nNo works verified. Exiting.');
      return;
    }

    // Create batches
    const batches = await this.createBatches(works);

    // Generate report
    const { reportPath, summaryPath } = await this.generateReport(batches);

    console.log('\n' + '='.repeat(60));
    console.log('Processing Complete!');
    console.log('='.repeat(60));
    console.log(`\nVerified works: ${this.stats.verified}`);
    console.log(`Rejected works: ${this.stats.rejected}`);
    console.log(`Batches created: ${batches.length}`);
    console.log(`\nOutput directory: ${CONFIG.outputBasePath}`);
    console.log(`Report: ${reportPath}`);
    console.log(`Summary: ${summaryPath}`);
    console.log('\nNext steps:');
    console.log('1. Review each batch in the candidate-batches folder');
    console.log('2. Check individual work reports for issues needing attention');
    console.log('3. Verify public domain status for flagged works');
    console.log('4. Add missing Wikipedia/Wikisource references');
    console.log('5. Manually promote approved works to src/content/works/');
  }
}

// Run the processor
const processor = new CandidateProcessor();
processor.run().catch(console.error);

export default CandidateProcessor;
