# Dhwani (ಧ್ವನಿ)

> **A directory of India's public domain literary heritage**

🌐 **Live**: [dhwani.ink](https://dhwani.ink)

---

## The Problem

India has one of the world's oldest and richest literary traditions—spanning millennia, multiple languages, and countless genres. Yet there's no centralized equivalent of Project Gutenberg for Indian works. No comprehensive directory. No easy way to discover what's already in the public domain and freely accessible.

Thousands of works sit scattered across Archive.org, Wikisource, and forgotten corners of the internet. Ancient texts, colonial-era translations, philosophical treatises, poetry, history—all public domain, all inaccessible to anyone who doesn't know exactly what they're looking for.

**Dhwani is an attempt to fix that.**

## What is Dhwani?

Dhwani is a curated **directory**—not a digital library, but a map to one. Each entry connects you to where you can read the work (Archive.org, Project Gutenberg, Wikisource, etc.), along with:

- **Rich descriptions** (150+ words, researched and contextualized)
- **Author information** and biographical context
- **Multiple sources** for reading and downloading
- **References** to Wikipedia, scholarly sources, and related materials
- **Metadata**: languages, genres, publication years, tags

It's incomplete. It's imperfect. But it's **here**.

**The name**: *Dhwani* (ಧ್ವನಿ) is the Kannada word for "voice" or "sound"—because these works are voices from history, echoing across time.

## Current Archive

- **301 works** catalogued and described
- **382 authors** represented
- **30 languages** covered (Sanskrit, Hindi, Bengali, Tamil, Persian, English, and more)
- Spanning from **ancient Vedic texts** to **20th-century literature**

### What You'll Find

- **Ancient texts**: Vedas, Upanishads, Mahabharata, Ramayana, Arthashastra
- **Classical literature**: Kalidasa, Bhavabhuti, Bhartrihari
- **Philosophy & religion**: Buddhist sutras, Yoga Sutras, Puranas, commentaries
- **History**: Mughal memoirs (Baburnama), Maratha history, colonial accounts
- **Linguistics**: Panini's Ashtadhyayi, Sanskrit grammars, dictionaries
- **Modern works**: Tagore, Gandhi, Premchand, Bankim Chandra Chattopadhyay
- **Colonial scholarship**: Translations, gazetteers, ethnographies, archaeology

## Why This Matters

Cultural preservation isn't glamorous. It doesn't scale like a startup. There's no business model.

But if we don't preserve our past, the future will be nothing but a mediocre remake of it.

India's literary heritage is our **shared inheritance**—not locked behind paywalls, not restricted by geography. These works belong to everyone. But belonging means nothing if people can't find them.

Dhwani makes them discoverable.

## Tech Stack

Built with modern tools for speed, simplicity, and longevity:

- **Framework**: [Astro](https://astro.build) — Fast, static-first, content-focused
- **Styling**: Tailwind CSS with custom design system
- **Search**: [Pagefind](https://pagefind.app/) — Static search, zero dependencies
- **Deployment**: Cloudflare Workers — Global edge, instant delivery
- **Content**: Markdown with structured YAML frontmatter
- **Build**: Node.js scripts for OG images, related works, validation

No database. No server. Just static HTML, CSS, and JavaScript. Fast, resilient, archivable.

## Local Development

```bash
# Clone the repository
git clone https://github.com/bebhuvan/dhwani.git
cd dhwani

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
│   │   └── works/          # 301 markdown files, one per work
│   ├── pages/
│   │   ├── index.astro     # Homepage
│   │   ├── about.astro     # About page and origin story
│   │   ├── archive/        # Paginated archive with filters
│   │   ├── works/          # Individual work pages
│   │   └── collections/    # Curated thematic collections
│   ├── layouts/            # Page layouts
│   └── components/         # Reusable UI components
├── public/
│   ├── fonts/              # Self-hosted fonts (Lora, Inter)
│   └── mobile-menu.js      # Mobile navigation
├── scripts/                # Build scripts (OG images, related works)
└── worker.js               # Cloudflare Worker with CSP headers
```

## Adding a New Work

1. Create a markdown file in `src/content/works/` (use kebab-case filename)
2. Add frontmatter following this schema:

```yaml
---
title: "A History of Sanskrit Literature"
author: ["Arthur Anthony Macdonell"]
year: 1900
language: ["English"]
genre: ["History", "Literary Criticism"]
description: "A comprehensive survey of Sanskrit literature from the Vedic period through classical drama and poetry, examining linguistic development, literary forms, and cultural context. Macdonell traces the evolution of Sanskrit as both sacred and literary language across two millennia."
collections: ["linguistics", "ancient-wisdom"]
sources:
  - name: "Internet Archive"
    url: "https://archive.org/details/..."
    type: "archive"
  - name: "Project Gutenberg"
    url: "https://www.gutenberg.org/..."
    type: "gutenberg"
references:
  - name: "Wikipedia: Arthur Anthony Macdonell"
    url: "https://en.wikipedia.org/wiki/..."
    type: "wikipedia"
publishDate: 2025-01-15
tags: ["Sanskrit", "literary history", "Vedic literature"]
---

# A History of Sanskrit Literature

[Optional: Extended content, quotes, or analysis]
```

3. Run `npm run build` to validate
4. Submit a PR or open an issue

## Content Guidelines

This isn't a dump of Archive.org links. Every entry is curated.

- **Quality over quantity**: Well-researched descriptions that contextualize the work
- **Public domain only**: Verify copyright status before adding (pre-1928 in most cases)
- **Multiple sources**: Link to Archive.org, Gutenberg, Wikisource when available
- **References**: Wikipedia, scholarly articles, author biographies
- **No boilerplate**: Avoid generic AI-generated summaries—add context, significance, historical detail
- **Accuracy**: Cross-check dates, authorship, editions, translations

## Deployment

The site auto-deploys to Cloudflare Workers via GitHub Actions on every push to `master`.

Manual deployment:
```bash
npm run build
wrangler pages deploy dist --project-name=dhwani
```

## Contributing

This is a personal project, but contributions are welcome:

- **Bug reports**: Found something broken? Open an issue
- **New works**: Suggest additions (must be public domain)
- **Corrections**: Fix errors in descriptions, dates, or metadata
- **Descriptions**: Improve existing entries with better context

**Not accepting**:
- Works still under copyright
- Generic AI-generated content without review
- Automated bulk additions without curation

## Origin Story

Most of my projects have origin stories. Dhwani emerged from a steady accumulation of things that make me happy—chief among them, a growing obsession with forgotten literary treasures.

As I read more, I stumbled upon an astonishing realization: there exists an insanely brilliant, rich collection of Indian literary works languishing in the public domain. These weren't just old books—these were **civilizational treasures**, largely ignored and forgotten.

I discovered Project Gutenberg and was struck by the absurdity of it all. The fact that people would dedicate time, effort, and money to digitizing works and making them freely available seemed almost unreasonable. But as my ignorance shrank, the civilizational value became crystal clear.

**This is our history.** And if we don't preserve our past, the future will be nothing but a shitty remake of it.

So I asked: **Why isn't there a Project Gutenberg for India?**

India is one of the oldest civilizations in the world. The literary treasures we have to offer are limitless. Yet when you look for a comprehensive directory of Indian public domain works, **there isn't one.**

I can't build a full digital library alone. But I can create a **directory**—a map to these works. That's what Dhwani is.

**Read the full story**: [dhwani.ink/about](https://dhwani.ink/about)

## Roadmap

- [ ] Expand to 1,000+ works
- [ ] Add more regional languages (Marathi, Gujarati, Kannada, Malayalam)
- [ ] Curated collections (by theme, period, language)
- [ ] Author pages with biographies
- [ ] Timeline visualization
- [ ] OCR and text extraction for works without digital text
- [ ] Community contributions via structured workflow

## License

- **Code**: MIT License — use it, fork it, improve it
- **Content**: Individual works retain their original public domain status
- **Descriptions & Curation**: CC BY 4.0 — cite if you reuse

## Contact

Built by **Bhuvanesh** ([@bebhuvan](https://twitter.com/bebhuvan))

- Website: [bebhuvan.com](https://bebhuvan.com)
- Newsletter: [bhuvan.substack.com](https://bhuvan.substack.com)
- Other projects: [seneca.ink](https://seneca.ink), [paperlanterns.ink](https://paperlanterns.ink)

---

**This is our shared heritage. Let's not let it fade into silence.**
