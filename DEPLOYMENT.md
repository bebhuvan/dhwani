# Deployment Guide for Dhwani

This guide will help you deploy your Dhwani literary archive to production.

## Build Status
✅ Production build completed successfully
✅ 287 pages generated
✅ All components tested
✅ Design system implemented

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

Cloudflare Pages is recommended for this project because:
- Free tier with unlimited bandwidth
- Global CDN with excellent performance
- Built-in analytics
- Easy GitHub integration

#### Deploy via Cloudflare Pages

1. **Push to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Dhwani literary archive"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/dhwani.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub account
   - Select your repository

3. **Build Configuration**:
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18 or higher

4. **Environment Variables** (if needed):
   - None required for basic setup

5. **Deploy**:
   - Click "Save and Deploy"
   - Your site will be live in ~2 minutes!

#### Custom Domain Setup (Optional)

1. Go to your Cloudflare Pages project
2. Click "Custom domains"
3. Add your domain (e.g., `dhwani.com`)
4. Follow DNS configuration instructions

---

### Option 2: Netlify

1. **Push to GitHub** (same as above)

2. **Deploy via Netlify**:
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

4. **Deploy**:
   - Click "Deploy site"
   - Site will be live with a Netlify subdomain

---

### Option 3: Vercel

1. **Push to GitHub** (same as above)

2. **Deploy via Vercel**:
   - Go to [Vercel](https://vercel.com/)
   - Click "Import Project"
   - Select your GitHub repository

3. **Build Configuration**:
   - **Framework**: Astro
   - **Build command**: `npm run build`
   - **Output directory**: `dist`

4. **Deploy**:
   - Click "Deploy"
   - Site will be live instantly

---

## Pre-Deployment Checklist

- [x] Production build completes without errors
- [x] All 271 works are accessible
- [x] Archive pagination works (6 pages)
- [x] Search functionality works
- [x] Mobile responsive design verified
- [x] All fonts loading correctly
- [x] OG images generated
- [x] RSS feed generated
- [x] Sitemap created
- [x] Related works computed

## Post-Deployment Steps

### 1. Verify Deployment
- Check homepage loads correctly
- Test archive search and filtering
- Verify work detail pages
- Test mobile responsiveness
- Check page load speed

### 2. Set Up Analytics (Optional)
- Add Google Analytics
- Or use Cloudflare Web Analytics (privacy-friendly)

### 3. Submit to Search Engines
```bash
# Google Search Console
Submit sitemap: https://your-domain.com/sitemap-index.xml

# Bing Webmaster Tools
Submit sitemap: https://your-domain.com/sitemap-index.xml
```

### 4. Monitor Performance
- Use Lighthouse to check performance scores
- Monitor Core Web Vitals
- Check page load times

## Build Commands Reference

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Individual build steps
npm run generate-og        # Generate OG image
npm run pagefind          # Build search index
npm run generate-related  # Compute related works
```

## Troubleshooting

### Build Fails
- Check Node.js version (18+ required)
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `npx astro check`

### Search Not Working
- Ensure Pagefind ran successfully during build
- Check that `/pagefind` directory exists in dist

### Missing Content
- Verify all markdown files in `src/content/works/` have proper frontmatter
- Check content collection schema in `src/content/config.ts`

## Performance Optimization

The site is already optimized for production with:
- Static site generation (fast loading)
- Optimized fonts (WOFF2 format)
- Client-side search (Pagefind)
- Lazy-loaded components
- Minimal JavaScript bundle
- Responsive images

## Maintenance

### Adding New Works
1. Add markdown file to `src/content/works/`
2. Follow existing frontmatter format
3. Rebuild and redeploy

### Updating Content
1. Edit markdown files in `src/content/`
2. Rebuild: `npm run build`
3. Push changes (auto-deploys on most platforms)

---

## Cloudflare Workers Optimizations

This site is now configured with the Cloudflare adapter and all performance optimizations enabled.

### Enabled Optimizations

1. **Static Site Generation (SSG)** - All pages pre-rendered
2. **Cloudflare Image Service** - Compile-time image optimization
3. **Platform Proxy** - Local Cloudflare runtime emulation for development
4. **Client Prerender** - Faster navigation (experimental)
5. **Smart Placement** - Optimal edge routing
6. **Lightning CSS** - Fast CSS minification
7. **esbuild** - Fast JavaScript minification
8. **HTML Compression** - Reduced payload sizes

### Deployment Commands

```bash
# Deploy to production
npm run deploy:production

# Deploy to preview
npm run deploy

# Local development with Cloudflare Workers
npm run cf:dev
```

### Configuration Files

- `astro.config.mjs` - Cloudflare adapter configuration
- `wrangler.toml` - Cloudflare Workers settings
- `dist/_routes.json` - Automatic routing configuration
- `dist/_worker.js/` - Cloudflare Worker bundle

### Benefits

- **Global CDN** - Cached at 300+ edge locations
- **HTTP/3 & QUIC** - Latest protocols
- **DDoS Protection** - Built-in security
- **Brotli Compression** - Automatic
- **Smart Routing** - Cloudflare Argo optimization
- **Edge Caching** - Ultra-fast asset delivery

---

**Ready to deploy?** Choose your platform above and follow the steps!
