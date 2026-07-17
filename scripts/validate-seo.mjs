import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { catalogProducts, categories } from '../js/catalog-data.js';
import { catalogApiIdBySlug } from '../js/catalog-api-id-map.js';
import {
    ARTICLE_ROUTES,
    CONSEILS_INDEX_ROUTE,
    categoryRoute,
    KHOURIBGA_ROUTE,
    LOCAL_LANDING_ROUTES,
    productRoute,
    SITE_ORIGIN,
    TRUST_PAGE_ROUTES
} from '../js/seo-routes.js';
import {
    ADDRESS,
    CONTACT,
    GEO,
    MAPS_URL,
    OPENING_HOURS_DISPLAY,
    OPERATOR,
    SERVICE_AREA
} from '../js/business-config.js';
import legacySeoRedirect from '../netlify/edge-functions/legacy-seo-redirect.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const errors = [];

function fail(message) {
    errors.push(message);
}

function matchOne(html, pattern, label, file) {
    const matches = [...html.matchAll(pattern)];
    if (matches.length !== 1) {
        fail(`${file}: expected exactly one ${label}, found ${matches.length}`);
        return '';
    }
    return matches[0][1]?.trim() || '';
}

function metaContent(html, key, value) {
    const pattern = new RegExp(`<meta\\s+${key}=["']${value}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
    const reverse = new RegExp(`<meta\\s+content=["']([^"']+)["'][^>]*${key}=["']${value}["'][^>]*>`, 'i');
    return html.match(pattern)?.[1] || html.match(reverse)?.[1] || '';
}

function canonicalContent(html) {
    return html.match(/<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1]
        || html.match(/<link\s+href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i)?.[1]
        || '';
}

function htmlFileForUrl(url) {
    const pathname = new URL(url).pathname;
    if (pathname === '/') return path.join(dist, 'index.html');
    return path.join(dist, pathname.replace(/^\/+|\/+$/g, ''), 'index.html');
}

async function exists(file) {
    try {
        await access(file);
        return true;
    } catch {
        return false;
    }
}

async function walkHtml(directory) {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...await walkHtml(target));
        else if (entry.name.endsWith('.html')) files.push(target);
    }
    return files;
}

function collectJsonLd(html, file) {
    const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    return blocks.flatMap((match, index) => {
        try {
            return [JSON.parse(match[1])];
        } catch (error) {
            fail(`${file}: JSON-LD block ${index + 1} is invalid (${error.message})`);
            return [];
        }
    });
}

function flattenSchemaTypes(value, types = []) {
    if (Array.isArray(value)) {
        value.forEach((item) => flattenSchemaTypes(item, types));
    } else if (value && typeof value === 'object') {
        if (value['@type']) types.push(...(Array.isArray(value['@type']) ? value['@type'] : [value['@type']]));
        Object.values(value).forEach((item) => flattenSchemaTypes(item, types));
    }
    return types;
}

function inspectForbiddenSchemaClaims(value, file) {
    const serialized = JSON.stringify(value);
    for (const forbidden of ['aggregateRating', 'review', 'ratingValue', 'reviewCount', 'priceValidUntil']) {
        if (serialized.includes(`"${forbidden}"`)) fail(`${file}: unsupported structured-data field ${forbidden}`);
    }
}

const sitemapFile = path.join(dist, 'sitemap.xml');
const sitemap = await readFile(sitemapFile, 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
const expectedCount = 2 + categories.length + catalogProducts.length + TRUST_PAGE_ROUTES.length + LOCAL_LANDING_ROUTES.length + ARTICLE_ROUTES.length;

if (locations.length !== expectedCount) fail(`sitemap.xml: expected ${expectedCount} URLs, found ${locations.length}`);
if (new Set(locations).size !== locations.length) fail('sitemap.xml: duplicate URLs found');
if (lastmods.length !== locations.length) fail('sitemap.xml: every URL must have one lastmod');
for (const lastmod of lastmods) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) fail(`sitemap.xml: invalid lastmod ${lastmod}`);
    if (lastmod > new Date().toISOString().slice(0, 10)) fail(`sitemap.xml: future lastmod ${lastmod}`);
}

