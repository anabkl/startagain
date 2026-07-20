import {
    apiFetch,
    apiFetchWithTimeout,
    bindLogoutButton,
    getAccessToken,
    getCurrentUser,
    saveAuthSession
} from './auth.js';
import { listMyOrders } from './order-service.js';
import { formatCurrency, renderStatusBanner, setStatus as setStatusText } from './utils.js';

const FALLBACK_IMAGE = 'assets/products/product-placeholder.svg';
const menuButtons = document.querySelectorAll('[data-profile-tab]');
const panels = document.querySelectorAll('.profile-panel');
const editToggle = document.getElementById('toggle-profile-edit');
const editForm = document.getElementById('edit-profile-form');
const passwordForm = document.getElementById('password-form');
const profileStatus = document.getElementById('profile-status');
const passwordStatus = document.getElementById('password-status');
const ordersList = document.getElementById('orders-list');
const dashboardStatus = document.getElementById('dashboard-status');

let profile = getCurrentUser() || {};

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || '---';
}

function setStatus(element, message, type = '') {
    setStatusText(element, message, type);
}

function splitName(name = '') {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ')
    };
}

function getDisplayProfile(user = {}) {
    const { firstName, lastName } = splitName(user.name || user.fullName || user.full_name);
    const name = `${user.first_name || user.firstName || firstName} ${user.last_name || user.lastName || lastName}`.trim()
        || user.name
        || user.email
        || '';
    const address = typeof user.address === 'string'
        ? user.address
        : (user.address?.line1 || user.shipping_address?.address || user.shipping_address?.line1 || '');

    return {
        ...user,
        name,
        email: user.email || '',
        whatsapp: user.whatsapp || user.phone || user.phoneNumber || user.phone_number || '',
        city: user.city || user.address?.city || user.shipping_address?.city || '',
        address
    };
}

function normalizeStatus(status) {
    const value = String(status || '').toLowerCase();
    if (['delivered', 'تم التسليم', 'livre', 'livrée'].includes(value)) return 'delivered';
    if (['shipped', 'في التوصيل', 'تم الإرسال', 'قيد التحضير'].includes(value)) return 'shipped';
    if (['cancelled', 'canceled', 'ملغي'].includes(value)) return 'cancelled';
    return 'pending';
}

function getStatusLabel(status) {
    const normalized = normalizeStatus(status);
    const labels = {
        pending: 'في الانتظار / Pending',
        shipped: 'تم الإرسال / Shipped',
        delivered: 'تم التسليم / Delivered',
        cancelled: 'ملغي / Annulée'
    };
    return labels[normalized];
}

function itemImage(item) {
    return item.image || item.imageUrl || item.image_url || item.product_image || FALLBACK_IMAGE;
}

function itemName(item) {
    return item.name || item.productName || item.product_name || item.product_id || 'Produit parapharmacie';
}

function renderProfile(user) {
    profile = getDisplayProfile(user || {});
    setText('profile-welcome', `مرحبا بك ${profile.name || 'عميلنا العزيز'}`);
    setText('profile-email', profile.email || 'Votre compte Parapharmacie.me');
    setText('profile-name', profile.name);
    setText('profile-phone', profile.whatsapp || profile.phone);
    setText('profile-city', profile.city);
    setText('profile-address', profile.address);

    document.getElementById('edit-name').value = profile.name || '';
    document.getElementById('edit-phone').value = profile.whatsapp || profile.phone || '';
    document.getElementById('edit-city').value = profile.city || '';
    document.getElementById('edit-address').value = profile.address || '';
}

