import { catalogProducts, categories, localCityKeywords, productImageFallbacks } from './catalog-data.js';
import { catalogApiIdBySlug } from './catalog-api-id-map.js';
import { apiFetch } from './auth.js';

const FALLBACK_IMAGE = 'assets/products/product-placeholder.svg';
const UNVERIFIED_AVAILABILITY = 'Disponibilité à confirmer';
const CATEGORY_FALLBACK_IMAGES = new Set(Object.values(productImageFallbacks));
export const LOCAL_PRODUCT_OVERRIDES_KEY = 'parapharmacie_product_overrides';
const CATEGORY_ALIASES = {
    visage: 'visage',
    الوجه: 'visage',
    'العنايه بالوجه': 'visage',
    peau: 'visage',
    skin: 'visage',
    corps: 'corps',
    الجسم: 'corps',
    'العنايه بالجسم': 'corps',
    body: 'corps',
    cheveux: 'cheveux',
    الشعر: 'cheveux',
    'العنايه بالشعر': 'cheveux',
    hair: 'cheveux',
    'bebe-maman': 'bebe-maman',
    bebe: 'bebe-maman',
    maman: 'bebe-maman',
    baby: 'bebe-maman',
    'الام والطفل': 'bebe-maman',
    solaire: 'solaire',
    الشمس: 'solaire',
    'واقي الشمس': 'solaire',
    sun: 'solaire',
    hygiene: 'hygiene',
    النظافه: 'hygiene',
    sante: 'sante',
    الصحه: 'sante',
    health: 'sante',
    supplements: 'complements-alimentaires',
    'complements-alimentaires': 'complements-alimentaires',
    'مكملات غذائيه': 'complements-alimentaires',
    homme: 'homme',
    الرجل: 'homme',
    'العنايه بالرجل': 'homme',
    bio: 'bio',
    طبيعي: 'bio',
    paramedical: 'para-medical',
    'para-medical': 'para-medical',
    'شبه طبي': 'para-medical',
    promotions: 'promotions',
    promo: 'promotions',
    عروض: 'promotions',
    'soins-visage': 'visage',
    'produits-cosmetiques': 'visage',
    'hygiene-bien-etre': 'hygiene',
    complements: 'complements-alimentaires',
    sante: 'sante',
    'para-medical': 'para-medical'
};

export { categories, localCityKeywords };
export const mockProducts = catalogProducts;

const categorySlugByName = Object.fromEntries(categories.flatMap((category) => [
    [category.name, category.slug],
    [category.arabicName, category.slug],
    [category.slug, category.slug]
]));
const catalogProductBySlug = new Map(catalogProducts.map((product) => [product.slug, product]));
const catalogProductByName = new Map(catalogProducts.map((product) => [normalizeCatalogName(product.name), product]));
const catalogSlugByApiId = Object.fromEntries(
    Object.entries(catalogApiIdBySlug).map(([slug, apiId]) => [apiId, slug])
);

function getCategorySlug(category) {
    const raw = String(category || '').trim();
    const normalized = normalizeSearchText(raw)
        .replace(/&/g, ' ')
        .replace(/\s+/g, '-');
    return categorySlugByName[raw]
        || CATEGORY_ALIASES[raw]
        || CATEGORY_ALIASES[normalized]
        || normalized;
}

