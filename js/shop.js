import {
    categories,
    getCatalogProducts,
    getEffectivePrice,
    getProductImage,
    matchesCategory,
    matchesProduct
} from './catalog.js';
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

function getDiscount(product) {
    if (!product.promoPrice || product.promoPrice >= product.price) return null;
    return Math.round(((product.price - product.promoPrice) / product.price) * 100);
}

function addToCart(productId, quantity = 1) {
    const product = allProducts.find((item) => item.id === productId);

    if (!product) return;
    if (product.stock === 0) {
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
        `<button class="category-pill active" data-category="all" type="button">Tous</button>`,
        ...categories.map((category) => `
            <button class="category-pill" data-category="${category.slug}" type="button">
                <i class="fa-solid ${category.icon}"></i>
                ${category.name}
            </button>
        `)
    ];

    categoryButtons.innerHTML = buttons.join('');

    categoryButtons.querySelectorAll('[data-category]').forEach((button) => {
        button.addEventListener('click', () => {
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
    const discount = getDiscount(product);
    const oldPrice = discount ? `<span class="product-card__old-price">${formatCurrency(product.price)}</span>` : '';
    const stockLabel = product.stock === 0 ? '<span class="product-card__stock out">Rupture</span>' : '<span class="product-card__stock">En stock</span>';
    const badge = discount ? `-${discount}%` : product.badge || 'Parapharmacie';

    return `
        <article class="product-card" data-reveal>
            <a href="product.html?id=${encodeURIComponent(product.id)}" class="product-card__media" aria-label="Voir ${escapeHtml(product.name)}">
                <span class="product-card__badge">${escapeHtml(badge)}</span>
                <img src="${getProductImage(product)}" alt="${escapeHtml(product.name)}" loading="lazy">
            </a>
            <div class="product-card__body">
                <div class="product-card__meta">
                    <span>${escapeHtml(product.category)}</span>
                    ${stockLabel}
                </div>
                <a href="product.html?id=${encodeURIComponent(product.id)}" class="product-card__title">${escapeHtml(product.name)}</a>
                <p class="product-card__brand">${escapeHtml(product.brand || 'parapharmacie.me')}</p>
                <div class="product-card__rating" aria-label="Note ${product.rating || 4.7} sur 5">
                    <i class="fa-solid fa-star"></i>
                    <span>${product.rating || '4.7'} (${product.reviews || 12})</span>
                </div>
                <div class="product-card__footer">
                    <div class="product-card__price">
                        <strong>${formatCurrency(price)}</strong>
                        ${oldPrice}
                    </div>
                    <button class="icon-btn add-to-cart-btn" type="button" data-product-id="${escapeHtml(product.id)}" ${product.stock === 0 ? 'disabled' : ''} aria-label="Ajouter ${escapeHtml(product.name)} au panier">
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
                <a href="shop.html" class="btn btn--secondary">Reinitialiser</a>
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
    if (sourceNote && source === 'firebase') {
        sourceNote.textContent = 'Stock synchronise';
    }

    applyFilters();
}

if (searchBar) {
    searchBar.addEventListener('input', applyFilters);
}

document.addEventListener('DOMContentLoaded', initShop);
