import { getOrderById } from './order-service.js';
import { formatCurrency } from './utils.js';

const whatsappLink = document.getElementById('success-whatsapp-link');
const orderIdEl = document.getElementById('success-order-id');
const orderItemsEl = document.getElementById('success-order-items');
const orderTotalEl = document.getElementById('success-order-total');
const params = new URLSearchParams(window.location.search);

const orderId = params.get('order');
const source = params.get('source') || 'local';

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function renderFallback() {
    if (orderIdEl && orderId) orderIdEl.textContent = `Commande #${String(orderId).slice(0, 12)}`;
    if (orderItemsEl) orderItemsEl.innerHTML = '<span>Resume indisponible localement.</span>';
    if (orderTotalEl) orderTotalEl.textContent = '';
}

async function renderOrderSummary() {
    if (!orderId) {
        renderFallback();
        return;
    }

    const order = await getOrderById(orderId, source);
    if (!order) {
        renderFallback();
        return;
    }

    if (orderIdEl) orderIdEl.textContent = `Commande #${String(order.id).slice(0, 12)}`;
    if (orderItemsEl) {
        orderItemsEl.innerHTML = (order.items || []).map((item) => `
            <span>${escapeHtml(item.name || 'Produit')} x ${item.quantity || 1}</span>
        `).join('');
    }
    if (orderTotalEl) {
        orderTotalEl.textContent = `Total: ${formatCurrency(order.total || 0)} · Livraison ${order.deliveryLabel || 'a confirmer'}`;
    }
}

if (whatsappLink && orderId) {
    const message = `Bonjour, je souhaite confirmer la demande #${String(orderId).slice(0, 12)} enregistrée sur Parapharmacie.me.`;
    whatsappLink.href = `https://wa.me/212675698351?text=${encodeURIComponent(message)}`;
}

renderOrderSummary();