const forbiddenSitemapFragments = ['?', '/cart', '/checkout', '/success', '/login', '/profile', '/orders', '/admin', '/seed', '.html'];
for (const url of locations) {
    if (!url.startsWith(`${SITE_ORIGIN}/`)) fail(`sitemap.xml: non-canonical origin ${url}`);
    for (const fragment of forbiddenSitemapFragments) {
        if (url.includes(fragment)) fail(`sitemap.xml: low-value or legacy URL ${url}`);
    }

    // Regression guard: every sitemap URL must be a well-formed, HTTPS,
    // apex (non-www) parapharmacie.me URL. Malformed URLs must fail
    // validation cleanly instead of crashing the later new URL() calls.
    let parsedLocation;
    try {
        parsedLocation = new URL(url);
    } catch {
        fail(`sitemap.xml: invalid URL ${url}`);
        continue;
    }
    if (parsedLocation.protocol !== 'https:') fail(`sitemap.xml: non-HTTPS URL ${url}`);
    if (parsedLocation.hostname !== 'parapharmacie.me') fail(`sitemap.xml: URL host must be the apex domain, found ${parsedLocation.hostname} in ${url}`);
}

const expectedPaths = new Set([
    '/',
    '/boutique/',
    ...categories.map(categoryRoute),
    ...catalogProducts.map(productRoute),
    ...TRUST_PAGE_ROUTES,
    ...LOCAL_LANDING_ROUTES,
    ...ARTICLE_ROUTES
]);
for (const route of expectedPaths) {
    if (!locations.includes(new URL(route, `${SITE_ORIGIN}/`).href)) fail(`sitemap.xml: missing ${route}`);
}

const titles = new Map();
const descriptions = new Map();
const h1s = new Map();
for (const url of locations) {
    const file = htmlFileForUrl(url);
    const relative = path.relative(dist, file);
    if (!await exists(file)) {
        fail(`${url}: generated HTML file is missing`);
        continue;
    }

    const html = await readFile(file, 'utf8');
    const title = matchOne(html, /<title>([\s\S]*?)<\/title>/gi, 'title', relative);
    const description = metaContent(html, 'name', 'description');
    const h1 = matchOne(html, /<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi, 'H1', relative).replace(/<[^>]+>/g, '').trim();
    const canonical = canonicalContent(html);
    const robots = metaContent(html, 'name', 'robots');

    if (!description) fail(`${relative}: missing meta description`);
    if (canonical !== url) fail(`${relative}: canonical ${canonical || '(missing)'} does not equal ${url}`);
    if (/noindex/i.test(robots)) fail(`${relative}: sitemap page is noindex`);

    for (const [kind, value, registry] of [['title', title, titles], ['description', description, descriptions], ['H1', h1, h1s]]) {
        if (!value) continue;
        if (registry.has(value)) fail(`${relative}: duplicate ${kind} also used by ${registry.get(value)}`);
        else registry.set(value, relative);
    }

    for (const [key, value] of [
        ['og:title', metaContent(html, 'property', 'og:title')],
        ['og:description', metaContent(html, 'property', 'og:description')],
        ['og:url', metaContent(html, 'property', 'og:url')],
        ['og:image', metaContent(html, 'property', 'og:image')],
        ['twitter:card', metaContent(html, 'name', 'twitter:card')],
        ['twitter:title', metaContent(html, 'name', 'twitter:title')],
        ['twitter:description', metaContent(html, 'name', 'twitter:description')]
    ]) {
        if (!value) fail(`${relative}: missing ${key}`);
    }
    if (metaContent(html, 'property', 'og:url') !== url) fail(`${relative}: og:url must match canonical`);

    const schemas = collectJsonLd(html, relative);
    const types = flattenSchemaTypes(schemas);
    schemas.forEach((schema) => inspectForbiddenSchemaClaims(schema, relative));
    if (url === `${SITE_ORIGIN}/`) {
        if (!types.includes('WebSite') || !types.includes('Organization')) fail(`${relative}: homepage needs WebSite and Organization JSON-LD`);
    } else if (!types.includes('BreadcrumbList')) {
        fail(`${relative}: missing BreadcrumbList JSON-LD`);
    }

    if (new URL(url).pathname.startsWith('/produits/')) {
        if (!types.includes('Product') || !types.includes('Offer') || !types.includes('Brand')) fail(`${relative}: incomplete Product/Offer/Brand JSON-LD`);
        const serialized = JSON.stringify(schemas);
        if (!serialized.includes('"priceCurrency":"MAD"')) fail(`${relative}: Product Offer must use MAD`);
        if (serialized.includes('"availability"')) fail(`${relative}: availability must be omitted until inventory is verified`);
    }

    const articlePathname = new URL(url).pathname;
    if (articlePathname.startsWith('/conseils/') && articlePathname !== CONSEILS_INDEX_ROUTE) {
        if (!types.includes('BlogPosting') && !types.includes('Article')) fail(`${relative}: missing BlogPosting/Article JSON-LD`);
    }
}

