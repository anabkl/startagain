import { getCart, saveCart } from './main.js';
import { showToast, formatCurrency } from './utils.js';
import { getEffectivePrice as getCatalogEffectivePrice, getProductImage, isProductUnavailable } from './catalog.js';
import { apiFetch, getCurrentUser } from './auth.js';

const checkoutForm = document.getElementById('checkout-form');
const orderTotalEl = document.getElementById('order-total-amount');
const summaryList = document.getElementById('summary-items-list');
const subtotalEl = document.getElementById('order-subtotal-amount');

function sanitizeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function getEffectivePrice(item) {
    return getCatalogEffectivePrice(item);
}

function getCartTotal(cart) {
    if (cart.some((item) => getEffectivePrice(item) === null)) return null;
    return cart.reduce((sum, item) => sum + getEffectivePrice(item) * (item.quantity || 1), 0);
}

function renderOrderSummary() {
    const storedCart = getCart();
    const cart = storedCart.filter((item) => !isProductUnavailable(item));
    if (cart.length !== storedCart.length) {
        saveCart(cart);
        showToast('Les références sans prix, livraison ou disponibilité confirmés ont été retirées avant le paiement.', 'error');
    }

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
                    <img src="${sanitizeHtml(getProductImage(item))}" alt="${sanitizeHtml(item.name)}" loading="lazy" decoding="async" width="128" height="128">
                    <div>
                        <strong>${sanitizeHtml(item.name)}</strong>
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

function setFormValue(id, value) {
    const el = document.getElementById(id);
    if (!el || !value || String(el.value || '').trim()) return;
    el.value = String(value).trim();
}

function splitName(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: '', lastName: '' };
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ') || ''
    };
}

function autofillCheckoutForm() {
    const user = getCurrentUser();
    if (!user || !checkoutForm) return;

    const { firstName, lastName } = splitName(user.name || user.fullName || user.full_name);

    setFormValue('firstName', user.first_name || user.firstName || firstName);
    setFormValue('lastName', user.last_name || user.lastName || lastName);
    setFormValue('email', user.email || '');
    setFormValue('whatsapp', user.whatsapp || user.phone || user.phoneNumber || user.phone_number || '');
    setFormValue('city', user.city || user.address?.city || user.shipping_address?.city || '');
    const normalizedAddress = typeof user.address === 'string' ? user.address : (user.address?.line1 || user.shipping_address?.address || user.shipping_address?.line1 || '');
    setFormValue('address', normalizedAddress);
}

function getFormValue(id) {
    return document.getElementById(id)?.value.trim() || '';
}

function validatePhone(phone) {
    return /^(05|06|07)\d{8}$/.test(phone.replace(/\s+/g, ''));
}

function normalizeMoroccanPhone(phone) {
    const digits = String(phone || '').replace(/\D+/g, '');
    if (!digits) return '';
    if (digits.startsWith('212')) return digits;
    if (digits.startsWith('0')) return `212${digits.slice(1)}`;
    if (digits.length === 9) return `212${digits}`;
    return digits;
}

function buildWhatsAppOrderMessage(orderData, orderId) {
    const itemsList = (orderData.items || []).map((item, index) => {
        const quantity = item.quantity || 1;
        const price = item.unit_price || item.effectivePrice || 0;
        return `${index + 1}. ${item.name || item.product_id} x ${quantity} = ${formatCurrency(price * quantity)}`;
    }).join('\n');

    return `Nouvelle commande - parapharmacie.me\n\nClient: ${orderData.shipping_address.first_name} ${orderData.shipping_address.last_name}\nWhatsApp: ${orderData.shipping_address.whatsapp}\nEmail: ${orderData.shipping_address.email || 'Non renseigne'}\nVille: ${orderData.shipping_address.city}\nAdresse: ${orderData.shipping_address.address}\n\nProduits:\n${itemsList}\n\nTotal: ${formatCurrency(orderData.total || 0)}\nPaiement: Paiement a la livraison\nCommande: #${String(orderId).slice(0, 12)}\nDate: ${new Date().toLocaleString('fr-MA')}`;
}

function showOrderSuccessModal(orderId, waUrl) {
    const existing = document.getElementById('checkout-success-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'checkout-success-modal';
    modal.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);z-index:9999;padding:16px;';

    modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;max-width:520px;width:100%;padding:22px;box-shadow:0 8px 32px rgba(0,0,0,.2);text-align:center;">
            <div style="font-size:40px;color:#1ba94c;margin-bottom:10px;"><i class="fa-solid fa-circle-check"></i></div>
            <h2 style="margin:0 0 8px;">Commande créée avec succès</h2>
            <p style="margin:0 0 18px;color:#555;">Votre commande #${sanitizeHtml(String(orderId).slice(0, 12))} a été enregistrée dans notre système.</p>
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
                <a href="${sanitizeHtml(waUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn--whatsapp"><i class="fa-brands fa-whatsapp"></i> Envoyer sur WhatsApp (optionnel)</a>
                <a href="success.html?order=${encodeURIComponent(orderId)}&source=api" class="btn btn--primary">Voir la confirmation</a>
            </div>
            <button type="button" id="checkout-success-close" class="btn btn--secondary" style="margin-top:12px;">Fermer</button>
        </div>
    `;

    document.body.appendChild(modal);
    const closeBtn = document.getElementById('checkout-success-close');
    closeBtn?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (event) => {
        if (event.target === modal) modal.remove();
    });
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
    if (cart.some((item) => isProductUnavailable(item))) {
        showToast('Impossible de commander une référence dont le prix, la livraison ou la disponibilité ne sont pas confirmés.', 'error');
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
        product_id: String(item.id),
        quantity: Number(item.quantity || 1),
        unit_price: getEffectivePrice(item),
        priceMAD: getEffectivePrice(item),
        effectivePrice: getEffectivePrice(item),
        priceSource: item.priceSource,
        priceVerifiedAt: item.priceVerifiedAt,
        stock: item.stock,
        stockVerified: item.stockVerified,
        stockVerifiedAt: item.stockVerifiedAt,
        deliveryEligible: item.deliveryEligible,
        name: item.name
    }));

    const total = getCartTotal(cart);

    const orderPayload = {
        items: items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        shipping_address: {
            first_name: firstName,
            last_name: lastName,
            email,
            whatsapp,
            city,
            address
        },
        payment_method: 'cod'
    };

    try {
        const user = getCurrentUser();
        const savedOrder = await apiFetch('/orders', {
            method: 'POST',
            body: JSON.stringify(orderPayload)
        }, { requiresAuth: Boolean(user) });

        const savedOrderId = savedOrder?.id || savedOrder?._id || savedOrder?.order?.id || savedOrder?.order?._id;
        if (!savedOrderId) throw new Error('Order created but response is invalid.');

        const normalizedOrder = {
            ...orderPayload,
            items,
            total: Number(savedOrder?.total ?? savedOrder?.order?.total ?? total)
        };

        const waMessage = buildWhatsAppOrderMessage(normalizedOrder, savedOrderId);
        const waPhone = normalizeMoroccanPhone('0675698351');
        const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;

        localStorage.setItem('parapharmacie_last_whatsapp_url', waUrl);
        saveCart([]);
        showToast('Commande enregistree avec succes.', 'success');
        checkoutForm.reset();
        showOrderSuccessModal(savedOrderId, waUrl);
    } catch (error) {
        console.error('Order error:', error);
        showToast(error.message || 'Impossible de confirmer la commande pour le moment.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

if (checkoutForm) checkoutForm.addEventListener('submit', processOrder);
autofillCheckoutForm();
renderOrderSummary();
