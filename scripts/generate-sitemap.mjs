import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const baseUrl = 'https://parapharmacie.me';
const today = new Date().toISOString().slice(0, 10);
const catalogModuleUrl = pathToFileURL(path.join(root, 'js/catalog-data.js')).href;
const { catalogProducts, categories } = await import(catalogModuleUrl);

function absolute(pathname) {
  return `${baseUrl}/${pathname.replace(/^\/+/, '')}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const urls = [
  { loc: absolute(''), priority: '1.0', changefreq: 'weekly' },
  { loc: absolute('shop.html'), priority: '0.9', changefreq: 'daily' },
  { loc: absolute('cart.html'), priority: '0.4', changefreq: 'monthly' },
  { loc: absolute('checkout.html'), priority: '0.4', changefreq: 'monthly' },
  { loc: absolute('success.html'), priority: '0.2', changefreq: 'yearly' },
  ...categories.map((category) => ({
    loc: absolute(`shop.html?category=${encodeURIComponent(category.slug)}`),
    priority: '0.8',
    changefreq: 'weekly'
  })),
  ...catalogProducts.map((product) => ({
    loc: absolute(`product.html?id=${encodeURIComponent(product.id)}`),
    priority: product.featured || product.bestseller ? '0.8' : '0.7',
    changefreq: 'weekly'
  }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

await writeFile(path.join(root, 'sitemap.xml'), sitemap);
await writeFile(path.join(root, 'robots.txt'), robots);

console.log(`Generated sitemap.xml with ${urls.length} URLs.`);
console.log('Generated robots.txt.');
