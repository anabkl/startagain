import { getCart, saveCart } from './main.js';
import { getEffectivePrice as getCatalogEffectivePrice, getProductImage, isProductUnavailable } from './catalog.js';
import {
    clearOrderRequestId,
    getOrCreateOrderRequestId,
    saveOrder,
    saveOrderReceipt
} from './order-service.js';
import { getCurrentUser } from './auth.js';
import { showToast, formatCurrency, renderStatusBanner } from './utils.js';
import { resolveDeliveryZone } from './business-config.js';

const checkoutForm = document.getElementById('checkout-form');
const orderTotalEl = document.getElementById('order-total-amount');
const summaryList = document.getElementById('summary-items-list');
const subtotalEl = document.getElementById('order-subtotal-amount');
const checkoutStatus = document.getElementById('checkout-status');
const cityInput = document.getElementById('city');
const deliveryFeeAmountEl = document.getElementById('delivery-fee-amount');
const deliveryFeeNoteEl = document.getElementById('delivery-fee-note');

let isSubmitting = false;

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
    return cart.reduce((sum, item) => sum + (getEffectivePrice(item) * (item.quantity || 1)), 0);
}

// Returns null while no city has been entered yet — the fee must not be
// guessed or defaulted to 0 before we know which delivery zone applies.
function getDeliveryInfo() {
    const city = cityInput?.value.trim() || '';
    if (!city) return null;
    return resolveDeliveryZone(city);
}

function updateDeliveryAndTotal() {
    const cart = getCart();
    const subtotal = getCartTotal(cart);
    const delivery = getDeliveryInfo();
    const canCalculateDelivery = Number.isFinite(delivery?.feeMAD);
    const total = subtotal === null || !canCalculateDelivery ? null : subtotal + delivery.feeMAD;

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (deliveryFeeAmountEl) deliveryFeeAmountEl.textContent = canCalculateDelivery ? formatCurrency(delivery.feeMAD) : '—';
    if (deliveryFeeNoteEl) {
        deliveryFeeNoteEl.textContent = !delivery
            ? 'Ville requise pour calculer les frais'
            : delivery.coverageConfirmed
                ? `${delivery.area} · couverture locale confirmée`
                : delivery.calculable
                    ? `${delivery.area} · demande soumise sous réserve de couverture`
                    : delivery.area;
    }
    if (orderTotalEl) orderTotalEl.textContent = formatCurrency(total);

    return { subtotal, delivery, total };
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
        setTimeout(() => { window.location.href = '/boutique/'; }, 1200);
        return;
    }

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

    updateDeliveryAndTotal();
}

if (cityInput) cityInput.addEventListener('input', updateDeliveryAndTotal);

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
    const normalizedAddress = typeof user.address === 'string'
        ? user.address
        : (user.address?.line1 || user.shipping_address?.address || user.shipping_address?.line1 || '');
    setFormValue('address', normalizedAddress);
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

async function processOrder(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const buttons = [...document.querySelectorAll('.btn-confirm')];
    const originalHtml = buttons.map((el) => el.innerHTML);

    function lockButtons() {
        isSubmitting = true;
        buttons.forEach((el) => {
            el.disabled = true;
            el.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirmation...';
        });
    }

    function unlockButtons() {
        isSubmitting = false;
        buttons.forEach((el, index) => {
            el.disabled = false;
            el.innerHTML = originalHtml[index];
        });
    }

    lockButtons();

    const cart = getCart();
    if (cart.length === 0) {
        showToast('Votre panier est vide.', 'error');
        unlockButtons();
        return;
    }
    if (cart.some((item) => isProductUnavailable(item))) {
        showToast('Impossible de commander une référence dont le prix, la livraison ou la disponibilité ne sont pas confirmés.', 'error');
        unlockButtons();
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
        unlockButtons();
        return;
    }

    if (!phoneNormalized) {
        showToast('Numero WhatsApp invalide. Exemples: 0675698351, +212675698351 ou 212675698351.', 'error');
        unlockButtons();
        return;
    }

    const items = cart.map((item) => ({
        product_id: String(item.apiId || item.product_id || item.id),
        id: String(item.id),
        apiId: item.apiId || item.product_id || null,
        quantity: Number(item.quantity || 1),
        unit_price: getEffectivePrice(item),
        effectivePrice: getEffectivePrice(item),
        priceMAD: getEffectivePrice(item),
        priceSource: item.priceSource,
        priceVerifiedAt: item.priceVerifiedAt,
        stock: item.stock,
        stockVerified: item.stockVerified,
        stockVerifiedAt: item.stockVerifiedAt,
        deliveryEligible: item.deliveryEligible,
        name: item.name,
        image: getProductImage(item)
    }));

    const subtotal = getCartTotal(cart);
    const delivery = resolveDeliveryZone(city);
    if (!delivery.calculable || !Number.isFinite(delivery.feeMAD)) {
        showToast('Saisissez un nom de ville valide. La sélection est conservée.', 'error');
        unlockButtons();
        return;
    }
    const deliveryFee = delivery.feeMAD;
    const total = subtotal + deliveryFee;
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
        subtotal,
        deliveryFee,
        deliveryLabel: `${formatCurrency(deliveryFee)} (${delivery.area})`,
        deliveryCoverageStatus: delivery.coverageConfirmed ? 'confirmed_local' : 'pending_confirmation',
        total
    };
    orderPayload.requestId = getOrCreateOrderRequestId(orderPayload);

    renderStatusBanner(checkoutStatus, {
        state: 'pending',
        message: 'Enregistrement de votre commande en cours...'
    });

    try {
        const savedOrder = await saveOrder(orderPayload);
        const orderId = savedOrder.id;
        const source = savedOrder.source || 'local';
        const normalizedOrder = savedOrder.order || orderPayload;
        saveOrderReceipt({ ...normalizedOrder, id: orderId, source });
        clearOrderRequestId();
        try {
            saveCart([]);
        } catch (storageError) {
            console.info('La demande serveur est enregistrée; le panier local n’a pas pu être vidé.', storageError?.message || storageError);
        }
        renderStatusBanner(checkoutStatus, { state: 'idle' });
        showToast(delivery.coverageConfirmed
            ? 'Demande de commande enregistrée.'
            : 'Demande enregistrée; la couverture de livraison reste à confirmer.', 'success');

        setTimeout(() => {
            window.location.href = `success.html?order=${encodeURIComponent(orderId)}&source=${encodeURIComponent(source)}`;
        }, 900);
    } catch (error) {
        console.error('Order error:', error);
        showToast(error.message || 'Impossible de confirmer la commande pour le moment.', 'error');
        renderStatusBanner(checkoutStatus, {
            state: 'error',
            message: 'Le service est momentanément indisponible. Veuillez réessayer.',
            onRetry: () => processOrder(event)
        });
        unlockButtons();
    }
}

if (checkoutForm) checkoutForm.addEventListener('submit', processOrder);
autofillCheckoutForm();
renderOrderSummary();
