#!/usr/bin/env node

/**
 * Multi-API Aggregator
 * Fetches and aggregates metadata from multiple sources:
 * - Wikipedia
 * - Wikidata
 * - OpenLibrary
 * - Archive.org
 */

import https from 'https';
import http from 'http';

/**
 * Generic HTTPS GET request
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Failed to parse JSON', raw: data });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Search Wikipedia
 */
async function searchWikipedia(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&utf8=1`;

  try {
    const data = await httpsGet(url);

    if (data.query && data.query.search && data.query.search.length > 0) {
      const results = data.query.search.map(r => ({
        title: r.title,
        snippet: r.snippet.replace(/<[^>]*>/g, ''),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`
      }));

      return { found: true, results };
    }

    return { found: false, results: [] };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

/**
 * Get Wikipedia page summary
 */
async function getWikipediaSummary(title) {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

  try {
    const data = await httpsGet(url);

    if (data.extract) {
      return {
        found: true,
        title: data.title,
        extract: data.extract,
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
        thumbnail: data.thumbnail?.source
      };
    }

    return { found: false };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

/**
 * Search Wikidata
 */
async function searchWikidata(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodedQuery}&language=en&format=json`;

  try {
    const data = await httpsGet(url);

    if (data.search && data.search.length > 0) {
      const results = data.search.map(r => ({
        id: r.id,
        label: r.label,
        description: r.description || '',
        url: `https://www.wikidata.org/wiki/${r.id}`
      }));

      return { found: true, results };
    }

    return { found: false, results: [] };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

/**
 * Search OpenLibrary for work
 */
async function searchOpenLibrary(title, author = '') {
  const query = author ? `${title} ${author}` : title;
  const encodedQuery = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=5`;

  try {
    const data = await httpsGet(url);

    if (data.docs && data.docs.length > 0) {
      const results = data.docs.map(doc => ({
        title: doc.title,
        author: doc.author_name || [],
        year: doc.first_publish_year,
        key: doc.key,
        url: `https://openlibrary.org${doc.key}`,
        authorKeys: (doc.author_key || []).map(k => `https://openlibrary.org/authors/${k}`)
      }));

      return { found: true, results };
    }

    return { found: false, results: [] };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

/**
 * Check if work exists in Wikisource
 */
async function checkWikisource(title) {
  const encodedTitle = encodeURIComponent(title);
  const url = `https://en.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodedTitle}&format=json`;

  try {
    const data = await httpsGet(url);

    if (data.query && data.query.search && data.query.search.length > 0) {
      const results = data.query.search.map(r => ({
        title: r.title,
        url: `https://en.wikisource.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}`
      }));

      return { found: true, results };
    }

    return { found: false, results: [] };
  } catch (error) {
    return { found: false, error: error.message };
  }
}

/**
 * Aggregate all metadata for a work
 */
async function aggregateMetadata(title, author = '', year = null) {
  console.log(`\nAggregating metadata for: ${title}`);

  const results = {
    title,
    author,
    year,
    sources: {}
  };

  // Wikipedia - search for work
  console.log('  Searching Wikipedia for work...');
  const wikiWork = await searchWikipedia(title);
  if (wikiWork.found && wikiWork.results.length > 0) {
    const summary = await getWikipediaSummary(wikiWork.results[0].title);
    results.sources.wikipediaWork = summary;
  } else {
    results.sources.wikipediaWork = { found: false };
  }

  // Wikipedia - search for author
  if (author) {
    console.log('  Searching Wikipedia for author...');
    const wikiAuthor = await searchWikipedia(author);
    if (wikiAuthor.found && wikiAuthor.results.length > 0) {
      const summary = await getWikipediaSummary(wikiAuthor.results[0].title);
      results.sources.wikipediaAuthor = summary;
    } else {
      results.sources.wikipediaAuthor = { found: false };
    }
  }

  // Wikidata - work
  console.log('  Searching Wikidata for work...');
  results.sources.wikidataWork = await searchWikidata(title);

  // Wikidata - author
  if (author) {
    console.log('  Searching Wikidata for author...');
    results.sources.wikidataAuthor = await searchWikidata(author);
  }

  // OpenLibrary
  console.log('  Searching OpenLibrary...');
  results.sources.openLibrary = await searchOpenLibrary(title, author);

  // Wikisource
  console.log('  Checking Wikisource...');
  results.sources.wikisource = await checkWikisource(title);

  return results;
}

/**
 * Build reference array from aggregated metadata
 */
function buildReferences(metadata) {
  const references = [];

  // Wikipedia - Work
  if (metadata.sources.wikipediaWork?.found) {
    references.push({
      name: `Wikipedia: ${metadata.sources.wikipediaWork.title}`,
      url: metadata.sources.wikipediaWork.url,
      type: 'wikipedia'
    });
  }

  // Wikipedia - Author
  if (metadata.sources.wikipediaAuthor?.found) {
    references.push({
      name: `Wikipedia: ${metadata.sources.wikipediaAuthor.title}`,
      url: metadata.sources.wikipediaAuthor.url,
      type: 'wikipedia'
    });
  }

  // Wikidata - Work
  if (metadata.sources.wikidataWork?.found && metadata.sources.wikidataWork.results.length > 0) {
    references.push({
      name: `Wikidata: ${metadata.sources.wikidataWork.results[0].label}`,
      url: metadata.sources.wikidataWork.results[0].url,
      type: 'other'
    });
  }

  // Wikidata - Author
  if (metadata.sources.wikidataAuthor?.found && metadata.sources.wikidataAuthor.results.length > 0) {
    references.push({
      name: `Wikidata: ${metadata.sources.wikidataAuthor.results[0].label}`,
      url: metadata.sources.wikidataAuthor.results[0].url,
      type: 'other'
    });
  }

  // OpenLibrary
  if (metadata.sources.openLibrary?.found && metadata.sources.openLibrary.results.length > 0) {
    const work = metadata.sources.openLibrary.results[0];
    references.push({
      name: `OpenLibrary: ${work.title}`,
      url: work.url,
      type: 'other'
    });

    if (work.authorKeys && work.authorKeys.length > 0) {
      references.push({
        name: `OpenLibrary: ${work.author[0] || 'Author'}`,
        url: work.authorKeys[0],
        type: 'other'
      });
    }
  }

  // Wikisource
  if (metadata.sources.wikisource?.found && metadata.sources.wikisource.results.length > 0) {
    references.push({
      name: `Wikisource: ${metadata.sources.wikisource.results[0].title}`,
      url: metadata.sources.wikisource.results[0].url,
      type: 'other'
    });
  }

  return references;
}

// Main execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const title = process.argv[2] || 'Bhagavad Gita';
  const author = process.argv[3] || '';

  aggregateMetadata(title, author)
    .then(metadata => {
      console.log('\n=== AGGREGATED METADATA ===');
      console.log(JSON.stringify(metadata, null, 2));

      const references = buildReferences(metadata);
      console.log('\n=== GENERATED REFERENCES ===');
      console.log(JSON.stringify(references, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { aggregateMetadata, buildReferences, searchWikipedia, searchWikidata, searchOpenLibrary };
