export const SITE_ORIGIN = 'https://parapharmacie.me';

export const CATEGORY_ROUTE_MAP = Object.freeze({
    visage: '/soins-visage/',
    corps: '/soins-corps/',
    cheveux: '/soins-cheveux/',
    'bebe-maman': '/bebe-et-maman/',
    solaire: '/protection-solaire/',
    hygiene: '/hygiene/',
    sante: '/sante-bien-etre/',
    'complements-alimentaires': '/complements-alimentaires/',
    homme: '/soins-homme/',
    bio: '/produits-bio/',
    'para-medical': '/materiel-paramedical/',
    promotions: '/promotions/'
});

export const TRUST_PAGE_ROUTES = Object.freeze([
    '/a-propos/',
    '/contact/',
    '/livraison/',
    '/confidentialite/',
    '/conditions-utilisation/'
]);

export function categoryRoute(categoryOrSlug) {
    const slug = typeof categoryOrSlug === 'string'
        ? categoryOrSlug
        : categoryOrSlug?.slug;
    return CATEGORY_ROUTE_MAP[slug] || '/boutique/';
}

export function productRoute(productOrSlug) {
    const slug = typeof productOrSlug === 'string'
        ? productOrSlug
        : (productOrSlug?.slug || productOrSlug?.id);
    return slug ? `/produits/${encodeURIComponent(slug)}/` : '/boutique/';
}

export function absoluteSiteUrl(pathname = '/') {
    return new URL(pathname, `${SITE_ORIGIN}/`).href;
}