const allHtmlFiles = await walkHtml(dist);
const sitemapFiles = new Set(locations.map(htmlFileForUrl));
for (const file of allHtmlFiles) {
    if (sitemapFiles.has(file)) continue;
    const html = await readFile(file, 'utf8');
    const robots = metaContent(html, 'name', 'robots');
    if (!/noindex/i.test(robots)) fail(`${path.relative(dist, file)}: non-sitemap HTML must be noindex`);
}

// Regression guard: no generated page may link to the plain-HTTP or "www"
// forms of the domain — every internal reference (links, canonical, OG,
// JSON-LD, assets) must already point at the HTTPS apex domain.
const insecureInternalLinkPattern = /(?:href|src|content)=["']http:\/\/(?:www\.)?parapharmacie\.me[^"']*["']/gi;
const wwwDomainPattern = /www\.parapharmacie\.me/gi;
for (const file of allHtmlFiles) {
    const relative = path.relative(dist, file);
    const html = await readFile(file, 'utf8');
    if (insecureInternalLinkPattern.test(html)) fail(`${relative}: contains a plain-HTTP internal parapharmacie.me reference`);
    if (wwwDomainPattern.test(html)) fail(`${relative}: contains a www.parapharmacie.me reference (must be the HTTPS apex domain)`);

    // Any page that declares a canonical at all (sitemap or not) must
    // declare an HTTPS apex one — never http:// or www.
    const canonical = canonicalContent(html);
    if (canonical) {
        let parsedCanonical;
        try {
            parsedCanonical = new URL(canonical);
        } catch {
            fail(`${relative}: canonical is not a valid URL (${canonical})`);
            parsedCanonical = null;
        }
        if (parsedCanonical) {
            if (parsedCanonical.protocol !== 'https:') fail(`${relative}: canonical must be HTTPS, found ${canonical}`);
            if (parsedCanonical.hostname !== 'parapharmacie.me') fail(`${relative}: canonical must use the apex domain, found ${canonical}`);
        }
    }
}

const transactionalPages = {
    'cart.html': 'noindex, follow',
    'checkout.html': 'noindex, follow',
    'success.html': 'noindex, follow',
    'login.html': 'noindex, follow',
    'register.html': 'noindex, follow',
    'profile.html': 'noindex, follow',
    'orders.html': 'noindex, follow',
    'admin.html': 'noindex, nofollow',
    'setup-admin.html': 'noindex, nofollow',
    'seed.html': 'noindex, nofollow',
    'seed-products.html': 'noindex, nofollow',
    'shop.html': 'noindex, follow',
    'product.html': 'noindex, follow',
    '404.html': 'noindex, follow'
};
for (const [relative, expected] of Object.entries(transactionalPages)) {
    const html = await readFile(path.join(dist, relative), 'utf8');
    const actual = metaContent(html, 'name', 'robots').toLowerCase();
    if (actual !== expected) fail(`${relative}: expected robots "${expected}", found "${actual || '(missing)'}"`);
}

