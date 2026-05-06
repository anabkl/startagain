import { access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const productRoute = path.join(root, 'product.html');
const catalogModuleUrl = pathToFileURL(path.join(root, 'js/catalog-data.js')).href;

const { catalogProducts, categories, productImageFallbacks } = await import(catalogModuleUrl);

const validCategories = new Set(categories.map((category) => category.name));
const validFallbackImages = new Set(Object.values(productImageFallbacks));
const ids = new Set();
const errors = [];
const warnings = [];

function fail(product, message) {
    errors.push(`${product?.id || 'unknown'}: ${message}`);
}

function isValidPrice(value) {
    return Number.isFinite(value) && value > 0;
}

async function localFileExists(relativePath) {
    await access(path.join(root, relativePath));
}

await access(productRoute);

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

if (catalogProducts.length < 100) {
    warnings.push(`Catalog contains ${catalogProducts.length} verified products; target is 100, but product count was capped to sourced items.`);
}

if (errors.length) {
    console.error(`Catalog validation failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

for (const warning of warnings) console.warn(`Warning: ${warning}`);
console.log(`Validated ${catalogProducts.length} catalog products across ${validCategories.size} categories.`);
console.log(`Sample product route format OK: product.html?id=${sampleIds[0]}`);
