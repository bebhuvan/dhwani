# Next Steps for Dhwani v2.0

## ✅ Completed

1. Project structure created
2. Astro configured with performance optimizations
3. Tailwind setup with purging
4. BaseLayout created (optimized, preserves design)
5. Global styles created (optimized CSS)
6. Import scripts ready (content + fonts)
7. Documentation written

## 🔄 Ready to Execute

### Step 1: Install Dependencies & Optimize (5 min)

```bash
cd /home/bhuvanesh/new-dhwani

# Install all dependencies
npm install

# Optional but recommended: Install fonttools for font optimization
pip install fonttools brotli

# Optimize fonts from old site
npm run optimize-fonts

# Import all content from old site
npm run import-content
```

**Expected output:**
- `public/fonts/` will have 4 WOFF2 files (~120KB total)
- `src/content/works/` will have 258 markdown files
- `src/content/authors/` will have author files
- `src/content/blog/` will have blog posts
- Statistics printed showing files copied and optimized

### Step 2: Create Page Templates (30-60 min)

You need to create these pages in `src/pages/`:

**Required pages:**

1. **`src/pages/index.astro`** - Homepage
   - Hero section
   - Featured works
   - Recent additions
   - Statistics

2. **`src/pages/archive.astro`** - Full works listing
   - Paginated list of all works
   - Filters (language, genre, collection)
   - Search integration

3. **`src/pages/works/[slug].astro`** - Individual work page
   - Work metadata
   - Description
   - Download links
   - Related works

4. **`src/pages/about.astro`** - About page
5. **`src/pages/collections.astro`** - Collections overview
6. **`src/pages/blog.astro`** - Blog listing
7. **`src/pages/blog/[slug].astro`** - Individual blog post
8. **`src/pages/rss.xml.js`** - RSS feed

**I can create these for you** - would you like me to create all page templates now, or do you want to do them manually?

### Step 3: Test Development Build (5 min)

```bash
npm run dev
```

Visit `http://localhost:4321` and verify:
- Pages load
- Theme looks correct
- Dark mode works
- Navigation works
- Content displays properly

### Step 4: Production Build & Validation (10 min)

```bash
npm run build
```

Check:
- Build completes without errors
- Bundle sizes are optimal
- All pages generated

```bash
# Check sizes
du -sh dist/
ls -lh dist/assets/

# Preview production build
npm run preview
```

### Step 5: Set Up Cloudflare Workers (30 min)

Create `/home/bhuvanesh/new-dhwani/workers/related-works/`:

1. Related works API
2. KV caching
3. Wrangler configuration

### Step 6: Set Up CI/CD (20 min)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: dhwani
          directory: dist
```

### Step 7: Performance Audit (15 min)

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit (after deploying or on preview)
lighthouse http://localhost:4321 --view

# Check specific pages
lighthouse http://localhost:4321/archive --view
lighthouse http://localhost:4321/works/some-work --view
```

**Target scores:**
- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

### Step 8: Deploy to Production (10 min)

1. Push to GitHub
2. Connect Cloudflare Pages
3. Deploy
4. Verify production site

## 🎯 Priority Order

**If you want to get running ASAP:**

1. ✅ Install dependencies: `npm install`
2. ✅ Import content: `npm run import-content`
3. ✅ Create homepage: `src/pages/index.astro`
4. ✅ Create archive: `src/pages/archive.astro`
5. ✅ Create work page: `src/pages/works/[slug].astro`
6. ✅ Test: `npm run dev`
7. ✅ Build: `npm run build`
8. ✅ Deploy

**Everything else can be added incrementally.**

## 💡 Recommendations

### Option A: I Create Everything (Fastest)

I can create all page templates, components, workers, and CI/CD config. You just:
1. Run `npm install`
2. Run scripts
3. Deploy

**Time: Ready to deploy in 30 min**

### Option B: Collaborative Approach

I create the complex pages (archive with filters, search, dynamic work pages). You create simple pages (about, collections).

**Time: Ready to deploy in 1-2 hours**

### Option C: You Build Pages

I've given you all the scaffolding. You create pages based on old site design using new optimized architecture.

**Time: Ready to deploy in 2-4 hours**

## 🚨 Critical Reminder

**Before going live:**

1. Update `site` URL in `astro.config.mjs` if not `dhwani.in`
2. Add real OG images
3. Update Google site verification in BaseLayout
4. Test all external links in works
5. Verify RSS feed works
6. Check sitemap generation
7. Test on mobile devices
8. Run accessibility audit

## 🤔 What Would You Like Me to Do Next?

1. **Create all page templates?** (I can do this now)
2. **Just create the complex ones?** (archive, works)
3. **Set up Workers?**
4. **Write validation script?**
5. **Create CI/CD pipeline?**
6. **Run the import scripts now?** (I can execute them)

Let me know and I'll continue building!
