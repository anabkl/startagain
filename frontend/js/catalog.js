import { catalogProducts, categories, localCityKeywords, productImageFallbacks } from './catalog-data.js';
import { apiFetch } from './auth.js';

const FALLBACK_IMAGE = 'assets/products/product-placeholder.svg';
export const LOCAL_PRODUCT_OVERRIDES_KEY = 'parapharmacie_product_overrides';
const CATEGORY_ALIASES = {
    'soins-visage': 'visage',
    'produits-cosmetiques': 'visage',
    'hygiene-bien-etre': 'hygiene',
    complements: 'complements-alimentaires',
    sante: 'sante',
    'para-medical': 'para-medical'
};

export { categories, localCityKeywords };
export const mockProducts = catalogProducts;

const categorySlugByName = Object.fromEntries(categories.map((category) => [category.name, category.slug]));

export const trustBadges = [
    { icon: 'fa-truck-fast', title: 'Livraison au Maroc', text: 'Khouribga, Oued Zem, Boujniba, Boulanouare et villes marocaines sur confirmation.' },
    { icon: 'fa-certificate', title: 'Catalogue source', text: 'Produits, prix et disponibilites references depuis des pages publiques marocaines.' },
    { icon: 'fa-hand-holding-dollar', title: 'Paiement a la livraison', text: 'Cash on Delivery disponible pour commander plus sereinement.' },
    { icon: 'fa-headset', title: 'Conseil WhatsApp', text: 'Support humain par Pharmacie Tawfiq pour confirmer stock, livraison et alternatives.' }
];

export const testimonials = [
    {
        name: 'Salma A.',
        location: 'Khouribga',
        text: 'J ai retrouve des marques connues avec des prix clairs et la commande WhatsApp m a rassuree.'
    },
    {
        name: 'Youssef B.',
        location: 'Oued Zem',
        text: 'Le panier est simple, le paiement a la livraison est visible et la selection fait tres professionnelle.'
    },
    {
        name: 'Nadia R.',
        location: 'Boujniba',
        text: 'Bonne selection bebe et maman, avec des descriptions prudentes et faciles a comprendre.'
    }
];

export const faqs = [
    {
        question: 'Est-ce que parapharmacie.me livre a Khouribga et dans les villes proches ?',
        answer: 'Oui. La boutique met en avant Pharmacie Tawfiq a Khouribga avec livraison a confirmer vers Oued Zem, Boujniba, Boulanouare et le reste du Maroc.'
    },
    {
        question: 'Puis-je payer a la livraison ?',
        answer: 'Oui. Le paiement a la livraison est indique sur le panier et le checkout, puis confirme par WhatsApp.'
    },
    {
        question: 'Les prix sont-ils definitifs ?',
        answer: 'Les prix du catalogue sont sources depuis des pages publiques marocaines. La disponibilite et le prix final doivent etre confirmes avant expedition.'
    },
    {
        question: 'Pourquoi certains visuels sont-ils des placeholders ?',
        answer: 'Les images concurrentes ne sont pas reutilisees sans verification. Les photos produit seront remplacees par des visuels autorises ou realises pour parapharmacie.me.'
    }
];

export function getProductImage(product) {
    return product?.image || product?.image_url || product?.imageUrl || productImageFallbacks[product?.categorySlug] || FALLBACK_IMAGE;
}

export function getLocalProductOverrides() {
    if (typeof window === 'undefined') return {};

    try {
        return JSON.parse(window.localStorage.getItem(LOCAL_PRODUCT_OVERRIDES_KEY)) || {};
    } catch {
        return {};
    }
}

export function saveLocalProductOverride(productId, override) {
    const overrides = getLocalProductOverrides();
    overrides[productId] = {
        ...(overrides[productId] || {}),
        ...override,
        updatedAt: new Date().toISOString()
    };
    window.localStorage.setItem(LOCAL_PRODUCT_OVERRIDES_KEY, JSON.stringify(overrides));
    return overrides[productId];
}

export function setLocalProductActive(productId, active) {
    return saveLocalProductOverride(productId, { active });
}