function normalizeCatalogName(name) {
    return normalizeSearchText(name)
        .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isCategoryFallbackImage(image) {
    return !image || image === FALLBACK_IMAGE || CATEGORY_FALLBACK_IMAGES.has(image);
}

function hasVerifiedInventory(product) {
    return product?.stockVerified === true
        || product?.inventoryVerified === true
        || product?.stock_status_verified === true;
}

function getPositiveNumber(...values) {
    for (const value of values) {
        const number = Number(value);
        if (Number.isFinite(number) && number > 0) return number;
    }
    return null;
}

function getLocalCatalogMatch(product) {
    const normalizedName = normalizeCatalogName(product?.name);
    return normalizedName ? catalogProductByName.get(normalizedName) || null : null;
}

export const trustBadges = [
    { icon: 'fa-list-check', title: '93 références', text: 'Le catalogue affiche le nom, la marque et la catégorie de chaque référence.' },
    { icon: 'fa-tag', title: 'Prix en MAD', text: 'Les prix catalogue sont indicatifs et confirmés avant la finalisation.' },
    { icon: 'fa-image', title: 'Visuels transparents', text: 'Les illustrations génériques sont clairement signalées comme telles.' },
    { icon: 'fa-circle-check', title: 'Confirmation préalable', text: 'Disponibilité, prix final et modalités sont vérifiés avant expédition.' }
];

export const faqs = [
    {
        question: 'Les prix affichés sont-ils définitifs ?',
        answer: 'Non. Ils servent de repère catalogue en MAD. Le prix final est confirmé avec la disponibilité avant la finalisation de la commande.'
    },
    {
        question: 'Comment connaître la disponibilité réelle ?',
        answer: 'La disponibilité n’est pas inventée à partir d’un stock par défaut. Elle doit être confirmée pour la référence choisie avant expédition.'
    },
    {
        question: 'Pourquoi certains visuels sont-ils génériques ?',
        answer: 'Les images de concurrents ne sont pas réutilisées sans droit. Une illustration de catégorie reste affichée jusqu’à la disponibilité d’un packshot autorisé.'
    },
    {
        question: 'Les fiches remplacent-elles un avis médical ?',
        answer: 'Non. Elles identifient les références du catalogue. Consultez l’emballage et la notice, puis demandez un avis professionnel adapté si nécessaire.'
    }
];

export function getProductImage(product) {
    return product?.image || product?.image_url || product?.imageUrl || productImageFallbacks[product?.categorySlug] || FALLBACK_IMAGE;
}

export function getProductImageAlt(product) {
    const image = getProductImage(product);
    if (product?.imageNeedsReview || isCategoryFallbackImage(image)) {
        const category = product?.category || 'parapharmacie';
        const name = product?.name ? ` pour la référence ${product.name}` : '';
        return `Illustration générique de la catégorie ${category}${name}`;
    }
    return product?.name || 'Produit de parapharmacie';
}

export function getProductAvailabilityLabel(product) {
    if (product?.stock === 0 || normalizeSearchText(product?.stockStatus).includes('rupture')) {
        return 'Rupture de stock';
    }

    if (!hasVerifiedInventory(product)) return UNVERIFIED_AVAILABILITY;
    return String(product?.stockStatus || 'En stock').trim() || 'En stock';
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
    const publicSlug = next.slug || next.id;
    const categorySlug = getCategorySlug(next.categorySlug || next.category);
    const priceMAD = coerceOptionalNumber(next.priceMAD ?? next.promoPrice ?? next.price, product.priceMAD);
    const oldPriceMAD = coerceOptionalNumber(next.oldPriceMAD, null);
    const hasPromo = oldPriceMAD && priceMAD && oldPriceMAD > priceMAD;
    const image = next.image || next.image_url || next.imageUrl || productImageFallbacks[categorySlug] || FALLBACK_IMAGE;
    const usesCategoryFallback = isCategoryFallbackImage(image);
    const stockVerified = hasVerifiedInventory(next);
    const candidateStock = coerceOptionalNumber(next.stock, null);
    const stock = stockVerified && candidateStock !== null && candidateStock >= 0 ? candidateStock : null;
    const stockStatus = stockVerified
        ? (next.stockStatus && next.stockStatus !== UNVERIFIED_AVAILABILITY
            ? next.stockStatus
            : (stock === 0 ? 'Rupture de stock' : 'En stock'))
        : UNVERIFIED_AVAILABILITY;

    return {
        ...next,
        apiId: next.apiId || catalogApiIdBySlug[publicSlug] || null,
        categorySlug,
        priceMAD,
        oldPriceMAD: hasPromo ? oldPriceMAD : null,
        price: hasPromo ? oldPriceMAD : priceMAD,
        promoPrice: hasPromo ? priceMAD : null,
        image,
        imageUrl: image,
        imageNeedsReview: usesCategoryFallback ? true : next.imageNeedsReview !== false,
        imageRightsStatus: usesCategoryFallback
            ? (next.imageRightsStatus || 'owned-fallback-needs-approved-product-packshot')
            : (next.imageRightsStatus || 'needs-rights-review'),
        active: next.active !== false,
        stockStatus,
        stock,
        stockVerified
    };
}

export function applyLocalProductOverrides(products, { includeInactive = false } = {}) {
    const overrides = getLocalProductOverrides();

    return products
        .map((product) => applyProductOverride(
            product,
            overrides[product.id] || overrides[product.apiId] || {}
        ))
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
    return normalizedCategory === 'all'
        || getCategorySlug(product.categorySlug || product.category) === normalizedCategory;
}

function normalizeApiProduct(product) {
    const localProduct = getLocalCatalogMatch(product);
    const publicId = localProduct?.slug || String(product.slug || product.id || '');
    const apiId = String(product.apiId || product.id || catalogApiIdBySlug[publicId] || '');
    const apiSlug = String(product.apiSlug || product.slug || apiId);
    const category = localProduct?.category || product.category || '';
    const categorySlug = localProduct?.categorySlug || getCategorySlug(product.categorySlug || category || 'all');

    const apiBasePrice = getPositiveNumber(product.priceMAD, product.price);
    const apiPromoPrice = getPositiveNumber(product.promoPrice, product.promo_price);
    const apiOldPrice = getPositiveNumber(product.oldPriceMAD, product.old_price_mad);
    let priceMAD = getPositiveNumber(localProduct?.priceMAD) || 0;
    let oldPriceMAD = getPositiveNumber(localProduct?.oldPriceMAD);

    if (apiBasePrice) {
        if (apiPromoPrice && apiPromoPrice < apiBasePrice) {
            priceMAD = apiPromoPrice;
            oldPriceMAD = apiBasePrice;
        } else {
            priceMAD = apiBasePrice;
            oldPriceMAD = apiOldPrice && apiOldPrice > apiBasePrice ? apiOldPrice : null;
        }
    }

    const hasPromo = Boolean(oldPriceMAD && oldPriceMAD > priceMAD);
    const apiImage = product.image || product.image_url || product.imageUrl || '';
    const image = apiImage || localProduct?.image || productImageFallbacks[categorySlug] || FALLBACK_IMAGE;
    const usesCategoryFallback = isCategoryFallbackImage(image);
    const imageMetadata = apiImage ? product : (localProduct || product);
    const imageRightsStatus = usesCategoryFallback
        ? (localProduct?.imageRightsStatus || 'owned-fallback-needs-approved-product-packshot')
        : (imageMetadata.imageRightsStatus || 'needs-rights-review');
    const hasApprovedImageRights = /approved|owned|licensed|authorized/i.test(imageRightsStatus);
    const imageNeedsReview = usesCategoryFallback
        || imageMetadata.imageNeedsReview !== false
        || !hasApprovedImageRights;

    const inventorySource = hasVerifiedInventory(product)
        ? product
        : (hasVerifiedInventory(localProduct) ? localProduct : null);
    const inventoryValue = inventorySource ? Number(inventorySource.stock) : null;
    const stock = Number.isFinite(inventoryValue) && inventoryValue >= 0 ? inventoryValue : null;
    const stockVerified = Boolean(inventorySource && stock !== null);
    const stockStatus = stockVerified
        ? (inventorySource.stockStatus || (stock === 0 ? 'Rupture de stock' : 'En stock'))
        : UNVERIFIED_AVAILABILITY;

    return {
        ...product,
        ...(localProduct || {}),
        id: publicId,
        slug: publicId,
        apiId,
        apiSlug,
        name: localProduct?.name || product.name || '',
        brand: localProduct?.brand || product.brand || '',
        category,
        categorySlug,
        priceMAD,
        oldPriceMAD: hasPromo ? oldPriceMAD : null,
        price: hasPromo ? oldPriceMAD : priceMAD,
        promoPrice: hasPromo ? priceMAD : null,
        promoBadge: hasPromo ? (product.promoBadge || localProduct?.promoBadge || 'Promo') : null,
        badge: hasPromo
            ? (product.promoBadge || localProduct?.promoBadge || 'Promo')
            : (localProduct?.featured ? 'Selection Tawfiq' : null),
        shortDescription: localProduct?.shortDescription
            || product.shortDescription
            || product.description
            || 'Produit de parapharmacie à confirmer avant expédition.',
        description: localProduct?.description
            || product.description
            || 'Produit de parapharmacie à confirmer avant expédition.',
        image,
        imageUrl: image,
        imageNeedsReview,
        imageSource: usesCategoryFallback
            ? (localProduct?.imageSource || 'Illustration de catégorie générée localement')
            : (imageMetadata.imageSource || 'Source du visuel à documenter'),
        imageRightsStatus,
        imageReplacementNote: imageMetadata.imageReplacementNote
            || 'Remplacer par un packshot autorisé avant de présenter ce visuel comme une photo produit.',
        active: product.active !== false && product.isPublished !== false,
        stockStatus,
        stock,
        stockVerified
    };
}

async function apiFetchWithTimeout(path, timeoutMs = 4000) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await apiFetch(path, { method: 'GET', signal: controller.signal });
    } finally {
        window.clearTimeout(timeout);
    }
}

