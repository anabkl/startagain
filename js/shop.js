import {
    categories,
    getCatalogProducts,
    getEffectivePrice,
    getProductAvailabilityLabel,
    getProductImage,
    getProductImageAlt,
    isProductUnavailable,
    matchesCategory,
    matchesProduct
} from './catalog.js';
import { categoryRoute, productRoute } from './seo-routes.js';
import { showToast, formatCurrency } from './utils.js';
import { getCart, saveCart } from './main.js';

const productsContainer = document.getElementById('products-container');
const searchBar = document.getElementById('search-bar');
const categoryButtons = document.getElementById('category-buttons');
const resultsMeta = document.getElementById('results-meta');

let allProducts = [];
let activeCategory = 'all';

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function addToCart(productId, quantity = 1) {
    const product = allProducts.find((item) => item.id === productId);

    if (!product) return;
    if (isProductUnavailable(product)) {
        showToast('Ce produit est actuellement indisponible.', 'error');
        return;
    }

    const cart = getCart();
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
    } else {
        cart.push({
            ...product,
            effectivePrice: getEffectivePrice(product),
            quantity
        });
    }

    saveCart(cart);
    showToast(`"${product.name}" a ete ajoute au panier.`, 'success');
}

function buildCategoryButtons() {
    if (!categoryButtons) return;

    const buttons = [
        `<a class="category-pill active" data-category="all" href="/boutique/">Tous</a>`,
        ...categories.map((category) => `
            <a class="category-pill" data-category="${category.slug}" href="${categoryRoute(category)}">
                <i class="fa-solid ${category.icon}"></i>
                ${category.name}
            </a>
        `)
    ];

    categoryButtons.innerHTML = buttons.join('');

    categoryButtons.querySelectorAll('[data-category]').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            activeCategory = button.dataset.category;
            if (searchBar) searchBar.value = '';
            categoryButtons.querySelectorAll('.category-pill').forEach((pill) => pill.classList.remove('active'));
            button.classList.add('active');
            applyFilters();
        });
    });
}

function renderProductCard(product) {
    const price = getEffectivePrice(product);
    const unavailable = isProductUnavailable(product);
    const stockLabel = `<span class="product-card__stock ${unavailable ? 'out' : ''}">${escapeHtml(getProductAvailabilityLabel(product))}</span>`;
    const badge = product.category || 'Catalogue';

    return `
        <article class="product-card" data-reveal>
            <a href="${productRoute(product)}" class="product-card__media product-image-frame" data-image-review="${product.imageNeedsReview ? 'true' : 'false'}" aria-label="Voir ${escapeHtml(product.name)}">
                <span class="product-card__badge">${escapeHtml(badge)}</span>
                <img src="${escapeHtml(getProductImage(product))}" alt="${escapeHtml(getProductImageAlt(product))}" loading="lazy" decoding="async" width="720" height="720">
                ${product.imageNeedsReview ? '<span class="product-image-frame__notice">Visuel générique</span>' : ''}
            </a>
            <div class="product-card__body">
                <div class="product-card__meta">
                    <span>${escapeHtml(product.category)}</span>
                    ${stockLabel}
                </div>
                <a href="${productRoute(product)}" class="product-card__title">${escapeHtml(product.name)}</a>
                <p class="product-card__brand">${escapeHtml(product.brand || 'parapharmacie.me')}</p>
                <p class="product-card__description">Prix catalogue indicatif ; disponibilité à confirmer avant commande.</p>
                <div class="product-card__footer">
                    <div class="product-card__price">
                        <strong>${formatCurrency(price)}</strong>
                        <small>prix indicatif</small>
                    </div>
                    <button class="icon-btn add-to-cart-btn" type="button" data-product-id="${escapeHtml(product.id)}" ${unavailable ? 'disabled' : ''} aria-label="Ajouter ${escapeHtml(product.name)} au panier">
                        <i class="fa-solid fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}

function renderProducts(products) {
    if (!productsContainer) return;

    if (resultsMeta) {
        resultsMeta.textContent = `${products.length} produit${products.length > 1 ? 's' : ''} trouve${products.length > 1 ? 's' : ''}`;
    }

    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h2>Aucun produit trouve</h2>
                <p>Essayez une autre categorie ou recherchez un soin, une marque, bebe et maman, ou complements alimentaires.</p>
                <a href="/boutique/" class="btn btn--secondary">Réinitialiser</a>
            </div>
        `;
        return;
    }

    productsContainer.innerHTML = products.map(renderProductCard).join('');
    productsContainer.querySelectorAll('.add-to-cart-btn').forEach((button) => {
        button.addEventListener('click', () => addToCart(button.dataset.productId));
    });
    document.dispatchEvent(new CustomEvent('content:updated'));
}

function applyFilters() {
    const query = searchBar ? searchBar.value : '';
    const filtered = allProducts.filter((product) => (
        matchesCategory(product, activeCategory) && matchesProduct(product, query)
    ));

    renderProducts(filtered);
}

async function initShop() {
    if (!productsContainer) return;

    productsContainer.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Chargement de la parapharmacie...</span>
        </div>
    `;

    const { products, source } = await getCatalogProducts();
    allProducts = products;
    buildCategoryButtons();

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const category = params.get('category');

    if (query && searchBar) searchBar.value = query;
    if (category && categories.some((item) => item.slug === category)) {
        activeCategory = category;
        categoryButtons?.querySelectorAll('.category-pill').forEach((pill) => {
            pill.classList.toggle('active', pill.dataset.category === category);
        });
    }

    const sourceNote = document.getElementById('catalog-source-note');
    if (sourceNote && source === 'api') {
        sourceNote.textContent = 'Catalogue synchronisé ; disponibilité à confirmer';
    }

    applyFilters();
}

if (searchBar) {
    searchBar.addEventListener('input', applyFilters);
}

document.addEventListener('DOMContentLoaded', initShop);
