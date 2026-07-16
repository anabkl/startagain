import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { catalogProducts, categories } from '../js/catalog-data.js';
import { catalogApiIdBySlug } from '../js/catalog-api-id-map.js';
import { articles, DEFAULT_AUTHOR, DISCLAIMER_TEXT } from '../js/articles-data.js';
import { returnsPolicy } from '../js/returns-policy-data.js';
import {
    ADDRESS,
    CONTACT,
    DELIVERY,
    MAPS_URL,
    OPENING_HOURS_DISPLAY,
    OPERATOR,
    SERVICE_AREA,
    SOCIAL,
    organizationSchema,
    pharmacySchema
} from '../js/business-config.js';
import {
    absoluteSiteUrl,
    ARTICLE_ROUTES,
    articleRoute,
    CATEGORY_ROUTE_MAP,
    categoryRoute,
    CONSEILS_INDEX_ROUTE,
    productRoute,
    RETURNS_ROUTE,
    SITE_ORIGIN,
    TRUST_PAGE_ROUTES
} from '../js/seo-routes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultOutputDir = path.join(root, 'dist');

const categorySeo = {
    visage: {
        h1: 'Soins visage au Maroc',
        title: 'Soins visage au Maroc | Parapharmacie.me',
        description: 'Découvrez les références visage du catalogue Parapharmacie.me, avec marques, formats et prix indicatifs en MAD.'
    },
    corps: {
        h1: 'Soins corps au Maroc',
        title: 'Soins corps au Maroc | Parapharmacie.me',
        description: 'Parcourez les soins corps référencés sur Parapharmacie.me, avec prix indicatifs en MAD et disponibilité à confirmer.'
    },
    cheveux: {
        h1: 'Soins cheveux au Maroc',
        title: 'Soins cheveux au Maroc | Parapharmacie.me',
        description: 'Retrouvez les références du catalogue liées aux cheveux, avec leur catégorie principale, leur marque et leur prix indicatif.'
    },
    'bebe-maman': {
        h1: 'Bébé et maman au Maroc',
        title: 'Bébé et maman au Maroc | Parapharmacie.me',
        description: 'Explorez les références bébé et maman du catalogue, avec marques, formats et prix indicatifs affichés en MAD.'
    },
    solaire: {
        h1: 'Protection solaire au Maroc',
        title: 'Protection solaire au Maroc | Parapharmacie.me',
        description: 'Comparez les références solaires du catalogue Parapharmacie.me, leurs formats et leurs prix indicatifs en MAD.'
    },
    hygiene: {
        h1: 'Hygiène et soins quotidiens',
        title: 'Hygiène au Maroc | Parapharmacie.me',
        description: 'Consultez les produits d’hygiène référencés sur Parapharmacie.me avec marques, formats et prix indicatifs en MAD.'
    },
    sante: {
        h1: 'Santé et bien-être : références catalogue',
        title: 'Santé et bien-être au Maroc | Parapharmacie.me',
        description: 'Consultez les références santé et bien-être du catalogue. Ces informations ne remplacent pas un avis médical.'
    },
    'complements-alimentaires': {
        h1: 'Compléments alimentaires au Maroc',
        title: 'Compléments alimentaires au Maroc | Parapharmacie.me',
        description: 'Découvrez les compléments alimentaires référencés, leurs marques, formats et prix indicatifs en MAD.'
    },
    homme: {
        h1: 'Soins homme au Maroc',
        title: 'Soins homme au Maroc | Parapharmacie.me',
        description: 'Parcourez les références homme du catalogue Parapharmacie.me avec marque, format et prix indicatif en MAD.'
    },
    bio: {
        h1: 'Produits classés Bio dans le catalogue',
        title: 'Produits Bio au Maroc | Parapharmacie.me',
        description: 'Consultez les références classées Bio dans le catalogue. Les labels et caractéristiques restent ceux du nom commercial affiché.'
    },
    'para-medical': {
        h1: 'Matériel paramédical au Maroc',
        title: 'Matériel paramédical au Maroc | Parapharmacie.me',
        description: 'Retrouvez les références paramédicales du catalogue. Respectez la notice et demandez un avis professionnel si nécessaire.'
    },
    promotions: {
        h1: 'Références classées en promotions',
        title: 'Promotions parapharmacie au Maroc | Parapharmacie.me',
        description: 'Consultez les références classées en promotions. Prix, cadeaux et conditions sont à confirmer avant toute commande.'
    }
};

function contactCardsHtml(headingTag = 'h2') {
    return `<div class="seo-contact-grid">
                <a class="trust-card" href="${CONTACT.phone.href}"><i class="fa-solid fa-phone"></i><${headingTag}>Téléphone</${headingTag}><p>${escapeHtml(CONTACT.phone.display)}</p></a>
                <a class="trust-card" href="${CONTACT.whatsapp.href}" rel="noreferrer"><i class="fa-brands fa-whatsapp"></i><${headingTag}>WhatsApp</${headingTag}><p>${escapeHtml(CONTACT.whatsapp.display)}</p></a>
                <a class="trust-card" href="${MAPS_URL}" rel="noreferrer" target="_blank"><i class="fa-solid fa-location-dot"></i><${headingTag}>Adresse</${headingTag}><p>${escapeHtml(ADDRESS.full)}</p></a>
            </div>`;
}

