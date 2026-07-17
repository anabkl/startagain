// Pure, framework-free helpers shared by scripts/generate-seo-pages.mjs
// (Node, static pages) and js/product.js (browser, live API-backed page)
// so both paths emit identical structured data for the same product
// instead of two hand-maintained copies drifting apart.

// Only emit InStock/OutOfStock when the catalog entry is actually backed
// by a verified stock source (product.stockVerified === true). Unverified
// products must never get a guessed availability value.
export function productAvailability(product) {
    if (product?.stockVerified !== true) return null;
    const stock = Number(product?.stock);
    if (!Number.isFinite(stock)) return null;
    return stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
}

// Only emit `gtin` when a real EAN/GTIN has been verified and recorded on
// the product. Never generated.
export function productGtin(product) {
    return product?.ean || null;
}
