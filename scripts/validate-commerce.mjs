import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { catalogProducts } from '../js/catalog-data.js';
import { catalogApiIdBySlug } from '../js/catalog-api-id-map.js';
import { productRoute } from '../js/seo-routes.js';
import { DELIVERY, PAYMENT, resolveDeliveryZone } from '../js/business-config.js';
import { hasCurrentProductPrice, isProductOrderable } from '../js/product-schema.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const errors = [];

function requireText(source, text, label) {
    if (!source.includes(text)) errors.push(`${label}: missing ${text}`);
}

function requireElement(html, id, label) {
    if (!new RegExp(`id=["']${id}["']`).test(html)) errors.push(`${label}: missing #${id}`);
}

const apiIds = Object.values(catalogApiIdBySlug);
if (Object.keys(catalogApiIdBySlug).length !== catalogProducts.length) {
    errors.push(`API mapping covers ${Object.keys(catalogApiIdBySlug).length}/${catalogProducts.length} products`);
}
if (new Set(apiIds).size !== apiIds.length) errors.push('API mapping contains duplicate API IDs');
for (const product of catalogProducts) {
    if (!catalogApiIdBySlug[product.id]) errors.push(`API mapping missing ${product.id}`);
    const htmlPath = path.join(dist, productRoute(product).replace(/^\/+|\/+$/g, ''), 'index.html');
    const html = await readFile(htmlPath, 'utf8');
    requireText(html, `data-seo-add-product="${product.id}"`, product.id);
    requireText(html, `data-product-id="${product.id}"`, product.id);
    if (!isProductOrderable(product)) {
        if (!hasCurrentProductPrice(product)) requireText(html, 'Prix à confirmer', product.id);
        const addButton = html.match(new RegExp(`<button[^>]*data-seo-add-product=["']${product.id}["'][^>]*>`, 'i'))?.[0] || '';
        if (!/\bdisabled\b/i.test(addButton) || !/aria-disabled=["']true["']/i.test(addButton)) {
            errors.push(`${product.id}: non-orderable product add-to-cart control must be disabled and aria-disabled`);
        }
        if (/data-static-qty(?:=|\s|>)/i.test(html)) {
            errors.push(`${product.id}: non-orderable product page must not expose a quantity control`);
        }
    }
}

const cartHtml = await readFile(path.join(dist, 'cart.html'), 'utf8');
for (const id of ['cart-empty', 'cart-content', 'cart-items', 'cart-cards', 'cart-total', 'checkout-btn']) {
    requireElement(cartHtml, id, 'cart.html');
}
requireText(cartHtml, 'src="js/cart.js"', 'cart.html');
if (/id=["']cart-total["'][^>]*>\s*0(?:[.,]00)?\s*(?:DH|MAD)/i.test(cartHtml)) {
    errors.push('cart.html: initial summary must not flash a fabricated zero total');
}

const checkoutHtml = await readFile(path.join(dist, 'checkout.html'), 'utf8');
for (const id of ['checkout-form', 'firstName', 'lastName', 'email', 'whatsapp', 'city', 'address', 'summary-items-list', 'order-total-amount', 'delivery-fee-amount', 'delivery-fee-note']) {
    requireElement(checkoutHtml, id, 'checkout.html');
}
requireText(checkoutHtml, 'src="js/checkout.js"', 'checkout.html');
for (const id of ['order-subtotal-amount', 'order-total-amount']) {
    if (new RegExp(`id=["']${id}["'][^>]*>\\s*0(?:[.,]00)?\\s*(?:DH|MAD)`, 'i').test(checkoutHtml)) {
        errors.push(`checkout.html: #${id} must stay confirmation-based before an orderable cart exists`);
    }
}

// Regression guard: CMI and Apple Pay must be visible in checkout but
// never selectable — a disabled radio input is the concrete signal.
for (const method of ['CMI', 'APPLE_PAY']) {
    const radioMatch = checkoutHtml.match(new RegExp(`<input[^>]*value=["']${method}["'][^>]*>`, 'i'));
    if (!radioMatch) {
        errors.push(`checkout.html: missing a ${method} payment option`);
    } else if (!/\bdisabled\b/.test(radioMatch[0])) {
        errors.push(`checkout.html: ${method} payment option must be disabled (not selectable)`);
    } else if (!/aria-disabled=["']true["']/i.test(radioMatch[0])) {
        errors.push(`checkout.html: ${method} payment option must expose aria-disabled="true"`);
    }
}
const paymentRadios = [...checkoutHtml.matchAll(/<input[^>]*type=["']radio["'][^>]*name=["']paymentMethod["'][^>]*>/gi)].map((match) => match[0]);
const enabledPaymentRadios = paymentRadios.filter((input) => !/\bdisabled\b/i.test(input));
if (enabledPaymentRadios.length !== 1 || !/value=["']COD["']/i.test(enabledPaymentRadios[0] || '') || !/\bchecked\b/i.test(enabledPaymentRadios[0] || '')) {
    errors.push('checkout.html: COD must be the only enabled and checked payment method');
}
if (!/<button[^>]*class=["'][^"']*checkout-card__submit[^"']*["'][^>]*>/i.test(checkoutHtml)) {
    errors.push('checkout.html: missing the normal-flow mobile submit control inside the form card');
}
if (!/<button[^>]*type=["']submit["'][^>]*form=["']checkout-form["'][^>]*class=["'][^"']*btn-confirm/i.test(checkoutHtml)) {
    errors.push('checkout.html: missing the desktop summary submit control bound to #checkout-form');
}
if (PAYMENT.active.includes('cmi') || PAYMENT.active.includes('apple_pay')) {
    errors.push('js/business-config.js: PAYMENT.active must not include cmi or apple_pay until they are truly live');
}

const checkoutJs = await readFile(path.join(root, 'js/checkout.js'), 'utf8');
const orderServiceJs = await readFile(path.join(root, 'js/order-service.js'), 'utf8');
const cartJs = await readFile(path.join(root, 'js/cart.js'), 'utf8');
const mainJs = await readFile(path.join(root, 'js/main.js'), 'utf8');
const staticStorefrontJs = await readFile(path.join(root, 'js/static-storefront.js'), 'utf8');
const legacyCardFunction = await readFile(path.join(root, 'netlify/functions/create-checkout-session.js'), 'utf8');

requireText(legacyCardFunction, 'statusCode: 410', 'legacy card-payment function must fail closed');
requireText(legacyCardFunction, 'Seul le paiement à la livraison est actif', 'legacy card-payment function COD notice');
for (const unsafePaymentToken of ['stripe(', 'checkout.sessions.create', 'unit_amount', 'item.price']) {
    if (legacyCardFunction.includes(unsafePaymentToken)) {
        errors.push(`legacy card-payment function: disabled endpoint still contains ${unsafePaymentToken}`);
    }
}

// Seed templates remain tracked for explicit local owner workflows, but are
// disabled and must never be copied into the production artifact.
const seedFiles = ['seed.html', 'seed-products.html'];
const unsafeSeedPatterns = [
    [/<script\b/i, 'executable script'],
    [/<button\b/i, 'action button'],
    [/\bonclick\s*=/i, 'inline action'],
    [/\bapiFetch\s*\(/i, 'API write capability'],
    [/\bmethod\s*:\s*["']POST["']/i, 'POST request'],
    [/\b(?:price|promoPrice|stock)\s*:/i, 'hard-coded price or stock field']
];
for (const seedFile of seedFiles) {
    const label = `source ${seedFile}`;
    const seedHtml = await readFile(path.join(root, seedFile), 'utf8');
    requireText(seedHtml, 'data-seed-tool-disabled="true"', label);
    requireText(seedHtml, 'content="noindex, nofollow"', label);
    for (const [pattern, risk] of unsafeSeedPatterns) {
        if (pattern.test(seedHtml)) errors.push(`${label}: disabled seed route contains ${risk}`);
    }
    try {
        await access(path.join(dist, seedFile));
        errors.push(`${seedFile}: development-only seed notice leaked into dist`);
    } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
    }
}

requireText(checkoutJs, 'item.apiId || item.product_id || item.id', 'checkout API ID bridge');
requireText(orderServiceJs, 'item.apiId || item.product_id || item.id', 'order service API ID bridge');
requireText(checkoutJs, 'saveCart([])', 'checkout clears cart after a saved order');
requireText(checkoutJs, 'success.html?order=', 'checkout success handoff');
requireText(checkoutJs, 'resolveDeliveryZone', 'checkout delivery-fee wiring (must not hardcode the fee)');
requireText(checkoutJs, 'isProductUnavailable', 'checkout non-orderable-item refusal');
requireText(cartJs, 'isProductUnavailable', 'cart stale/non-orderable-item refusal');
requireText(cartJs, "cartContentDiv.style.display = '';", 'cart inline-display reset');
requireText(orderServiceJs, 'assertOrderPricesVerified', 'order payload unverified-price refusal');
requireText(orderServiceJs, 'hasCurrentStockVerification', 'order service stock-evidence boundary');
requireText(orderServiceJs, 'Local persistence is an explicit mock/demo backend mode only', 'remote failure must not become a local success');
if (orderServiceJs.includes('Order saved locally after API fallback') || orderServiceJs.includes('Order saved locally for demo mode')) {
    errors.push('order service: configured API/Firebase rejection must propagate instead of becoming a successful local order');
}
requireText(staticStorefrontJs, 'isProductOrderable', 'static storefront full orderability refusal');
requireText(cartJs, 'renderCart()', 'cart render entrypoint');
requireText(mainJs, "export const CART_KEY = 'parashop_cart'", 'cart storage compatibility');

const css = await readFile(path.join(root, 'css/style.css'), 'utf8');
for (const breakpoint of ['@media (max-width: 1080px)', '@media (max-width: 860px)', '@media (max-width: 560px)']) {
    requireText(css, breakpoint, 'responsive CSS');
}
requireText(css, '.product-detail__purchase', 'responsive product purchase layout');
requireText(css, '.cart__cards', 'responsive cart cards');
requireText(css, '.payment-method--soon', 'non-selectable planned-payment styling');
requireText(css, 'select,\n    textarea {\n        font-size: 16px;', 'mobile form-input iOS-zoom fix');
requireText(css, ':focus-visible', 'keyboard focus-visible styling');

// Responsive layout regression: the former viewport-fixed mobile submit
// button covered payment cards and the populated summary while scrolling.
// Mobile now uses a normal-flow form submit; the desktop summary submit is
// hidden at the same breakpoint, and long cart content has zero-min tracks.
if (/\.checkout-card__submit\s*\{[^}]*position:\s*fixed\b/is.test(css)) {
    errors.push('responsive CSS: checkout submit must not be viewport-fixed over payment/summary content');
}
requireText(css, '.checkout-card__submit {\n        display: inline-flex;\n        position: static;', 'mobile checkout submit stays in normal flow');
requireText(css, '.order-summary .btn-confirm {\n        display: none;', 'mobile hides duplicate summary submit');
requireText(css, '.summary-products {\n        max-height: none;\n        overflow: visible;', 'single-column checkout summary must not mask populated items');
requireText(css, 'grid-template-columns: 64px minmax(0, 1fr);', '360px cart card zero-min responsive grid');
requireText(css, '.cart-card__details {\n    flex: 1;\n    min-width: 0;', 'cart details intrinsic-width guard');
requireText(css, '.cart__actions .btn {\n    width: 100%;\n    min-width: 0;\n    min-height: 48px;', 'mobile cart CTA wrapping/tap target');
requireText(css, '.qty-control__btn {\n    width: 44px;\n    height: 44px;', 'quantity button 44px tap target');
requireText(css, '.btn-remove {\n    width: 44px;\n    height: 44px;', 'remove button 44px tap target');
requireText(css, ':root[data-theme="dark"] .cart-card,', 'dark-theme cart card surface');
if (/\.(?:checkout-container|order-summary)\s*\{[^}]*overflow:\s*hidden\b/is.test(css)) {
    errors.push('responsive CSS: checkout container/summary must not hide overflowing content');
}
if (/body\s*\{[^}]*overflow-x:\s*hidden\b/is.test(css)) {
    errors.push('global CSS: body overflow-x must not mask real mobile layout defects');
}
requireText(css, 'grid-template-columns: 56px minmax(0, 1fr) auto;', 'checkout summary zero-min product track');
requireText(css, 'max-width: min(360px, calc(100vw - 36px));', 'toast stays inside narrow viewports');
requireText(css, '.whatsapp-float {\n    position: fixed;\n    right: 18px;', 'WhatsApp control stays inset from viewport edge');
requireText(css, '.hero__floating-card {\n        left: 12px;\n        right: 12px;\n        width: auto;', 'single-column hero cannot protrude past the viewport');

// Central delivery-zone config: pure-function regression coverage. Only
// the explicitly verified local city (Khouribga) may resolve to the 15
// MAD tier; everything else — including nearby but unverified communes —
// must fall back to the "other Moroccan cities" tier, never be guessed.
const deliveryCases = [
    ['Khouribga', 'local'],
    ['khouribga', 'local'],
    ['  KHOURIBGA  ', 'local'],
    ['Khôuribga', 'local'],
    ['Casablanca', 'other'],
    ['Oued Zem', 'other'],
    ['Boujniba', 'other'],
    ['', 'confirmation-required'],
    ['12345', 'confirmation-required'],
    [undefined, 'confirmation-required']
];
for (const [city, expectedZone] of deliveryCases) {
    const result = resolveDeliveryZone(city);
    if (result.zone !== expectedZone) {
        errors.push(`resolveDeliveryZone(${JSON.stringify(city)}): expected zone "${expectedZone}", got "${result.zone}"`);
    }
    const expectedFee = expectedZone === 'local'
        ? DELIVERY.local.feeMAD
        : expectedZone === 'other' ? DELIVERY.other.feeMAD : null;
    if (result.feeMAD !== expectedFee) {
        errors.push(`resolveDeliveryZone(${JSON.stringify(city)}): expected fee ${expectedFee}, got ${result.feeMAD}`);
    }
}

class MemoryStorage {
    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.has(key) ? this.values.get(key) : null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

    removeItem(key) {
        this.values.delete(key);
    }
}

class FakeElement {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.className = '';
        this.dataset = {};
        this.style = {};
        this.classList = { add() {}, remove() {}, toggle() { return false; } };
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    setAttribute() {}
    addEventListener() {}
    remove() {}
}

const documentListeners = new Map();
const fakeBody = new FakeElement('body');
globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();
globalThis.window = {
    API_BASE: '',
    location: { hostname: '127.0.0.1', search: '', href: 'http://127.0.0.1/' },
    addEventListener() {},
    setTimeout
};
globalThis.document = {
    body: fakeBody,
    documentElement: { dataset: {} },
    addEventListener(type, listener) {
        documentListeners.set(type, [...(documentListeners.get(type) || []), listener]);
    },
    createElement(tagName) {
        return new FakeElement(tagName);
    },
    getElementById() {
        return null;
    },
    querySelector(selector) {
        if (selector === '.toast-container') {
            return fakeBody.children.find((child) => child.className === 'toast-container') || null;
        }
        return null;
    },
    querySelectorAll() {
        return [];
    }
};
globalThis.requestAnimationFrame = (callback) => callback();

const { getCart } = await import('../js/main.js');
await import('../js/static-storefront.js');
const { applyLocalProductOverrides } = await import('../js/catalog.js');
const { buildWhatsAppOrderMessage, toApiOrderPayload } = await import('../js/order-service.js');
const reconciledFallback = applyLocalProductOverrides([catalogProducts[0]])[0];
if (reconciledFallback.apiId !== catalogApiIdBySlug[catalogProducts[0].id]) {
    errors.push('runtime catalogue fallback test: local product did not retain its API ID');
}
const addHandler = (documentListeners.get('click') || []).at(-1);
if (!addHandler) {
    errors.push('runtime cart test: add-to-cart click handler was not registered');
} else {
    const sample = catalogProducts[0];
    const target = {
        closest(selector) {
            if (selector === '[data-seo-add-product]') return { dataset: { seoAddProduct: sample.id } };
            return null;
        }
    };
    addHandler({ target });
    addHandler({ target });
    const cart = getCart();
    if (cart.length !== 0) errors.push('runtime cart test: unverified product was added to the cart');

    let unverifiedOrderRefused = false;
    try {
        toApiOrderPayload({ items: [{ ...sample, quantity: 1 }], paymentMethod: 'COD' });
    } catch (error) {
        unverifiedOrderRefused = /Prix non vérifié/.test(error.message);
    }
    if (!unverifiedOrderRefused) errors.push('runtime checkout test: unverified product price did not fail closed');

    const verifiedItem = {
        ...sample,
        apiId: catalogApiIdBySlug[sample.id],
        priceMAD: 123,
        effectivePrice: 123,
        priceSource: 'caisse:QA-123',
        priceVerifiedAt: new Date().toISOString(),
        stock: 5,
        stockVerified: true,
        stockVerifiedAt: new Date().toISOString(),
        deliveryEligible: true,
        quantity: 2
    };
    const payload = toApiOrderPayload({ items: [verifiedItem], paymentMethod: 'COD' });
    if (payload.items[0]?.product_id !== catalogApiIdBySlug[sample.id] || payload.items[0]?.quantity !== 2) {
        errors.push('runtime checkout test: verified item did not preserve the mapped product ID and quantity');
    }
    const browserCommerceFields = ['delivery_fee', 'delivery_coverage_status', 'subtotal', 'total'];
    for (const field of browserCommerceFields) {
        if (field in payload) errors.push(`runtime checkout test: API payload must not send browser-controlled ${field}`);
    }
    if (Object.keys(payload.items[0] || {}).some((field) => !['product_id', 'quantity'].includes(field))) {
        errors.push('runtime checkout test: API item payload must contain only product_id and quantity');
    }

    const serverReceiptMessage = buildWhatsAppOrderMessage({
        source: 'api',
        firstName: 'QA',
        lastName: 'Receipt',
        city: 'Khouribga',
        address: 'Adresse QA',
        items: [{ product_id: 'product-1', name: 'Produit serveur', quantity: 2, price: 100, subtotal: 200 }],
        subtotal: 200,
        deliveryLabel: '15.00 DH (Khouribga)',
        total: 215
    }, 'ORDER-QA', (amount) => amount === null ? 'Prix à confirmer' : `${Number(amount).toFixed(2)} DH`);
    if (!serverReceiptMessage.includes('Produit serveur x 2 = 200.00 DH') || !serverReceiptMessage.includes('Total: 215.00 DH')) {
        errors.push('runtime checkout test: accepted server receipt could not produce the post-order WhatsApp confirmation');
    }
}

if (errors.length) {
    console.error(`Commerce validation failed with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Commerce validation passed for ${catalogProducts.length} product/cart API mappings.`);
console.log('Unverified-price cart/order refusal and verified API order-ID handoff passed at runtime; checkout markup and responsive fallbacks are structurally intact.');
