import {
    getCatalogProduct,
    getEffectivePrice,
    getProductAvailabilityLabel,
    getProductImage,
    getProductImageAlt,
    isProductUnavailable
} from './catalog.js';
import { productAvailability, productGtin } from './product-schema.js';
import { absoluteSiteUrl, categoryRoute, productRoute } from './seo-routes.js';
import { formatCurrency, showToast } from './utils.js';
import { getCart, saveCart } from './main.js';

const detail = document.getElementById('product-detail');
const loading = document.getElementById('product-loading');
const relatedGrid = document.getElementById('related-grid');
const relatedSection = document.getElementById('related-section');

let currentProduct = null;
let quantity = 1;

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function updateQty(delta) {
    quantity = Math.max(1, Math.min(20, quantity + delta));
    const value = document.getElementById('qty-val');
    if (value) value.textContent = quantity;
    syncWhatsAppLink();
}

function addProductToCart(event) {
    event?.preventDefault();
    if (!currentProduct || isProductUnavailable(currentProduct)) return;

    const cart = getCart();
    const existing = cart.find((item) => item.id === currentProduct.id);

    if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
    } else {
        cart.push({
            ...currentProduct,
            effectivePrice: getEffectivePrice(currentProduct),
            quantity
        });
    }

    saveCart(cart);
    showToast(`"${currentProduct.name}" a ete ajoute au panier.`, 'success');
}

function getWhatsAppUrl() {
    const price = getEffectivePrice(currentProduct || {});
    const priceLine = price === null ? 'Prix: a confirmer' : `Prix verifie: ${formatCurrency(price)}`;
    const message = `Bonjour parapharmacie.me, je souhaite commander ou demander la disponibilite de: ${currentProduct?.name || ''}\nQuantite: ${quantity}\n${priceLine}\nLien: ${window.location.href}`;
    return `https://wa.me/212675698351?text=${encodeURIComponent(message)}`;
}

function syncWhatsAppLink() {
    const link = detail?.querySelector('[data-product-action="whatsapp"]');
    if (link) link.href = getWhatsAppUrl();
}

function setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
}

function setCanonical(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
    }
    canonical.href = url;
}

function upsertJsonLd(id, data) {
    let script = document.getElementById(id);
    if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);
}

function updateProductSeo(product, price) {
    const hasVerifiedPrice = price !== null;
    const canOrder = !isProductUnavailable(product);
    const availabilityLabel = getProductAvailabilityLabel(product);
    const description = hasVerifiedPrice
        ? `${product.name} par ${product.brand}, référence ${product.category} à ${formatCurrency(price)}, prix vérifié. ${availabilityLabel}.`
        : `${product.name} par ${product.brand}, référence ${product.category}. Prix et disponibilité à confirmer.`;
    const title = `${product.name} | Parapharmacie.me`;
    const productUrl = absoluteSiteUrl(productRoute(product));
    const imageUrl = product.imageNeedsReview
        ? absoluteSiteUrl('/.netlify/images?url=/assets/images/photopharamcie.png&w=1200&h=630&fit=cover&fm=webp&q=80')
        : absoluteSiteUrl(`/${getProductImage(product).replace(/^\/+/, '')}`);

    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', imageUrl);
    setMeta('meta[property="og:url"]', 'content', productUrl);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setCanonical(productUrl);

    const availability = productAvailability(product);
    const gtin = productGtin(product);
    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description,
        ...(product.sku ? { sku: product.sku } : {}),
        brand: {
            '@type': 'Brand',
            name: product.brand
        },
        category: product.category,
        url: productUrl,
        ...(canOrder ? {
            offers: {
                '@type': 'Offer',
                price: Number(price).toFixed(2),
                priceCurrency: 'MAD',
                url: productUrl,
                seller: {
                    '@type': 'Organization',
                    name: 'Parapharmacie.me',
                    url: 'https://parapharmacie.me/'
                },
                ...(availability ? { availability } : {})
            }
        } : {})
    };

    if (gtin) productSchema.gtin = gtin;
    if (!product.imageNeedsReview) productSchema.image = [imageUrl];

    upsertJsonLd('product-jsonld', productSchema);
    upsertJsonLd('breadcrumb-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Accueil',
                item: absoluteSiteUrl('/')
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Boutique',
                item: absoluteSiteUrl('/boutique/')
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: product.category || 'Parapharmacie Maroc',
                item: absoluteSiteUrl(categoryRoute(product.categorySlug))
            },
            {
                '@type': 'ListItem',
                position: 4,
                name: product.name,
                item: productUrl
            }
        ]
    });
}

