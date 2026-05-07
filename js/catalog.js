import { isFirebaseEnabled } from './runtime-config.js';
import {
    catalogProducts,
    categories,
    getCategoryMeta,
    getCategorySlug,
    localCityKeywords,
    productImageFallbacks
} from './catalog-data.js';

const FALLBACK_IMAGE = 'assets/products/product-placeholder.svg';
export const LOCAL_PRODUCT_OVERRIDES_KEY = 'parapharmacie_product_overrides';
const CATEGORY_ALIASES = {
    'soins-visage': 'visage',
    'produits-cosmetiques': 'visage',
    'hygiene-bien-etre': 'hygiene',
    complements: 'supplements',
    'complements-alimentaires': 'supplements',
    'para-medical': 'paramedical',
    sante: 'sante'
};

export { categories, getCategorySlug, localCityKeywords };
export const mockProducts = catalogProducts;

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
    return product?.image || product?.imageUrl || productImageFallbacks[product?.categorySlug] || FALLBACK_IMAGE;
}

export function getCategoryLabel(value, locale = 'fr') {
    const meta = getCategoryMeta(value);
    return locale === 'ar' ? meta.arabicName : meta.name;
}

export function getCategoryUrl(value) {
    return `categorie/${encodeURIComponent(getCategorySlug(value))}/`;
}

export function getProductUrl(product) {
    return `produit/${encodeURIComponent(product?.slug || product?.id || '')}/`;
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
    const categorySlug = getCategorySlug(next.category || next.categorySlug);
    const categoryMeta = getCategoryMeta(categorySlug);
    const priceMAD = coerceOptionalNumber(next.priceMAD ?? next.promoPrice ?? next.price, product.priceMAD);
    const oldPriceMAD = coerceOptionalNumber(next.oldPriceMAD, null);
    const hasPromo = oldPriceMAD && priceMAD && oldPriceMAD > priceMAD;
    const image = next.image || next.imageUrl || productImageFallbacks[categorySlug] || FALLBACK_IMAGE;

    return {
        ...next,
        category: categorySlug,
        categoryLabel: categoryMeta.name,
        categoryArabicName: categoryMeta.arabicName,
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
        product.categoryLabel,
        product.categoryArabicName,
        product.shortDescription,
        product.description,
        product.tags,
        product.searchKeywords,
        product.cityKeywords
    ]).join(' '));

    return search.split(/\s+/).every((word) => haystack.includes(word));
}

export function matchesCategory(product, categorySlug) {
    if (!categorySlug || categorySlug === 'all') return true;
    const normalizedCategory = CATEGORY_ALIASES[categorySlug] || getCategorySlug(categorySlug);
    return product.categorySlug === normalizedCategory || product.category === normalizedCategory;
}

function normalizeExternalProduct(product) {
    const priceMAD = Number(product.priceMAD || product.promoPrice || product.price || 0);
    const oldPriceMAD = Number(product.oldPriceMAD || product.price || 0);
    const categorySlug = getCategorySlug(product.category || product.categorySlug);
    const categoryMeta = getCategoryMeta(categorySlug);

    return {
        ...product,
        slug: product.slug || product.id,
        category: categorySlug,
        categoryLabel: categoryMeta.name,
        categoryArabicName: categoryMeta.arabicName,
        categorySlug,
        priceMAD,
        oldPriceMAD: oldPriceMAD > priceMAD ? oldPriceMAD : null,
        shortDescription: product.shortDescription || product.description || 'Produit de parapharmacie a confirmer avant expedition.',
        image: product.image || product.imageUrl || FALLBACK_IMAGE,
        imageUrl: product.image || product.imageUrl || FALLBACK_IMAGE,
        imageNeedsReview: product.imageNeedsReview ?? true,
        imageSource: product.imageSource || 'Firebase product image source pending documentation',
        imageRightsStatus: product.imageRightsStatus || 'needs-rights-review',
        imageReplacementNote: product.imageReplacementNote || 'Confirm ecommerce usage rights before production launch.',
        active: product.active !== false,
        stockStatus: product.stockStatus || (product.stock === 0 ? 'Rupture de stock' : 'En stock')
    };
}

async function loadFirebaseProducts() {
    const [{ db }, firestore] = await Promise.all([
        import('./firebase.js'),
        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js')
    ]);
    const snap = await firestore.getDocs(firestore.collection(db, 'products'));
    return snap.docs.map((doc) => normalizeExternalProduct({ id: doc.id, ...doc.data() }));
}

function withTimeout(promise, timeoutMs = 3000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('Firebase catalog timeout')), timeoutMs);
        })
    ]);
}

export async function getCatalogProducts() {
    if (!isFirebaseEnabled()) {
        return { products: applyLocalProductOverrides(catalogProducts), source: 'local-catalog' };
    }

    try {
        const firebaseProducts = await withTimeout(loadFirebaseProducts());
        const publicProducts = firebaseProducts.filter((product) => product.type !== 'pack' && product.active !== false);

        if (publicProducts.length > 0) {
            return { products: applyLocalProductOverrides(publicProducts), source: 'firebase' };
        }
    } catch (error) {
        console.info('Using local production catalog:', error?.message || error);
    }

    return { products: applyLocalProductOverrides(catalogProducts), source: 'local-catalog' };
}

export async function getCatalogProduct(id) {
    const { products, source } = await getCatalogProducts();
    return {
        product: products.find((item) => item.id === id || item.slug === id) || null,
        products,
        source
    };
}
