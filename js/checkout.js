import { getCart, saveCart } from './main.js';
import { showToast, formatCurrency } from './utils.js';
import { DEFAULT_ORDER_STATUS, saveOrder, buildWhatsAppOrderMessage } from './order-service.js';
import { getProductImage } from './catalog.js';

const checkoutForm = document.getElementById('checkout-form');
const orderTotalEl = document.getElementById('order-total-amount');
const summaryList = document.getElementById('summary-items-list');
const subtotalEl = document.getElementById('order-subtotal-amount');

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function getEffectivePrice(item) {
    return Number(item.effectivePrice || item.priceMAD || item.promoPrice || item.discountPrice || item.price || 0);
}

function getCartTotal(cart) {
    return cart.reduce((sum, item) => sum + getEffectivePrice(item) * (item.quantity || 1), 0);
}

function normalizeMoroccanPhone(phone) {
    const original = String(phone || '').trim();
    const compact = original.replace(/[\s().-]/g, '');

    if (/^0[67]\d{8}$/.test(compact)) {
        return { original, normalized: `+212${compact.slice(1)}`, isValid: true };
    }

    if (/^\+212[67]\d{8}$/.test(compact)) {
        return { original, normalized: compact, isValid: true };
    }

    if (/^212[67]\d{8}$/.test(compact)) {
        return { original, normalized: `+${compact}`, isValid: true };
    }

    return { original, normalized: '', isValid: false };
}

function renderOrderSummary() {
    const cart = getCart();

    if (cart.length === 0) {
        showToast('Votre panier est vide. Redirection vers la boutique.', 'error');
        setTimeout(() => { window.location.href = 'shop.html'; }, 1200);
        return;
    }

    const total = getCartTotal(cart);

    if (summaryList) {
        summaryList.innerHTML = cart.map((item) => {
            const price = getEffectivePrice(item);
            return `
                <div class="summary-product">
                    <img src="${escapeHtml(getProductImage(item))}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" width="128" height="128">
                    <div>
                        <strong>${escapeHtml(item.name)}</strong>
                        <span>${formatCurrency(price)} x ${item.quantity || 1}</span>
                    </div>
                    <em>${formatCurrency(price * (item.quantity || 1))}</em>
                </div>
            `;
        }).join('');
    }

    if (subtotalEl) subtotalEl.textContent = formatCurrency(total);
    if (orderTotalEl) orderTotalEl.textContent = formatCurrency(total);
}

function getFormValue(id) {
    return document.getElementById(id)?.value.trim() || '';
}

async function processOrder(event) {
    event.preventDefault();

    const btn = event.submitter || document.querySelector('.btn-confirm');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirmation...';

    const cart = getCart();
    if (cart.length === 0) {
        showToast('Votre panier est vide.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const firstName = getFormValue('firstName');
    const lastName = getFormValue('lastName');
    const email = getFormValue('email');
    const phone = normalizeMoroccanPhone(getFormValue('whatsapp'));
    const city = getFormValue('city');
    const address = getFormValue('address');

    if (!firstName || !lastName || !phone.original || !city || !address) {
        showToast('Veuillez remplir les champs obligatoires.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    if (!phone.isValid) {
        showToast('Numero WhatsApp invalide. Exemples acceptes: 0675698351, +212675698351 ou 212675698351.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const items = cart.map((item) => ({
        ...item,
        effectivePrice: getEffectivePrice(item)
    }));
    const subtotal = getCartTotal(items);
    const deliveryFee = 0;
    const deliveryLabel = 'A confirmer';
    const total = subtotal + deliveryFee;

    const orderData = {
        firstName,
        lastName,
        email,
        phoneOriginal: phone.original,
        phoneNormalized: phone.normalized,
        whatsapp: phone.normalized,
        city,
        address,
        items,
        subtotal,
        deliveryFee,
        deliveryLabel,
        total,
        paymentMethod: 'COD',
        status: DEFAULT_ORDER_STATUS
    };

    try {
        const savedOrder = await saveOrder(orderData);
        const savedOrderData = savedOrder.order || { ...orderData, id: savedOrder.id, source: savedOrder.source };
        const waMessage = buildWhatsAppOrderMessage(savedOrderData, savedOrder.id, formatCurrency);
        const waUrl = `https://wa.me/212675698351?text=${encodeURIComponent(waMessage)}`;

        localStorage.setItem('parapharmacie_last_whatsapp_url', waUrl);
        localStorage.setItem('parapharmacie_last_order_id', savedOrder.id);
        localStorage.setItem('parapharmacie_last_order_source', savedOrder.source);
        saveCart([]);
        showToast('Commande enregistree avec succes.', 'success');

        setTimeout(() => {
            window.location.href = `success.html?order=${encodeURIComponent(savedOrder.id)}&source=${savedOrder.source}`;
        }, 900);
    } catch (error) {
        console.error('Order error:', error);
        showToast('Impossible de confirmer la commande pour le moment.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

if (checkoutForm) checkoutForm.addEventListener('submit', processOrder);
renderOrderSummary();
