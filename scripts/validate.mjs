import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'index.html',
  'shop.html',
  'product.html',
  'cart.html',
  'checkout.html',
  'success.html',
  'css/style.css',
  'js/main.js',
  'js/runtime-config.js',
  'js/catalog.js',
  'js/shop.js',
  'js/product.js',
  'js/cart.js',
  'js/checkout.js',
  'js/success.js',
  'js/order-service.js'
];

const htmlFiles = (await readdir(root)).filter((file) => file.endsWith('.html'));
const localAssetPattern = /(?:href|src)=["']([^"']+)["']/g;
const ignoredPrefixes = [
  'http://',
  'https://',
  'mailto:',
  'tel:',
  'data:',
  '#'
];

function isLocalReference(value) {
  return !ignoredPrefixes.some((prefix) => value.startsWith(prefix));
}

async function exists(relativePath) {
  await access(path.join(root, relativePath.split('?')[0]));
}

for (const file of requiredFiles) {
  await exists(file);
}

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(root, htmlFile), 'utf8');
  const matches = html.matchAll(localAssetPattern);

  for (const match of matches) {
    const reference = match[1];
    if (!isLocalReference(reference)) continue;
    if (reference.endsWith('.html') || reference.includes('/')) {
      await exists(reference);
    }
  }
}

const css = await readFile(path.join(root, 'css/style.css'), 'utf8');
if (css.includes('transition: var(--transition);:root')) {
  throw new Error('css/style.css still contains the broken injected :root rule.');
}

console.log(`Validated ${requiredFiles.length} core files and ${htmlFiles.length} HTML routes.`);
