import { buildWhatsAppOrderMessage, getOrderById } from './order-service.js';
import { formatCurrency } from './utils.js';

const whatsappLink = document.getElementById('success-whatsapp-link');
const orderBox = document.getElementById('success-order');
const orderIdEl = document.getElementById('success-order-id');
const orderItemsEl = document.getElementById('success-order-items');
const orderTotalEl = document.getElementById('success-order-total');

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function getRequestedOrder() {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get('order') || localStorage.getItem('parapharmacie_last_order_id'),
        source: params.get('source') || localStorage.getItem('parapharmacie_last_order_source')
    };
}

function renderOrder(order) {
    if (!order || !orderBox) return;

    orderBox.hidden = false;
    if (orderIdEl) orderIdEl.textContent = `#${String(order.id).slice(0, 12)}`;
    if (orderTotalEl) orderTotalEl.textContent = formatCurrency(order.total || 0);
    if (orderItemsEl) {
        orderItemsEl.innerHTML = (order.items || []).map((item) => `
            <div class="success-order__item">
                <span>${escapeHtml(item.name)}</span>
                <strong>${item.quantity || 1} x ${formatCurrency(item.effectivePrice || item.priceMAD || item.price || 0)}</strong>
            </div>
        `).join('');
    }
}

async function initSuccess() {
    const requested = getRequestedOrder();
    const order = await getOrderById(requested.id, requested.source);
    renderOrder(order);

    if (whatsappLink) {
        const fallbackUrl = localStorage.getItem('parapharmacie_last_whatsapp_url') || 'https://wa.me/212675698351';
        if (order) {
            const message = buildWhatsAppOrderMessage(order, order.id, formatCurrency);
            whatsappLink.href = `https://wa.me/212675698351?text=${encodeURIComponent(message)}`;
        } else {
            whatsappLink.href = fallbackUrl;
        }
    }
}

initSuccess();
