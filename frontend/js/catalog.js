import { catalogProducts, categories, localCityKeywords, productImageFallbacks } from './catalog-data.js';
import { apiFetch } from './auth.js';
import {
    hasCurrentProductPrice,
    hasCurrentStockVerification,
    isProductOrderable,
    verifiedProductPrice
} from './product-schema.js';

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
    { icon: 'fa-truck-fast', title: 'Livraison au Maroc', text: 'Khouribga et autres villes marocaines desservies, sur confirmation.' },
    { icon: 'fa-certificate', title: 'Prix à confirmer', text: 'Un montant ne s’affiche qu’avec une source propriétaire datée de moins de 30 jours.' },
    { icon: 'fa-hand-holding-dollar', title: 'Paiement a la livraison', text: 'Cash on Delivery disponible pour commander plus sereinement.' },
    { icon: 'fa-headset', title: 'Conseil WhatsApp', text: 'Support humain par Pharmacie Tawfiq pour confirmer stock, livraison et alternatives.' }
];

// No customer testimonial is published until the owner supplies a genuine,
// consented review. The legacy mirror must not fabricate social proof.
export const testimonials = [];

export const faqs = [
    {
        question: 'Est-ce que parapharmacie.me livre a Khouribga et dans les villes proches ?',
        answer: 'La zone locale confirmée est Khouribga. Les autres villes desservies et les frais applicables sont confirmés avant expédition.'
    },
    {
        question: 'Puis-je payer a la livraison ?',
        answer: 'Oui. Le paiement a la livraison est indique sur le panier et le checkout, puis confirme par WhatsApp.'
    },
    {
        question: 'Les prix sont-ils definitifs ?',
        answer: 'Un montant n’est affiché qu’avec une source propriétaire vérifiée depuis moins de 30 jours. Sinon, le prix doit être confirmé.'
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
    const candidatePrice = coerceOptionalNumber(next.priceMAD ?? next.promoPrice ?? next.price, null);
    const priceSource = next.priceSource || next.price_source || null;
    const priceVerifiedAt = next.priceVerifiedAt || next.price_verified_at || null;
    const priceMAD = verifiedProductPrice({ ...next, priceMAD: candidatePrice, priceSource, priceVerifiedAt });
    const candidateOldPrice = coerceOptionalNumber(next.oldPriceMAD, null);
    const hasPromo = priceMAD !== null && candidateOldPrice !== null && candidateOldPrice > priceMAD;
    const oldPriceMAD = hasPromo ? candidateOldPrice : null;
    const image = next.image || next.image_url || next.imageUrl || productImageFallbacks[categorySlug] || FALLBACK_IMAGE;
    const stockVerified = hasCurrentStockVerification({
        ...next,
        stockVerified: next.stockVerified === true
            || next.inventoryVerified === true
            || next.stock_status_verified === true,
        stockVerifiedAt: next.stockVerifiedAt || next.stock_verified_at || next.inventoryVerifiedAt || null
    });
    const stock = stockVerified ? Number(next.stock) : null;

    return {
        ...next,
        categorySlug,
        priceMAD,
        oldPriceMAD,
        price: hasPromo ? oldPriceMAD : priceMAD,
        promoPrice: hasPromo ? priceMAD : null,
        promoBadge: hasPromo ? (next.promoBadge || 'Promo') : null,
        priceSource: priceMAD !== null ? priceSource : null,
        priceVerifiedAt: priceMAD !== null ? priceVerifiedAt : null,
        image,
        imageUrl: image,
        active: next.active !== false,
        stockStatus: stockVerified
            ? (next.stockStatus || (stock === 0 ? 'Rupture de stock' : 'En stock'))
            : 'Disponibilité à confirmer',
        stock,
        stockVerified,
        stockVerifiedAt: stockVerified ? (next.stockVerifiedAt || next.stock_verified_at || next.inventoryVerifiedAt) : null,
        deliveryEligible: typeof next.deliveryEligible === 'boolean' ? next.deliveryEligible : null
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
    const price = verifiedProductPrice(product);
    if (price === null) return null;
    const oldPrice = Number(product?.oldPriceMAD);
    return Number.isFinite(oldPrice) && oldPrice > price ? oldPrice : price;
}

export function getEffectivePrice(product) {
    return verifiedProductPrice(product);
}

export function getOldPrice(product) {
    const oldPrice = Number(product?.oldPriceMAD);
    const price = getEffectivePrice(product);
    return price !== null && Number.isFinite(oldPrice) && oldPrice > price ? oldPrice : null;
}

export function isProductUnavailable(product) {
    return !isProductOrderable(product);
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
    const candidatePrice = Number(product.priceMAD || product.price || 0);
    const priceSource = product.priceSource || product.price_source || null;
    const priceVerifiedAt = product.priceVerifiedAt || product.price_verified_at || null;
    const priceMAD = verifiedProductPrice({ priceMAD: candidatePrice, priceSource, priceVerifiedAt });
    const candidateOldPrice = Number(product.oldPriceMAD || 0);
    const oldPriceMAD = priceMAD !== null && candidateOldPrice > priceMAD ? candidateOldPrice : null;
    const image = product.image || product.image_url || product.imageUrl || productImageFallbacks[categorySlug] || FALLBACK_IMAGE;
    const stockVerifiedAt = product.stockVerifiedAt || product.stock_verified_at || product.inventoryVerifiedAt || null;
    const stockVerified = hasCurrentStockVerification({
        ...product,
        stockVerified: product.stockVerified === true || product.inventoryVerified === true || product.stock_status_verified === true,
        stockVerifiedAt
    });
    const stock = stockVerified ? Number(product.stock) : null;

    return {
        ...product,
        id: String(product.id),
        slug: product.slug || String(product.id),
        categorySlug,
        priceMAD,
        oldPriceMAD,
        price: oldPriceMAD || priceMAD,
        promoPrice: oldPriceMAD ? priceMAD : null,
        priceSource: priceMAD !== null ? priceSource : null,
        priceVerifiedAt: priceMAD !== null ? priceVerifiedAt : null,
        shortDescription: product.shortDescription || product.description || 'Produit de parapharmacie a confirmer avant expedition.',
        image,
        imageUrl: image,
        imageNeedsReview: product.imageNeedsReview ?? false,
        imageSource: product.imageSource || 'Backend API',
        imageRightsStatus: product.imageRightsStatus || 'owned-or-approved',
        imageReplacementNote: product.imageReplacementNote || '',
        active: product.active !== false,
        stockStatus: stockVerified
            ? (product.stockStatus || (stock === 0 ? 'Rupture de stock' : 'En stock'))
            : 'Disponibilité à confirmer',
        stock,
        stockVerified,
        stockVerifiedAt: stockVerified ? stockVerifiedAt : null,
        deliveryEligible: typeof product.deliveryEligible === 'boolean' ? product.deliveryEligible : null
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
