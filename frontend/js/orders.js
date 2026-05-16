import {
    DEFAULT_ORDER_STATUS,
    ORDER_STATUSES,
    buildWhatsAppOrderMessage,
    deleteOrder,
    listOrders,
    updateOrderStatus
} from './order-service.js';
import { formatCurrency, showToast } from './utils.js';

const ordersList = document.getElementById('orders-list');
const ordersEmpty = document.getElementById('orders-empty');
const searchInput = document.getElementById('orders-search');
const statusFilter = document.getElementById('orders-status-filter');
const refreshBtn = document.getElementById('orders-refresh');
const modal = document.getElementById('order-modal');
const modalBody = document.getElementById('order-modal-body');
const modalClose = document.getElementById('order-modal-close');

let orders = [];

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
}

function getShortId(order) {
    return String(order.id || '').slice(0, 12);
}

function getCustomerName(order) {
    return `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Client';
}

function getStatusClass(status) {
    return {
        'في الانتظار': 'status--pending',
        'تم التأكيد': 'status--confirmed',
        'قيد التحضير': 'status--preparing',
        'في التوصيل': 'status--delivery',
        'تم التسليم': 'status--delivered',
        'ملغي': 'status--cancelled'
    }[status] || 'status--pending';
}

function formatDate(value) {
    if (!value) return '---';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '---' : date.toLocaleString('ar-MA');
}

function getCustomerWhatsApp(order) {
    return String(order.phoneNormalized || order.whatsapp || order.phoneOriginal || '').replace(/^\+/, '');
}

function getAdminMessage(order) {
    return buildWhatsAppOrderMessage(order, order.id, formatCurrency);
}

function getCustomerContactMessage(order) {
    return `مرحبا ${getCustomerName(order)}، معكم parapharmacie.me بخصوص طلبكم رقم #${getShortId(order)}. الحالة الحالية: ${order.status || DEFAULT_ORDER_STATUS}.`;
}

function getWhatsAppHref(order) {
    const phone = getCustomerWhatsApp(order);
    if (!phone) return '#';
    return `https://wa.me/${phone}?text=${encodeURIComponent(getCustomerContactMessage(order))}`;
}

function populateStatusFilter() {
    if (!statusFilter || statusFilter.options.length > 1) return;
    ORDER_STATUSES.forEach((status) => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusFilter.appendChild(option);
    });
}

function renderStatusSelect(order) {
    return `
        <select class="status-select" data-action="status" data-order-id="${escapeHtml(order.id)}" aria-label="تغيير حالة الطلب">
            ${ORDER_STATUSES.map((status) => `
                <option value="${escapeHtml(status)}" ${status === (order.status || DEFAULT_ORDER_STATUS) ? 'selected' : ''}>${escapeHtml(status)}</option>
            `).join('')}
        </select>
    `;
}

function getFilteredOrders() {
    const query = normalizeText(searchInput?.value);
    const status = statusFilter?.value || 'all';

    return orders.filter((order) => {
        const matchesStatus = status === 'all' || (order.status || DEFAULT_ORDER_STATUS) === status;
        const haystack = normalizeText([
            order.id,
            getCustomerName(order),
            order.city,
            order.status
        ].join(' '));
        const matchesQuery = !query || query.split(/\s+/).every((word) => haystack.includes(word));
        return matchesStatus && matchesQuery;
    });
}

