import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'assets/products');
const tempDir = path.join(root, '.tmp-product-fallbacks');
const width = 720;
const height = 720;

const themes = [
  { slug: 'visage', colors: ['#e9f7f3', '#d8eef8', '#f8fbff'], accent: '#23a981' },
  { slug: 'corps', colors: ['#f9f3e5', '#e8f6f1', '#ffffff'], accent: '#c88a4a' },
  { slug: 'cheveux', colors: ['#eaf5ff', '#edf8f6', '#ffffff'], accent: '#2d8ac7' },
  { slug: 'bebe-maman', colors: ['#fff1f5', '#eff8ff', '#ffffff'], accent: '#e58aa2' },
  { slug: 'solaire', colors: ['#fff5cf', '#e9f8f0', '#ffffff'], accent: '#f2b544' },
  { slug: 'hygiene', colors: ['#e8f7f5', '#f3fbff', '#ffffff'], accent: '#23a6a6' },
  { slug: 'sante', colors: ['#edf5ff', '#effaf3', '#ffffff'], accent: '#4a8bd6' },
  { slug: 'supplements', colors: ['#eff8e8', '#fff8dc', '#ffffff'], accent: '#76a843' },
  { slug: 'homme', colors: ['#edf3f4', '#e8f0fb', '#ffffff'], accent: '#607686' },
  { slug: 'bio', colors: ['#eff8e5', '#e4f4ee', '#ffffff'], accent: '#6ea646' },
  { slug: 'paramedical', colors: ['#edf4ff', '#f4fbff', '#ffffff'], accent: '#598ed4' },
  { slug: 'promotions', colors: ['#fff0e8', '#eef8f1', '#ffffff'], accent: '#e57a42' }
];

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}

function mix(a, b, amount) {
  return a.map((channel, index) => Math.round(channel * (1 - amount) + b[index] * amount));
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function paintPixel(buffer, x, y, color, opacity = 1) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const offset = (y * width + x) * 3;
  buffer[offset] = Math.round(buffer[offset] * (1 - opacity) + color[0] * opacity);
  buffer[offset + 1] = Math.round(buffer[offset + 1] * (1 - opacity) + color[1] * opacity);
  buffer[offset + 2] = Math.round(buffer[offset + 2] * (1 - opacity) + color[2] * opacity);
}

function fillRoundedRect(buffer, x, y, w, h, radius, color, opacity = 1) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      const dx = Math.max(x - xx, 0, xx - (x + w - 1));
      const dy = Math.max(y - yy, 0, yy - (y + h - 1));
      const cornerX = xx < x + radius ? x + radius : xx > x + w - radius ? x + w - radius : xx;
      const cornerY = yy < y + radius ? y + radius : yy > y + h - radius ? y + h - radius : yy;
      const cornerDistance = Math.hypot(xx - cornerX, yy - cornerY);
      if ((dx === 0 && dy === 0) || cornerDistance <= radius) {
        paintPixel(buffer, xx, yy, color, opacity);
      }
    }
  }
}

function fillCircle(buffer, cx, cy, radius, color, opacity = 1) {
  const r2 = radius * radius;
  for (let yy = cy - radius; yy <= cy + radius; yy += 1) {
    for (let xx = cx - radius; xx <= cx + radius; xx += 1) {
      const distance = (xx - cx) ** 2 + (yy - cy) ** 2;
      if (distance <= r2) paintPixel(buffer, xx, yy, color, opacity);
    }
  }
}

function createPpm(theme) {
  const [start, mid, end] = theme.colors.map(hexToRgb);
  const accent = hexToRgb(theme.accent);
  const white = [255, 255, 255];
  const ink = [24, 54, 62];
  const buffer = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const linear = (x * 0.62 + y * 0.38) / width;
      const radial = clamp(1 - Math.hypot(x - 520, y - 150) / 620);
      let color = mix(start, end, clamp(linear));
      color = mix(color, mid, radial * 0.42);
      const offset = (y * width + x) * 3;
      buffer[offset] = color[0];
      buffer[offset + 1] = color[1];
      buffer[offset + 2] = color[2];
    }
  }

  fillCircle(buffer, 560, 165, 152, white, 0.32);
  fillCircle(buffer, 170, 545, 190, accent, 0.09);
  fillRoundedRect(buffer, 160, 545, 400, 34, 17, ink, 0.09);

  fillRoundedRect(buffer, 285, 132, 96, 60, 18, white, 0.86);
  fillRoundedRect(buffer, 266, 178, 134, 350, 46, white, 0.9);
  fillRoundedRect(buffer, 292, 285, 82, 120, 22, accent, 0.75);
  fillRoundedRect(buffer, 306, 314, 54, 18, 9, white, 0.55);
  fillRoundedRect(buffer, 306, 346, 54, 12, 6, white, 0.48);

  fillRoundedRect(buffer, 405, 255, 112, 270, 34, white, 0.72);
  fillRoundedRect(buffer, 426, 295, 70, 64, 18, accent, 0.34);
  fillRoundedRect(buffer, 178, 300, 86, 225, 26, white, 0.62);
  fillRoundedRect(buffer, 195, 330, 52, 76, 18, accent, 0.24);
  fillCircle(buffer, 464, 470, 34, accent, 0.35);
  fillRoundedRect(buffer, 245, 558, 245, 10, 5, white, 0.62);

  const header = Buffer.from(`P6\n${width} ${height}\n255\n`, 'ascii');
  return Buffer.concat([header, Buffer.from(buffer)]);
}

function encodeWebp(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('cwebp', ['-quiet', '-preset', 'drawing', '-q', '82', inputPath, '-o', outputPath]);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`cwebp failed for ${path.basename(outputPath)} with exit code ${code}`));
    });
  });
}

await mkdir(outputDir, { recursive: true });
await rm(tempDir, { recursive: true, force: true });
await mkdir(tempDir, { recursive: true });

for (const theme of themes) {
  const ppmPath = path.join(tempDir, `${theme.slug}.ppm`);
  const webpPath = path.join(outputDir, `category-fallback-${theme.slug}.webp`);
  await writeFile(ppmPath, createPpm(theme));
  await encodeWebp(ppmPath, webpPath);
  console.log(`Generated ${path.relative(root, webpPath)}`);
}

await rm(tempDir, { recursive: true, force: true });