const trustPages = [
    {
        route: '/a-propos/',
        title: 'À propos de Parapharmacie.me',
        description: 'Comprendre le fonctionnement du catalogue Parapharmacie.me, ses sources, ses limites et son processus de commande.',
        eyebrow: 'Transparence',
        h1: 'À propos de Parapharmacie.me',
        content: `
            <p>Parapharmacie.me présente un catalogue de références disponibles sur le marché marocain, avec des prix affichés en dirhams. Le site permet de parcourir les produits, de préparer un panier et de transmettre une demande de commande.</p>
            <h2>Ce que le catalogue permet de vérifier</h2>
            <ul>
                <li>le nom commercial de la référence, sa marque et sa catégorie ;</li>
                <li>le format lorsqu’il figure dans le nom du produit ;</li>
                <li>un prix catalogue indicatif en MAD.</li>
            </ul>
            <h2>Une présentation volontairement prudente</h2>
            <p>La disponibilité, le prix final et les modalités de remise ou de livraison sont confirmés avant la finalisation. Les visuels génériques sont signalés comme tels. Aucune note, aucun avis client ni aucune promesse médicale ne sont inventés.</p>
            <p>Les informations produit servent à identifier une référence. Elles ne remplacent ni la notice du fabricant, ni le conseil d’un pharmacien, d’un médecin ou d’un autre professionnel de santé.</p>`
    },
    {
        route: '/contact/',
        title: 'Contact | Parapharmacie.me',
        description: 'Contactez Pharmacie Tawfiq à Khouribga par téléphone ou WhatsApp pour confirmer une référence, un prix ou une commande.',
        eyebrow: 'Nous contacter',
        h1: 'Contact Parapharmacie.me',
        content: `
            <p>Parapharmacie.me est le site du catalogue en ligne de ${escapeHtml(OPERATOR.displayName)}, à Khouribga. Utilisez les coordonnées ci-dessous pour demander la confirmation d’une référence, d’un prix ou d’une commande.</p>
            ${contactCardsHtml('h2')}
            <h2>Adresse et horaires</h2>
            <p>${escapeHtml(ADDRESS.full)}</p>
            <ul>
                ${OPENING_HOURS_DISPLAY.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
            </ul>
            <p>Zone de service : ${escapeHtml(SERVICE_AREA)}. Retrouvez-nous aussi sur <a href="${SOCIAL.instagram}" rel="noreferrer" target="_blank">Instagram</a> et <a href="${SOCIAL.facebook}" rel="noreferrer" target="_blank">Facebook</a>.</p>
            <p>Le site ne publie pas de délai de réponse garanti. N’envoyez pas d’informations médicales sensibles par WhatsApp. Pour une urgence ou un avis médical, contactez un professionnel de santé adapté.</p>`
    },
    {
        route: '/livraison/',
        title: 'Commande et livraison | Parapharmacie.me',
        description: 'Frais de livraison Parapharmacie.me : 15 MAD à Khouribga et les environs, 35 MAD vers les autres villes du Maroc desservies.',
        eyebrow: 'Avant de commander',
        h1: 'Commande et modalités de livraison',
        content: `
            <p>Le formulaire de commande demande une ville et une adresse afin de préparer la demande.</p>
            <h2>Frais de livraison</h2>
            <ul>
                <li>${escapeHtml(DELIVERY.local.area)} : ${DELIVERY.local.feeMAD} MAD</li>
                <li>${escapeHtml(DELIVERY.other.area)} : ${DELIVERY.other.feeMAD} MAD</li>
            </ul>
            <p>Le délai de livraison précis et la couverture exacte hors de ces zones restent à confirmer au moment de la commande. Le paiement s’effectue actuellement à la livraison ; le paiement en ligne CMI et Apple Pay sont prévus mais pas encore actifs.</p>
            <h2>Étapes affichées par le site</h2>
            <ol>
                <li>Ajoutez les références souhaitées au panier.</li>
                <li>Renseignez les coordonnées nécessaires à la demande.</li>
                <li>Le prix final, la disponibilité et les modalités applicables sont confirmés avant expédition.</li>
            </ol>
            <p>Une demande enregistrée ne doit pas être interprétée comme une garantie immédiate de stock ou de livraison. En cas de doute, utilisez la <a href="/contact/">page de contact</a> avant de transmettre la commande.</p>`
    },
    {
        route: '/confidentialite/',
        title: 'Confidentialité et données | Parapharmacie.me',
        description: 'Informations factuelles sur les données utilisées par le panier, le compte et la commande Parapharmacie.me.',
        eyebrow: 'Données utilisées',
        h1: 'Confidentialité et données personnelles',
        content: `
            <p>Cette notice décrit les données utilisées par le fonctionnement actuel du site. Parapharmacie.me ne demande pas d’informations médicales pour constituer un panier ou enregistrer une demande de commande.</p>
            <h2>Données utilisées</h2>
            <p>Le panier est enregistré dans le navigateur. Lors d’une création de compte ou d’une commande, le site peut traiter le nom, l’e-mail, le numéro de téléphone ou WhatsApp, la ville, l’adresse et le contenu de la commande.</p>
            <h2>Services sollicités</h2>
            <p>Le site communique avec son API pour le catalogue, le compte et les commandes. Si vous choisissez le bouton WhatsApp, vous quittez Parapharmacie.me et les règles de confidentialité de WhatsApp s’appliquent.</p>
            <h2>Vos choix et vos demandes</h2>
            <p>Vous pouvez vider votre panier et les données locales depuis votre navigateur. Pour une question, une demande d’accès, de rectification ou de suppression concernant les données transmises, contactez-nous par <a href="${CONTACT.whatsapp.href}" rel="noreferrer">WhatsApp</a> ou par <a href="${CONTACT.phone.href}">téléphone</a>. N’envoyez pas d’informations médicales sensibles par ce canal.</p>`
    },
    {
        route: '/conditions-utilisation/',
        title: 'Conditions d’utilisation | Parapharmacie.me',
        description: 'Règles d’utilisation factuelles du catalogue, des prix indicatifs, du panier et des informations de santé.',
        eyebrow: 'Utilisation du site',
        h1: 'Conditions d’utilisation',
        content: `
            <h2>Catalogue et prix</h2>
            <p>Les noms, marques, catégories, formats et prix servent à identifier les références du catalogue. Les prix sont indicatifs et doivent être confirmés avec la disponibilité avant la finalisation d’une commande.</p>
            <h2>Commande</h2>
            <p>Le panier et le formulaire transmettent une demande. Les modalités applicables, dont les éventuels frais, sont confirmées avant expédition. Le paiement à la livraison apparaît comme option dans l’interface, sous réserve de confirmation pour la commande concernée.</p>
            <h2>Visuels et informations produit</h2>
            <p>Un visuel marqué comme générique illustre une catégorie et non le conditionnement exact du produit. Consultez l’emballage et la notice fournis avec la référence.</p>
            <h2>Information de santé</h2>
            <p>Le contenu ne constitue ni un diagnostic, ni une prescription, ni une promesse de traitement. Demandez un avis professionnel adapté à votre situation.</p>`
    }
];

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function jsonLd(data) {
    return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function formatPrice(value) {
    return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Number(value || 0));
}

