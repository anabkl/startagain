import { getCart, saveCart, updateCartCount } from './main.js';
import { showToast, formatCurrency } from './utils.js';
import { getCatalogProduct, getEffectivePrice as getCatalogEffectivePrice, getProductImage, isProductUnavailable } from './catalog.js';

const cartItemsContainer = document.getElementById('cart-items');
const cartCardsContainer = document.getElementById('cart-cards');
const cartTotalElement = document.getElementById('cart-total');
const cartCountElement = document.getElementById('cart-items-count');
const cartEmptyDiv = document.getElementById('cart-empty');
const cartContentDiv = document.getElementById('cart-content');
const whatsappCartLink = document.getElementById('whatsapp-cart-link');

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function getEffectivePrice(item) {
    return Number(item.effectivePrice || item.priceMAD || item.promoPrice || item.discountPrice || item.price || 0);
}

function getTotal(cart) {
    return cart.reduce((sum, item) => sum + getEffectivePrice(item) * (item.quantity || 1), 0);
}

function updateQuantity(index, newQty) {
    const cart = getCart();
    const qty = Number.parseInt(newQty, 10);

    if (Number.isNaN(qty) || qty < 1) {
        showToast('Quantite invalide.', 'error');
        renderCart();
        return;
    }

    cart[index].quantity = Math.min(qty, 99);
    saveCart(cart);
    renderCart();
}

function removeFromCart(index) {
    const cart = getCart();
    const removedItem = cart[index];
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
    showToast(`"${removedItem.name}" a ete retire du panier.`, 'error');
}

function renderDesktopRows(cart) {
    return cart.map((item, index) => {
        const price = getEffectivePrice(item);
        const subtotal = price * (item.quantity || 1);

        return `
            <tr class="cart-table__row">
                <td class="cart-table__product">
                    <img src="${escapeHtml(getProductImage(item))}" alt="${escapeHtml(item.name)}" class="cart-table__img" loading="lazy">
                    <div>
                        <span class="cart-table__name">${escapeHtml(item.name)}</span>
                        <small>${escapeHtml(item.brand || item.category || 'parapharmacie.me')}</small>
                    </div>
                </td>
                <td class="cart-table__price">${formatCurrency(price)}</td>
                <td class="cart-table__qty">
                    <div class="qty-control">
                        <button class="qty-control__btn" data-action="decrease" data-index="${index}" aria-label="Diminuer la quantite">-</button>
                        <input class="qty-control__input" type="number" min="1" max="99" value="${item.quantity || 1}" data-index="${index}" aria-label="Quantite">
                        <button class="qty-control__btn" data-action="increase" data-index="${index}" aria-label="Augmenter la quantite">+</button>
                    </div>
                </td>
                <td class="cart-table__subtotal">${formatCurrency(subtotal)}</td>
                <td class="cart-table__remove">
                    <button class="btn-remove" data-index="${index}" aria-label="Supprimer le produit">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderMobileCards(cart) {
    return cart.map((item, index) => {
        const price = getEffectivePrice(item);
        const subtotal = price * (item.quantity || 1);

        return `
            <article class="cart-card">
                <img src="${escapeHtml(getProductImage(item))}" alt="${escapeHtml(item.name)}" class="cart-card__img" loading="lazy">
                <div class="cart-card__details">
                    <h3 class="cart-card__name">${escapeHtml(item.name)}</h3>
                    <p class="cart-card__price">${formatCurrency(price)}</p>
                    <div class="qty-control">
                        <button class="qty-control__btn" data-action="decrease" data-index="${index}" aria-label="Diminuer la quantite">-</button>
                        <input class="qty-control__input" type="number" min="1" max="99" value="${item.quantity || 1}" data-index="${index}" aria-label="Quantite">
                        <button class="qty-control__btn" data-action="increase" data-index="${index}" aria-label="Augmenter la quantite">+</button>
                    </div>
                    <p class="cart-card__subtotal">Sous-total: <strong>${formatCurrency(subtotal)}</strong></p>
                </div>
                <button class="btn-remove" data-index="${index}" aria-label="Supprimer le produit">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </article>
        `;
    }).join('');
}

function updateWhatsAppLink(cart) {
    if (!whatsappCartLink) return;

    const items = cart.map((item) => `${item.name} x ${item.quantity || 1}`).join('\n');
    const message = `Bonjour parapharmacie.me, je souhaite confirmer cette commande:\n${items}\nTotal: ${formatCurrency(getTotal(cart))}`;
    whatsappCartLink.href = `https://wa.me/212675698351?text=${encodeURIComponent(message)}`;
}

function renderCart() {
    const cart = getCart();

    if (cart.length === 0) {
        cartEmptyDiv.style.display = 'flex';
        cartContentDiv.style.display = 'none';
        if (cartItemsContainer) cartItemsContainer.innerHTML = '';
        if (cartCardsContainer) cartCardsContainer.innerHTML = '';
        if (cartTotalElement) cartTotalElement.textContent = formatCurrency(0);
        if (cartCountElement) cartCountElement.textContent = '0';
        updateCartCount();
        return;
    }

    cartEmptyDiv.style.display = 'none';
    cartContentDiv.style.display = 'flex';

    const total = getTotal(cart);
    const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (cartItemsContainer) cartItemsContainer.innerHTML = renderDesktopRows(cart);
    if (cartCardsContainer) cartCardsContainer.innerHTML = renderMobileCards(cart);
    if (cartTotalElement) cartTotalElement.textContent = formatCurrency(total);
    if (cartCountElement) cartCountElement.textContent = totalQty;
    updateWhatsAppLink(cart);
    updateCartCount();
}

async function hydrateCartFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('add');
    if (!productId) return;

    const qty = Math.max(1, Math.min(Number.parseInt(params.get('qty') || '1', 10) || 1, 20));
    const { product } = await getCatalogProduct(productId);

    if (product && !isProductUnavailable(product)) {
        const cart = getCart();
        const existing = cart.find((item) => item.id === product.id);

        if (existing) {
            existing.quantity = (existing.quantity || 1) + qty;
        } else {
            cart.push({
                ...product,
                effectivePrice: getCatalogEffectivePrice(product),
                quantity: qty
            });
        }

        saveCart(cart);
        showToast(`"${product.name}" a ete ajoute au panier.`, 'success');
    }

    window.history.replaceState({}, document.title, 'cart.html');
}

document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (target) {
        const index = Number.parseInt(target.dataset.index, 10);
        const cart = getCart();
        const currentQty = cart[index]?.quantity || 1;

        if (target.dataset.action === 'increase') updateQuantity(index, currentQty + 1);
        if (target.dataset.action === 'decrease') {
            currentQty > 1 ? updateQuantity(index, currentQty - 1) : removeFromCart(index);
        }
        return;
    }

    const removeBtn = event.target.closest('.btn-remove');
    if (removeBtn) removeFromCart(Number.parseInt(removeBtn.dataset.index, 10));
});

document.addEventListener('change', (event) => {
    if (event.target.classList.contains('qty-control__input')) {
        updateQuantity(Number.parseInt(event.target.dataset.index, 10), event.target.value);
    }
});

async function initCart() {
    await hydrateCartFromQuery();
    renderCart();
}

initCart();
