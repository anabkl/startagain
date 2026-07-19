import './ui-preferences.js';
import {
    apiFetch,
    bindLogoutButton,
    getAccessToken,
    getCurrentUser
} from './auth.js';
import {
    LOCAL_PRODUCT_OVERRIDES_KEY,
    applyLocalProductOverrides,
    mockProducts,
    saveLocalProductOverride,
    setLocalProductActive
} from './catalog.js';
import { categories } from './catalog-data.js';
import { hasCurrentProductPrice, verifiedProductPrice } from './product-schema.js';

const pageContent = document.getElementById('pageContent');
const productForm = document.getElementById('productForm');
const packForm = document.getElementById('packForm');
const productStatus = document.getElementById('productStatus');
const packStatus = document.getElementById('packStatus');
const backendMode = document.getElementById('adminBackendMode');
const productSearch = document.getElementById('adminProductSearch');
const productsList = document.getElementById('adminProductsList');
const productEditor = document.getElementById('adminProductEditor');
const productEditStatus = document.getElementById('productEditStatus');
const resetProductOverridesBtn = document.getElementById('resetProductOverrides');
const cancelProductEditBtn = document.getElementById('cancelProductEdit');
const todayRevenueEl = document.getElementById('todayRevenue');
const newOrdersEl = document.getElementById('newOrders');
const newClientsEl = document.getElementById('newClients');
const refreshStatsBtn = document.getElementById('refreshStats');
const adminWelcomeName = document.getElementById('adminWelcomeName');

let editableProducts = [];

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
}

function showStatus(el, message, type = '') {
    if (!el) return;
    el.textContent = message;
    el.className = `status-msg ${type}`;
    if (!type) el.style.display = 'block';
}

function setPageVisible() {
    if (pageContent) pageContent.style.display = 'block';
}

function renderAdminWelcome(user) {
    if (!adminWelcomeName) return;
    const adminName = String(user?.name || user?.displayName || user?.email || 'Admin').trim();
    const frenchName = /^admin\b/i.test(adminName) ? adminName : `Admin ${adminName}`;
    adminWelcomeName.textContent = `Bienvenue, ${frenchName} / مرحباً، ${adminName}`;
}

// Protect the admin page with the MongoDB session token.
function initAdminGuard() {
    const user = getCurrentUser();
    const token = getAccessToken();

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    if (user.role !== 'admin') {
        window.location.href = '/';
        return;
    }

    if (backendMode) backendMode.textContent = 'Mode Render (MongoDB)';
    renderAdminWelcome(user);
    setPageVisible();
}

function initTabs() {
    document.querySelectorAll('[data-tab]').forEach((el) => {
        el.addEventListener('click', (event) => {
            event.preventDefault();
            const tab = el.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach((button) => button.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
            document.querySelectorAll('.sidebar__nav a[data-tab]').forEach((link) => link.classList.remove('active'));
            document.querySelectorAll(`[data-tab="${tab}"]`).forEach((target) => target.classList.add('active'));
            document.getElementById(`tab-${tab}`)?.classList.add('active');
            if (tab === 'statistics') loadStatistics();
        });
    });
}

function formatMAD(value) {
    return `${Number(value || 0).toLocaleString('fr-MA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} DH`;
}

function setMetric(element, value) {
    if (element) element.textContent = value;
}

async function loadStatistics() {
    if (!todayRevenueEl || !newOrdersEl || !newClientsEl) return;

    setMetric(todayRevenueEl, '...');
    setMetric(newOrdersEl, '...');
    setMetric(newClientsEl, '...');

    try {
        const stats = await apiFetch('/admin/statistics/today', {}, { requiresAuth: true });
        setMetric(todayRevenueEl, formatMAD(stats.todayRevenue || stats.sales_today || 0));
        setMetric(newOrdersEl, Number(stats.newOrders || 0).toLocaleString('fr-MA'));
        setMetric(newClientsEl, Number(stats.newClients || 0).toLocaleString('fr-MA'));
    } catch (error) {
        console.error(error);
        setMetric(todayRevenueEl, 'تعذر التحميل');
        setMetric(newOrdersEl, '---');
        setMetric(newClientsEl, '---');
    }
}

function readOwnerEnteredStock(data) {
    const rawStock = data.get('stock');
    const stock = Number(rawStock);
    if (rawStock === null || rawStock === '' || !Number.isInteger(stock) || stock < 0) {
        throw new Error('أدخل كمية المخزون الفعلية كعدد صحيح يساوي صفراً أو أكثر.');
    }
    return stock;
}

function readOptionalText(data, field) {
    const value = String(data.get(field) || '').trim();
    return value || null;
}

// 📦 إضافة منتج جديد لقاعدة بيانات MongoDB
async function saveMongoProduct(form, statusEl, button) {
    const data = new FormData(form);

    const newProduct = {
        name: data.get('name').trim(),
        brand: data.get('brand').trim(),
        category: data.get('category').trim(),
        price: Number(data.get('price')),
        promoPrice: data.get('promoPrice') ? Number(data.get('promoPrice')) : null,
        description: data.get('description').trim(),
        stock: readOwnerEnteredStock(data),
        image_url: readOptionalText(data, 'image_url'),
        sku: readOptionalText(data, 'sku'),
        isPublished: true,
        priceVerifiedAt: null,
        priceSource: null,
        stockVerified: null,
        stockVerifiedAt: null,
        deliveryEligible: null
    };

    await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(newProduct)
    }, { requiresAuth: true });

    showStatus(statusEl, 'تم حفظ المرجع. يبقى السعر والمخزون غير موثّقين والطلب معطلاً حتى استكمال الأدلة.', 'success');
    form.reset();
    button.disabled = false;
}