function productImage(product) {
    return `/${String(product.image || 'assets/products/product-placeholder.svg').replace(/^\/+/, '')}`;
}

function productImageAlt(product) {
    return product.imageNeedsReview
        ? `Illustration générique de la catégorie ${product.category} pour la référence ${product.name}`
        : `Conditionnement de ${product.name}`;
}

function extractFormat(product) {
    const matches = String(product.name).match(/\b\d+(?:[,.]\d+)?\s?(?:ml|l|g|mg|comprimés?|gélules?|ampoules?|tests?|bandelettes?)\b/gi);
    return matches?.join(' · ') || null;
}

function productDescription(product) {
    const format = extractFormat(product);
    const formatText = format ? ` Le format indiqué est ${format}.` : '';
    return `${product.name} est une référence ${product.category} de la marque ${product.brand}.${formatText} Son prix catalogue est ${formatPrice(product.priceMAD)} ; le prix final et la disponibilité sont à confirmer avant commande.`;
}

function productMetaDescription(product) {
    return `${product.name} par ${product.brand} : ${formatPrice(product.priceMAD)} à titre indicatif sur Parapharmacie.me. Disponibilité et prix final à confirmer.`;
}

function productsForCategory(category) {
    if (category.slug !== 'cheveux') {
        return catalogProducts.filter((product) => product.categorySlug === category.slug);
    }

    const hairPattern = /cheveu|capillaire|shampoo|anti-chute|antichute|hair/i;
    return catalogProducts.filter((product) => hairPattern.test([
        product.name,
        product.category,
        ...(product.tags || []),
        ...(product.searchKeywords || [])
    ].join(' ')));
}

function header() {
    return `
        <header class="site-header">
            <div class="header__top-bar">
                <div class="container">
                    <span><i class="fa-solid fa-tag"></i> Prix affichés en MAD</span>
                    <span><i class="fa-solid fa-circle-check"></i> Disponibilité confirmée avant commande</span>
                    <span><i class="fa-solid fa-notes-medical"></i> Information non médicale</span>
                </div>
            </div>
            <div class="header__main">
                <div class="container header__main-inner">
                    <a href="/" class="header__logo" aria-label="Parapharmacie.me — accueil">
                        <img src="/assets/images/logo-head.png" alt="Parapharmacie.me" width="64" height="65">
                        <span><strong>parapharmacie.me</strong><small>Catalogue au Maroc</small></span>
                    </a>
                    <form class="header__search" role="search" action="/boutique/" method="get">
                        <input type="search" class="header__search-input" name="q" placeholder="Rechercher une marque ou une référence" aria-label="Rechercher dans le catalogue">
                        <button class="header__search-btn" type="submit" aria-label="Lancer la recherche"><i class="fa-solid fa-magnifying-glass"></i></button>
                    </form>
                    <nav class="header__actions" aria-label="Actions rapides">
                        <a href="/login.html" class="header__action-btn"><i class="fa-regular fa-user"></i><span>Compte</span></a>
                        <a href="/cart.html" class="header__action-btn header__cart"><i class="fa-solid fa-bag-shopping"></i><span class="header__cart-count" id="cart-count">0</span><span>Panier</span></a>
                        <button class="header__mobile-toggle" id="menuToggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false"><span></span><span></span><span></span></button>
                    </nav>
                </div>
            </div>
            <nav class="header__nav" id="mainNav" aria-label="Navigation principale">
                <div class="container"><ul class="header__nav-list">
                    <li><a href="/">Accueil</a></li>
                    <li><a href="/boutique/">Boutique</a></li>
                    <li><a href="${CATEGORY_ROUTE_MAP.visage}">Visage</a></li>
                    <li><a href="${CATEGORY_ROUTE_MAP.solaire}">Solaire</a></li>
                    <li><a href="${CATEGORY_ROUTE_MAP['bebe-maman']}">Bébé et maman</a></li>
                    <li><a href="${CATEGORY_ROUTE_MAP['complements-alimentaires']}">Compléments</a></li>
                    <li><a href="${CONSEILS_INDEX_ROUTE}">Conseils</a></li>
                    <li><a href="/a-propos/">À propos</a></li>
                </ul></div>
            </nav>
        </header>`;
}

function footer() {
    return `
        <footer class="footer">
            <div class="container footer__grid">
                <div>
                    <a href="/" class="footer__brand"><img src="/assets/images/logo-head.png" alt="Parapharmacie.me" width="56" height="57"><span>parapharmacie.me</span></a>
                    <p>Catalogue de parapharmacie au Maroc. Prix en MAD et disponibilité à confirmer avant commande.</p>
                </div>
                <div><h2>Boutique</h2>
                    <a href="${CATEGORY_ROUTE_MAP.visage}">Soins visage</a>
                    <a href="${CATEGORY_ROUTE_MAP.corps}">Soins corps</a>
                    <a href="${CATEGORY_ROUTE_MAP.solaire}">Protection solaire</a>
                    <a href="${CATEGORY_ROUTE_MAP['bebe-maman']}">Bébé et maman</a>
                    <a href="${CATEGORY_ROUTE_MAP['complements-alimentaires']}">Compléments alimentaires</a>
                </div>
                <div><h2>Informations</h2>
                    <a href="/a-propos/">À propos</a>
                    <a href="/contact/">Contact</a>
                    <a href="${CONSEILS_INDEX_ROUTE}">Conseils</a>
                    <a href="/livraison/">Commande et livraison</a>
                    <a href="${RETURNS_ROUTE}">Retours et remboursements</a>
                    <a href="/confidentialite/">Confidentialité</a>
                    <a href="/conditions-utilisation/">Conditions d’utilisation</a>
                </div>
                <div><h2>${escapeHtml(OPERATOR.displayName)}</h2>
                    <address class="footer__address">${escapeHtml(ADDRESS.streetAddress)}<br>${escapeHtml(ADDRESS.addressLocality)} ${escapeHtml(ADDRESS.postalCode)}, ${escapeHtml(ADDRESS.countryName)}</address>
                    <a href="${CONTACT.phone.href}">${escapeHtml(CONTACT.phone.display)}</a>
                    <a href="${CONTACT.whatsapp.href}" rel="noreferrer">WhatsApp : ${escapeHtml(CONTACT.whatsapp.display)}</a>
                    <a href="${MAPS_URL}" rel="noreferrer">Voir sur Google Maps</a>
                    <p class="footer__hours">${OPENING_HOURS_DISPLAY.map(escapeHtml).join('<br>')}</p>
                    <div class="footer__social">
                        <a href="${SOCIAL.instagram}" rel="noreferrer" aria-label="Instagram ${escapeHtml(OPERATOR.displayName)}"><i class="fa-brands fa-instagram"></i></a>
                        <a href="${SOCIAL.facebook}" rel="noreferrer" aria-label="Facebook ${escapeHtml(OPERATOR.displayName)}"><i class="fa-brands fa-facebook"></i></a>
                    </div>
                </div>
            </div>
            <div class="footer__bottom"><div class="container">© 2026 Parapharmacie.me — information produit sans conseil médical.</div></div>
        </footer>`;
}

