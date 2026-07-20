import { publishedArticles } from './articles-data.js';

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

// City/local landing pages. Kept separate from TRUST_PAGE_ROUTES because
// these use their own dedicated builder (map, local FAQ, local JSON-LD)
// instead of the generic prose trust-page template — see
// scripts/generate-seo-pages.mjs's buildKhouribgaPage().
export const KHOURIBGA_ROUTE = '/parapharmacie-khouribga/';
export const LOCAL_LANDING_ROUTES = Object.freeze([KHOURIBGA_ROUTE]);

export const CONSEILS_INDEX_ROUTE = '/conseils/';

// Computed from js/articles-data.js so this list can never drift from what
// generate-seo-pages.mjs actually builds — unlike TRUST_PAGE_ROUTES, which
// is hand-maintained alongside a separate `trustPages` array.
export const ARTICLE_ROUTES = Object.freeze([
    CONSEILS_INDEX_ROUTE,
    ...publishedArticles.map((article) => `/conseils/${article.slug}/`)
]);

// Deliberately NOT part of TRUST_PAGE_ROUTES or ARTICLE_ROUTES: no approved
// returns policy exists yet (see js/returns-policy-data.js), so this route
// must stay out of the sitemap and noindexed until the business confirms
// the policy fields. Only validate.mjs's generatedRoutes should reference
// this export (to avoid a false "broken internal link" from footer/trust
// page links) — never generate-sitemap.mjs or validate-seo.mjs's
// expectedPaths.
export const RETURNS_ROUTE = '/retours-remboursements/';

export function articleRoute(articleOrSlug) {
    const slug = typeof articleOrSlug === 'string' ? articleOrSlug : articleOrSlug?.slug;
    return slug ? `/conseils/${encodeURIComponent(slug)}/` : CONSEILS_INDEX_ROUTE;
}

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
