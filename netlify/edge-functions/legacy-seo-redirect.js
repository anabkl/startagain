import { catalogApiIdBySlug } from '../../js/catalog-api-id-map.js';

const CANONICAL_ORIGIN = 'https://parapharmacie.me';
const catalogSlugByApiId = Object.fromEntries(
    Object.entries(catalogApiIdBySlug).map(([slug, apiId]) => [apiId, slug])
);
const categoryRoutes = {
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
};

function permanentRedirect(pathname, configure) {
    const destination = new URL(pathname, `${CANONICAL_ORIGIN}/`);
    configure?.(destination);
    return Response.redirect(destination, 301);
}

export default async function legacySeoRedirect(request) {
    const url = new URL(request.url);

    if (url.pathname === '/product.html') {
        const requestedId = url.searchParams.get('id') || '';
        const slug = catalogApiIdBySlug[requestedId]
            ? requestedId
            : catalogSlugByApiId[requestedId];
        return permanentRedirect(slug ? `/produits/${encodeURIComponent(slug)}/` : '/boutique/');
    }

    if (url.pathname === '/shop.html') {
        const category = url.searchParams.get('category') || '';
        if (categoryRoutes[category]) return permanentRedirect(categoryRoutes[category]);

        const search = url.searchParams.get('q')?.trim();
        return permanentRedirect('/boutique/', search
            ? (destination) => destination.searchParams.set('q', search)
            : undefined);
    }

    return undefined;
}