function renderOrders() {
    if (!ordersList) return;

    const filtered = getFilteredOrders();
    ordersEmpty.hidden = filtered.length > 0;

    ordersList.innerHTML = filtered.map((order) => {
        const status = order.status || DEFAULT_ORDER_STATUS;
        const phone = getCustomerWhatsApp(order);

        return `
            <tr>
                <td><span class="order-id">#${escapeHtml(getShortId(order))}</span><br><small>${escapeHtml(formatDate(order.createdAt))}</small></td>
                <td><strong>${escapeHtml(getCustomerName(order))}</strong><br><small>${escapeHtml(order.phoneNormalized || order.phoneOriginal || '')}</small></td>
                <td>${escapeHtml(order.city || '---')}</td>
                <td><strong>${formatCurrency(order.total || 0)}</strong></td>
                <td>${order.paymentMethod === 'COD' ? 'عند الاستلام' : escapeHtml(order.paymentMethod || '---')}</td>
                <td><span class="status-badge ${getStatusClass(status)}">${escapeHtml(status)}</span><br>${renderStatusSelect(order)}</td>
                <td>
                    <div class="orders-actions">
                        <button type="button" data-action="details" data-order-id="${escapeHtml(order.id)}"><i class="fa-solid fa-eye"></i> التفاصيل</button>
                        <button type="button" class="success" data-action="delivered" data-order-id="${escapeHtml(order.id)}"><i class="fa-solid fa-check"></i> تم التسليم</button>
                        <button type="button" class="danger" data-action="cancel" data-order-id="${escapeHtml(order.id)}"><i class="fa-solid fa-ban"></i> إلغاء</button>
                        <button type="button" data-action="copy" data-order-id="${escapeHtml(order.id)}"><i class="fa-solid fa-copy"></i> نسخ واتساب</button>
                        <button type="button" class="danger" data-action="delete" data-order-id="${escapeHtml(order.id)}"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                </td>
                <td>
                    <div class="orders-actions">
                        <a href="${phone ? getWhatsAppHref(order) : '#'}" target="_blank" rel="noreferrer" aria-disabled="${phone ? 'false' : 'true'}"><i class="fa-brands fa-whatsapp"></i> واتساب</a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function findOrder(orderId) {
    return orders.find((order) => order.id === orderId);
}

function renderOrderDetails(order) {
    if (!modalBody) return;

    const products = (order.items || []).map((item) => `
        <div class="order-product">
            <span>${escapeHtml(item.name)}</span>
            <strong>${item.quantity || 1} x ${formatCurrency(item.effectivePrice || item.priceMAD || item.price || 0)}</strong>
        </div>
    `).join('');

    const history = (order.statusHistory || []).map((entry) => `
        <li>
            <strong>${escapeHtml(entry.status || DEFAULT_ORDER_STATUS)}</strong>
            <span>${escapeHtml(formatDate(entry.at))}</span>
        </li>
    `).join('');

    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-card"><span>الزبون</span><strong>${escapeHtml(getCustomerName(order))}</strong></div>
            <div class="detail-card"><span>واتساب</span><strong>${escapeHtml(order.phoneNormalized || order.phoneOriginal || '---')}</strong></div>
            <div class="detail-card"><span>المدينة</span><strong>${escapeHtml(order.city || '---')}</strong></div>
            <div class="detail-card"><span>العنوان</span><strong>${escapeHtml(order.address || '---')}</strong></div>
            <div class="detail-card"><span>طريقة الدفع</span><strong>${order.paymentMethod === 'COD' ? 'الدفع عند الاستلام' : escapeHtml(order.paymentMethod || '---')}</strong></div>
            <div class="detail-card"><span>تاريخ الإنشاء</span><strong>${escapeHtml(formatDate(order.createdAt))}</strong></div>
            <div class="detail-card"><span>الحالة</span><strong>${escapeHtml(order.status || DEFAULT_ORDER_STATUS)}</strong></div>
            <div class="detail-card"><span>المجموع</span><strong>${formatCurrency(order.total || 0)}</strong></div>
        </div>
        <section>
            <h3>المنتجات</h3>
            <div class="order-products">${products || '<p>لا توجد منتجات.</p>'}</div>
        </section>
        <section>
            <h3>تاريخ الحالات</h3>
            <ul class="status-history">${history || '<li><strong>لا يوجد تاريخ بعد</strong></li>'}</ul>
        </section>
    `;
}

function openDetails(orderId) {
    const order = findOrder(orderId);
    if (!order || !modal) return;
    renderOrderDetails(order);
    modal.classList.add('open');
}

function closeDetails() {
    modal?.classList.remove('open');
}

async function setStatus(orderId, status, note = 'Admin update') {
    await updateOrderStatus(orderId, status, note);
    showToast('تم تحديث حالة الطلب.', 'success');
    await fetchOrders();
}

async function copyWhatsAppMessage(orderId) {
    const order = findOrder(orderId);
    if (!order) return;
    const message = getAdminMessage(order);
    await navigator.clipboard.writeText(message);
    showToast('تم نسخ رسالة واتساب.', 'success');
}

async function removeOrder(orderId) {
    if (!window.confirm('هل تريد حذف هذا الطلب نهائياً؟')) return;
    await deleteOrder(orderId);
    showToast('تم حذف الطلب.', 'success');
    await fetchOrders();
}

async function handleAction(event) {
    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    const orderId = actionTarget.dataset.orderId;
    if (!orderId) return;
    if (action === 'status' && event.type !== 'change') return;
    if (action !== 'status' && event.type !== 'click') return;

    try {
        if (action === 'status') await setStatus(orderId, actionTarget.value, 'Manual status select');
        if (action === 'details') openDetails(orderId);
        if (action === 'delivered') await setStatus(orderId, 'تم التسليم', 'Marked delivered');
        if (action === 'cancel') await setStatus(orderId, 'ملغي', 'Cancelled from admin');
        if (action === 'copy') await copyWhatsAppMessage(orderId);
        if (action === 'delete') await removeOrder(orderId);
    } catch (error) {
        console.error(error);
        showToast('تعذر تنفيذ العملية.', 'error');
    }
}

async function fetchOrders() {
    if (!ordersList) return;
    ordersList.innerHTML = '<tr><td colspan="8" style="text-align:center;">جاري جلب الطلبيات...</td></tr>';
    populateStatusFilter();

    try {
        orders = await listOrders();
        renderOrders();
    } catch (error) {
        console.error('Error fetching orders:', error);
        ordersList.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#d94343;">تعذر تحميل الطلبات.</td></tr>';
    }
}

ordersList?.addEventListener('click', handleAction);
ordersList?.addEventListener('change', handleAction);
searchInput?.addEventListener('input', renderOrders);
statusFilter?.addEventListener('change', renderOrders);
refreshBtn?.addEventListener('click', fetchOrders);
modalClose?.addEventListener('click', closeDetails);
modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeDetails();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDetails();
});

fetchOrders();
