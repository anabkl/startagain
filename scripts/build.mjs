import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const dist = path.join(root, 'dist');
const copyTargets = [
  'assets',
  'css',
  'js',
  'netlify',
  'admin.css',
  'netlify.toml',
  'robots.txt',
  'sitemap.xml',
  'firestore.rules',
  'storage.rules'
];

const htmlFiles = [
  'index.html',
  'shop.html',
  'product.html',
  'cart.html',
  'checkout.html',
  'success.html',
  'login.html',
  'register.html',
  'profile.html',
  'orders.html',
  'admin.html',
  'setup-admin.html',
  'seed.html',
  'seed-products.html'
];

await import(fileURLToPath(new URL('./validate.mjs', import.meta.url)));

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const target of [...copyTargets, ...htmlFiles]) {
  await cp(path.join(root, target), path.join(dist, target), { recursive: true });
}

console.log(`Built static site to ${path.relative(root, dist)}/`);
