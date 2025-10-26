import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const width = 1200;
const height = 630;

// Create SVG with text
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#fffcf7"/>

  <!-- Decorative border -->
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}"
        fill="none" stroke="#e85d3e" stroke-width="2"/>

  <!-- Main title -->
  <text x="${width / 2}" y="280"
        font-family="Georgia, serif"
        font-size="120"
        font-weight="600"
        fill="#2d2520"
        text-anchor="middle">Dhwani</text>

  <!-- Subtitle -->
  <text x="${width / 2}" y="380"
        font-family="Georgia, serif"
        font-size="32"
        font-weight="300"
        fill="#5a514c"
        text-anchor="middle">A Treasury of Indian Literary Heritage</text>

  <!-- Bottom accent line -->
  <rect x="${width / 2 - 80}" y="450" width="160" height="3" fill="#e85d3e"/>
</svg>
`;

try {
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(join(__dirname, '../public/og-image.jpg'));

  console.log('✅ OG image created successfully at public/og-image.jpg');
} catch (error) {
  console.error('❌ Error creating OG image:', error);
  process.exit(1);
}
