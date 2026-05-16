import {
    categories,
    faqs,
    getCatalogProducts,
    getEffectivePrice,
    getOldPrice,
    getProductImage,
    getProductImageReviewLabel,
    getProductInitials,
    isProductUnavailable,
    testimonials,
    trustBadges
} from './catalog.js';
import { formatCurrency, showToast } from './utils.js';
import { getCart, saveCart } from './main.js';

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function addToCart(product, quantity = 1) {
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
        <a href="shop.html?category=${category.slug}" class="category-card" style="--category-bg: ${category.color}" data-reveal>
            <i class="fa-solid ${category.icon}"></i>
            <span>${escapeHtml(category.name)}</span>
            <strong>${escapeHtml(category.arabicName)}</strong>
            <p>${escapeHtml(category.description)}</p>
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

    const featured = products.filter((product) => product.featured || product.bestseller).slice(0, 6);

    grid.innerHTML = featured.map((product) => `
        <article class="product-card" data-reveal>
            <a href="product.html?id=${encodeURIComponent(product.id)}" class="product-card__media product-image-frame" data-image-review="${product.imageNeedsReview ? 'true' : 'false'}">
                <span class="product-card__badge">${escapeHtml(product.badge || 'Best seller')}</span>
                <img src="${escapeHtml(getProductImage(product))}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" width="720" height="720">
                ${product.imageNeedsReview ? `<span class="product-image-frame__initials" title="${escapeHtml(getProductImageReviewLabel(product))}" aria-hidden="true">${escapeHtml(getProductInitials(product))}</span>` : ''}
            </a>
            <div class="product-card__body">
                <div class="product-card__meta">
                    <span>${escapeHtml(product.category)}</span>
                    <span class="product-card__stock ${isProductUnavailable(product) ? 'out' : ''}">${escapeHtml(product.stockStatus || 'En stock')}</span>
                </div>
                <a href="product.html?id=${encodeURIComponent(product.id)}" class="product-card__title">${escapeHtml(product.name)}</a>
                <p class="product-card__brand">${escapeHtml(product.brand)}</p>
                <p class="product-card__description">${escapeHtml(product.shortDescription || product.description || '')}</p>
                <div class="product-card__footer">
                    <div class="product-card__price">
                        <strong>${formatCurrency(getEffectivePrice(product))}</strong>
                        ${getOldPrice(product) ? `<span class="product-card__old-price">${formatCurrency(getOldPrice(product))}</span>` : ''}
                    </div>
                    <button class="icon-btn" type="button" data-home-product="${escapeHtml(product.id)}" ${isProductUnavailable(product) ? 'disabled' : ''} aria-label="Ajouter ${escapeHtml(product.name)} au panier">
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

function renderTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    if (!grid) return;

    grid.innerHTML = testimonials.map((testimonial) => `
        <article class="testimonial-card" data-reveal>
            <div class="testimonial-card__stars" aria-label="5 etoiles">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
            </div>
            <p>${escapeHtml(testimonial.text)}</p>
            <strong>${escapeHtml(testimonial.name)}</strong>
            <span>${escapeHtml(testimonial.location)}</span>
        </article>
    `).join('');
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
    renderTestimonials();
    renderFaqs();

    const { products } = await getCatalogProducts();
    renderProducts(products);
    document.dispatchEvent(new CustomEvent('content:updated'));
}

document.addEventListener('DOMContentLoaded', initHome);