function renderProduct(product) {
    currentProduct = product;
    quantity = 1;
    const price = getEffectivePrice(product);
    const unavailable = isProductUnavailable(product);
    updateProductSeo(product, price);

    detail.innerHTML = `
        <div class="product-detail__info" data-reveal>
            <nav class="breadcrumb" aria-label="Fil d'Ariane">
                <a href="/">Accueil</a>
                <span>/</span>
                <a href="/boutique/">Boutique</a>
                <span>/</span>
                <a href="${categoryRoute(product.categorySlug)}">${escapeHtml(product.category)}</a>
                <span>/</span>
                <span>${escapeHtml(product.name)}</span>
            </nav>
            <p class="eyebrow">Parapharmacie Maroc</p>
            <h1>${escapeHtml(product.name)}</h1>
            <p class="product-detail__brand">Marque : <a href="/boutique/?q=${encodeURIComponent(product.brand || '')}">${escapeHtml(product.brand || 'Non renseignée')}</a></p>
            <div class="product-detail__price">
                <strong>${formatCurrency(price)}</strong>
            </div>
            <p class="product-detail__stock ${unavailable ? 'out' : ''}">${price === null ? 'Prix à confirmer' : 'Prix vérifié'} · ${escapeHtml(getProductAvailabilityLabel(product))}</p>
            <div class="product-detail__purchase">
                ${unavailable ? '' : `<div class="qty-control product-detail__qty" aria-label="Quantite">
                    <button class="qty-control__btn" type="button" data-qty="-1" aria-label="Diminuer la quantite">-</button>
                    <span class="qty-control__value" id="qty-val">1</span>
                    <button class="qty-control__btn" type="button" data-qty="1" aria-label="Augmenter la quantite">+</button>
                </div>`}
                <button class="btn btn--primary ${unavailable ? 'is-disabled' : ''}" id="btn-add-cart" type="button" data-product-action="add-to-cart" ${unavailable ? 'aria-disabled="true" disabled' : ''}>
                    <i class="fa-solid fa-cart-plus"></i>
                    ${unavailable ? 'Commande en ligne indisponible' : 'Ajouter au panier'}
                </button>
                <a class="btn btn--whatsapp" href="${getWhatsAppUrl()}" target="_blank" rel="noreferrer" data-product-action="whatsapp">
                    <i class="fa-brands fa-whatsapp"></i>
                    Confirmer par WhatsApp
                </a>
            </div>
            <p class="product-detail__description">${escapeHtml(product.name)} est une référence ${escapeHtml(product.category)} de la marque ${escapeHtml(product.brand)}. Le prix final et la disponibilité sont confirmés avant commande.</p>
            <div class="product-detail__trust">
                <span><i class="fa-solid fa-tag"></i> ${price === null ? 'Prix à confirmer' : 'Prix vérifié en MAD'}</span>
                <span><i class="fa-solid fa-circle-check"></i> ${escapeHtml(getProductAvailabilityLabel(product))}</span>
                <span><i class="fa-solid fa-notes-medical"></i> Information non médicale</span>
            </div>
            <div class="product-detail__note">
                <strong>Information responsable :</strong> aucune composition, indication ou promesse médicale n’est ajoutée sans donnée fabricant vérifiée. Consultez l’emballage et la notice.
            </div>
        </div>
        <div class="product-detail__media product-image-frame" data-image-review="${product.imageNeedsReview ? 'true' : 'false'}" data-reveal>
            <span class="product-detail__badge">${escapeHtml(product.category)}</span>
            <img src="${escapeHtml(getProductImage(product))}" alt="${escapeHtml(getProductImageAlt(product))}" loading="eager" fetchpriority="high" decoding="async" width="720" height="720">
            ${product.imageNeedsReview ? '<span class="product-image-frame__notice product-image-frame__notice--large">Visuel générique de catégorie</span>' : ''}
        </div>
    `;

    detail.querySelectorAll('[data-qty]').forEach((button) => {
        button.addEventListener('click', () => updateQty(Number(button.dataset.qty)));
    });
    detail.querySelector('[data-product-action="add-to-cart"]')?.addEventListener('click', addProductToCart);
    document.dispatchEvent(new CustomEvent('content:updated'));
}

function renderRelated(products) {
    if (!relatedGrid || !relatedSection || !currentProduct) return;

    const related = products
        .filter((product) => product.id !== currentProduct.id && product.categorySlug === currentProduct.categorySlug)
        .slice(0, 4);

    if (related.length === 0) return;

    relatedGrid.innerHTML = related.map((product) => `
        <a href="${productRoute(product)}" class="related-card">
            <img src="${escapeHtml(getProductImage(product))}" alt="${escapeHtml(getProductImageAlt(product))}" loading="lazy" decoding="async" width="320" height="320">
            <span>${escapeHtml(product.category)}</span>
            <strong>${escapeHtml(product.name)}</strong>
            <em>${formatCurrency(getEffectivePrice(product))}</em>
        </a>
    `).join('');

    relatedSection.style.display = 'block';
    document.dispatchEvent(new CustomEvent('content:updated'));
}

async function initProduct() {
    const productId = new URLSearchParams(window.location.search).get('id');

    if (!productId) {
        window.location.href = '/boutique/';
        return;
    }

    const { product, products } = await getCatalogProduct(productId);
    if (!product) {
        loading.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <h1>Produit introuvable</h1>
                <p>Ce produit n'est plus disponible. Continuez vers la boutique pour decouvrir la selection actuelle.</p>
                <a class="btn btn--primary" href="/boutique/">Voir la boutique</a>
            </div>
        `;
        return;
    }

    loading.style.display = 'none';
    detail.style.display = 'grid';
    renderProduct(product);
    renderRelated(products);
}

document.addEventListener('DOMContentLoaded', initProduct);
