import { getCatalogProduct, getEffectivePrice, getOldPrice, getProductImage, isProductUnavailable } from './catalog.js';
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
    syncCartFallbackLink();
}

function syncCartFallbackLink() {
    const link = document.getElementById('btn-add-cart');
    if (link && currentProduct) {
        link.href = `cart.html?add=${encodeURIComponent(currentProduct.id)}&qty=${quantity}`;
    }
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
    const message = `Bonjour parapharmacie.me, je souhaite commander ou demander la disponibilite de: ${currentProduct?.name || ''}\nQuantite: ${quantity}\nPrix indicatif: ${formatCurrency(getEffectivePrice(currentProduct || {}))}\nLien: ${window.location.href}`;
    return `https://wa.me/212675698351?text=${encodeURIComponent(message)}`;
}

function renderProduct(product) {
    currentProduct = product;
    const price = getEffectivePrice(product);
    const oldPrice = getOldPrice(product);
    const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;
    const unavailable = isProductUnavailable(product);

    document.title = `${product.name} | parapharmacie.me Maroc`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', `${product.name} source sur le marche marocain, disponible sur parapharmacie.me Khouribga avec livraison au Maroc et paiement a la livraison.`);

    detail.innerHTML = `
        <div class="product-detail__info" data-reveal>
            <nav class="breadcrumb" aria-label="Fil d'Ariane">
                <a href="index.html">Accueil</a>
                <span>/</span>
                <a href="shop.html">Boutique</a>
                <span>/</span>
                <span>${escapeHtml(product.brand || product.category)}</span>
            </nav>
            <p class="eyebrow">Parapharmacie Maroc</p>
            <h1>${escapeHtml(product.name)}</h1>
            <p class="product-detail__brand">${escapeHtml(product.brand || 'Selection parapharmacie.me')}</p>
            <div class="product-detail__rating">
                <i class="fa-solid fa-star"></i>
                <span>${product.rating || '4.7'} / 5</span>
                <small>${product.reviews || 12} avis clients</small>
            </div>
            <div class="product-detail__price">
                <strong>${formatCurrency(price)}</strong>
                ${oldPrice ? `<span>${formatCurrency(oldPrice)}</span><em>${escapeHtml(product.promoBadge || `-${discount}%`)}</em>` : ''}
            </div>
            <p class="product-detail__stock ${unavailable ? 'out' : ''}">${escapeHtml(product.stockStatus || 'En stock')} • Prix indicatif Maroc</p>
            <div class="product-detail__purchase">
                <div class="qty-control product-detail__qty" aria-label="Quantite">
                    <button class="qty-control__btn" type="button" data-qty="-1" aria-label="Diminuer la quantite">-</button>
                    <span class="qty-control__value" id="qty-val">1</span>
                    <button class="qty-control__btn" type="button" data-qty="1" aria-label="Augmenter la quantite">+</button>
                </div>
                <a class="btn btn--primary ${unavailable ? 'is-disabled' : ''}" id="btn-add-cart" href="cart.html?add=${encodeURIComponent(product.id)}&qty=1" data-product-action="add-to-cart" onclick="window.addProductToCart?.(event)" ${unavailable ? 'aria-disabled="true"' : ''}>
                    <i class="fa-solid fa-cart-plus"></i>
                    ${unavailable ? 'Indisponible' : 'Ajouter au panier'}
                </a>
                <a class="btn btn--whatsapp" href="${getWhatsAppUrl()}" target="_blank" rel="noreferrer">
                    <i class="fa-brands fa-whatsapp"></i>
                    Commander sur WhatsApp
                </a>
            </div>
            <p class="product-detail__description">${escapeHtml(product.shortDescription || product.description)}</p>
            <div class="product-detail__trust">
                <span><i class="fa-solid fa-check"></i> Produit authentique</span>
                <span><i class="fa-solid fa-truck-fast"></i> Livraison au Maroc</span>
                <span><i class="fa-solid fa-hand-holding-dollar"></i> Paiement a la livraison</span>
            </div>
            <a class="product-detail__source" href="${escapeHtml(product.sourceUrl)}" target="_blank" rel="noreferrer">
                Source catalogue publique
                <i class="fa-solid fa-up-right-from-square"></i>
            </a>
            <div class="product-detail__note">
                <strong>Conseil responsable:</strong> les descriptions sont informatives et ne remplacent pas l’avis d’un professionnel de sante.
            </div>
        </div>
        <div class="product-detail__media" data-reveal>
            <span class="product-detail__badge">${escapeHtml(product.promoBadge || product.category)}</span>
            <img src="${getProductImage(product)}" alt="${escapeHtml(product.name)}" loading="lazy">
        </div>
    `;

    detail.querySelectorAll('[data-qty]').forEach((button) => {
        button.addEventListener('click', () => updateQty(Number(button.dataset.qty)));
    });
    window.addProductToCart = addProductToCart;
    syncCartFallbackLink();
    document.dispatchEvent(new CustomEvent('content:updated'));
}

function renderRelated(products) {
    if (!relatedGrid || !relatedSection || !currentProduct) return;

    const related = products
        .filter((product) => product.id !== currentProduct.id && product.categorySlug === currentProduct.categorySlug)
        .slice(0, 4);

    if (related.length === 0) return;

    relatedGrid.innerHTML = related.map((product) => `
        <a href="product.html?id=${encodeURIComponent(product.id)}" class="related-card">
            <img src="${getProductImage(product)}" alt="${escapeHtml(product.name)}" loading="lazy">
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
        window.location.href = 'shop.html';
        return;
    }

    const { product, products } = await getCatalogProduct(productId);
    if (!product) {
        loading.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <h1>Produit introuvable</h1>
                <p>Ce produit n'est plus disponible. Continuez vers la boutique pour decouvrir la selection actuelle.</p>
                <a class="btn btn--primary" href="shop.html">Voir la boutique</a>
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
