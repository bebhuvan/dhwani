#!/usr/bin/env node
/**
 * Font Optimization Script
 * Converts TTF to WOFF2 and subsets fonts for better performance
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OLD_FONTS = path.join(__dirname, '../../A main projects/Dhwani/akshara-dhara/public/fonts');
const NEW_FONTS = path.join(__dirname, '../public/fonts');

// Only keep fonts we actually use
const FONTS_TO_KEEP = [
  { file: 'inter-400.ttf', name: 'Inter', weight: 400, style: 'normal' },
  { file: 'inter-500.ttf', name: 'Inter', weight: 500, style: 'normal' },
  { file: 'lora-400.ttf', name: 'Lora', weight: 400, style: 'normal' },
  { file: 'lora-400-italic.ttf', name: 'Lora', weight: 400, style: 'italic' },
];

// Character subset (Latin + basic punctuation)
const UNICODE_RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

/**
 * Check if fonttools/pyftsubset is available
 */
async function checkFonttools() {
  try {
    await execAsync('pyftsubset --help');
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert and subset font
 */
async function optimizeFont(font) {
  const inputPath = path.join(OLD_FONTS, font.file);
  const outputName = font.file.replace('.ttf', '.woff2');
  const outputPath = path.join(NEW_FONTS, outputName);

  try {
    // Check if source exists
    await fs.access(inputPath);

    console.log(`📦 Optimizing ${font.file}...`);

    // Use pyftsubset to convert and subset
    // This creates WOFF2 and removes unused glyphs
    const cmd = `pyftsubset "${inputPath}" \
      --output-file="${outputPath}" \
      --flavor=woff2 \
      --layout-features="*" \
      --unicodes="${UNICODE_RANGE}"`;

    await execAsync(cmd);

    // Check file sizes
    const oldSize = (await fs.stat(inputPath)).size;
    const newSize = (await fs.stat(outputPath)).size;
    const savings = Math.round((1 - newSize / oldSize) * 100);

    console.log(`   ✅ ${font.file} → ${outputName} (${savings}% smaller)`);

    return { font, oldSize, newSize, savings };
  } catch (error) {
    console.error(`   ❌ Error optimizing ${font.file}:`, error.message);
    return null;
  }
}

/**
 * Generate optimized fonts.css
 */
async function generateFontCSS(results) {
  const css = `/* Optimized fonts for Dhwani - Generated automatically */

${FONTS_TO_KEEP.map((font) => {
  const filename = font.file.replace('.ttf', '.woff2');
  return `@font-face {
  font-family: '${font.name}';
  font-style: ${font.style};
  font-weight: ${font.weight};
  font-display: swap;
  src: url('/fonts/${filename}') format('woff2');
  unicode-range: ${UNICODE_RANGE};
}`;
}).join('\n\n')}
`;

  const cssPath = path.join(NEW_FONTS, 'fonts.css');
  await fs.writeFile(cssPath, css);
  console.log('\n✅ Generated fonts.css');
}

/**
 * Fallback: Copy TTF files if fonttools not available
 */
async function fallbackCopy() {
  console.log('⚠️  pyftsubset not found, copying TTF files...');
  console.log('   Install fonttools for better optimization: pip install fonttools brotli');

  for (const font of FONTS_TO_KEEP) {
    const src = path.join(OLD_FONTS, font.file);
    const dest = path.join(NEW_FONTS, font.file);

    try {
      await fs.copyFile(src, dest);
      console.log(`   ✅ Copied ${font.file}`);
    } catch (error) {
      console.error(`   ❌ Error copying ${font.file}:`, error.message);
    }
  }

  // Generate CSS for TTF files
  const css = FONTS_TO_KEEP.map((font) => {
    return `@font-face {
  font-family: '${font.name}';
  font-style: ${font.style};
  font-weight: ${font.weight};
  font-display: swap;
  src: url('/fonts/${font.file}') format('truetype');
}`;
  }).join('\n\n');

  await fs.writeFile(path.join(NEW_FONTS, 'fonts.css'), css);
  console.log('\n✅ Generated fonts.css (TTF version)');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting font optimization...\n');

  // Create fonts directory
  await fs.mkdir(NEW_FONTS, { recursive: true });

  // Check for fonttools
  const hasFonttools = await checkFonttools();

  if (hasFonttools) {
    // Optimize fonts
    const results = [];
    for (const font of FONTS_TO_KEEP) {
      const result = await optimizeFont(font);
      if (result) results.push(result);
    }

    // Generate CSS
    await generateFontCSS(results);

    // Print statistics
    console.log('\n📊 Optimization Statistics:');
    const totalOld = results.reduce((sum, r) => sum + r.oldSize, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newSize, 0);
    const totalSavings = Math.round((1 - totalNew / totalOld) * 100);

    console.log(`   Total before: ${Math.round(totalOld / 1024)}KB`);
    console.log(`   Total after: ${Math.round(totalNew / 1024)}KB`);
    console.log(`   Savings: ${totalSavings}%`);
  } else {
    await fallbackCopy();
  }

  console.log('\n✨ Font optimization complete!');
}

main().catch(console.error);
