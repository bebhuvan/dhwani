#!/usr/bin/env node

/**
 * Dhwani Candidate Enhancement Tool
 *
 * This tool enhances candidate works with:
 * 1. Robust public domain verification
 * 2. Wikipedia/Wikisource link discovery
 * 3. Alternative Archive.org sources
 * 4. Description quality improvements
 */

import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import yaml from 'yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  batchesPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/candidate-batches',
  logPath: '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/enhancement-logs',
  timeout: 10000,
};

class CandidateEnhancer {
  constructor(batchNumber) {
    this.batchNumber = batchNumber;
    this.batchPath = path.join(CONFIG.batchesPath, `batch-${batchNumber}`);
    this.stats = {
      processed: 0,
      enhanced: 0,
      errors: 0,
      wikipediaFound: 0,
      wikisourceFound: 0,
      alternativeSourcesFound: 0,
    };
  }

  async init() {
    await fs.mkdir(CONFIG.logPath, { recursive: true });
  }

  // Fetch URL with timeout
  async fetchUrl(url, timeout = CONFIG.timeout) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      protocol.get(url, (res) => {
        clearTimeout(timeoutId);
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }).on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
  }

  // Search Archive.org for alternative sources
  async findAlternativeSources(title, author) {
    const queries = [
      // Query variations for better results
      `${title} ${author}`,
      title,
      `${author} ${title.split(/[:\-]/)[0]}`, // First part before colon/dash
    ];

    const foundSources = [];

    for (const query of queries) {
      try {
        const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator&rows=10&output=json`;

        console.log(`  Searching Archive.org: "${query}"`);
        const response = await this.fetchUrl(searchUrl);

        if (response.statusCode === 200) {
          const data = JSON.parse(response.body);

          if (data.response && data.response.docs) {
            for (const doc of data.response.docs) {
              // Check if this is a relevant match
              const docTitle = doc.title?.toLowerCase() || '';
              const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
              const matchScore = titleWords.filter(word => docTitle.includes(word)).length;

              if (matchScore >= Math.min(3, titleWords.length / 2)) {
                foundSources.push({
                  name: `Internet Archive: ${doc.title}`,
                  url: `https://archive.org/details/${doc.identifier}`,
                  type: 'archive',
                  score: matchScore,
                });
              }
            }
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`  Archive.org search error: ${error.message}`);
      }

      // If we found good matches, stop searching
      if (foundSources.length >= 3) break;
    }

    // Sort by score and deduplicate
    const uniqueSources = [];
    const seenUrls = new Set();

    for (const source of foundSources.sort((a, b) => b.score - a.score)) {
      if (!seenUrls.has(source.url)) {
        seenUrls.add(source.url);
        uniqueSources.push({
          name: source.name,
          url: source.url,
          type: source.type,
        });
      }
    }

    return uniqueSources.slice(0, 5); // Return top 5
  }

  // Search for Wikipedia article
  async findWikipediaLink(title, author) {
    const queries = [
      title,
      `${title} ${author}`,
      title.replace(/\([^)]*\)/g, '').trim(), // Remove parentheses
    ];

    for (const query of queries) {
      try {
        // Use Wikipedia's OpenSearch API
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json`;

        console.log(`  Searching Wikipedia: "${query}"`);
        const response = await this.fetchUrl(searchUrl);

        if (response.statusCode === 200) {
          const data = JSON.parse(response.body);

          // data is [query, [titles], [descriptions], [urls]]
          if (data[3] && data[3].length > 0) {
            // Return first result (usually most relevant)
            return {
              name: `Wikipedia: ${data[1][0]}`,
              url: data[3][0],
              type: 'wikipedia',
            };
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`  Wikipedia search error: ${error.message}`);
      }
    }

    return null;
  }

  // Search for Wikisource page
  async findWikisourceLink(title, author) {
    const queries = [
      title,
      author,
    ];

    for (const query of queries) {
      try {
        // Use Wikisource's OpenSearch API
        const searchUrl = `https://en.wikisource.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json`;

        console.log(`  Searching Wikisource: "${query}"`);
        const response = await this.fetchUrl(searchUrl);

        if (response.statusCode === 200) {
          const data = JSON.parse(response.body);

          if (data[3] && data[3].length > 0) {
            // Check if result is actually relevant
            const resultTitle = data[1][0]?.toLowerCase() || '';
            const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
            const matches = titleWords.filter(word => resultTitle.includes(word));

            if (matches.length >= 2) {
              return {
                name: `Wikisource: ${data[1][0]}`,
                url: data[3][0],
                type: 'wikisource',
              };
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`  Wikisource search error: ${error.message}`);
      }
    }

    return null;
  }

  // Enhanced public domain verification
  verifyPublicDomainRobust(work) {
    const year = work.frontmatter.year;
    const currentYear = new Date().getFullYear();
    const title = work.frontmatter.title || '';
    const description = work.content || '';

    // Check for red flags in title/description
    const copyrightIndicators = [
      /copyright.*\d{4}/i,
      /©.*\d{4}/i,
      /all rights reserved/i,
    ];

    for (const indicator of copyrightIndicators) {
      if (indicator.test(title) || indicator.test(description)) {
        const match = (title + description).match(/\d{4}/g);
        if (match) {
          const latestYear = Math.max(...match.map(y => parseInt(y)));
          if (latestYear > 1960) {
            return {
              status: 'UNCERTAIN',
              reason: `Copyright notice found with year ${latestYear}`,
              needsReview: true,
              confidence: 'low',
            };
          }
        }
      }
    }

    // Definitive public domain (pre-1924)
    if (!year || year < 1924) {
      return {
        status: 'PUBLIC_DOMAIN',
        reason: 'Published before 1924 (definitely in public domain in US)',
        needsReview: false,
        confidence: 'high',
      };
    }

    // Likely public domain (1924-1928)
    if (year >= 1924 && year < 1929) {
      return {
        status: 'LIKELY_PUBLIC_DOMAIN',
        reason: 'Published 1924-1928 (likely in public domain)',
        needsReview: true,
        confidence: 'medium',
      };
    }

    // Need to check author death date (1929-1963)
    if (year >= 1929 && year < 1964) {
      return {
        status: 'NEEDS_VERIFICATION',
        reason: `Published in ${year}. Verify: (1) author death date, (2) if author died before 1954, work likely in PD in India (life+60), (3) check if published with proper copyright notice`,
        needsReview: true,
        confidence: 'medium',
      };
    }

    // Very likely still under copyright
    if (year >= 1964) {
      return {
        status: 'LIKELY_COPYRIGHTED',
        reason: `Published in ${year}, likely still under copyright unless author died before ${currentYear - 60}`,
        needsReview: true,
        confidence: 'high',
      };
    }

    return {
      status: 'UNCERTAIN',
      reason: 'Unable to determine public domain status',
      needsReview: true,
      confidence: 'low',
    };
  }

  // Parse frontmatter
  parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      throw new Error('No frontmatter found');
    }

    const frontmatter = yaml.parse(match[1]);
    return {
      frontmatter,
      content: content.substring(match[0].length).trim(),
    };
  }

  // Generate enhanced markdown
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

  // Process a single work
  async processWork(filename) {
    const workPath = path.join(this.batchPath, 'works', filename);

    try {
      console.log(`\nProcessing: ${filename}`);

      const content = await fs.readFile(workPath, 'utf-8');
      const parsed = this.parseFrontmatter(content);
      const work = {
        filename,
        frontmatter: parsed.frontmatter,
        content: parsed.content,
      };

      let enhanced = false;

      // 1. Enhanced PD verification
      const pdCheck = this.verifyPublicDomainRobust(work);
      console.log(`  PD Status: ${pdCheck.status} (confidence: ${pdCheck.confidence})`);

      // 2. Find alternative Archive.org sources
      const currentSources = work.frontmatter.sources || [];
      const currentSourceUrls = new Set(currentSources.map(s => s.url));

      console.log(`  Finding alternative sources...`);
      const alternativeSources = await this.findAlternativeSources(
        work.frontmatter.title,
        work.frontmatter.author[0]
      );

      const newSources = alternativeSources.filter(s => !currentSourceUrls.has(s.url));
      if (newSources.length > 0) {
        console.log(`  Found ${newSources.length} new alternative sources`);
        work.frontmatter.sources = [...currentSources, ...newSources];
        this.stats.alternativeSourcesFound += newSources.length;
        enhanced = true;
      }

      // 3. Find Wikipedia link
      const currentRefs = work.frontmatter.references || [];
      const hasWikipedia = currentRefs.some(r => r.type === 'wikipedia');

      if (!hasWikipedia) {
        console.log(`  Finding Wikipedia link...`);
        const wikiLink = await this.findWikipediaLink(
          work.frontmatter.title,
          work.frontmatter.author[0]
        );

        if (wikiLink) {
          console.log(`  Found Wikipedia: ${wikiLink.url}`);
          work.frontmatter.references = [wikiLink, ...currentRefs];
          this.stats.wikipediaFound++;
          enhanced = true;
        }
      }

      // 4. Find Wikisource link
      const hasWikisource = currentRefs.some(r => r.type === 'wikisource');

      if (!hasWikisource) {
        console.log(`  Finding Wikisource link...`);
        const wikisourceLink = await this.findWikisourceLink(
          work.frontmatter.title,
          work.frontmatter.author[0]
        );

        if (wikisourceLink) {
          console.log(`  Found Wikisource: ${wikisourceLink.url}`);
          // Insert after Wikipedia if exists
          const wikiIndex = work.frontmatter.references.findIndex(r => r.type === 'wikipedia');
          if (wikiIndex >= 0) {
            work.frontmatter.references.splice(wikiIndex + 1, 0, wikisourceLink);
          } else {
            work.frontmatter.references.unshift(wikisourceLink);
          }
          this.stats.wikisourceFound++;
          enhanced = true;
        }
      }

      // Save enhanced work if changes were made
      if (enhanced) {
        const enhancedContent = this.generateMarkdown(work);
        await fs.writeFile(workPath, enhancedContent, 'utf-8');
        console.log(`  ✓ Enhanced and saved`);
        this.stats.enhanced++;
      } else {
        console.log(`  No enhancements needed`);
      }

      // Save enhancement report
      const report = {
        filename,
        publicDomain: pdCheck,
        sourcesAdded: newSources.length,
        wikipediaFound: !!(!hasWikipedia && await this.findWikipediaLink),
        wikisourceFound: !!(!hasWikisource && await this.findWikisourceLink),
      };

      const reportPath = path.join(this.batchPath, 'reports', `${filename}.enhancement.json`);
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

      this.stats.processed++;

    } catch (error) {
      console.error(`  Error: ${error.message}`);
      this.stats.errors++;
    }
  }

  // Process entire batch
  async processBatch() {
    console.log('='.repeat(60));
    console.log(`Enhancing Batch ${this.batchNumber}`);
    console.log('='.repeat(60));

    const worksPath = path.join(this.batchPath, 'works');
    const files = await fs.readdir(worksPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    console.log(`\nFound ${mdFiles.length} works to enhance\n`);

    for (const filename of mdFiles) {
      await this.processWork(filename);
    }

    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('Enhancement Complete!');
    console.log('='.repeat(60));
    console.log(`\nProcessed: ${this.stats.processed}`);
    console.log(`Enhanced: ${this.stats.enhanced}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Wikipedia links found: ${this.stats.wikipediaFound}`);
    console.log(`Wikisource links found: ${this.stats.wikisourceFound}`);
    console.log(`Alternative sources found: ${this.stats.alternativeSourcesFound}`);

    // Save summary
    const summaryPath = path.join(CONFIG.logPath, `batch-${this.batchNumber}-enhancement.json`);
    await fs.writeFile(summaryPath, JSON.stringify(this.stats, null, 2), 'utf-8');
  }

  async run() {
    await this.init();
    await this.processBatch();
  }
}

// CLI
const batchNumber = process.argv[2] || '1';

console.log(`Starting enhancement for batch ${batchNumber}...\n`);

const enhancer = new CandidateEnhancer(batchNumber);
enhancer.run().catch(console.error);

export default CandidateEnhancer;
