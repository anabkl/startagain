// Pure, framework-free product-truth helpers shared by the browser runtime
// and the build/validation scripts. Public price and availability claims fail
// closed whenever their supporting evidence is absent or stale.

export const PRICE_VERIFICATION_MAX_AGE_DAYS = 30;
export const STOCK_VERIFICATION_MAX_AGE_HOURS = 24;

const DAY_MS = 24 * 60 * 60 * 1000;
const TRACEABLE_PRICE_SOURCE = /^(?:erp|caisse|facture|fournisseur|catalogue-interne):[a-z0-9][a-z0-9._\/-]{2,127}$/i;

function timestamp(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function nowTimestamp(now) {
    const parsed = now instanceof Date ? now.getTime() : Date.parse(now);
    return Number.isFinite(parsed) ? parsed : Date.now();
}

function isCurrentTimestamp(value, maxAgeMs, now = new Date()) {
    const verifiedAt = timestamp(value);
    if (verifiedAt === null) return false;
    const current = nowTimestamp(now);
    return verifiedAt <= current && current - verifiedAt <= maxAgeMs;
}

export function isTraceablePriceSource(value) {
    return typeof value === 'string' && TRACEABLE_PRICE_SOURCE.test(value.trim());
}

export function hasCurrentProductPrice(product, now = new Date()) {
    const price = product?.priceMAD;
    return typeof price === 'number'
        && Number.isFinite(price)
        && price > 0
        && isTraceablePriceSource(product?.priceSource)
        && isCurrentTimestamp(product?.priceVerifiedAt, PRICE_VERIFICATION_MAX_AGE_DAYS * DAY_MS, now);
}

export function verifiedProductPrice(product, now = new Date()) {
    return hasCurrentProductPrice(product, now) ? product.priceMAD : null;
}

export function hasCurrentStockVerification(product, now = new Date()) {
    const stock = product?.stock;
    return product?.stockVerified === true
        && typeof stock === 'number'
        && Number.isInteger(stock)
        && stock >= 0
        && isCurrentTimestamp(product?.stockVerifiedAt, STOCK_VERIFICATION_MAX_AGE_HOURS * 60 * 60 * 1000, now);
}

// Only emit InStock/OutOfStock when a current, explicitly verified stock
// record exists. A number on its own is never treated as verification.
export function productAvailability(product, now = new Date()) {
    if (!hasCurrentStockVerification(product, now)) return null;
    return product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock';
}

// Online ordering is permitted only when every owner-controlled commercial
// prerequisite is explicit. Unknown delivery eligibility is contact-only;
// a current verified zero-stock record is never orderable.
export function isProductOrderable(product, now = new Date()) {
    return hasCurrentProductPrice(product, now)
        && product?.deliveryEligible === true
        && hasCurrentStockVerification(product, now)
        && product.stock > 0;
}

function hasValidGtinChecksum(value) {
    const digits = [...value].map(Number);
    const expected = digits.pop();
    let sum = 0;
    let multiplier = 3;

    for (let index = digits.length - 1; index >= 0; index -= 1) {
        sum += digits[index] * multiplier;
        multiplier = multiplier === 3 ? 1 : 3;
    }

    return (10 - (sum % 10)) % 10 === expected;
}

// Only emit a syntactically and checksum-valid GTIN. Values are never
// generated or inferred from a product name.
export function productGtin(product) {
    const ean = String(product?.ean || '').trim();
    if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(ean)) return null;
    return hasValidGtinChecksum(ean) ? ean : null;
}
