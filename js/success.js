import { buildWhatsAppOrderMessage, getOrderById } from './order-service.js';
import { formatCurrency } from './utils.js';

const whatsappLink = document.getElementById('success-whatsapp-link');
const orderBox = document.getElementById('success-order');
function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function renderOrder(order) {
    if (!orderBox || !order) return;

    const items = (order.items || []).slice(0, 4).map((item) => {
        const quantity = item.quantity || 1;
        return `
            <div>
                <span>${escapeHtml(item.name)} x ${quantity}</span>
                <strong>${formatCurrency((item.effectivePrice || item.priceMAD || item.price || 0) * quantity)}</strong>
            </div>
        `;
    }).join('');

    orderBox.innerHTML = `
        <div class="success-order__id">
            <span>Numero de commande</span>
            <strong>#${escapeHtml(String(order.id || '').slice(0, 12))}</strong>
        </div>
        <div class="success-order__items">${items}</div>
        <div class="success-order__total">
            <span>Total</span>
            <strong>${formatCurrency(order.total || 0)}</strong>
        </div>
    `;
    orderBox.hidden = false;
}

async function initSuccess() {
    const orderId = getQueryParam('order') || localStorage.getItem('parapharmacie_last_order_id');
    const source = getQueryParam('source') || localStorage.getItem('parapharmacie_last_order_source');
    const order = await getOrderById(orderId, source);
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
