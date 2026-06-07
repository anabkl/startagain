import { getOrderById } from './order-service.js';
import { formatCurrency } from './utils.js';

const whatsappLink = document.getElementById('success-whatsapp-link');
const orderIdEl = document.getElementById('success-order-id');
const orderItemsEl = document.getElementById('success-order-items');
const orderTotalEl = document.getElementById('success-order-total');
const params = new URLSearchParams(window.location.search);

const orderId = params.get('order') || localStorage.getItem('parapharmacie_last_order_id');
const source = params.get('source') || localStorage.getItem('parapharmacie_last_order_source') || 'local';
const savedWhatsAppUrl = localStorage.getItem('parapharmacie_last_whatsapp_url');

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

if (whatsappLink && savedWhatsAppUrl) {
    whatsappLink.href = savedWhatsAppUrl;
}

renderOrderSummary();
