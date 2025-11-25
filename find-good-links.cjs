#!/usr/bin/env node

/**
 * Good Link Finder for Dhwani Works
 * Searches Archive.org API for REAL alternative sources and validates them
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const WORKS_DIR = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/fully-enhanced-works';
const OUTPUT_FILE = '/home/bhuvanesh.r/AA/A main projects/Dhwani files/new-dhwani/good-links-found.json';

// Search Archive.org for real items
async function searchArchive(title, author) {
  return new Promise((resolve) => {
    const query = `${title} ${author}`.substring(0, 200);
    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,creator,language&rows=10&output=json`;
    
    https.get(searchUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.response?.docs || []);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

// Validate URL exists
async function validateUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      method: 'HEAD',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Score relevance of search result
function scoreMatch(searchResult, title, author) {
  let score = 0;
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const resultTitle = (searchResult.title || '').toLowerCase();
  const resultCreator = (searchResult.creator || '').toLowerCase();
  
  // Title word matches
  for (const word of titleWords) {
    if (resultTitle.includes(word)) score += 2;
  }
  
  // Author match
  if (author && resultCreator.includes(author.toLowerCase())) {
    score += 5;
  }
  
  // Language match (prefer English, Sanskrit, regional)
  const lang = searchResult.language || '';
  if (lang.includes('eng') || lang.includes('san')) score += 1;
  
  return score;
}

// Extract metadata from file
function parseFile(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;
  
  const fm = frontmatterMatch[1];
  
  const titleMatch = fm.match(/title:\s*['"]?(.+?)['"]?\n/);
  const authorMatch = fm.match(/author:\s*\n\s*-\s*(.+)/);
  const existingSourcesMatch = fm.matchAll(/url:\s*https:\/\/archive\.org\/details\/([^\s]+)/g);
  
  const existingIds = new Set();
  for (const match of existingSourcesMatch) {
    existingIds.add(match[1]);
  }
  
  return {
    title: titleMatch ? titleMatch[1].replace(/['"]/g, '') : '',
    author: authorMatch ? authorMatch[1] : '',
    existingIds
  };
}

// Process a single work
async function findGoodLinks(filename) {
  const filePath = path.join(WORKS_DIR, filename);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const metadata = parseFile(content);
    
    if (!metadata || !metadata.title) {
      return { file: filename, found: [] };
    }
    
    console.log(`\n📄 ${filename}`);
    console.log(`   Title: ${metadata.title}`);
    console.log(`   Author: ${metadata.author || 'Unknown'}`);
    console.log(`   Searching Archive.org...`);
    
    // Search Archive.org
    const results = await searchArchive(metadata.title, metadata.author);
    
    if (results.length === 0) {
      console.log(`   ❌ No results found`);
      return { file: filename, found: [] };
    }
    
    console.log(`   Found ${results.length} potential matches`);
    
    // Score and filter results
    const scored = results
      .map(r => ({
        ...r,
        score: scoreMatch(r, metadata.title, metadata.author)
      }))
      .filter(r => r.score >= 4) // Require decent match
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5
    
    const goodLinks = [];
    
    for (const result of scored) {
      const identifier = result.identifier;
      
      // Skip if already exists
      if (metadata.existingIds.has(identifier)) {
        console.log(`   ⊘ ${identifier} (already exists)`);
        continue;
      }
      
      const url = `https://archive.org/details/${identifier}`;
      
      // Validate URL
      console.log(`   🔍 Validating ${identifier}...`);
      const isValid = await validateUrl(url);
      
      if (isValid) {
        console.log(`   ✅ ${identifier} (score: ${result.score})`);
        goodLinks.push({
          url,
          identifier,
          title: result.title,
          score: result.score
        });
      } else {
        console.log(`   ❌ ${identifier} (invalid)`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`   📊 Found ${goodLinks.length} new good links`);
    
    return {
      file: filename,
      title: metadata.title,
      author: metadata.author,
      found: goodLinks
    };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { file: filename, error: error.message, found: [] };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 DHWANI GOOD LINK FINDER');
  console.log('='.repeat(70));
  console.log('\nSearching Archive.org for VERIFIED alternative sources...\n');
  
  const files = await fs.readdir(WORKS_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md')); // Process ALL files

  console.log(`📚 Processing ${mdFiles.length} files (comprehensive search)...\n`);
  
  const results = {
    timestamp: new Date().toISOString(),
    totalFiles: mdFiles.length,
    filesProcessed: 0,
    totalLinksFound: 0,
    fileResults: []
  };
  
  for (const filename of mdFiles) {
    const result = await findGoodLinks(filename);
    results.fileResults.push(result);
    results.filesProcessed++;
    results.totalLinksFound += result.found?.length || 0;
    
    // Rate limiting between files
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save results
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 GOOD LINK FINDER SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nFiles processed: ${results.filesProcessed}`);
  console.log(`Total new good links found: ${results.totalLinksFound}`);
  console.log(`Average per file: ${(results.totalLinksFound / results.filesProcessed).toFixed(1)}`);
  
  const filesWithLinks = results.fileResults.filter(f => f.found && f.found.length > 0);
  console.log(`\nFiles with new links: ${filesWithLinks.length}`);
  
  if (filesWithLinks.length > 0) {
    console.log('\n📋 Top results:');
    filesWithLinks.slice(0, 10).forEach(f => {
      console.log(`  ${f.file}: ${f.found.length} new link(s)`);
    });
  }
  
  console.log(`\n📝 Full results: ${OUTPUT_FILE}`);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
