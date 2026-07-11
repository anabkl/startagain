import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { catalogProducts } from '../js/catalog-data.js';
import { catalogApiIdBySlug } from '../js/catalog-api-id-map.js';
import { productRoute } from '../js/seo-routes.js';

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
}

const cartHtml = await readFile(path.join(dist, 'cart.html'), 'utf8');
for (const id of ['cart-empty', 'cart-content', 'cart-items', 'cart-cards', 'cart-total', 'checkout-btn']) {
    requireElement(cartHtml, id, 'cart.html');
}
requireText(cartHtml, 'src="js/cart.js"', 'cart.html');

const checkoutHtml = await readFile(path.join(dist, 'checkout.html'), 'utf8');
for (const id of ['checkout-form', 'firstName', 'lastName', 'email', 'whatsapp', 'city', 'address', 'summary-items-list', 'order-total-amount']) {
    requireElement(checkoutHtml, id, 'checkout.html');
}
requireText(checkoutHtml, 'src="js/checkout.js"', 'checkout.html');

const checkoutJs = await readFile(path.join(root, 'js/checkout.js'), 'utf8');
const orderServiceJs = await readFile(path.join(root, 'js/order-service.js'), 'utf8');
const cartJs = await readFile(path.join(root, 'js/cart.js'), 'utf8');
const mainJs = await readFile(path.join(root, 'js/main.js'), 'utf8');
requireText(checkoutJs, 'item.apiId || item.product_id || item.id', 'checkout API ID bridge');
requireText(orderServiceJs, 'item.apiId || item.product_id || item.id', 'order service API ID bridge');
requireText(checkoutJs, 'saveCart([])', 'checkout clears cart after a saved order');
requireText(checkoutJs, 'success.html?order=', 'checkout success handoff');
requireText(cartJs, 'renderCart()', 'cart render entrypoint');
requireText(mainJs, "export const CART_KEY = 'parashop_cart'", 'cart storage compatibility');

const css = await readFile(path.join(root, 'css/style.css'), 'utf8');
for (const breakpoint of ['@media (max-width: 1080px)', '@media (max-width: 860px)', '@media (max-width: 560px)']) {
    requireText(css, breakpoint, 'responsive CSS');
}
requireText(css, '.product-detail__purchase', 'responsive product purchase layout');
requireText(css, '.cart__cards', 'responsive cart cards');

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
const { toApiOrderPayload } = await import('../js/order-service.js');
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
    if (cart.length !== 1 || cart[0].id !== sample.id || cart[0].quantity !== 2) {
        errors.push('runtime cart test: repeated add-to-cart did not merge quantity');
    }
    if (cart[0]?.apiId !== catalogApiIdBySlug[sample.id]) {
        errors.push('runtime cart test: canonical product did not retain its API ID');
    }
    const payload = toApiOrderPayload({ items: cart, paymentMethod: 'COD' });
    if (payload.items[0]?.product_id !== catalogApiIdBySlug[sample.id] || payload.items[0]?.quantity !== 2) {
        errors.push('runtime checkout test: API payload did not use the mapped product ID and cart quantity');
    }
}

if (errors.length) {
    console.error(`Commerce validation failed with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`Commerce validation passed for ${catalogProducts.length} product/cart API mappings.`);
console.log('Cart quantity merging and API order-ID handoff passed at runtime; checkout markup and responsive fallbacks are structurally intact.');
