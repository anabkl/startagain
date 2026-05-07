import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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
  'favicon.svg',
  'netlify.toml',
  'robots.txt',
  'site.webmanifest',
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
const { catalogProducts, categories } = await import(fileURLToPath(new URL('../js/catalog-data.js', import.meta.url)));

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const target of [...copyTargets, ...htmlFiles]) {
  await cp(path.join(root, target), path.join(dist, target), { recursive: true });
}

function withBase(html) {
  return html.includes('<base href="/">') ? html : html.replace('<head>', '<head>\n    <base href="/">');
}

const productHtml = withBase(await readFile(path.join(root, 'product.html'), 'utf8'));
for (const product of catalogProducts) {
  const routeDir = path.join(dist, 'produit', product.slug || product.id);
  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, 'index.html'), productHtml);
}

const categoryHtml = withBase(await readFile(path.join(root, 'shop.html'), 'utf8'));
for (const category of categories) {
  const routeDir = path.join(dist, 'categorie', category.slug);
  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, 'index.html'), categoryHtml);
}

console.log(`Built static site to ${path.relative(root, dist)}/`);