const redirects = await readFile(path.join(dist, '_redirects'), 'utf8');
for (const category of categories) {
    const rule = `/shop.html category=${category.slug} ${categoryRoute(category)} 301!`;
    if (!redirects.includes(rule)) fail(`_redirects: missing category rule ${rule}`);
}
for (const product of catalogProducts) {
    const canonical = productRoute(product);
    if (!redirects.includes(`/product.html id=${product.id} ${canonical} 301!`)) fail(`_redirects: missing local-id rule for ${product.id}`);
    const apiId = catalogApiIdBySlug[product.id];
    if (!apiId || !redirects.includes(`/product.html id=${apiId} ${canonical} 301!`)) fail(`_redirects: missing API-id rule for ${product.id}`);
}
if (!redirects.includes('/* /404.html 404')) fail('_redirects: missing real 404 fallback rule');

const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
if (!/^User-agent: \*$/m.test(robots) || !/^Allow: \/$/m.test(robots)) fail('robots.txt: crawler access is not explicitly allowed');
if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) fail('robots.txt: canonical sitemap directive is missing');

const localLegacyResponse = await legacySeoRedirect(new Request(`${SITE_ORIGIN}/product.html?id=${catalogProducts[0].id}`));
const apiLegacyResponse = await legacySeoRedirect(new Request(`${SITE_ORIGIN}/product.html?id=${catalogApiIdBySlug[catalogProducts[0].id]}`));
const categoryLegacyResponse = await legacySeoRedirect(new Request(`${SITE_ORIGIN}/shop.html?category=visage`));
for (const [label, response, expected] of [
    ['local product ID', localLegacyResponse, `${SITE_ORIGIN}${productRoute(catalogProducts[0])}`],
    ['API product ID', apiLegacyResponse, `${SITE_ORIGIN}${productRoute(catalogProducts[0])}`],
    ['category query', categoryLegacyResponse, `${SITE_ORIGIN}${categoryRoute('visage')}`]
]) {
    if (response.status !== 301) fail(`edge redirect: ${label} must return 301`);
    if (response.headers.get('location') !== expected) fail(`edge redirect: ${label} must strip the legacy query and target ${expected}`);
}

// Regression guard: netlify.toml must declare the three HTTP/www -> HTTPS
// apex 301 rules, each forced (so they run even if a matching static file
// exists) and pointing at the bare https://parapharmacie.me apex. Order
// matters too: all three must appear before Netlify's SPA/edge routing so
// none of them can be shadowed into a loop or a chain.
const netlifyToml = await readFile(path.join(root, 'netlify.toml'), 'utf8');
const requiredHttpsRedirects = [
    { from: 'http://parapharmacie.me/*', label: 'HTTP apex -> HTTPS apex' },
    { from: 'http://www.parapharmacie.me/*', label: 'HTTP www -> HTTPS apex' },
    { from: 'https://www.parapharmacie.me/*', label: 'HTTPS www -> HTTPS apex' }
];
let lastRedirectIndex = -1;
for (const { from, label } of requiredHttpsRedirects) {
    const block = new RegExp(`\\[\\[redirects\\]\\]\\s*\\n\\s*from\\s*=\\s*"${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*\\n\\s*to\\s*=\\s*"https://parapharmacie\\.me/:splat"\\s*\\n\\s*status\\s*=\\s*301\\s*\\n\\s*force\\s*=\\s*true`);
    const match = block.exec(netlifyToml);
    if (!match) {
        fail(`netlify.toml: missing forced 301 redirect for ${label} (${from} -> https://parapharmacie.me/:splat)`);
        continue;
    }
    if (match.index < lastRedirectIndex) fail(`netlify.toml: ${label} redirect must not appear after a later HTTPS-consolidation rule (risk of a redirect chain)`);
    lastRedirectIndex = match.index;
}

