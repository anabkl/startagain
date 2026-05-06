import { getCart, saveCart } from './main.js';
import { showToast, formatCurrency } from './utils.js';
import { saveOrder, buildWhatsAppOrderMessage } from './order-service.js';
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
                    <img src="${escapeHtml(getProductImage(item))}" alt="${escapeHtml(item.name)}" loading="lazy">
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

function validatePhone(phone) {
    return /^(05|06|07)\d{8}$/.test(phone.replace(/\s+/g, ''));
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
    const whatsapp = getFormValue('whatsapp').replace(/\s+/g, '');
    const city = getFormValue('city');
    const address = getFormValue('address');

    if (!firstName || !lastName || !whatsapp || !city || !address) {
        showToast('Veuillez remplir les champs obligatoires.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    if (!validatePhone(whatsapp)) {
        showToast('Numero WhatsApp invalide. Exemple: 0675698351', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const items = cart.map((item) => ({
        ...item,
        effectivePrice: getEffectivePrice(item)
    }));
    const total = getCartTotal(items);

    const orderData = {
        firstName,
        lastName,
        email,
        whatsapp,
        city,
        address,
        items,
        total,
        paymentMethod: 'COD',
        status: 'pending'
    };

    try {
        const savedOrder = await saveOrder(orderData);
        const waMessage = buildWhatsAppOrderMessage(orderData, savedOrder.id, formatCurrency);
        const waUrl = `https://wa.me/212675698351?text=${encodeURIComponent(waMessage)}`;

        localStorage.setItem('parapharmacie_last_whatsapp_url', waUrl);
        saveCart([]);
        showToast('Commande enregistree. Ouverture de WhatsApp...', 'success');

        setTimeout(() => {
            window.open(waUrl, '_blank', 'noopener');
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
