import { apiFetch, getCurrentUser, logoutUser } from './auth.js';
import { formatCurrency } from './utils.js';
import { listMyOrders } from './order-service.js';

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function splitName(name = '') {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ')
    };
}

function getUserProfile(user) {
    const { firstName, lastName } = splitName(user?.name || user?.fullName || user?.full_name);
    const displayName = `${user?.first_name || user?.firstName || firstName} ${user?.last_name || user?.lastName || lastName}`.trim() || user?.email || 'Client';
    return {
        displayName,
        email: user?.email || '—',
        whatsapp: user?.whatsapp || user?.phone || user?.phoneNumber || user?.phone_number || '—',
        city: user?.city || user?.address?.city || user?.shipping_address?.city || '—',
        address: (typeof user?.address === 'string' ? user.address : user?.address?.line1) || user?.shipping_address?.address || user?.shipping_address?.line1 || '—'
    };
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderUser(user) {
    const profile = getUserProfile(user);
    setText('userName', profile.displayName);
    setText('sideUserName', profile.displayName);
    setText('sideUserEmail', profile.email);
    setText('userEmail', profile.email);
    setText('userWa', profile.whatsapp);
    setText('userCity', profile.city);
    setText('userAddr', profile.address);
}

function normalizeStatus(status) {
    const value = String(status || '').toLowerCase();
    if (value.includes('deliver') || status === 'تم التسليم') return { cls: 'status-delivered', text: 'تم التسليم' };
    if (value.includes('cancel') || status === 'ملغي') return { cls: 'status-pending', text: 'ملغي' };
    if (status) return { cls: 'status-pending', text: String(status) };
    return { cls: 'status-pending', text: 'في الانتظار' };
}

function formatDate(value) {
    const date = new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ar-MA');
}

function normalizeOrdersPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
}

function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    if (!container) return;

    if (!orders.length) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#757575;"><i class="fas fa-box-open" style="font-size:3rem; margin-bottom:15px; display:block; color:#bdbdbd;"></i><p>لا توجد طلبيات سابقة بعد.</p><a href="shop.html" style="color:#0d7c3e; font-weight:bold;">ابدأ التسوق الآن</a></div>';
        return;
    }

    container.innerHTML = orders.map((order) => {
        const status = normalizeStatus(order.status);
        const itemsList = Array.isArray(order.items)
            ? order.items.map((item) => `${item.name || item.product?.name || item.product_name || item.product_id || 'Produit'} × ${item.quantity || 1}`).join('، ')
            : '';

        return `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">#${escapeHtml(String(order.id || order._id || '').slice(0, 8))}</span>
                    <span class="order-status ${status.cls}">${escapeHtml(status.text)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#757575; font-size:0.9rem;"><i class="fas fa-calendar-alt"></i> ${escapeHtml(formatDate(order.createdAt))}</span>
                    <span class="order-total">${formatCurrency(Number(order.total || 0))}</span>
                </div>
                ${itemsList ? `<div class="order-products"><i class="fas fa-box" style="margin-left:5px;"></i>${escapeHtml(itemsList)}</div>` : ''}
            </div>
        `;
    }).join('');
}

async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
        let orders = await listMyOrders();
        if (!Array.isArray(orders) || orders.length === 0) {
            const fallback = await apiFetch('/orders/my-orders', {}, { requiresAuth: true });
            orders = normalizeOrdersPayload(fallback);
        }
        renderOrders(orders);
    } catch (error) {
        console.error('Orders error:', error);
        container.innerHTML = '<p style="color:#757575; text-align:center;">تعذّر تحميل الطلبات.</p>';
    }
}

window.showSection = function showSection(name, el) {
    document.querySelectorAll('.profile-section').forEach((section) => section.classList.remove('active'));
    document.querySelectorAll('.side-menu li').forEach((item) => item.classList.remove('active'));
    document.getElementById(`section-${name}`)?.classList.add('active');
    el?.classList.add('active');
};

async function initProfile() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    renderUser(user);
    await loadOrders();

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await logoutUser();
    });
}

initProfile();
