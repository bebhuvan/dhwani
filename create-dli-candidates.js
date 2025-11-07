#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const dliWorks = JSON.parse(fs.readFileSync('./dli-candidates.json', 'utf-8'));

function sanitize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80);
}

dliWorks.forEach(work => {
  const filename = sanitize(`${work.title}-${work.creator}`) + '.md';
  const filepath = path.join('./potential-candidates', filename);

  if (fs.existsSync(filepath)) {
    console.log(`⏭  Exists: ${filename}`);
    return;
  }

  const content = `---
title: "${work.title.replace(/"/g, '\\"')}"
author: ["${work.creator.replace(/"/g, '\\"')}"]
year: ${work.year}
language: ["Hindi", "Sanskrit", "English"]
genre: ["Indian Literature"]
description: "${work.title} by ${work.creator}, published in ${work.year}. A significant work in Indian literary tradition."
collections: []
sources:
  - name: "Digital Library of India"
    url: "https://archive.org/details/${work.id}"
    type: "other"
references:
  - name: "Wikipedia search"
    url: "https://en.wikipedia.org/wiki/Special:Search/${encodeURIComponent(work.title)}"
    type: "wikipedia"
featured: false
publishDate: ${new Date().toISOString().split('T')[0]}
tags: ["Indian literature", "Sanskrit", "Public domain"]
_public_domain_status: "true"
_public_domain_reason: "Published in ${work.year} (before 1924)"
_public_domain_confidence: "high"
_collection: "Digital Library of India"
_identifier: "${work.id}"
_needs_review: true
---

# ${work.title}

## Overview

Published in ${work.year}, this work is an important contribution to Indian literature and scholarship.

## Public Domain Status

**Status**: ✓ Public Domain
**Reason**: Published in ${work.year} (before 1924)
**Confidence**: High

## Source

[View on Archive.org](https://archive.org/details/${work.id})

**Collection**: Digital Library of India
**Identifier**: \`${work.id}\`

---

**Note**: Fetched from Digital Library of India. Requires review and enhancement.

**Fetched**: ${new Date().toISOString().split('T')[0]}
`;

  fs.writeFileSync(filepath, content);
  console.log(`✓ Created: ${filename}`);
});

console.log(`\n✅ DLI candidates creation complete!`);
