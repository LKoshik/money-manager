/**
 * Draws the app icons (wallet on the accent color) into src/pwa/icons/.
 * Run once with "npm run icons"; the PNG files are kept in the project.
 * Each pixel is sampled 3x3 times so the edges are smooth.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { encodePng } from './png.mjs';

const OUT = fileURLToPath(new URL('../src/pwa/icons/', import.meta.url));
const ACCENT = [0x4f, 0x46, 0xe5]; // same as --color-accent in the light theme
const WHITE = [255, 255, 255];
const SAMPLES = 3;

// The picture in a 0..1 square, drawn bottom to top: a card peeking out, the wallet, its clasp.
const LAYERS = [
  { box: [0.3, 0.25, 0.64, 0.4], radius: 0.04, color: WHITE, alpha: 0.6 },
  { box: [0.22, 0.32, 0.74, 0.72], radius: 0.07, color: WHITE, alpha: 1 },
  { box: [0.56, 0.45, 0.8, 0.61], radius: 0.05, color: WHITE, alpha: 1 },
  { box: [0.58, 0.47, 0.78, 0.59], radius: 0.035, color: ACCENT, alpha: 1 },
  { box: [0.62, 0.51, 0.66, 0.55], radius: 0.02, color: WHITE, alpha: 1 },
];

// "Maskable" icons fill the whole square (Android cuts its own shape), so the picture shrinks
// to stay inside the safe zone.
const ICONS = [
  { file: 'icon-192.png', size: 192, rounded: true, scale: 1 },
  { file: 'icon-512.png', size: 512, rounded: true, scale: 1 },
  { file: 'icon-maskable-512.png', size: 512, rounded: false, scale: 0.85 },
];

function insideBox(x, y, [x0, y0, x1, y1], r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
  const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return dx * dx + dy * dy <= r * r;
}

/** Color of one point, as [r, g, b, alpha 0..1]. */
function colorAt(x, y, { rounded, scale }) {
  if (!insideBox(x, y, [0, 0, 1, 1], rounded ? 0.22 : 0)) return [0, 0, 0, 0];
  const gx = (x - 0.5) / scale + 0.5;
  const gy = (y - 0.5) / scale + 0.5;
  let color = ACCENT;
  for (const layer of LAYERS) {
    if (!insideBox(gx, gy, layer.box, layer.radius)) continue;
    color = color.map((c, i) => layer.color[i] * layer.alpha + c * (1 - layer.alpha));
  }
  return [...color, 1];
}

/** Average of SAMPLES x SAMPLES points inside one pixel, as 4 bytes. */
function pixelAt(px, py, spec) {
  const sum = [0, 0, 0, 0];
  for (let sy = 0; sy < SAMPLES; sy++) {
    for (let sx = 0; sx < SAMPLES; sx++) {
      const u = (px + (sx + 0.5) / SAMPLES) / spec.size;
      const v = (py + (sy + 0.5) / SAMPLES) / spec.size;
      const [r, g, b, a] = colorAt(u, v, spec);
      sum[0] += r * a; sum[1] += g * a; sum[2] += b * a; sum[3] += a; // colors weighted by alpha
    }
  }
  const alpha = sum[3];
  if (alpha === 0) return [0, 0, 0, 0];
  return [sum[0] / alpha, sum[1] / alpha, sum[2] / alpha, (alpha / (SAMPLES * SAMPLES)) * 255].map(Math.round);
}

function drawIcon(spec) {
  const pixels = new Uint8Array(spec.size * spec.size * 4);
  for (let y = 0; y < spec.size; y++) {
    for (let x = 0; x < spec.size; x++) pixels.set(pixelAt(x, y, spec), (y * spec.size + x) * 4);
  }
  return pixels;
}

await mkdir(OUT, { recursive: true });
for (const spec of ICONS) {
  await writeFile(join(OUT, spec.file), encodePng(spec.size, spec.size, drawIcon(spec)));
  console.log('wrote', spec.file);
}