function renderOrders(orders = []) {
    if (!ordersList) return;
    if (!orders.length) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <h3>لا توجد طلبيات بعد</h3>
                <p>عندما تقوم بطلب منتج من Parapharmacie.me سيظهر هنا.</p>
                <a class="btn btn--primary" href="/boutique/">ابدأ التسوق</a>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map((order) => {
        const firstItem = order.items?.[0] || {};
        const remaining = Math.max((order.items?.length || 0) - 1, 0);
        const rawDate = order.createdAt || order.created_at;
        const date = rawDate ? new Date(rawDate).toLocaleDateString('fr-MA') : '---';

        return `
            <article class="profile-order-card">
                <img src="${escapeHtml(itemImage(firstItem))}" alt="${escapeHtml(itemName(firstItem))}" loading="lazy" width="72" height="72">
                <div class="profile-order-card__body">
                    <strong>#${escapeHtml(String(order.id || '').slice(0, 8))}</strong>
                    <span>${escapeHtml(itemName(firstItem))}${remaining ? ` +${remaining}` : ''}</span>
                    <small>${escapeHtml(date)}</small>
                </div>
                <div class="profile-order-card__meta">
                    <b>${formatCurrency(order.total || 0)}</b>
                    <em class="order-status-pill status-${normalizeStatus(order.status)}">${getStatusLabel(order.status)}</em>
                </div>
            </article>
        `;
    }).join('');
}

function initTabs() {
    menuButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const tab = button.dataset.profileTab;
            menuButtons.forEach((item) => item.classList.toggle('active', item === button));
            panels.forEach((panel) => panel.classList.toggle('active', panel.id === `profile-tab-${tab}`));
        });
    });
}

async function loadProfileOrders(fallbackOrders = []) {
    try {
        const orders = fallbackOrders.length ? fallbackOrders : await listMyOrders();
        renderOrders(orders);
    } catch (error) {
        console.error('Orders error:', error);
        renderOrders(fallbackOrders);
    }
}

async function loadDashboard() {
    if (!getAccessToken()) {
        window.location.href = 'login.html';
        return;
    }

    renderProfile(profile);

    try {
        const dashboard = await apiFetchWithTimeout('/users/me/dashboard', {}, 8000, { requiresAuth: true });
        const user = dashboard.user || dashboard.profile || profile;
        renderProfile(user);
        await loadProfileOrders(dashboard.orders || []);
        saveAuthSession({
            access_token: getAccessToken(),
            user
        }, Boolean(localStorage.getItem('parapharmacie_access_token')));
        renderStatusBanner(dashboardStatus, { state: 'idle' });
    } catch (error) {
        console.info('Using cached profile after dashboard fallback:', error?.message || error);
        await loadProfileOrders();
        renderStatusBanner(dashboardStatus, {
            state: 'error',
            message: 'Le service est momentanément indisponible. Vos dernières informations enregistrées restent affichées.',
            onRetry: loadDashboard
        });
    }
}

editToggle?.addEventListener('click', () => {
    editForm.hidden = !editForm.hidden;
    if (!editForm.hidden) editForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

editForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(profileStatus, '');

    try {
        const updated = await apiFetch('/users/me', {
            method: 'PATCH',
            body: JSON.stringify({
                name: document.getElementById('edit-name').value,
                whatsapp: document.getElementById('edit-phone').value,
                city: document.getElementById('edit-city').value,
                address: document.getElementById('edit-address').value
            })
        }, { requiresAuth: true });

        renderProfile(updated);
        saveAuthSession({
            access_token: getAccessToken(),
            user: updated
        }, Boolean(localStorage.getItem('parapharmacie_access_token')));
        setStatus(profileStatus, 'تم تحديث معلومات التوصيل بنجاح.', 'success');
    } catch (error) {
        setStatus(profileStatus, error.message, 'error');
    }
});

passwordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(passwordStatus, '');

    try {
        await apiFetch('/users/me/password', {
            method: 'POST',
            body: JSON.stringify({
                oldPassword: document.getElementById('old-password').value,
                newPassword: document.getElementById('new-password').value
            })
        }, { requiresAuth: true });
        passwordForm.reset();
        setStatus(passwordStatus, 'تم تحديث كلمة المرور بنجاح.', 'success');
    } catch (error) {
        setStatus(passwordStatus, error.message, 'error');
    }
});

bindLogoutButton();
initTabs();
loadDashboard();