async function loadApiProducts() {
    const data = await apiFetchWithTimeout('/products?per_page=100&page=1');
    return Array.isArray(data) ? data.map(normalizeApiProduct) : [];
}

export async function getCatalogProducts() {
    try {
        const apiProducts = await loadApiProducts();
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
    const requestedId = String(id || '');
    const requestedLocalSlug = catalogProductBySlug.has(requestedId)
        ? requestedId
        : catalogSlugByApiId[requestedId] || null;
    const apiLookupId = requestedLocalSlug
        ? (catalogApiIdBySlug[requestedLocalSlug] || requestedId)
        : requestedId;

    try {
        const product = await apiFetchWithTimeout(`/products/${encodeURIComponent(apiLookupId)}`, 4000);
        if (product?.id) {
            const normalized = normalizeApiProduct(product);
            if (!requestedLocalSlug || normalized.slug === requestedLocalSlug) {
                return {
                    product: applyLocalProductOverrides([normalized], { includeInactive: true })[0] || normalized,
                    products: [normalized],
                    source: 'api'
                };
            }
        }
    } catch {
        // fallback below
    }

    const { products, source } = await getCatalogProducts();
    const matchedProduct = products.find((item) => (
        item.id === requestedId
        || item.slug === requestedId
        || item.apiId === requestedId
        || (requestedLocalSlug && item.slug === requestedLocalSlug)
    ));

    if (matchedProduct) {
        return { product: matchedProduct, products, source };
    }

    if (requestedLocalSlug) {
        const localFallback = catalogProductBySlug.get(requestedLocalSlug);
        const product = applyLocalProductOverrides([localFallback], { includeInactive: true })[0] || localFallback;
        return { product, products: [product], source: 'local-catalog' };
    }

    return {
        product: null,
        products,
        source
    };
}