// 🎁 إضافة عرض (Pack) جديد لـ MongoDB
async function saveMongoPack(form, statusEl, button) {
    const data = new FormData(form);

    const newPack = {
        name: data.get('name').trim(),
        description: data.get('description').trim(),
        price: Number(data.get('promoPrice')),
        category: "Promotions",
        brand: data.get('brand').trim(),
        stock: readOwnerEnteredStock(data),
        image_url: readOptionalText(data, 'image_url'),
        sku: readOptionalText(data, 'sku'),
        isPublished: true,
        priceVerifiedAt: null,
        priceSource: null,
        stockVerified: null,
        stockVerifiedAt: null,
        deliveryEligible: null
    };

    await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(newPack)
    }, { requiresAuth: true });

    showStatus(statusEl, 'تم حفظ المرجع. يبقى السعر والمخزون غير موثّقين والطلب معطلاً حتى استكمال الأدلة.', 'success');
    form.reset();
    button.disabled = false;
}

function initForms() {
    productForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = productForm.querySelector('.btn-submit');
        button.disabled = true;
        showStatus(productStatus, 'جارٍ الحفظ...', '');

        try {
            await saveMongoProduct(productForm, productStatus, button);
        } catch (error) {
            console.error(error);
            showStatus(productStatus, `فشل الحفظ: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
        }
    });

    packForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = packForm.querySelector('.btn-submit');
        button.disabled = true;
        showStatus(packStatus, 'جارٍ الحفظ...', '');

        try {
            await saveMongoPack(packForm, packStatus, button);
        } catch (error) {
            console.error(error);
            showStatus(packStatus, `فشل الحفظ: ${error.message}`, 'error');
        } finally {
            button.disabled = false;
        }
    });
}

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function getProductPrice(product) {
    return verifiedProductPrice(product);
}

function refreshEditableProducts() {
    editableProducts = applyLocalProductOverrides(mockProducts, { includeInactive: true });
}

function renderProductsList() {
    if (!productsList) return;
    refreshEditableProducts();
    const query = normalizeText(productSearch?.value);
    const products = editableProducts.filter((product) => {
        const haystack = normalizeText([product.name, product.brand, product.category, product.id].join(' '));
        return !query || query.split(/\s+/).every((word) => haystack.includes(word));
    });

    productsList.innerHTML = products.map((product) => `
        <article class="admin-product-row ${product.active === false ? 'is-inactive' : ''}">
            <img src="${escapeHtml(product.image || product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy">
            <div>
                <strong>${escapeHtml(product.name)}</strong>
                <span>${escapeHtml(product.brand)} · ${escapeHtml(product.category)}</span>
                <small>${escapeHtml(product.id)}</small>
            </div>
            <div class="admin-product-price">${getProductPrice(product) === null ? 'À confirmer' : `${getProductPrice(product).toFixed(2)} DH`}</div>
            <span class="admin-product-state ${product.active === false ? 'off' : 'on'}">${product.active === false ? 'مخفي' : 'ظاهر'}</span>
            <div class="admin-product-actions">
                <button type="button" data-product-action="edit" data-product-id="${escapeHtml(product.id)}">تعديل</button>
                <button type="button" data-product-action="toggle" data-product-id="${escapeHtml(product.id)}">${product.active === false ? 'تفعيل' : 'إخفاء'}</button>
                <button type="button" class="danger" data-product-action="delete" data-product-id="${escapeHtml(product.id)}">حذف/إخفاء</button>
            </div>
        </article>
    `).join('') || '<p class="admin-muted">لا توجد منتجات مطابقة.</p>';
}

function populateCategorySelect(selectedCategory) {
    const select = document.getElementById('editCategory');
    if (!select) return;
    select.innerHTML = categories.map((category) => `
        <option value="${escapeHtml(category.name)}" ${category.name === selectedCategory ? 'selected' : ''}>${escapeHtml(category.name)}</option>
    `).join('');
}

function editProduct(productId) {
    const product = editableProducts.find((item) => item.id === productId);
    if (!product || !productEditor) return;

    productEditor.hidden = false;
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editName').value = product.name || '';
    document.getElementById('editBrand').value = product.brand || '';
    document.getElementById('editPrice').value = getProductPrice(product) ?? '';
    document.getElementById('editOldPrice').value = product.oldPriceMAD || '';
    document.getElementById('editPriceSource').value = product.priceSource || '';
    document.getElementById('editPriceVerifiedAt').value = product.priceVerifiedAt ? new Date(product.priceVerifiedAt).toISOString().slice(0, 16) : '';
    document.getElementById('editStockStatus').value = product.stockStatus || 'Disponibilité à confirmer';
    document.getElementById('editImage').value = product.image || product.imageUrl || '';
    document.getElementById('editDescription').value = product.shortDescription || product.description || '';
    document.getElementById('editActive').checked = product.active !== false;
    populateCategorySelect(product.category);
    productEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function readProductEditor() {
    const priceInput = document.getElementById('editPrice').value.trim();
    const priceSource = document.getElementById('editPriceSource').value.trim();
    const verifiedAtInput = document.getElementById('editPriceVerifiedAt').value;
    const candidate = {
        priceMAD: priceInput ? Number(priceInput) : null,
        priceSource: priceSource || null,
        priceVerifiedAt: verifiedAtInput ? new Date(verifiedAtInput).toISOString() : null
    };
    const priceVerified = hasCurrentProductPrice(candidate);
    const priceMAD = priceVerified ? candidate.priceMAD : null;
    const oldPriceMAD = Number(document.getElementById('editOldPrice').value) || null;
    const image = document.getElementById('editImage').value.trim();

    return {
        name: document.getElementById('editName').value.trim(),
        brand: document.getElementById('editBrand').value.trim(),
        priceMAD,
        priceSource: priceVerified ? candidate.priceSource : null,
        priceVerifiedAt: priceVerified ? candidate.priceVerifiedAt : null,
        oldPriceMAD: priceVerified && oldPriceMAD && oldPriceMAD > priceMAD ? oldPriceMAD : null,
        category: document.getElementById('editCategory').value,
        stockStatus: document.getElementById('editStockStatus').value,
        image,
        imageUrl: image,
        shortDescription: document.getElementById('editDescription').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        active: document.getElementById('editActive').checked
    };
}

function initProductManagement() {
    renderProductsList();
    productSearch?.addEventListener('input', renderProductsList);
    cancelProductEditBtn?.addEventListener('click', () => {
        productEditor.hidden = true;
    });

    resetProductOverridesBtn?.addEventListener('click', () => {
        if (!window.confirm('هل تريد حذف كل تعديلات المنتجات المحلية؟')) return;
        localStorage.removeItem(LOCAL_PRODUCT_OVERRIDES_KEY);
        productEditor.hidden = true;
        renderProductsList();
    });

    productsList?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-product-action]');
        if (!button) return;
        const productId = button.dataset.productId;
        const product = editableProducts.find((item) => item.id === productId);
        if (!product) return;

        if (button.dataset.productAction === 'edit') editProduct(productId);
        if (button.dataset.productAction === 'toggle') {
            setLocalProductActive(productId, product.active === false);
            renderProductsList();
        }
        if (button.dataset.productAction === 'delete') {
            if (!window.confirm('سيتم إخفاء المنتج من المتجر مع الاحتفاظ ببياناته. هل تريد المتابعة؟')) return;
            setLocalProductActive(productId, false);
            renderProductsList();
        }
    });

    productEditor?.addEventListener('submit', (event) => {
        event.preventDefault();
        const productId = document.getElementById('editProductId').value;
        saveLocalProductOverride(productId, readProductEditor());
        showStatus(productEditStatus, 'تم حفظ تعديلات المنتج محلياً.', 'success');
        renderProductsList();
    });
}

// 🚪 تسجيل الخروج
bindLogoutButton('#logoutBtn');
refreshStatsBtn?.addEventListener('click', loadStatistics);

initTabs();
initForms();
initProductManagement();
initAdminGuard();
loadStatistics();
