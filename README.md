# Dhwani (ಧ್ವನಿ)

> **A directory of India's public domain literary heritage**

Dhwani is a curated archive connecting readers to thousands of public domain works from Indian literature—from ancient Vedic hymns to modern poetry, spanning multiple languages, genres, and centuries.

🌐 **Live Site**: [dhwani.ink](https://dhwani.ink)

## What is Dhwani?

India has one of the world's oldest and richest literary traditions, yet there's no centralized equivalent of Project Gutenberg for Indian works. Dhwani attempts to fix that.

It's not a replacement for a proper digital library—it's a **directory**. Each entry links to where you can read the work (Archive.org, Project Gutenberg, Wikisource, etc.), along with descriptions, author information, and references.

**The name**: *Dhwani* (ಧ್ವನಿ) is the Kannada word for "voice" or "sound"—because these works are voices from history, echoing across time.

## Current Stats

- **301 works** catalogued
- **382 authors** represented
- **30 languages** covered
- From ancient texts (Vedas, Upanishads) to modern literature (Tagore, Gandhi)

## Tech Stack

- **Framework**: [Astro](https://astro.build) (static site generation)
- **Styling**: Tailwind CSS with custom design system
- **Search**: Pagefind (static search index)
- **Deployment**: Cloudflare Workers
- **Content**: Markdown with YAML frontmatter

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:4321

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
dhwani/
├── src/
│   ├── content/
│   │   └── works/          # All literary works (301 markdown files)
│   ├── pages/
│   │   ├── index.astro     # Homepage
│   │   ├── about.astro     # About page
│   │   ├── archive/        # Paginated archive
│   │   ├── works/          # Individual work pages
│   │   └── collections/    # Curated collections
│   ├── layouts/            # Page layouts
│   └── components/         # Reusable UI components
├── public/
│   ├── fonts/              # Custom fonts (Lora, Inter)
│   └── mobile-menu.js      # Mobile navigation
├── scripts/                # Build scripts
└── worker.js               # Cloudflare Worker config
```

## Adding a New Work

1. Create a new markdown file in `src/content/works/`
2. Use the frontmatter schema:

```yaml
---
title: "Work Title"
author: ["Author Name"]
year: 1925
language: ["English", "Sanskrit"]
genre: ["Poetry", "Philosophy"]
description: "A detailed description (150+ words recommended)"
collections: ["ancient-wisdom"]
sources:
  - name: "Internet Archive"
    url: "https://archive.org/details/..."
    type: "archive"
references:
  - name: "Wikipedia: Author Name"
    url: "https://en.wikipedia.org/..."
    type: "wikipedia"
publishDate: 2025-01-15
tags: ["tag1", "tag2"]
---

# Work Title

[Optional markdown content for the work page]
```

3. Build and deploy

## Content Guidelines

- **Quality over quantity**: Each work should have a well-researched description
- **Public domain only**: Verify copyright status before adding
- **Multiple sources**: Link to multiple reading sources when available
- **References**: Include Wikipedia, scholarly sources, or biographical info
- **No boilerplate**: Avoid generic AI-generated descriptions
- **Verify accuracy**: Cross-check dates, authorship, and historical facts

## Deployment

The site deploys automatically via GitHub Actions to Cloudflare Workers when pushing to the `master` branch.

Manual deployment:
```bash
npm run build
wrangler deploy
```

## Contributing

This is a personal project, but I welcome:
- Bug reports and fixes
- Suggestions for new works to add
- Corrections to existing entries
- Improvements to descriptions

Please open an issue or submit a PR.

## Origin Story

Most of my projects have origin stories, and Dhwani emerged from a growing obsession with forgotten literary treasures. I discovered an astonishingly rich collection of Indian literary works in the public domain—largely ignored and scattered across the internet.

There's no Project Gutenberg for India, despite millennia of literary tradition. That seemed wrong.

I can't build a full digital library alone, but I can create a **directory**—a map to these works. That's what Dhwani is.

Read the full story: [dhwani.ink/about](https://dhwani.ink/about)

## License

- **Code**: MIT License
- **Content**: Individual works retain their original copyright status (all public domain)
- **Descriptions & Curation**: CC BY 4.0

## Contact

Built by [@bebhuvan](https://twitter.com/bebhuvan)

- Website: [bebhuvan.com](https://bebhuvan.com)
- Newsletter: [bhuvan.substack.com](https://bhuvan.substack.com)

---

*This is our shared heritage. Let's not let it fade into silence.*
