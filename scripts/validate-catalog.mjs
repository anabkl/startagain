import { access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { productRoute as cleanProductRoute } from '../js/seo-routes.js';
import { productAvailability, productGtin } from '../js/product-schema.js';

const root = process.cwd();
const productTemplate = path.join(root, 'product.html');
const catalogModuleUrl = pathToFileURL(path.join(root, 'js/catalog-data.js')).href;

const { catalogProducts, categories, productImageFallbacks } = await import(catalogModuleUrl);

const validCategories = new Set(categories.map((category) => category.name));
const validFallbackImages = new Set(Object.values(productImageFallbacks));
const ids = new Set();
const errors = [];

function fail(product, message) {
    errors.push(`${product?.id || 'unknown'}: ${message}`);
}

function isValidPrice(value) {
    return Number.isFinite(value) && value > 0;
}

async function localFileExists(relativePath) {
    await access(path.join(root, relativePath));
}

await access(productTemplate);

for (const product of catalogProducts) {
    if (!product.id) fail(product, 'missing id');
    if (!product.slug) fail(product, 'missing slug');
    if (!product.name) fail(product, 'missing name');
    if (!product.brand) fail(product, 'missing brand');
    if (!product.category) fail(product, 'missing category');
    if (!isValidPrice(Number(product.priceMAD))) fail(product, 'invalid priceMAD');
    if (!product.sourceUrl) fail(product, 'missing sourceUrl');
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

    if (!validCategories.has(product.category)) {
        fail(product, `invalid category "${product.category}"`);
    }

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

    if (product.oldPriceMAD && Number(product.oldPriceMAD) <= Number(product.priceMAD)) {
        fail(product, 'oldPriceMAD must be greater than priceMAD when present');
    }

    if ('rating' in product || 'reviews' in product || 'reviewsCount' in product) {
        fail(product, 'unverified ratings or review counts must not be generated');
    }

    if (product.stockVerified !== true && product.stock !== null) {
        fail(product, 'unverified inventory must not have a numeric stock value');
    }

    if (product.stockVerified !== true && product.stockStatus !== 'Disponibilité à confirmer') {
        fail(product, 'unverified inventory needs a neutral availability label');
    }

    // Product-truth fields (TASK 3): backward-compatible, never invented.
    if (!product.sku) fail(product, 'missing sku');
    if (product.ean !== null && !/^\d{8}$|^\d{12,14}$/.test(String(product.ean))) {
        fail(product, 'ean must be a real, verified 8/12/13/14-digit GTIN, or left null');
    }
    if (product.priceVerifiedAt && !product.priceSource) {
        fail(product, 'priceVerifiedAt is set without a priceSource');
    }
    if (product.stockVerifiedAt && product.stockVerified !== true) {
        fail(product, 'stockVerifiedAt is set without stockVerified');
    }

    // Structured-data invariant: since no catalog product has verified
    // stock yet, none may compute a schema.org availability value. This
    // regression-guards rule "Add InStock/OutOfStock only when backed by
    // a real current stock source" directly against the real catalog.
    if (product.stockVerified !== true && productAvailability(product) !== null) {
        fail(product, 'unverified product must not resolve a schema.org availability value');
    }
    if (!product.ean && productGtin(product) !== null) {
        fail(product, 'product without a verified ean must not resolve a gtin value');
    }
}

// Unit-style regression tests for the shared product-schema helpers.
// The real catalog only exercises the "unverified" branch above, so this
// covers the "verified" branch directly with synthetic products.
const verifiedInStock = { stockVerified: true, stock: 4, ean: '3282770203915' };
const verifiedOutOfStock = { stockVerified: true, stock: 0, ean: null };
const unverified = { stockVerified: false, stock: null, ean: null };

if (productAvailability(verifiedInStock) !== 'https://schema.org/InStock') {
    fail({ id: 'productAvailability' }, 'verified in-stock product must resolve to schema.org/InStock');
}
if (productAvailability(verifiedOutOfStock) !== 'https://schema.org/OutOfStock') {
    fail({ id: 'productAvailability' }, 'verified zero-stock product must resolve to schema.org/OutOfStock');
}
if (productAvailability(unverified) !== null) {
    fail({ id: 'productAvailability' }, 'unverified product must resolve to null availability');
}
if (productGtin(verifiedInStock) !== '3282770203915') {
    fail({ id: 'productGtin' }, 'product with a verified ean must resolve gtin to that ean');
}
if (productGtin(unverified) !== null) {
    fail({ id: 'productGtin' }, 'product without ean must resolve gtin to null');
}

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

console.log(`Validated ${catalogProducts.length} catalog products across ${validCategories.size} categories.`);
console.log(`Sample canonical product route OK: ${cleanProductRoute(sampleIds[0])}`);
