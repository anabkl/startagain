// Central, single source of truth for verified business identity: used by
// the raw storefront pages (index.html, footer/header markup duplicated in
// scripts/generate-seo-pages.mjs), the generated SEO pages, and structured
// data (JSON-LD).
//
// Every field below was explicitly confirmed by the business owner on
// BUSINESS_DATA_VERIFIED_DATE. Do not add fields that were not part of that
// verification (email address, additional coordinates, stock, EAN/GTIN,
// return terms, etc.) — follow the same confirmed/value/note gate already
// used by js/returns-policy-data.js for anything still unverified.
//
// GEO was resolved read-only from MAPS_URL: the short link redirects
// unambiguously to a single Google Maps place named "PHARMACIE TAWFIQ",
// with the @lat,lng in the redirect URL matching the precise !3d/!4d values
// in the same URL. Do not edit GEO without re-resolving MAPS_URL the same
// way, and remove GEO entirely (do not guess) if a future resolution is
// ever ambiguous.

export const BUSINESS_DATA_VERIFIED_DATE = '2026-07-16';

// The public ecommerce brand — what customers see as "the website/store".
export const BRAND = Object.freeze({
    name: 'Parapharmacie.me',
    url: 'https://parapharmacie.me/',
    logo: 'https://parapharmacie.me/assets/images/logo-head.png'
});

// The owner-confirmed legal/physical operator behind the ecommerce brand.
// Kept distinct from BRAND on purpose: "Parapharmacie.me" is the storefront
// name customers browse online; "PHARMACIE TAWFIQ" is the real sign name
// and legal/physical operator of the store in Khouribga.
export const OPERATOR = Object.freeze({
    legalName: 'PHARMACIE TAWFIQ',
    displayName: 'Pharmacie Tawfiq'
});

export const CONTACT = Object.freeze({
    phone: Object.freeze({
        e164: '+212521130339',
        display: '05 21 13 03 39',
        href: 'tel:+212521130339'
    }),
    whatsapp: Object.freeze({
        e164: '+212675698351',
        display: '06 75 69 83 51',
        href: 'https://wa.me/212675698351'
    })
});

export const ADDRESS = Object.freeze({
    streetAddress: '251, Ancienne Médina du Séchage',
    addressLocality: 'Khouribga',
    postalCode: '25010',
    addressCountry: 'MA',
    countryName: 'Maroc',
    full: '251, Ancienne Médina du Séchage, Khouribga 25010, Maroc'
});

export const GEO = Object.freeze({ latitude: 32.880939, longitude: -6.8961967 });

export const MAPS_URL = 'https://maps.app.goo.gl/TbTSUacj462VrfZv5';

