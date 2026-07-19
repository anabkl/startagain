import { catalogProducts } from './catalog-data.js';
import { catalogApiIdBySlug } from './catalog-api-id-map.js';
import { getCart, saveCart } from './main.js';
import { showToast } from './utils.js';
import { isProductOrderable, verifiedProductPrice } from './product-schema.js';

let selectedQuantity = 1;

function getProduct(productId) {
    const product = catalogProducts.find((item) => item.id === productId || item.slug === productId);
    if (!product) return null;
    return {
        ...product,
        apiId: catalogApiIdBySlug[product.id] || product.apiId || null
    };
}

function addProduct(productId, quantity = 1) {
    const product = getProduct(productId);
    if (!product) {
        showToast('Cette référence est introuvable dans le catalogue.', 'error');
        return;
    }
    if (!isProductOrderable(product)) {
        showToast('Prix, livraison et disponibilité doivent être confirmés avant toute commande en ligne.', 'error');
        return;
    }

    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
        existing.apiId = product.apiId || existing.apiId || null;
    } else {
        cart.push({
            ...product,
            effectivePrice: verifiedProductPrice(product),
            quantity
        });
    }

    saveCart(cart);
    showToast(`« ${product.name} » a été ajouté au panier.`, 'success');
}

function updateQuantity(delta) {
    selectedQuantity = Math.max(1, Math.min(20, selectedQuantity + delta));
    document.querySelectorAll('[data-static-qty-value]').forEach((element) => {
        element.textContent = String(selectedQuantity);
    });
}

function normalize(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function initCatalogFilter() {
    const input = document.getElementById('catalog-filter');
    const status = document.getElementById('catalog-filter-status');
    const cards = [...document.querySelectorAll('[data-product-card]')];
    if (!input || cards.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    input.value = params.get('q') || '';

    const filter = () => {
        const query = normalize(input.value);
        let visible = 0;
        cards.forEach((card) => {
            const matches = !query || normalize(card.dataset.search).includes(query);
            card.hidden = !matches;
            if (matches) visible += 1;
        });
        if (status) status.textContent = `${visible} référence${visible > 1 ? 's' : ''} affichée${visible > 1 ? 's' : ''}`;
    };

    input.addEventListener('input', filter);
    filter();
}

document.addEventListener('click', (event) => {
    const quantityButton = event.target.closest('[data-static-qty]');
    if (quantityButton) {
        updateQuantity(Number(quantityButton.dataset.staticQty));
        return;
    }

    const addButton = event.target.closest('[data-seo-add-product]');
    if (!addButton) return;
    const quantity = document.querySelector('[data-static-product-page]') ? selectedQuantity : 1;
    addProduct(addButton.dataset.seoAddProduct, quantity);
});

document.addEventListener('DOMContentLoaded', initCatalogFilter);