function coerceOptionalNumber(value, fallback = null) {
    if (value === '' || value === null || value === undefined) return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function applyProductOverride(product, override = {}) {
    const next = { ...product, ...override };
    const categorySlug = categorySlugByName[next.category] || next.categorySlug;
    const priceMAD = coerceOptionalNumber(next.priceMAD ?? next.promoPrice ?? next.price, product.priceMAD);
    const oldPriceMAD = coerceOptionalNumber(next.oldPriceMAD, null);
    const hasPromo = oldPriceMAD && priceMAD && oldPriceMAD > priceMAD;
    const image = next.image || next.image_url || next.imageUrl || productImageFallbacks[categorySlug] || FALLBACK_IMAGE;

    return {
        ...next,
        categorySlug,
        priceMAD,
        oldPriceMAD: hasPromo ? oldPriceMAD : null,
        price: hasPromo ? oldPriceMAD : priceMAD,
        promoPrice: hasPromo ? priceMAD : null,
        image,
        imageUrl: image,
        active: next.active !== false,
        stockStatus: next.stockStatus || product.stockStatus || 'En stock',
        stock: next.stockStatus === 'Rupture de stock' ? 0 : (next.stock ?? product.stock ?? 24)
    };
}

export function applyLocalProductOverrides(products, { includeInactive = false } = {}) {
    const overrides = getLocalProductOverrides();

    return products
        .map((product) => applyProductOverride(product, overrides[product.id]))
        .filter((product) => includeInactive || product.active !== false);
}

export function getProductInitials(product) {
    const source = product?.brand || product?.name || 'PM';
    return normalizeSearchText(source)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('') || 'PM';
}

export function getProductImageReviewLabel(product) {
    return product?.imageNeedsReview
        ? 'Visuel indicatif a remplacer avant production'
        : 'Visuel produit approuve';
}

export function getBasePrice(product) {
    return Number(product?.oldPriceMAD || product?.price || product?.priceMAD || 0);
}

export function getEffectivePrice(product) {
    const priceMAD = Number(product?.priceMAD || 0);
    if (priceMAD > 0) return priceMAD;

    const promo = Number(product?.promoPrice || product?.discountPrice || 0);
    const price = Number(product?.price || 0);
    return promo > 0 && (!price || promo < price) ? promo : price;
}

export function getOldPrice(product) {
    const oldPrice = Number(product?.oldPriceMAD || 0);
    const price = getEffectivePrice(product);
    return oldPrice > price ? oldPrice : null;
}

export function isProductUnavailable(product) {
    return product?.stock === 0 || normalizeSearchText(product?.stockStatus).includes('rupture');
}

export function normalizeSearchText(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '');
}

function flattenSearchValues(values) {
    return values.flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean);
}

export function matchesProduct(product, query) {
    const search = normalizeSearchText(query);
    if (!search) return true;

    const haystack = normalizeSearchText(flattenSearchValues([
        product.name,
        product.brand,
        product.category,
        product.shortDescription,
        product.description,
        product.tags,
        product.searchKeywords,
        product.cityKeywords
    ]).join(' '));

    return search.split(/\s+/).every((word) => haystack.includes(word));
}

export function matchesCategory(product, categorySlug) {
    const normalizedCategory = CATEGORY_ALIASES[categorySlug] || categorySlug;
    return normalizedCategory === 'all' || product.categorySlug === normalizedCategory || product.category === normalizedCategory;
}

function normalizeApiProduct(product) {
    const categorySlug = categorySlugByName[product.category] || String(product.category || 'all').toLowerCase();
    const priceMAD = Number(product.priceMAD || product.price || 0);
    const oldPriceMAD = Number(product.oldPriceMAD || 0);
    const image = product.image || product.image_url || product.imageUrl || productImageFallbacks[categorySlug] || FALLBACK_IMAGE;

    return {
        ...product,
        id: String(product.id),
        slug: product.slug || String(product.id),
        categorySlug,
        priceMAD,
        oldPriceMAD: oldPriceMAD > priceMAD ? oldPriceMAD : null,
        shortDescription: product.shortDescription || product.description || 'Produit de parapharmacie a confirmer avant expedition.',
        image,
        imageUrl: image,
        imageNeedsReview: product.imageNeedsReview ?? false,
        imageSource: product.imageSource || 'Backend API',
        imageRightsStatus: product.imageRightsStatus || 'owned-or-approved',
        imageReplacementNote: product.imageReplacementNote || '',
        active: product.active !== false,
        stockStatus: product.stockStatus || (Number(product.stock || 0) > 0 ? 'En stock' : 'Rupture de stock')
    };
}

async function loadApiProducts() {
    const data = await apiFetch('/products?per_page=100&page=1', { method: 'GET' });
    return Array.isArray(data) ? data.map(normalizeApiProduct) : [];
}

function withTimeout(promise, timeoutMs = 4000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('Catalog API timeout')), timeoutMs);
        })
    ]);
}

export async function getCatalogProducts() {
    try {
        const apiProducts = await withTimeout(loadApiProducts());
        const publicProducts = apiProducts.filter((product) => product.type !== 'pack' && product.active !== false);

        if (publicProducts.length > 0) {
            return { products: applyLocalProductOverrides(publicProducts), source: 'api' };
        }
    } catch (error) {
        console.info('Using local fallback catalog:', error?.message || error);
    }

    return { products: applyLocalProductOverrides(catalogProducts), source: 'local-catalog' };
}

export async function getCatalogProduct(id) {
    try {
        const product = await withTimeout(apiFetch(`/products/${encodeURIComponent(id)}`, { method: 'GET' }), 4000);
        if (product?.id) {
            const normalized = normalizeApiProduct(product);
            return {
                product: applyLocalProductOverrides([normalized], { includeInactive: true })[0] || normalized,
                products: [normalized],
                source: 'api'
            };
        }
    } catch {
        // fallback below
    }

    const { products, source } = await getCatalogProducts();
    return {
        product: products.find((item) => item.id === id || item.slug === id) || null,
        products,
        source
    };
}