// Google's key-less embeddable Maps URL built from the same verified GEO
// coordinates above. Do not swap this for an API-key embed without owner
// sign-off on billing; do not change the coordinates without re-resolving
// MAPS_URL per the note at the top of this file.
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${GEO.latitude},${GEO.longitude}&z=16&output=embed`;

export const SERVICE_AREA = 'Khouribga et les environs';

// A real, owner-confirmed photo of the physical storefront (matches
// OPERATOR.legalName signage exactly: "PHARMACIE TAWFIQ" over the shopfront
// in assets/images/photopharamcie.png). This is a genuine photo, not a
// stock or generic illustration, so it is safe to use as structured-data
// `image` and as a real photo on public pages.
export const STOREFRONT_PHOTO = Object.freeze({
    path: '/assets/images/photopharamcie.png',
    url: 'https://parapharmacie.me/assets/images/photopharamcie.png',
    width: 577,
    height: 433,
    alt: `Façade de ${OPERATOR.legalName} à ${ADDRESS.addressLocality}, parapharmacie et matériel médical`
});

// Sunday is deliberately absent: it is closed, and schema.org's convention
// for closed days is to omit them from openingHoursSpecification rather
// than emit a zero-length range.
export const OPENING_HOURS = Object.freeze([
    Object.freeze({ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '12:30' }),
    Object.freeze({ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '15:30', closes: '20:00' }),
    Object.freeze({ days: ['Saturday'], opens: '09:00', closes: '12:30' })
]);

export const OPENING_HOURS_DISPLAY = Object.freeze([
    'Lundi – Vendredi : 09:00–12:30 et 15:30–20:00',
    'Samedi : 09:00–12:30',
    'Dimanche : Fermé'
]);

export const DELIVERY = Object.freeze({
    local: Object.freeze({ area: 'Khouribga et les environs proches', feeMAD: 15 }),
    other: Object.freeze({ area: 'Autres villes marocaines desservies', feeMAD: 35 })
});

// The ONLY city explicitly confirmed by the owner for the 15 MAD local
// rate is Khouribga itself. Surrounding communes referenced elsewhere as
// SEO keywords (Oued Zem, Boujniba, Boulanouare — see
// js/catalog-data.js's localCityKeywords) are geographically close but
// have NOT been confirmed by the owner as qualifying for the local rate.
// Do not add a city here without an explicit owner confirmation for that
// exact name — guessing "surrounding communes" is exactly what this list
// exists to prevent.
//
// STILL NEEDED FROM OWNER: an explicit yes/no per commune — at minimum
// Oued Zem, Boujniba, and Boulanouare — before any of them can move from
// the 35 MAD "other" tier into this 15 MAD local list.
export const LOCAL_DELIVERY_ZONE_CITIES = Object.freeze(['Khouribga']);

function normalizeCityName(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

// Resolves a free-text city input to a delivery zone. Everything that is
// not an explicitly verified local city (see LOCAL_DELIVERY_ZONE_CITIES)
// falls into the "other Moroccan cities" tier — this is an intentional
// two-tier partition already described by DELIVERY, not a guess about
// which specific other cities are covered.
export function resolveDeliveryZone(cityInput) {
    const normalized = normalizeCityName(cityInput);
    const isLocal = normalized.length > 0
        && LOCAL_DELIVERY_ZONE_CITIES.some((city) => normalizeCityName(city) === normalized);
    return isLocal
        ? { zone: 'local', feeMAD: DELIVERY.local.feeMAD, area: DELIVERY.local.area }
        : { zone: 'other', feeMAD: DELIVERY.other.feeMAD, area: DELIVERY.other.area };
}

// `active` reflects what the checkout actually offers today. `planned`
// methods must never be presented as selectable on any public-facing page.
export const PAYMENT = Object.freeze({
    active: Object.freeze(['cod']),
    planned: Object.freeze(['cmi', 'apple_pay'])
});

// Normalized (tracking-parameter-free) social profile URLs. Facebook's
// `?id=...` query string is the profile identifier itself, not a tracking
// parameter — it stays.
export const SOCIAL = Object.freeze({
    instagram: 'https://www.instagram.com/para_pharmacie_tawfiq/',
    facebook: 'https://www.facebook.com/profile.php?id=100095397014781'
});

export function openingHoursSpecification() {
    return OPENING_HOURS.map((slot) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [...slot.days],
        opens: slot.opens,
        closes: slot.closes
    }));
}

export function organizationSchema() {
    return {
        '@type': 'Organization',
        '@id': `${BRAND.url}#organization`,
        name: BRAND.name,
        url: BRAND.url,
        logo: BRAND.logo,
        sameAs: [SOCIAL.instagram, SOCIAL.facebook]
    };
}

export function pharmacySchema() {
    return {
        '@type': 'Pharmacy',
        '@id': `${BRAND.url}#pharmacy`,
        name: OPERATOR.legalName,
        brand: { '@id': `${BRAND.url}#organization` },
        url: BRAND.url,
        telephone: CONTACT.phone.e164,
        address: {
            '@type': 'PostalAddress',
            streetAddress: ADDRESS.streetAddress,
            addressLocality: ADDRESS.addressLocality,
            postalCode: ADDRESS.postalCode,
            addressCountry: ADDRESS.addressCountry
        },
        geo: { '@type': 'GeoCoordinates', latitude: GEO.latitude, longitude: GEO.longitude },
        hasMap: MAPS_URL,
        areaServed: SERVICE_AREA,
        image: STOREFRONT_PHOTO.url,
        openingHoursSpecification: openingHoursSpecification()
    };
}