function documentHtml({ title, description, canonicalPath, content, schemas = [], robots = 'index, follow', bodyClass = '', ogType = 'website' }) {
    const canonical = absoluteSiteUrl(canonicalPath);
    const socialImage = absoluteSiteUrl('/.netlify/images?url=/assets/images/photopharamcie.png&w=1200&h=630&fit=cover&fm=webp&q=80');
    return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:locale" content="fr_MA">
    <meta property="og:type" content="${escapeHtml(ogType)}">
    <meta property="og:site_name" content="Parapharmacie.me">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${escapeHtml(socialImage)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(socialImage)}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#0f7f64">
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap">
    ${schemas.map(jsonLd).join('\n    ')}
</head>
<body${bodyClass ? ` class="${escapeHtml(bodyClass)}"` : ''}>
    ${header()}
    ${content}
    ${footer()}
    <a href="${CONTACT.whatsapp.href}" class="whatsapp-float" rel="noreferrer" aria-label="Contacter Parapharmacie.me sur WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
    <script type="module" src="/js/main.js"></script>
    <script type="module" src="/js/static-storefront.js"></script>
</body>
</html>`;
}

function breadcrumbSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: absoluteSiteUrl(item.path)
        }))
    };
}

function visibleBreadcrumb(items) {
    return `<nav class="breadcrumb" aria-label="Fil d’Ariane">${items.map((item, index) => (
        index === items.length - 1
            ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
            : `<a href="${item.path}">${escapeHtml(item.name)}</a><span aria-hidden="true">/</span>`
    )).join('')}</nav>`;
}

function productCard(product) {
    return `
        <article class="product-card" data-product-card data-category="${escapeHtml(product.categorySlug)}" data-search="${escapeHtml([product.name, product.brand, product.category].join(' ').toLowerCase())}">
            <a href="${productRoute(product)}" class="product-card__media product-image-frame" data-image-review="${product.imageNeedsReview ? 'true' : 'false'}" aria-label="Voir la fiche de ${escapeHtml(product.name)}">
                <span class="product-card__badge">${escapeHtml(product.category)}</span>
                <img src="${productImage(product)}" alt="${escapeHtml(productImageAlt(product))}" loading="lazy" decoding="async" width="720" height="720">
                ${product.imageNeedsReview ? '<span class="product-image-frame__notice">Visuel générique</span>' : ''}
            </a>
            <div class="product-card__body">
                <div class="product-card__meta"><span>${escapeHtml(product.category)}</span><span class="product-card__stock">À confirmer</span></div>
                <a href="${productRoute(product)}" class="product-card__title">${escapeHtml(product.name)}</a>
                <p class="product-card__brand">${escapeHtml(product.brand)}</p>
                <p class="product-card__description">Prix catalogue indicatif ; disponibilité à confirmer avant commande.</p>
                <div class="product-card__footer">
                    <div class="product-card__price"><strong>${formatPrice(product.priceMAD)}</strong><small>prix indicatif</small></div>
                    <button class="icon-btn" type="button" data-seo-add-product="${escapeHtml(product.id)}" aria-label="Ajouter ${escapeHtml(product.name)} au panier"><i class="fa-solid fa-cart-plus"></i></button>
                </div>
            </div>
        </article>`;
}

function categoryLinks(activeSlug = null) {
    return `<nav class="category-pills" aria-label="Catégories du catalogue">
        <a class="category-pill${activeSlug ? '' : ' active'}" href="/boutique/">Toutes les références</a>
        ${categories.map((category) => `<a class="category-pill${activeSlug === category.slug ? ' active' : ''}" href="${categoryRoute(category)}">${escapeHtml(category.name)}</a>`).join('')}
    </nav>`;
}

function buildBoutiquePage() {
    const pathName = '/boutique/';
    const title = `Boutique parapharmacie au Maroc | ${catalogProducts.length} références`;
    const description = `Explorez ${catalogProducts.length} références de parapharmacie au Maroc avec marques, catégories et prix indicatifs en MAD.`;
    const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: 'Boutique', path: pathName }];
    const content = `
        <main>
            <section class="page-hero"><div class="container page-hero__grid"><div>
                <p class="eyebrow">Catalogue au Maroc</p>
                <h1>Boutique parapharmacie en ligne au Maroc</h1>
                <p>${catalogProducts.length} références sont présentées avec leur marque, leur catégorie et un prix catalogue indicatif en MAD. La disponibilité et le prix final sont confirmés avant commande.</p>
            </div><div class="page-hero__badge"><i class="fa-solid fa-list-check"></i> Catalogue pré-rendu et consultable</div></div></section>
            <section class="section"><div class="container">
                ${visibleBreadcrumb(breadcrumbs)}
                <div class="seo-catalog-tools">
                    <label for="catalog-filter">Filtrer les ${catalogProducts.length} références</label>
                    <input id="catalog-filter" type="search" placeholder="Nom, marque ou catégorie" autocomplete="off">
                    <p id="catalog-filter-status" aria-live="polite">${catalogProducts.length} références affichées</p>
                </div>
                ${categoryLinks()}
                <div class="products__grid" id="seo-products-grid">${catalogProducts.map(productCard).join('')}</div>
            </div></section>
        </main>`;
    return documentHtml({
        title,
        description,
        canonicalPath: pathName,
        content,
        schemas: [breadcrumbSchema(breadcrumbs)]
    });
}

function buildCategoryPage(category) {
    const products = productsForCategory(category);
    const seo = categorySeo[category.slug];
    const route = categoryRoute(category);
    const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))].slice(0, 5);
    const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: 'Boutique', path: '/boutique/' }, { name: seo.h1, path: route }];
    const specialNote = category.slug === 'cheveux'
        ? 'Cette sélection transversale rassemble les références dont le nom ou les repères du catalogue mentionnent les cheveux ; leur catégorie principale reste affichée sur chaque carte.'
        : category.slug === 'promotions'
            ? 'Ces références sont classées « Promotions » dans le catalogue. La validité des prix, cadeaux ou remises doit être confirmée avant commande.'
            : `Cette page regroupe les références classées « ${category.name} » dans le catalogue.`;
    const content = `
        <main>
            <section class="page-hero"><div class="container page-hero__grid"><div>
                <p class="eyebrow">Catégorie catalogue</p>
                <h1>${escapeHtml(seo.h1)}</h1>
                <p>${escapeHtml(specialNote)} ${products.length} référence${products.length > 1 ? 's' : ''} actuellement listée${products.length > 1 ? 's' : ''}${brands.length ? `, notamment ${escapeHtml(brands.join(', '))}` : ''}.</p>
            </div><div class="page-hero__badge"><i class="fa-solid fa-circle-info"></i> Prix et disponibilité à confirmer</div></div></section>
            <section class="section"><div class="container">
                ${visibleBreadcrumb(breadcrumbs)}
                ${categoryLinks(category.slug)}
                <div class="section-header"><div><p class="eyebrow">Sélection ${escapeHtml(category.name)}</p><h2>${products.length} référence${products.length > 1 ? 's' : ''} à comparer</h2></div><a class="section-header__link" href="/boutique/">Voir tout le catalogue <i class="fa-solid fa-arrow-right"></i></a></div>
                <div class="products__grid">${products.map(productCard).join('')}</div>
                <aside class="seo-medical-note"><strong>Information responsable</strong><p>Les noms et formats servent à identifier les références. Consultez l’étiquette et la notice ; pour une question de santé, demandez un avis professionnel.</p></aside>
            </div></section>
        </main>`;
    return documentHtml({
        title: seo.title,
        description: seo.description,
        canonicalPath: route,
        content,
        schemas: [breadcrumbSchema(breadcrumbs)]
    });
}

function buildProductPage(product) {
    const route = productRoute(product);
    const categoryPath = categoryRoute(product.categorySlug);
    const description = productDescription(product);
    const format = extractFormat(product);
    const breadcrumbs = [
        { name: 'Accueil', path: '/' },
        { name: 'Boutique', path: '/boutique/' },
        { name: product.category, path: categoryPath },
        { name: product.name, path: route }
    ];
    const related = catalogProducts
        .filter((candidate) => candidate.id !== product.id && candidate.categorySlug === product.categorySlug)
        .slice(0, 4);
    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description,
        sku: product.id,
        brand: { '@type': 'Brand', name: product.brand },
        category: product.category,
        url: absoluteSiteUrl(route),
        offers: {
            '@type': 'Offer',
            url: absoluteSiteUrl(route),
            price: Number(product.priceMAD).toFixed(2),
            priceCurrency: 'MAD',
            seller: { '@type': 'Organization', name: 'Parapharmacie.me', url: `${SITE_ORIGIN}/` }
        }
    };
    if (!product.imageNeedsReview) productSchema.image = [absoluteSiteUrl(productImage(product))];

    const content = `
        <main class="section product-page" data-static-product-page data-product-id="${escapeHtml(product.id)}">
            <div class="container">
                ${visibleBreadcrumb(breadcrumbs)}
                <article class="product-detail">
                    <div class="product-detail__info">
                        <p class="eyebrow">${escapeHtml(product.category)}</p>
                        <h1>${escapeHtml(product.name)}</h1>
                        <p class="product-detail__brand">Marque : <a href="/boutique/?q=${encodeURIComponent(product.brand)}">${escapeHtml(product.brand)}</a></p>
                        <div class="product-detail__price"><strong>${formatPrice(product.priceMAD)}</strong></div>
                        <p class="product-detail__stock">Prix catalogue indicatif · Disponibilité à confirmer</p>
                        <div class="product-detail__purchase">
                            <div class="qty-control product-detail__qty" aria-label="Quantité">
                                <button class="qty-control__btn" type="button" data-static-qty="-1" aria-label="Diminuer la quantité">−</button>
                                <span class="qty-control__value" data-static-qty-value>1</span>
                                <button class="qty-control__btn" type="button" data-static-qty="1" aria-label="Augmenter la quantité">+</button>
                            </div>
                            <button class="btn btn--primary" type="button" data-seo-add-product="${escapeHtml(product.id)}"><i class="fa-solid fa-cart-plus"></i> Ajouter au panier</button>
                            <a class="btn btn--whatsapp" href="${CONTACT.whatsapp.href}?text=${encodeURIComponent(`Bonjour, je souhaite confirmer la disponibilité de ${product.name} (${route})`)}" rel="noreferrer"><i class="fa-brands fa-whatsapp"></i> Confirmer par WhatsApp</a>
                        </div>
                        <p class="product-detail__description">${escapeHtml(description)}</p>
                        <dl class="seo-product-facts">
                            <div><dt>Marque</dt><dd><a href="/boutique/?q=${encodeURIComponent(product.brand)}">${escapeHtml(product.brand)}</a></dd></div>
                            <div><dt>Catégorie</dt><dd><a href="${categoryPath}">${escapeHtml(product.category)}</a></dd></div>
                            ${format ? `<div><dt>Format indiqué</dt><dd>${escapeHtml(format)}</dd></div>` : ''}
                            <div><dt>Prix</dt><dd>${formatPrice(product.priceMAD)} — indicatif</dd></div>
                            <div><dt>Disponibilité</dt><dd>À confirmer avant commande</dd></div>
                        </dl>
                        <div class="product-detail__note"><strong>Information produit :</strong> aucune composition, indication, contre-indication ou promesse médicale n’est ajoutée sans donnée fabricant vérifiée. Consultez l’emballage et la notice.</div>
                    </div>
                    <div class="product-detail__media product-image-frame" data-image-review="${product.imageNeedsReview ? 'true' : 'false'}">
                        <span class="product-detail__badge">${escapeHtml(product.category)}</span>
                        <img src="${productImage(product)}" alt="${escapeHtml(productImageAlt(product))}" loading="eager" fetchpriority="high" decoding="async" width="720" height="720">
                        ${product.imageNeedsReview ? '<span class="product-image-frame__notice product-image-frame__notice--large">Visuel générique de catégorie</span>' : ''}
                    </div>
                </article>
                ${related.length ? `<section class="related-section"><div class="section-header"><div><p class="eyebrow">Même catégorie</p><h2>Références liées</h2></div></div><div class="related-grid">${related.map((item) => `<a href="${productRoute(item)}" class="related-card"><img src="${productImage(item)}" alt="${escapeHtml(productImageAlt(item))}" loading="lazy" width="320" height="320"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.name)}</strong><em>${formatPrice(item.priceMAD)}</em></a>`).join('')}</div></section>` : ''}
            </div>
        </main>`;
    return documentHtml({
        title: `${product.name} | Parapharmacie.me`,
        description: productMetaDescription(product),
        canonicalPath: route,
        content,
        ogType: 'product',
        schemas: [productSchema, breadcrumbSchema(breadcrumbs)]
    });
}

function buildTrustPage(page) {
    const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: page.h1, path: page.route }];
    const content = `<main><section class="page-hero"><div class="container"><p class="eyebrow">${escapeHtml(page.eyebrow)}</p><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p></div></section><section class="section"><div class="container seo-prose">${visibleBreadcrumb(breadcrumbs)}${page.content}</div></section></main>`;
    return documentHtml({
        title: page.title,
        description: page.description,
        canonicalPath: page.route,
        content,
        schemas: [breadcrumbSchema(breadcrumbs)]
    });
}

function slugifyHeading(text) {
    return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function formatFrenchDate(isoDate) {
    return new Date(isoDate).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function faqSchema(faq) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a }
        }))
    };
}

function articleTableOfContents(sections) {
    if (sections.length < 3) return '';
    return `<nav class="article-toc" aria-label="Sommaire de l’article">
        <h2>Sommaire</h2>
        <ol>${sections.map((section) => `<li><a href="#${slugifyHeading(section.heading)}">${escapeHtml(section.heading)}</a></li>`).join('')}</ol>
    </nav>`;
}

function articleSections(sections) {
    return sections.map((section) => `
        <section class="article-section">
            <h2 id="${slugifyHeading(section.heading)}">${escapeHtml(section.heading)}</h2>
            <p>${section.body}</p>
        </section>`).join('');
}

function articleFaqSection(faq) {
    if (!faq.length) return '';
    return `<section class="article-faq">
        <h2>Questions fréquentes</h2>
        ${faq.map((item) => `<article class="faq__item"><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p></article>`).join('')}
    </section>`;
}

function articleSourcesSection(sources) {
    if (!sources.length) return '';
    return `<section class="article-sources">
        <h2>Sources et références</h2>
        <ul>${sources.map((source) => `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(source.label)}</a></li>`).join('')}</ul>
    </section>`;
}

function articleDisclaimer() {
    return `<aside class="seo-medical-note"><strong>Information responsable</strong><p>${escapeHtml(DISCLAIMER_TEXT)}</p></aside>`;
}

function relatedArticlesSection(article) {
    const related = (article.relatedArticleSlugs || [])
        .map((slug) => articles.find((item) => item.slug === slug))
        .filter(Boolean);
    if (!related.length) return '';
    return `<section class="related-section">
        <div class="section-header"><div><p class="eyebrow">Pour aller plus loin</p><h2>Articles liés</h2></div></div>
        <div class="related-grid">
            ${related.map((item) => `<a href="${articleRoute(item)}" class="related-card"><img src="${escapeHtml(item.heroImage)}" alt="${escapeHtml(item.title)}" loading="lazy" width="320" height="180"><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.title)}</strong></a>`).join('')}
        </div>
    </section>`;
}

function relatedProductsSection(article) {
    const products = catalogProducts.filter((product) => product.categorySlug === article.categorySlug).slice(0, 4);
    if (!products.length) return '';
    return `<section class="related-section">
        <div class="section-header"><div><p class="eyebrow">Références catalogue</p><h2>Produits ${escapeHtml(article.category)}</h2></div><a class="section-header__link" href="${categoryRoute(article.categorySlug)}">Voir la catégorie <i class="fa-solid fa-arrow-right"></i></a></div>
        <div class="products__grid">${products.map(productCard).join('')}</div>
    </section>`;
}

function buildArticlePage(article) {
    const route = articleRoute(article);
    const breadcrumbs = [
        { name: 'Accueil', path: '/' },
        { name: 'Conseils', path: CONSEILS_INDEX_ROUTE },
        { name: article.title, path: route }
    ];

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.description,
        image: [absoluteSiteUrl(article.heroImage)],
        datePublished: article.publishedDate,
        dateModified: article.updatedDate,
        author: { '@type': 'Organization', name: article.author },
        publisher: { '@type': 'Organization', name: 'Parapharmacie.me', url: `${SITE_ORIGIN}/` },
        mainEntityOfPage: absoluteSiteUrl(route)
    };

    const schemas = [articleSchema, breadcrumbSchema(breadcrumbs)];
    if (article.faq?.length) schemas.push(faqSchema(article.faq));

    const content = `
        <main class="section article-page">
            <div class="container">
                ${visibleBreadcrumb(breadcrumbs)}
                <article class="article-detail">
                    <header class="article-detail__header">
                        <p class="eyebrow">${escapeHtml(article.category)}</p>
                        <h1>${escapeHtml(article.title)}</h1>
                        <p class="article-detail__lede">${escapeHtml(article.description)}</p>
                        <div class="article-meta">
                            <span><i class="fa-regular fa-user" aria-hidden="true"></i> ${escapeHtml(article.author)}</span>
                            <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> Publié le ${escapeHtml(formatFrenchDate(article.publishedDate))}</span>
                            ${article.updatedDate && article.updatedDate !== article.publishedDate ? `<span><i class="fa-solid fa-rotate" aria-hidden="true"></i> Mis à jour le ${escapeHtml(formatFrenchDate(article.updatedDate))}</span>` : ''}
                            <span><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapeHtml(String(article.readingTimeMinutes))} min de lecture</span>
                        </div>
                    </header>
                    <img class="article-detail__hero" src="${escapeHtml(article.heroImage)}" alt="Illustration de la catégorie ${escapeHtml(article.category)}" loading="eager" fetchpriority="high" decoding="async" width="1200" height="675">
                    ${articleTableOfContents(article.sections)}
                    <div class="article-detail__body">
                        ${articleSections(article.sections)}
                    </div>
                    ${articleFaqSection(article.faq || [])}
                    ${articleDisclaimer()}
                    ${articleSourcesSection(article.sources || [])}
                </article>
                ${relatedProductsSection(article)}
                ${relatedArticlesSection(article)}
            </div>
        </main>`;

    return documentHtml({
        title: `${article.title} | Conseils Parapharmacie.me`,
        description: article.description,
        canonicalPath: route,
        content,
        ogType: 'article',
        schemas
    });
}

function buildConseilsIndexPage() {
    const route = CONSEILS_INDEX_ROUTE;
    const title = 'Conseils parapharmacie au Maroc | Parapharmacie.me';
    const description = `Guides pratiques et non médicaux sur les soins visage, la protection solaire, les cheveux et l’hygiène quotidienne, rédigés pour un public marocain.`;
    const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: 'Conseils', path: route }];
    const categoriesInArticles = [...new Set(articles.map((article) => article.category))];

    const articleCard = (article) => `
        <a href="${articleRoute(article)}" class="article-card" data-reveal>
            <img src="${escapeHtml(article.heroImage)}" alt="Illustration de la catégorie ${escapeHtml(article.category)}" loading="lazy" decoding="async" width="480" height="270">
            <div class="article-card__body">
                <span class="article-card__category">${escapeHtml(article.category)}</span>
                <h3>${escapeHtml(article.title)}</h3>
                <p>${escapeHtml(article.description)}</p>
                <span class="article-card__meta"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapeHtml(String(article.readingTimeMinutes))} min</span>
            </div>
        </a>`;

    const groupedSections = categoriesInArticles.map((category) => {
        const items = articles.filter((article) => article.category === category);
        return `
            <section class="conseils-category-group" id="${slugifyHeading(category)}">
                <h2>${escapeHtml(category)}</h2>
                <div class="article-grid">${items.map(articleCard).join('')}</div>
            </section>`;
    }).join('');

    const content = `
        <main>
            <section class="page-hero"><div class="container page-hero__grid"><div>
                <p class="eyebrow">Contenu éditorial</p>
                <h1>Conseils parapharmacie au Maroc</h1>
                <p>Des guides pratiques et non médicaux sur les soins visage, la protection solaire, les cheveux et l’hygiène quotidienne, rédigés par ${escapeHtml(DEFAULT_AUTHOR)} pour un public marocain. Ce contenu ne remplace pas l’avis d’un pharmacien ou d’un professionnel de santé.</p>
            </div><div class="page-hero__badge"><i class="fa-solid fa-book-open"></i> ${articles.length} articles publiés</div></div></section>
            <section class="section"><div class="container">
                ${visibleBreadcrumb(breadcrumbs)}
                <nav class="category-pills" aria-label="Catégories de conseils">
                    ${categoriesInArticles.map((category) => `<a class="category-pill" href="#${slugifyHeading(category)}">${escapeHtml(category)}</a>`).join('')}
                </nav>
                ${groupedSections}
            </div></section>
        </main>`;

    return documentHtml({
        title,
        description,
        canonicalPath: route,
        content,
        schemas: [breadcrumbSchema(breadcrumbs)]
    });
}

function returnsFieldRow(label, field) {
    return `<div class="returns-field"><dt>${escapeHtml(label)}</dt><dd>${field.confirmed ? escapeHtml(String(field.value)) : '<em>En cours de confirmation</em>'}</dd></div>`;
}

function buildReturnsPage() {
    const route = RETURNS_ROUTE;
    const title = 'Retours et remboursements | Parapharmacie.me';
    const description = 'Politique de retour et de remboursement Parapharmacie.me : conditions en cours de finalisation, contactez-nous pour toute demande.';
    const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: 'Retours et remboursements', path: route }];

    const content = `
        <main><section class="page-hero"><div class="container">
            <p class="eyebrow">Après votre commande</p>
            <h1>Retours et remboursements</h1>
            <p>Cette page décrit la structure générale de notre politique de retour. Certaines conditions précises sont en cours de validation par la pharmacie et seront publiées dès leur confirmation.</p>
        </div></section>
        <section class="section"><div class="container seo-prose">
            ${visibleBreadcrumb(breadcrumbs)}
            <p class="seo-page-updated">Dernière mise à jour de cette page : ${escapeHtml(formatFrenchDate(returnsPolicy.lastReviewedDate))}</p>
            <div class="returns-status-note"><strong>Statut :</strong> les conditions détaillées de retour sont en cours de finalisation avec la pharmacie. En attendant leur publication, contactez-nous directement pour toute demande de retour ou de remboursement : nous traiterons votre demande au cas par cas.</div>
            <dl class="returns-fields">
                ${returnsFieldRow('Types de retour acceptés', returnsPolicy.acceptedReturnTypes)}
                ${returnsFieldRow('Délai de retour', returnsPolicy.returnWindowDays)}
                ${returnsFieldRow('Produits non ouverts non défectueux', returnsPolicy.unopenedNonDefectiveAccepted)}
                ${returnsFieldRow('Produits d’hygiène / cosmétiques ouverts', returnsPolicy.openedHygieneCosmeticPolicy)}
                ${returnsFieldRow('Échanges', returnsPolicy.exchangesAllowed)}
                ${returnsFieldRow('Frais de retour', returnsPolicy.returnShippingFeePolicy)}
                ${returnsFieldRow('Mode de remboursement', returnsPolicy.refundMethod)}
                ${returnsFieldRow('Délai de remboursement', returnsPolicy.refundProcessingTime)}
            </dl>
            <h2>Comment nous contacter pour un retour</h2>
            ${contactCardsHtml('h3')}
            <p>Pour toute demande, indiquez votre numéro de commande, la référence concernée et le motif de la demande. Nous reviendrons vers vous pour confirmer la marche à suivre.</p>
        </div></section></main>`;

    return documentHtml({
        title,
        description,
        canonicalPath: route,
        content,
        robots: 'noindex, follow',
        schemas: [breadcrumbSchema(breadcrumbs)]
    });
}

function buildNotFoundPage() {
    return documentHtml({
        title: 'Page introuvable | Parapharmacie.me',
        description: 'La page demandée est introuvable. Retrouvez le catalogue et les catégories Parapharmacie.me.',
        canonicalPath: '/404.html',
        robots: 'noindex, follow',
        content: `<main class="section"><div class="container"><div class="empty-state"><i class="fa-solid fa-compass"></i><p class="eyebrow">Erreur 404</p><h1>Cette page est introuvable</h1><p>Le lien a peut-être changé. Utilisez la boutique ou les catégories pour retrouver une référence.</p><a class="btn btn--primary" href="/boutique/">Voir la boutique</a></div></div></main>`
    });
}

async function writeRoute(outputDir, route, html) {
    const relative = route === '/404.html'
        ? '404.html'
        : path.join(route.replace(/^\/+|\/+$/g, ''), 'index.html');
    const destination = path.join(outputDir, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html);
}

async function writeRedirects(outputDir) {
    const lines = [
        '# Generated from the canonical catalog routes. Specific query rules must remain first.'
    ];

    for (const category of categories) {
        lines.push(`/shop.html category=${category.slug} ${categoryRoute(category)} 301!`);
    }

    for (const product of catalogProducts) {
        const canonical = productRoute(product);
        lines.push(`/product.html id=${product.id} ${canonical} 301!`);
        const apiId = catalogApiIdBySlug[product.id];
        if (apiId) lines.push(`/product.html id=${apiId} ${canonical} 301!`);
    }

    lines.push('/shop.html /boutique/ 301!');
    lines.push('/product.html /boutique/ 301!');
    lines.push('/index.html / 301!');
    lines.push('/* /404.html 404');
    await writeFile(path.join(outputDir, '_redirects'), `${lines.join('\n')}\n`);
}

async function injectHomepageProducts(outputDir) {
    const homepagePath = path.join(outputDir, 'index.html');
    const homepage = await readFile(homepagePath, 'utf8');
    const start = '<!-- seo:featured:start -->';
    const end = '<!-- seo:featured:end -->';
    if (!homepage.includes(start) || !homepage.includes(end)) {
        throw new Error('Homepage featured-product markers are missing.');
    }

    const featured = catalogProducts.filter((product) => product.featured).slice(0, 6);
    const selected = featured.length ? featured : catalogProducts.slice(0, 6);
    const replacement = `${start}\n${selected.map(productCard).join('')}\n                    ${end}`;
    await writeFile(homepagePath, homepage.replace(new RegExp(`${start}[\\s\\S]*?${end}`), replacement));
}

async function injectHomepageJsonLd(outputDir) {
    const homepagePath = path.join(outputDir, 'index.html');
    const homepage = await readFile(homepagePath, 'utf8');
    const start = '<!-- seo:jsonld:start -->';
    const end = '<!-- seo:jsonld:end -->';
    if (!homepage.includes(start) || !homepage.includes(end)) {
        throw new Error('Homepage JSON-LD markers are missing.');
    }

    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                '@id': 'https://parapharmacie.me/#website',
                name: 'Parapharmacie.me',
                url: 'https://parapharmacie.me/',
                inLanguage: 'fr-MA',
                publisher: { '@id': 'https://parapharmacie.me/#organization' },
                potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://parapharmacie.me/boutique/?q={search_term_string}',
                    'query-input': 'required name=search_term_string'
                }
            },
            organizationSchema(),
            pharmacySchema()
        ]
    };
    const replacement = `${start}\n    ${jsonLd(graph)}\n    ${end}`;
    await writeFile(homepagePath, homepage.replace(new RegExp(`${start}[\\s\\S]*?${end}`), replacement));
}

export async function generateSeoPages({ outputDir = defaultOutputDir } = {}) {
    await mkdir(outputDir, { recursive: true });
    await injectHomepageProducts(outputDir);
    await injectHomepageJsonLd(outputDir);
    await writeRoute(outputDir, '/boutique/', buildBoutiquePage());

    for (const category of categories) {
        await writeRoute(outputDir, categoryRoute(category), buildCategoryPage(category));
    }

    for (const product of catalogProducts) {
        await writeRoute(outputDir, productRoute(product), buildProductPage(product));
    }

    for (const page of trustPages) {
        await writeRoute(outputDir, page.route, buildTrustPage(page));
    }

    await writeRoute(outputDir, CONSEILS_INDEX_ROUTE, buildConseilsIndexPage());
    for (const article of articles) {
        await writeRoute(outputDir, articleRoute(article), buildArticlePage(article));
    }

    // Noindexed and deliberately excluded from the sitemap until the
    // pharmacy confirms the return-policy fields in js/returns-policy-data.js.
    await writeRoute(outputDir, RETURNS_ROUTE, buildReturnsPage());

    await writeRoute(outputDir, '/404.html', buildNotFoundPage());
    await writeRedirects(outputDir);

    if (trustPages.some((page) => !TRUST_PAGE_ROUTES.includes(page.route))) {
        throw new Error('Trust page routes are out of sync with js/seo-routes.js.');
    }

    const expectedArticleRoutes = [CONSEILS_INDEX_ROUTE, ...articles.map((article) => articleRoute(article))];
    if (expectedArticleRoutes.some((route) => !ARTICLE_ROUTES.includes(route))) {
        throw new Error('Article routes are out of sync with js/seo-routes.js.');
    }

    console.log(`Generated ${catalogProducts.length} product pages, ${categories.length} category pages, the boutique, trust pages, ${articles.length} conseils articles, the returns page, 404, and redirects.`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
    const outputArg = process.argv.find((argument) => argument.startsWith('--output='));
    const outputDir = outputArg ? path.resolve(outputArg.slice('--output='.length)) : defaultOutputDir;
    await generateSeoPages({ outputDir });
}
