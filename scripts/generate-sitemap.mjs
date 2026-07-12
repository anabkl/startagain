import { existsSync } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { catalogProducts, categories } from '../js/catalog-data.js';
import {
    absoluteSiteUrl,
    ARTICLE_ROUTES,
    categoryRoute,
    productRoute,
    TRUST_PAGE_ROUTES
} from '../js/seo-routes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const today = new Date().toISOString().slice(0, 10);

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function latestFileDate(relativeFiles) {
    const dirty = spawnSync('git', ['diff', '--quiet', '--', ...relativeFiles], { cwd: root });
    const hasUntracked = relativeFiles.some((file) => {
        if (!existsSync(path.join(root, file))) return false;
        const tracked = spawnSync('git', ['ls-files', '--error-unmatch', file], { cwd: root });
        return tracked.status !== 0;
    });
    if (dirty.status !== 0 || hasUntracked) return today;

    try {
        const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...relativeFiles], {
            cwd: root,
            encoding: 'utf8'
        }).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    } catch {
        // Fall back to the source-file modification time outside a Git checkout.
    }

    const dates = [];
    for (const file of relativeFiles) {
        try {
            dates.push((await stat(path.join(root, file))).mtime.toISOString().slice(0, 10));
        } catch {
            // Ignore missing optional sources.
        }
    }
    return dates.sort().at(-1) || today;
}

export async function generateSitemap({ outputDir = root } = {}) {
    const homepageLastmod = await latestFileDate(['index.html', 'js/home.js']);
    const catalogLastmod = await latestFileDate([
        'js/catalog-data.js',
        'scripts/generate-seo-pages.mjs',
        'js/static-storefront.js'
    ]);
    const trustLastmod = await latestFileDate(['scripts/generate-seo-pages.mjs']);
    const articlesLastmod = await latestFileDate(['js/articles-data.js', 'scripts/generate-seo-pages.mjs']);

    const urls = [
        { path: '/', lastmod: homepageLastmod },
        { path: '/boutique/', lastmod: catalogLastmod },
        ...categories.map((category) => ({ path: categoryRoute(category), lastmod: catalogLastmod })),
        ...catalogProducts.map((product) => ({ path: productRoute(product), lastmod: catalogLastmod })),
        ...TRUST_PAGE_ROUTES.map((route) => ({ path: route, lastmod: trustLastmod })),
        ...ARTICLE_ROUTES.map((route) => ({ path: route, lastmod: articlesLastmod }))
    ];

    const uniqueUrls = [...new Map(urls.map((entry) => [entry.path, entry])).values()];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((entry) => `  <url>
    <loc>${escapeXml(absoluteSiteUrl(entry.path))}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>
`;
    const robots = `User-agent: *
Allow: /

Sitemap: ${absoluteSiteUrl('/sitemap.xml')}
`;

    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'sitemap.xml'), sitemap);
    await writeFile(path.join(outputDir, 'robots.txt'), robots);
    console.log(`Generated sitemap.xml with ${uniqueUrls.length} canonical, indexable URLs.`);
    console.log('Generated robots.txt with the canonical sitemap location.');
    return uniqueUrls;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
    const outputArg = process.argv.find((argument) => argument.startsWith('--output='));
    const outputDir = outputArg ? path.resolve(outputArg.slice('--output='.length)) : root;
    await generateSitemap({ outputDir });
}
