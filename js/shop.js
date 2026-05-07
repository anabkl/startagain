import {
    categories,
    getCatalogProducts,
    getCategoryLabel,
    getCategorySlug,
    getCategoryUrl,
    getEffectivePrice,
    getOldPrice,
    getProductImage,
    getProductImageReviewLabel,
    getProductInitials,
    getProductUrl,
    isProductUnavailable,
    matchesCategory
} from './catalog.js';
import { debounce, getEmptySearchSuggestions, getRecentSearches, saveRecentSearch, searchProducts } from './smart-search.js';
import { trackAddToCart, trackSearch } from './analytics.js';
import { showToast, formatCurrency } from './utils.js';
import { getCart, saveCart } from './main.js';

const productsContainer = document.getElementById('products-container');
const searchBar = document.getElementById('search-bar');
const categoryButtons = document.getElementById('category-buttons');
const resultsMeta = document.getElementById('results-meta');

let allProducts = [];
let activeCategory = 'all';
let searchDropdown = null;
let highlightedSearchIndex = -1;
let currentSearchResults = [];

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function getDiscount(product) {
    const oldPrice = getOldPrice(product);
    const price = getEffectivePrice(product);
    if (!oldPrice) return null;
    return Math.round(((oldPrice - price) / oldPrice) * 100);
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
    trackAddToCart(product, quantity, getEffectivePrice(product));
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
            hideSearchDropdown();
            categoryButtons.querySelectorAll('.category-pill').forEach((pill) => pill.classList.remove('active'));
            button.classList.add('active');
            updateShopHistory(activeCategory);
            applyFilters();
        });
    });
}

function updateShopHistory(categorySlug) {
    const nextPath = categorySlug === 'all'
        ? '/shop.html'
        : `/${getCategoryUrl(categorySlug)}`;

    if (window.location.protocol === 'file:') {
        const filePath = categorySlug === 'all'
            ? 'shop.html'
            : `shop.html?category=${encodeURIComponent(categorySlug)}`;
        history.replaceState({}, '', filePath);
        return;
    }

    history.replaceState({}, '', nextPath);
}

function renderProductCard(product) {
    const price = getEffectivePrice(product);
    const discount = getDiscount(product);
    const oldPriceValue = getOldPrice(product);
    const oldPrice = oldPriceValue ? `<span class="product-card__old-price">${formatCurrency(oldPriceValue)}</span>` : '';
    const unavailable = isProductUnavailable(product);
    const stockLabel = unavailable
        ? '<span class="product-card__stock out">Rupture</span>'
        : `<span class="product-card__stock">${escapeHtml(product.stockStatus || 'En stock')}</span>`;
    const categoryLabel = getCategoryLabel(product.category || product.categorySlug);
    const badge = product.promoBadge || (discount ? `-${discount}%` : product.badge || categoryLabel || 'Parapharmacie');
    const imageReviewLabel = getProductImageReviewLabel(product);

    return `
        <article class="product-card" data-reveal>
            <a href="${getProductUrl(product)}" class="product-card__media product-image-frame" data-image-review="${product.imageNeedsReview ? 'true' : 'false'}" aria-label="Voir ${escapeHtml(product.name)}">
                <span class="product-card__badge">${escapeHtml(badge)}</span>
                <img src="${escapeHtml(getProductImage(product))}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" width="720" height="720">
                ${product.imageNeedsReview ? `<span class="product-image-frame__initials" title="${escapeHtml(imageReviewLabel)}" aria-hidden="true">${escapeHtml(getProductInitials(product))}</span>` : ''}
            </a>
            <div class="product-card__body">
                <div class="product-card__meta">
                    <span>${escapeHtml(categoryLabel)}</span>
                    ${stockLabel}
                </div>
                <a href="${getProductUrl(product)}" class="product-card__title">${escapeHtml(product.name)}</a>
                <p class="product-card__brand">${escapeHtml(product.brand || 'parapharmacie.me')}</p>
                <p class="product-card__description">${escapeHtml(product.shortDescription || product.description || '')}</p>
                <div class="product-card__rating" aria-label="Note ${product.rating || 4.7} sur 5">
                    <i class="fa-solid fa-star"></i>
                    <span>${product.rating || '4.7'} (${product.reviews || 12})</span>
                </div>
                <div class="product-card__footer">
                    <div class="product-card__price">
                        <strong>${formatCurrency(price)}</strong>
                        ${oldPrice}
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
        const suggestions = getEmptySearchSuggestions(allProducts);
        productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h2>Aucun produit trouve</h2>
                <p>Essayez une autre categorie ou recherchez un soin, une marque, bebe et maman, ou complements alimentaires.</p>
                <div class="search-suggestions">
                    ${suggestions.map((suggestion) => `<button type="button" data-search-suggestion="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`).join('')}
                </div>
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
    updateCategorySeo();
    const query = searchBar ? searchBar.value : '';
    const categoryProducts = allProducts.filter((product) => matchesCategory(product, activeCategory));
    const filtered = query.trim()
        ? searchProducts(categoryProducts, query)
        : categoryProducts;

    renderProducts(filtered);
}

function ensureSearchDropdown() {
    if (searchDropdown || !searchBar) return searchDropdown;
    searchDropdown = document.createElement('div');
    searchDropdown.className = 'smart-search';
    searchDropdown.setAttribute('role', 'listbox');
    searchBar.closest('.header__search')?.appendChild(searchDropdown);
    return searchDropdown;
}

function hideSearchDropdown() {
    if (searchDropdown) {
        searchDropdown.classList.remove('open');
        searchDropdown.innerHTML = '';
    }
    highlightedSearchIndex = -1;
}

