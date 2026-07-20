import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { productRoute as cleanProductRoute } from '../js/seo-routes.js';
import {
    hasCurrentProductPrice,
    hasCurrentStockVerification,
    isTraceablePriceSource,
    isProductOrderable,
    productAvailability,
    productGtin,
    verifiedProductPrice
} from '../js/product-schema.js';

const root = process.cwd();
const productTemplate = path.join(root, 'product.html');
const catalogModuleUrl = pathToFileURL(path.join(root, 'js/catalog-data.js')).href;
const { catalogProducts, categories, productImageFallbacks } = await import(catalogModuleUrl);

const validCategories = new Set(categories.map((category) => category.name));
const validFallbackImages = new Set(Object.values(productImageFallbacks));
const productsById = new Map(catalogProducts.map((product) => [product.id, product]));
const ids = new Set();
const errors = [];

function fail(product, message) {
    errors.push(`${product?.id || 'unknown'}: ${message}`);
}

async function localFileExists(relativePath) {
    await access(path.join(root, relativePath));
}

function rawProductBlocks(source) {
    const start = source.indexOf('const rawProducts = [');
    const end = source.indexOf('\n];', start);
    if (start < 0 || end < 0) return [];
    return source
        .slice(start, end)
        .split('\n    {\n')
        .slice(1)
        .map((chunk) => chunk.split('\n    }')[0]);
}

function rawField(block, name) {
    return block.match(new RegExp(`^\\s*${name}:\\s*([^,\\n]+)`, 'm'))?.[1]?.trim() || null;
}

