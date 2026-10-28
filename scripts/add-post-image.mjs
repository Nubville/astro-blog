// Usage: node scripts/add-post-image.mjs <postNumber> <sourceImage> [name]
// Resizes (max 1400px wide) + converts to WebP into public/images/compressed/post<N>/
// and prints the url/width/height to paste into frontmatter or an <img> tag.
import { mkdir } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const [postNumber, source, nameArg] = process.argv.slice(2);
if (!postNumber || !source) {
  console.error('Usage: node scripts/add-post-image.mjs <postNumber> <sourceImage> [name]');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const name = (nameArg ?? basename(source, extname(source)))
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const outDir = join(root, 'public/images/compressed', `post${Number(postNumber)}`);
await mkdir(outDir, { recursive: true });

const out = join(outDir, `${name}.webp`);
const info = await sharp(source)
  .rotate()
  .resize({ width: 1400, withoutEnlargement: true })
  .webp({ quality: 80 })
  .toFile(out);

console.log(
  `url: /images/compressed/post${Number(postNumber)}/${name}.webp\nwidth: ${info.width}\nheight: ${info.height}`
);
