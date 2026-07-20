import {
    categories,
    faqs,
    getCatalogProducts,
    getEffectivePrice,
    getProductAvailabilityLabel,
    getProductImage,
    getProductImageAlt,
    isProductUnavailable,
    trustBadges
} from './catalog.js';
import { categoryRoute, productRoute } from './seo-routes.js';
import { formatCurrency, showToast } from './utils.js';
import { getCart, saveCart } from './main.js';

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function addToCart(product, quantity = 1) {
    if (!product || isProductUnavailable(product)) {
        showToast('Le prix de cette référence doit être confirmé avant toute commande.', 'error');
        return;
    }
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
    } else {
        cart.push({ ...product, effectivePrice: getEffectivePrice(product), quantity });
    }

    saveCart(cart);
    showToast(`"${product.name}" a ete ajoute au panier.`, 'success');
}

function renderCategories() {
    const grid = document.getElementById('home-categories');
    if (!grid) return;

    grid.innerHTML = categories.map((category) => `
        <a href="${categoryRoute(category)}" class="category-card" style="--category-bg: ${category.color}" data-reveal>
            <i class="fa-solid ${category.icon}"></i>
            <span>${escapeHtml(category.name)}</span>
            <strong>${escapeHtml(category.arabicName)}</strong>
            <p>Voir les références classées ${escapeHtml(category.name)} dans le catalogue.</p>
        </a>
    `).join('');
}

function renderTrustBadges() {
    const grid = document.getElementById('trust-grid');
    if (!grid) return;

    grid.innerHTML = trustBadges.map((badge) => `
        <article class="trust-card" data-reveal>
            <i class="fa-solid ${badge.icon}"></i>
            <h3>${escapeHtml(badge.title)}</h3>
            <p>${escapeHtml(badge.text)}</p>
        </article>
    `).join('');
}

function renderProducts(products) {
    const grid = document.getElementById('featured-products');
    if (!grid) return;

    const featuredProducts = products.filter((product) => product.featured);
    const featured = (featuredProducts.length ? featuredProducts : products).slice(0, 6);

    grid.innerHTML = featured.map((product) => `
        <article class="product-card" data-reveal>
            <a href="${productRoute(product)}" class="product-card__media product-image-frame" data-image-review="${product.imageNeedsReview ? 'true' : 'false'}">
                <span class="product-card__badge">${escapeHtml(product.category || 'Catalogue')}</span>
                <img src="${escapeHtml(getProductImage(product))}" alt="${escapeHtml(getProductImageAlt(product))}" loading="lazy" decoding="async" width="720" height="720">
                ${product.imageNeedsReview ? '<span class="product-image-frame__notice">Visuel générique</span>' : ''}
            </a>
            <div class="product-card__body">
                <div class="product-card__meta">
                    <span>${escapeHtml(product.category)}</span>
                    <span class="product-card__stock ${isProductUnavailable(product) ? 'out' : ''}">${escapeHtml(getProductAvailabilityLabel(product))}</span>
                </div>
                <a href="${productRoute(product)}" class="product-card__title">${escapeHtml(product.name)}</a>
                <p class="product-card__brand">${escapeHtml(product.brand)}</p>
                <p class="product-card__description">Prix et disponibilité à confirmer sans preuve courante.</p>
                <div class="product-card__footer">
                    <div class="product-card__price">
                        <strong>${formatCurrency(getEffectivePrice(product))}</strong>
                        <small>${getEffectivePrice(product) === null ? 'confirmation requise' : 'prix vérifié'}</small>
                    </div>
                    <button class="icon-btn" type="button" data-home-product="${escapeHtml(product.id)}" ${isProductUnavailable(product) ? 'disabled aria-disabled="true"' : ''} aria-label="${isProductUnavailable(product) ? `Commande en ligne indisponible pour ${escapeHtml(product.name)}; prix, stock ou livraison à confirmer` : `Ajouter ${escapeHtml(product.name)} au panier`}">
                        <i class="fa-solid fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </article>
    `).join('');

    grid.querySelectorAll('[data-home-product]').forEach((button) => {
        const product = products.find((item) => item.id === button.dataset.homeProduct);
        button.addEventListener('click', () => addToCart(product));
    });
}

function renderFaqs() {
    const list = document.getElementById('faq-list');
    if (!list) return;

    list.innerHTML = faqs.map((faq, index) => `
        <article class="faq__item ${index === 0 ? 'open' : ''}" data-reveal>
            <button type="button" data-faq-question aria-expanded="${index === 0 ? 'true' : 'false'}">
                <span>${escapeHtml(faq.question)}</span>
                <i class="fa-solid fa-chevron-down"></i>
            </button>
            <p>${escapeHtml(faq.answer)}</p>
        </article>
    `).join('');
}

async function initHome() {
    renderCategories();
    renderTrustBadges();
    renderFaqs();

    const { products } = await getCatalogProducts();
    renderProducts(products);
    document.dispatchEvent(new CustomEvent('content:updated'));
}

document.addEventListener('DOMContentLoaded', initHome);