// Regression guard: the Khouribga local landing page must visibly show the
// owner-verified business identity, embed an accessible lazy-loaded map,
// never present CMI/Apple Pay as selectable, and its JSON-LD must match
// js/business-config.js exactly (not just "look right" to a human reviewer).
const khouribgaFile = htmlFileForUrl(`${SITE_ORIGIN}${KHOURIBGA_ROUTE}`);
if (!await exists(khouribgaFile)) {
    fail(`${KHOURIBGA_ROUTE}: generated HTML file is missing`);
} else {
    const khouribgaRelative = path.relative(dist, khouribgaFile);
    const khouribgaHtml = await readFile(khouribgaFile, 'utf8');

    const h1 = matchOne(khouribgaHtml, /<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi, 'H1', khouribgaRelative).replace(/<[^>]+>/g, '').trim();
    if (h1 !== 'Votre parapharmacie à Khouribga') fail(`${khouribgaRelative}: H1 must be exactly "Votre parapharmacie à Khouribga", found "${h1}"`);

    for (const visibleText of [OPERATOR.legalName, ADDRESS.full, CONTACT.phone.display, CONTACT.whatsapp.display, ...OPENING_HOURS_DISPLAY]) {
        if (!khouribgaHtml.includes(visibleText)) fail(`${khouribgaRelative}: missing visible business text "${visibleText}"`);
    }
    if (!khouribgaHtml.includes(`href="${CONTACT.whatsapp.href}"`)) fail(`${khouribgaRelative}: missing a WhatsApp CTA using ${CONTACT.whatsapp.href}`);
    if (!khouribgaHtml.includes(`href="${MAPS_URL}"`)) fail(`${khouribgaRelative}: missing a "Voir l’itinéraire" link to the verified Maps URL`);

    // Map accessibility: lazy-loaded, titled, referrer-safe iframe embed.
    const localMapFrameMatch = khouribgaHtml.match(/<div class="local-map__frame">\s*<iframe([^>]*)>/i);
    if (!localMapFrameMatch) {
        fail(`${khouribgaRelative}: missing the local-map iframe section`);
    } else {
        const iframeAttrs = localMapFrameMatch[1];
        if (!/loading=["']lazy["']/i.test(iframeAttrs)) fail(`${khouribgaRelative}: local map iframe must use loading="lazy"`);
        if (!/title=["'][^"']+["']/i.test(iframeAttrs)) fail(`${khouribgaRelative}: local map iframe must have a non-empty title`);
        if (!/referrerpolicy=["'][^"']+["']/i.test(iframeAttrs)) fail(`${khouribgaRelative}: local map iframe must set a safe referrerpolicy`);
        if (!/src=["']https:\/\/www\.google\.com\/maps\?q=/i.test(iframeAttrs)) fail(`${khouribgaRelative}: local map iframe src must be a Google Maps embed`);
    }

    // CMI / Apple Pay must be labelled "Bientôt" and never rendered as a
    // clickable/selectable control (no surrounding <a> or <button>).
    for (const method of ['CMI', 'Apple Pay']) {
        const badgeMatch = khouribgaHtml.match(new RegExp(`<span class="payment-badge payment-badge--soon">[\\s\\S]*?${method}[\\s\\S]*?Bientôt[\\s\\S]*?</span>`));
        if (!badgeMatch) fail(`${khouribgaRelative}: ${method} must be shown as a "Bientôt" (not-yet-active) badge`);
        else if (/<a\s|<button/i.test(badgeMatch[0])) fail(`${khouribgaRelative}: ${method} must not be rendered as a clickable/selectable element`);
    }
    if (!/payment-badge--active[\s\S]{0,120}Paiement à la livraison/.test(khouribgaHtml)) {
        fail(`${khouribgaRelative}: cash-on-delivery must be shown as the active payment method`);
    }

    // Schema consistency: JSON-LD on this page must match business-config.js
    // exactly, not drift from the visible content above.
    const khouribgaSchemas = collectJsonLd(khouribgaHtml, khouribgaRelative);
    const graphNode = khouribgaSchemas.find((schema) => Array.isArray(schema['@graph']));
    const pharmacyNode = graphNode?.['@graph']?.find((node) => node['@type'] === 'Pharmacy');
    if (!pharmacyNode) {
        fail(`${khouribgaRelative}: missing a Pharmacy node in the JSON-LD @graph`);
    } else {
        if (pharmacyNode.name !== OPERATOR.legalName) fail(`${khouribgaRelative}: Pharmacy JSON-LD name must be "${OPERATOR.legalName}"`);
        if (pharmacyNode.telephone !== CONTACT.phone.e164) fail(`${khouribgaRelative}: Pharmacy JSON-LD telephone must be "${CONTACT.phone.e164}"`);
        if (pharmacyNode.hasMap !== MAPS_URL) fail(`${khouribgaRelative}: Pharmacy JSON-LD hasMap must be "${MAPS_URL}"`);
        if (pharmacyNode.areaServed !== SERVICE_AREA) fail(`${khouribgaRelative}: Pharmacy JSON-LD areaServed must be "${SERVICE_AREA}"`);
        if (pharmacyNode.address?.streetAddress !== ADDRESS.streetAddress || pharmacyNode.address?.addressLocality !== ADDRESS.addressLocality || pharmacyNode.address?.postalCode !== ADDRESS.postalCode) {
            fail(`${khouribgaRelative}: Pharmacy JSON-LD address does not match js/business-config.js`);
        }
        if (pharmacyNode.geo?.latitude !== GEO.latitude || pharmacyNode.geo?.longitude !== GEO.longitude) {
            fail(`${khouribgaRelative}: Pharmacy JSON-LD geo does not match js/business-config.js`);
        }
    }
    const khouribgaTypes = flattenSchemaTypes(khouribgaSchemas);
    if (!khouribgaTypes.includes('FAQPage')) fail(`${khouribgaRelative}: missing FAQPage JSON-LD for the local FAQ`);
    if (!khouribgaTypes.includes('WebSite')) fail(`${khouribgaRelative}: missing WebSite JSON-LD in the @graph`);
}

// Regression guard: the shared footer map (present on every generated page)
// must also be an accessible, lazy-loaded, safely-referrer'd embed.
const homepageFooterHtml = await readFile(path.join(dist, 'boutique', 'index.html'), 'utf8');
const footerMapMatch = homepageFooterHtml.match(/<div class="footer__map">\s*<iframe([^>]*)>/i);
if (!footerMapMatch) {
    fail('boutique/index.html: missing the shared footer map iframe');
} else {
    const footerIframeAttrs = footerMapMatch[1];
    if (!/loading=["']lazy["']/i.test(footerIframeAttrs)) fail('footer map iframe must use loading="lazy"');
    if (!/title=["'][^"']+["']/i.test(footerIframeAttrs)) fail('footer map iframe must have a non-empty title');
    if (!/referrerpolicy=["'][^"']+["']/i.test(footerIframeAttrs)) fail('footer map iframe must set a safe referrerpolicy');
}

if (errors.length) {
    console.error(`SEO validation failed with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`SEO validation passed for ${locations.length} sitemap URLs and ${allHtmlFiles.length} HTML files.`);
console.log('Unique titles, descriptions and H1s; canonicals, social metadata, JSON-LD, noindex controls and legacy redirects are consistent.');
