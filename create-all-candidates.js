#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const candidates = JSON.parse(fs.readFileSync('./batch-processing-summary.json', 'utf-8')).candidates;

function sanitizeFilename(title, author) {
  return `${title} ${author}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function createCandidate(work) {
  const {id, title, creator, year, subjects, language, collection} = work;

  const filename = sanitizeFilename(title, creator) + '.md';
  const filepath = path.join('./potential-candidates', filename);

  if (fs.existsSync(filepath)) return null;

  const langs = Array.isArray(language) ? language : [language];
  const subjs = Array.isArray(subjects) ? subjects : [subjects];

  const content = `---
title: "${title.replace(/"/g, '\\"')}"
author: ["${creator.replace(/"/g, '\\"')}"]
year: ${year}
language: ${JSON.stringify(langs)}
genre: ${JSON.stringify(subjs)}
description: "${title} by ${creator}, published in ${year}. ${subjs.join(', ')}."
collections: []
sources:
  - name: "Internet Archive"
    url: "https://archive.org/details/${id}"
    type: "other"
references:
  - name: "Wikipedia search"
    url: "https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(title)}"
    type: "wikipedia"
featured: false
publishDate: ${new Date().toISOString().split('T')[0]}
tags: ${JSON.stringify(subjs)}
_public_domain_status: "true"
_public_domain_reason: "Published in ${year} (before 1924)"
_public_domain_confidence: "high"
_collection: "${collection}"
_identifier: "${id}"
_needs_review: true
_fetched_date: "${new Date().toISOString().split('T')[0]}"
---

# ${title}

## Overview

Published in ${year}, this work ${subjs.length > 0 ? `covers ${subjs.join(', ')}` : 'is an important contribution to Indian studies'}.

## Public Domain Status

**Status**: ✓ Public Domain
**Reason**: Published in ${year} (before 1924)
**Confidence**: High

## Source

[View on Archive.org](https://archive.org/details/${id})

**Collection**: ${collection}
**Identifier**: \`${id}\`

---

**Note**: This candidate was automatically fetched and requires review before adding to the main collection.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  return filename;
}

// Create all candidates
let created = 0;
candidates.forEach(work => {
  const filename = createCandidate(work);
  if (filename) {
    created++;
    console.log(`✓ Created: ${filename}`);
  }
});

console.log(`\n✅ Successfully created ${created} candidate files!`);