function renderSearchDropdown(query) {
    if (!searchBar) return;
    const dropdown = ensureSearchDropdown();
    const value = query.trim();

    if (!value) {
        const recent = getRecentSearches();
        currentSearchResults = [];
        highlightedSearchIndex = -1;
        if (!recent.length) {
            hideSearchDropdown();
            return;
        }
        dropdown.innerHTML = `
            <div class="smart-search__section">Recherches recentes</div>
            ${recent.map((item, index) => `<button type="button" class="smart-search__item" data-recent-search="${escapeHtml(item)}" data-index="${index}"><i class="fa-solid fa-clock-rotate-left"></i><span>${escapeHtml(item)}</span></button>`).join('')}
        `;
        dropdown.classList.add('open');
        return;
    }

    currentSearchResults = searchProducts(allProducts, value, 6);
    dropdown.innerHTML = currentSearchResults.length ? `
        <div class="smart-search__section">Resultats rapides</div>
        ${currentSearchResults.map((product, index) => `
            <a class="smart-search__item ${index === highlightedSearchIndex ? 'is-active' : ''}" href="${getProductUrl(product)}" data-index="${index}">
                <img src="${escapeHtml(getProductImage(product))}" alt="" loading="lazy" width="42" height="42">
                <span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.brand)} · ${formatCurrency(getEffectivePrice(product))}</small></span>
            </a>
        `).join('')}
    ` : `
        <div class="smart-search__section">Aucun resultat rapide</div>
        <button type="button" class="smart-search__item" data-search-suggestion="solaire"><i class="fa-solid fa-lightbulb"></i><span>Essayez solaire, acne, cheveux ou bebe</span></button>
    `;
    dropdown.classList.add('open');
}

function commitSearch() {
    const query = searchBar?.value.trim() || '';
    if (query) saveRecentSearch(query);
    if (query) trackSearch(query, productsContainer?.querySelectorAll('.product-card').length || null);
    hideSearchDropdown();
    applyFilters();
}

function upsertCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
    }
    link.href = url;
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

function updateCategorySeo() {
    const isCategory = activeCategory && activeCategory !== 'all';
    const category = categories.find((item) => item.slug === activeCategory);
    const label = category?.name || 'Parapharmacie Maroc';
    const title = isCategory
        ? `${label} | Parapharmacie Tawfiq Khouribga Maroc`
        : 'Boutique parapharmacie Tawfiq Khouribga & Maroc';
    const description = isCategory
        ? `${label} chez parapharmacie.me: produits de parapharmacie Tawfiq a Khouribga, livraison au Maroc et paiement a la livraison.`
        : 'Catalogue parapharmacie Tawfiq pour Khouribga et le Maroc: soins visage, solaire, bebe et maman, sante, supplements, hygiene et paiement a la livraison.';
    const canonical = isCategory
        ? `https://parapharmacie.me/${getCategoryUrl(activeCategory)}`
        : 'https://parapharmacie.me/shop.html';

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    upsertCanonical(canonical);

    if (isCategory) {
        upsertJsonLd('category-jsonld', {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: label,
            description,
            url: canonical,
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://parapharmacie.me/' },
                    { '@type': 'ListItem', position: 2, name: 'Boutique', item: 'https://parapharmacie.me/shop.html' },
                    { '@type': 'ListItem', position: 3, name: label, item: canonical }
                ]
            }
        });
    }
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
    const pathCategory = window.location.pathname.match(/\/categorie\/([^/]+)/)?.[1];
    const rawCategory = pathCategory ? decodeURIComponent(pathCategory) : params.get('category');
    const category = rawCategory ? getCategorySlug(rawCategory) : null;

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

    updateCategorySeo();
    applyFilters();
}

if (searchBar) {
    const debouncedSearch = debounce(() => {
        renderSearchDropdown(searchBar.value);
        applyFilters();
    }, 160);

    searchBar.addEventListener('input', debouncedSearch);
    searchBar.addEventListener('focus', () => renderSearchDropdown(searchBar.value));
    searchBar.addEventListener('keydown', (event) => {
        const items = searchDropdown ? [...searchDropdown.querySelectorAll('.smart-search__item')] : [];
        if (event.key === 'ArrowDown' && items.length) {
            event.preventDefault();
            highlightedSearchIndex = (highlightedSearchIndex + 1) % items.length;
            renderSearchDropdown(searchBar.value);
        }
        if (event.key === 'ArrowUp' && items.length) {
            event.preventDefault();
            highlightedSearchIndex = highlightedSearchIndex <= 0 ? items.length - 1 : highlightedSearchIndex - 1;
            renderSearchDropdown(searchBar.value);
        }
        if (event.key === 'Enter') {
            if (highlightedSearchIndex >= 0 && items[highlightedSearchIndex]) {
                event.preventDefault();
                items[highlightedSearchIndex].click();
                return;
            }
            commitSearch();
        }
        if (event.key === 'Escape') hideSearchDropdown();
    });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.header__search')) hideSearchDropdown();
    });
}

document.addEventListener('click', (event) => {
    const recent = event.target.closest('[data-recent-search]');
    if (recent && searchBar) {
        searchBar.value = recent.dataset.recentSearch;
        commitSearch();
    }

    const suggestion = event.target.closest('[data-search-suggestion]');
    if (suggestion && searchBar) {
        searchBar.value = suggestion.dataset.searchSuggestion;
        activeCategory = 'all';
        categoryButtons?.querySelectorAll('.category-pill').forEach((pill) => {
            pill.classList.toggle('active', pill.dataset.category === 'all');
        });
        commitSearch();
    }
});

document.addEventListener('DOMContentLoaded', initShop);