function rawString(value) {
    return value?.match(/^['"]([\s\S]*)['"]$/)?.[1] || null;
}

function isNumericLiteral(value) {
    return /^-?\d+(?:\.\d+)?$/.test(value || '');
}

async function validateShippedCatalogSource(relativePath) {
    const source = await readFile(path.join(root, relativePath), 'utf8');
    const blocks = rawProductBlocks(source);
    if (blocks.length !== catalogProducts.length) {
        fail({ id: relativePath }, `raw catalogue has ${blocks.length}/${catalogProducts.length} product records`);
    }
    if (/priceSource\s*:\s*(?:product\.)?sourceUrl|priceSource\s*:\s*[^\n]*\|\|\s*(?:product\.)?sourceUrl/.test(source)) {
        fail({ id: relativePath }, 'competitor/sourceUrl must never be promoted to owner price evidence');
    }
    if (/sku\s*:\s*[^\n]*\|\|\s*(?:product\.)?(?:id|slug)/.test(source)) {
        fail({ id: relativePath }, 'route IDs or slugs must never be promoted to merchant SKU evidence');
    }

    for (const block of blocks) {
        const id = rawString(rawField(block, 'id'));
        const product = productsById.get(id);
        if (!id || !product) {
            fail({ id: id || relativePath }, `${relativePath} raw record does not map to the normalized catalogue`);
            continue;
        }
        const rawPrice = rawField(block, 'priceMAD');
        const rawOldPrice = rawField(block, 'oldPriceMAD');
        const rawSku = rawString(rawField(block, 'sku'));
        if (isNumericLiteral(rawPrice) && !hasCurrentProductPrice(product)) {
            fail(product, `${relativePath} embeds an exact price without current owner-controlled evidence`);
        }
        if (isNumericLiteral(rawOldPrice) && !hasCurrentProductPrice(product)) {
            fail(product, `${relativePath} embeds an old price while the current price is unverified`);
        }
        if (!rawSku && product.sku !== null) {
            fail(product, `${relativePath} inferred a merchant SKU without an owner-supplied raw value`);
        }
    }
}

await access(productTemplate);

for (const product of catalogProducts) {
    if (!product.id) fail(product, 'missing id');
    if (!product.slug) fail(product, 'missing slug');
    if (!product.name) fail(product, 'missing name');
    if (!product.brand) fail(product, 'missing brand');
    if (!product.category) fail(product, 'missing category');
    if (!product.sourceUrl) fail(product, 'missing historical identity sourceUrl');
    if (!product.image) fail(product, 'missing image or fallback');
    if (!product.imageSource) fail(product, 'missing imageSource');
    if (!product.imageRightsStatus) fail(product, 'missing imageRightsStatus');
    if (!product.imageReplacementNote) fail(product, 'missing imageReplacementNote');
    if (!product.stockStatus) fail(product, 'missing stockStatus');
    if (!product.shortDescription) fail(product, 'missing shortDescription');
    if (!Array.isArray(product.tags)) fail(product, 'tags must be an array');
    if (!Array.isArray(product.searchKeywords)) fail(product, 'searchKeywords must be an array');
    if (!Array.isArray(product.cityKeywords)) fail(product, 'cityKeywords must be an array');

    if (product.id) {
        if (ids.has(product.id)) fail(product, 'duplicate id');
        ids.add(product.id);
    }
    if (!validCategories.has(product.category)) fail(product, `invalid category "${product.category}"`);

    try {
        const url = new URL(product.sourceUrl);
        if (!['http:', 'https:'].includes(url.protocol)) fail(product, 'sourceUrl must be http(s)');
    } catch {
        fail(product, 'sourceUrl is not a valid URL');
    }

    if (product.image && !/^https?:\/\//.test(product.image)) {
        try {
            await localFileExists(product.image);
        } catch {
            fail(product, `local image not found: ${product.image}`);
        }
        if (!product.image.endsWith('.webp') && !product.image.endsWith('.svg')) {
            fail(product, 'local image must be an optimized .webp file or the legacy SVG placeholder');
        }
    }
    if (/^https?:\/\//.test(product.image || '') && product.imageNeedsReview !== true) {
        fail(product, 'remote image must be marked imageNeedsReview');
    }
    if (validFallbackImages.has(product.image) && product.imageNeedsReview !== true) {
        fail(product, 'generated fallback image must stay imageNeedsReview until replaced by an approved packshot');
    }
    if (product.imageNeedsReview === false && !/approved|owned|licensed|authorized/i.test(product.imageRightsStatus)) {
        fail(product, 'approved image requires a documented rights status');
    }

    if (product.priceMAD === null) {
        for (const field of ['priceSource', 'priceVerifiedAt', 'oldPriceMAD', 'price', 'promoPrice']) {
            if (product[field] !== null) fail(product, `${field} must be null while the public price is unverified`);
        }
        if (product.promoBadge !== null) fail(product, 'promoBadge must be null while the public price is unverified');
    } else {
        if (!hasCurrentProductPrice(product)) fail(product, 'priceMAD must fail closed without a positive current owner-controlled price record');
        if (verifiedProductPrice(product) !== Number(product.priceMAD)) fail(product, 'verifiedProductPrice must match the current public price');
        if (product.oldPriceMAD !== null && Number(product.oldPriceMAD) <= Number(product.priceMAD)) {
            fail(product, 'oldPriceMAD must be greater than priceMAD when present');
        }
    }
    if (product.priceSource && product.priceSource === product.sourceUrl) {
        fail(product, 'historical sourceUrl is not valid owner-controlled price evidence');
    }

    if (product.deliveryEligible !== null && typeof product.deliveryEligible !== 'boolean') {
        fail(product, 'deliveryEligible must be an explicit boolean or null');
    }
    if (product.stockVerified === true) {
        if (!hasCurrentStockVerification(product)) fail(product, 'stockVerified requires a non-negative quantity and a current non-future verification date');
    } else {
        if (product.stock !== null) fail(product, 'unverified inventory must not have a numeric stock value');
        if (product.stockVerifiedAt !== null) fail(product, 'unverified inventory must not retain stockVerifiedAt');
        if (product.stockStatus !== 'Disponibilité à confirmer') fail(product, 'unverified inventory needs a neutral availability label');
    }
    if (!hasCurrentStockVerification(product) && productAvailability(product) !== null) {
        fail(product, 'unverified or stale inventory must not resolve a schema.org availability value');
    }

    if (product.sku !== null && (typeof product.sku !== 'string' || !product.sku.trim())) {
        fail(product, 'sku must be a non-empty owner-supplied identifier or null');
    }
    if (product.ean !== null && productGtin(product) !== String(product.ean)) {
        fail(product, 'ean must be a checksum-valid 8/12/13/14-digit GTIN, or left null');
    }
    if (!product.ean && productGtin(product) !== null) fail(product, 'product without a verified ean must not resolve a gtin value');

    if ('rating' in product || 'reviews' in product || 'reviewsCount' in product) {
        fail(product, 'unverified ratings or review counts must not be generated');
    }
}

await validateShippedCatalogSource('js/catalog-data.js');
await validateShippedCatalogSource('frontend/js/catalog-data.js');

// Fixed-clock unit regressions cover evidence age, source provenance, stock
// freshness and checksum behavior independently from today's real catalogue.
const now = new Date('2026-07-17T12:00:00.000Z');
const verifiedPrice = {
    priceMAD: 123,
    priceSource: 'caisse:TICKET-123',
    priceVerifiedAt: '2026-07-16T12:00:00.000Z'
};
const invalidPriceFixtures = [
    { ...verifiedPrice, priceSource: null },
    { ...verifiedPrice, priceSource: 'https://www.parapharma.ma/example' },
    { ...verifiedPrice, priceVerifiedAt: '2026-06-16T11:59:59.000Z' },
    { ...verifiedPrice, priceVerifiedAt: '2026-07-17T12:00:01.000Z' },
    { ...verifiedPrice, priceMAD: 0 }
];
if (!hasCurrentProductPrice(verifiedPrice, now) || verifiedProductPrice(verifiedPrice, now) !== 123) {
    fail({ id: 'priceEvidence' }, 'current owner-controlled price evidence must resolve to its positive amount');
}
if (isProductOrderable({ ...verifiedPrice, deliveryEligible: null }, now)) {
    fail({ id: 'orderability' }, 'unknown delivery eligibility must remain contact-only');
}
if (!isTraceablePriceSource(verifiedPrice.priceSource) || isTraceablePriceSource('https://www.parapharma.ma/example')) {
    fail({ id: 'priceEvidence' }, 'only traceable owner-controlled reference prefixes may qualify');
}
for (const fixture of invalidPriceFixtures) {
    if (hasCurrentProductPrice(fixture, now) || verifiedProductPrice(fixture, now) !== null) {
        fail({ id: 'priceEvidence' }, `invalid price fixture did not fail closed (${JSON.stringify(fixture)})`);
    }
}

const verifiedInStock = { stockVerified: true, stock: 4, stockVerifiedAt: '2026-07-17T11:00:00.000Z', ean: '4006381333931' };
const verifiedOutOfStock = { stockVerified: true, stock: 0, stockVerifiedAt: '2026-07-17T11:00:00.000Z', ean: null };
const invalidStockFixtures = [
    { stockVerified: false, stock: 4, stockVerifiedAt: '2026-07-17T11:00:00.000Z' },
    { stockVerified: true, stock: 4, stockVerifiedAt: null },
    { stockVerified: true, stock: 4, stockVerifiedAt: '2026-07-16T11:59:59.000Z' },
    { stockVerified: true, stock: 4, stockVerifiedAt: '2026-07-17T12:00:01.000Z' }
];
if (productAvailability(verifiedInStock, now) !== 'https://schema.org/InStock') {
    fail({ id: 'productAvailability' }, 'current verified positive stock must resolve to schema.org/InStock');
}
if (productAvailability(verifiedOutOfStock, now) !== 'https://schema.org/OutOfStock') {
    fail({ id: 'productAvailability' }, 'current verified zero stock must resolve to schema.org/OutOfStock');
}
if (!isProductOrderable({ ...verifiedPrice, deliveryEligible: true, ...verifiedInStock }, now)) {
    fail({ id: 'orderability' }, 'current price, explicit delivery eligibility and positive current stock must be orderable');
}
if (isProductOrderable({ ...verifiedPrice, deliveryEligible: true, ...verifiedOutOfStock }, now)) {
    fail({ id: 'orderability' }, 'current verified zero stock must not be orderable');
}
for (const fixture of invalidStockFixtures) {
    if (hasCurrentStockVerification(fixture, now) || productAvailability(fixture, now) !== null) {
        fail({ id: 'productAvailability' }, `invalid stock fixture did not fail closed (${JSON.stringify(fixture)})`);
    }
}
if (productGtin(verifiedInStock) !== '4006381333931') fail({ id: 'productGtin' }, 'checksum-valid GTIN must be emitted unchanged');
if (productGtin({ ean: '4006381333932' }) !== null) fail({ id: 'productGtin' }, 'invalid GTIN checksum must fail closed');
if (productGtin({ ean: null }) !== null) fail({ id: 'productGtin' }, 'missing EAN must resolve to null');

const sampleIds = [
    'avene-cleanance-gel-400',
    'uriage-xemose-huile-lavante-apaisante-500',
    'bioderma-sensibio-gel-moussant-200',
    'accu-chek-instant-bandelettes-x50',
    'caudalie-coffret-solution-fermete'
];
for (const sampleId of sampleIds) {
    if (!catalogProducts.some((product) => product.id === sampleId || product.slug === sampleId)) {
        fail({ id: sampleId }, 'sample product detail route has no matching catalog item');
    }
}

if (errors.length) {
    console.error(`Catalog validation failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

const unverifiedPrices = catalogProducts.filter((product) => !hasCurrentProductPrice(product)).length;
const unverifiedStocks = catalogProducts.filter((product) => !hasCurrentStockVerification(product)).length;
console.log(`Validated ${catalogProducts.length} catalog products across ${validCategories.size} categories.`);
console.log(`Fail-closed truth checks passed: ${unverifiedPrices} prices and ${unverifiedStocks} stock records remain unverified; no unsupported public amount or availability is exposed.`);
console.log(`Sample canonical product route OK: ${cleanProductRoute(sampleIds[0])}`);
