// Generates the hero fold study used behind the DitherVeil component.
// The image is rendered locally so the site ships a first-party photograph-like
// asset: no third-party CDN request, no licence to track, no visitor IP leak.
//
//   node scripts/make-hero.mjs
//
// Output: app/public/media/hero-fold.png (700 x 855, RGB, no metadata).

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WIDTH = 700;
const HEIGHT = 855;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'public', 'media', 'hero-fold.png');

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = (buffer) => {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const name = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([length, name, data, crc]);
};

const encodePng = (width, height, rgb) => {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolour
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (edge0, edge1, v) => {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

const hash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
};

const valueNoise = (x, y) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return mix(mix(a, b, ux), mix(c, d, ux), uy);
};

const fbm = (x, y) => {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let octave = 0; octave < 4; octave += 1) {
    total += valueNoise(x * frequency, y * frequency) * amplitude;
    frequency *= 2.07;
    amplitude *= 0.5;
  }
  return total;
};

const PALETTE = {
  light: [244, 241, 234],
  mid: [203, 191, 171],
  shade: [120, 101, 82],
  deep: [43, 34, 29],
  edge: [104, 48, 38],
};

const shade = (value, t) => {
  if (value < 0.42) {
    const k = smoothstep(0, 0.42, value);
    return [mix(t.deep[0], t.shade[0], k), mix(t.deep[1], t.shade[1], k), mix(t.deep[2], t.shade[2], k)];
  }
  if (value < 0.74) {
    const k = smoothstep(0.42, 0.74, value);
    return [mix(t.shade[0], t.mid[0], k), mix(t.shade[1], t.mid[1], k), mix(t.shade[2], t.mid[2], k)];
  }
  const k = smoothstep(0.74, 1, value);
  return [mix(t.mid[0], t.light[0], k), mix(t.mid[1], t.light[1], k), mix(t.mid[2], t.light[2], k)];
};

const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

for (let y = 0; y < HEIGHT; y += 1) {
  const v = y / HEIGHT;
  for (let x = 0; x < WIDTH; x += 1) {
    const u = x / WIDTH;

    // Cloth hangs from a rail: folds fan out slightly towards the hem.
    const spread = 0.86 + v * 0.5;
    const warp = fbm(u * 3.1, v * 1.7) * 0.55;

    // Four broad folds plus two narrow creases between them.
    let light = 0;
    light += Math.sin((u * 9.4 + warp * 0.9) * Math.PI) * 0.5 + 0.5;
    light += (Math.sin((u * 23.0 - warp * 0.4) * Math.PI) * 0.5 + 0.5) * 0.35;
    light += (Math.sin((u * 4.1 + v * 0.9) * Math.PI) * 0.5 + 0.5) * 0.25;

    // The leading edge of the drape catches light; the trailing edge falls away.
    const edge = smoothstep(0.02, 0.16, u) * smoothstep(0.98, 0.84, u);
    const depth = 0.5 + (1 - v) * 0.16;

    // Twill texture, kept low frequency so dithering reads it as fabric, not noise.
    const twill = (Math.sin((x + y) * 0.19) * 0.5 + 0.5) * 0.035;

    let value = light * 0.44 + depth * 0.42 + twill - 0.1;
    value = value * (1 - 0.34 * (1 - edge));
    value += (fbm(u * 7.5, v * 5.0) - 0.5) * 0.06;

    // Vignette pulls the rail and the floor into shadow.
    const dx = (u - 0.5) * 2;
    const dy = (v - 0.5) * 2;
    const vignette = 1 - 0.32 * clamp01(dx * dx * 0.55 + dy * dy * 0.4);
    value *= vignette;

    // Warm the deepest crease with the oxblood edge colour.
    const stain = smoothstep(0.62, 0.18, value) * 0.5;
    const base = shade(clamp01(value), PALETTE);
    const r = mix(base[0], PALETTE.edge[0], stain) * spread * 0.98;
    const g = mix(base[1], PALETTE.edge[1], stain) * spread * 0.98;
    const b = mix(base[2], PALETTE.edge[2], stain) * spread * 0.98;

    const i = (y * WIDTH + x) * 3;
    pixels[i] = Math.round(clamp01(r / 255) * 255);
    pixels[i + 1] = Math.round(clamp01(g / 255) * 255);
    pixels[i + 2] = Math.round(clamp01(b / 255) * 255);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, encodePng(WIDTH, HEIGHT, pixels));
console.log(`Wrote ${OUT} (${WIDTH}x${HEIGHT}, ${(pixels.length / 1024).toFixed(0)} KiB RGB)`);
