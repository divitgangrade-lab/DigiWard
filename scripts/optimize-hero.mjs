// Produces the responsive hero derivatives used by HeroVeil.
//
//   node scripts/optimize-hero.mjs
//
// The source is app/public/media/hero-fold.png; the outputs sit beside it so
// GitHub Pages serves them as first-party files. The 700px WebP is also the
// texture passed to the DitherVeil canvas.

import { statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const media = join(root, 'app', 'public', 'media');
const source = join(media, 'hero-fold.png');
const widths = [360, 540, 700];

const kb = (path) => `${Math.round(statSync(path).size / 1024)} KB`;

for (const width of widths) {
  const base = sharp(source).resize({ width, withoutEnlargement: true });
  const webp = join(media, `hero-fold-${width}.webp`);
  const avif = join(media, `hero-fold-${width}.avif`);
  await base.clone().webp({ quality: 80, effort: 6 }).toFile(webp);
  await base.clone().avif({ quality: 55, effort: 6 }).toFile(avif);
  console.log(`hero-fold-${width}: webp ${kb(webp)}, avif ${kb(avif)}`);
}

console.log('Hero derivatives written to app/public/media/.');
