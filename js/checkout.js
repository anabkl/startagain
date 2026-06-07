import { getCart, saveCart } from './main.js';
import { showToast, formatCurrency } from './utils.js';
import { getProductImage } from './catalog.js';
import { saveOrder } from './order-service.js';

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

function normalizeMoroccanPhone(phone) {
    const compact = String(phone || '').replace(/[\s.-]/g, '');

    if (/^0[67]\d{8}$/.test(compact)) {
        return `+212${compact.slice(1)}`;
    }

    if (/^\+212[67]\d{8}$/.test(compact)) {
        return compact;
    }

    if (/^212[67]\d{8}$/.test(compact)) {
        return `+${compact}`;
    }

    return null;
}

function buildWhatsAppOrderMessage(orderData, orderId) {
    const itemsList = (orderData.items || []).map((item, index) => {
        const quantity = item.quantity || 1;
        const price = item.unit_price || item.effectivePrice || 0;
        return `${index + 1}. ${item.name || item.product_id} x ${quantity} = ${formatCurrency(price * quantity)}`;
    }).join('\n');

    return `Nouvelle commande - parapharmacie.me

Client: ${orderData.firstName} ${orderData.lastName}
WhatsApp: ${orderData.phoneNormalized}
Email: ${orderData.email || 'Non renseigne'}
Ville: ${orderData.city}
Adresse: ${orderData.address}

Produits:
${itemsList}

Sous-total: ${formatCurrency(orderData.subtotal || orderData.total || 0)}
Livraison: ${orderData.deliveryLabel || 'A confirmer'}
Total: ${formatCurrency(orderData.total || 0)}
Paiement: Paiement a la livraison
Commande: #${String(orderId).slice(0, 12)}
Date: ${new Date().toLocaleString('fr-MA')}`;
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
    const phoneOriginal = getFormValue('whatsapp');
    const phoneNormalized = normalizeMoroccanPhone(phoneOriginal);
    const city = getFormValue('city');
    const address = getFormValue('address');

    if (!firstName || !lastName || !phoneOriginal || !city || !address) {
        showToast('Veuillez remplir les champs obligatoires.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    if (!phoneNormalized) {
        showToast('Numero WhatsApp invalide. Exemples: 0675698351, +212675698351 ou 212675698351.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const items = cart.map((item) => ({
        product_id: String(item.id),
        id: String(item.id),
        quantity: Number(item.quantity || 1),
        unit_price: getEffectivePrice(item),
        effectivePrice: getEffectivePrice(item),
        priceMAD: getEffectivePrice(item),
        name: item.name,
        image: getProductImage(item)
    }));

    const total = getCartTotal(cart);

    const orderPayload = {
        firstName,
        lastName,
        email,
        phoneOriginal,
        phoneNormalized,
        whatsapp: phoneNormalized,
        city,
        address,
        paymentMethod: 'COD',
        items,
        subtotal: total,
        deliveryFee: 0,
        deliveryLabel: 'A confirmer',
        total
    };

    try {
        const savedOrder = await saveOrder(orderPayload);
        const orderId = savedOrder.id;
        const source = savedOrder.source || 'local';
        const normalizedOrder = savedOrder.order || orderPayload;
        const waMessage = buildWhatsAppOrderMessage(normalizedOrder, orderId);
        const waUrl = `https://wa.me/212675698351?text=${encodeURIComponent(waMessage)}`;

        localStorage.setItem('parapharmacie_last_whatsapp_url', waUrl);
        localStorage.setItem('parapharmacie_last_order_id', orderId);
        localStorage.setItem('parapharmacie_last_order_source', source);
        saveCart([]);
        showToast('Commande enregistree avec succes.', 'success');

        setTimeout(() => {
            window.location.href = `success.html?order=${encodeURIComponent(orderId)}&source=${encodeURIComponent(source)}`;
        }, 900);
    } catch (error) {
        console.error('Order error:', error);
        showToast(error.message || 'Impossible de confirmer la commande pour le moment.', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

if (checkoutForm) checkoutForm.addEventListener('submit', processOrder);
renderOrderSummary();
