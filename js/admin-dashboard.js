import { isFirebaseEnabled } from './runtime-config.js';
import {
    LOCAL_PRODUCT_OVERRIDES_KEY,
    applyLocalProductOverrides,
    getCategoryLabel,
    mockProducts,
    saveLocalProductOverride,
    setLocalProductActive
} from './catalog.js';
import { categories } from './catalog-data.js';

const pageContent = document.getElementById('pageContent');
const logoutBtn = document.getElementById('logoutBtn');
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

let firebaseContext = null;
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

async function loadFirebaseContext() {
    if (firebaseContext) return firebaseContext;

    const [{ auth, db, storage }, firestore, storageApi, authApi] = await Promise.all([
        import('./firebase.js'),
        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js'),
        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js'),
        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js')
    ]);

    firebaseContext = { auth, db, storage, firestore, storageApi, authApi };
    return firebaseContext;
}

async function initAdminGuard() {
    if (!isFirebaseEnabled()) {
        if (backendMode) backendMode.textContent = 'Mode local/mock';
        setPageVisible();
        return;
    }

    if (backendMode) backendMode.textContent = 'Mode Firebase';
    const { auth, db, firestore, authApi } = await loadFirebaseContext();

    authApi.onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const userDoc = await firestore.getDoc(firestore.doc(db, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        setPageVisible();
    });
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
        });
    });
}

async function uploadImage(file, folder) {
    const { storage, storageApi } = await loadFirebaseContext();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const imagePath = `${folder}/${crypto.randomUUID()}_${safeName}`;
    const imageRef = storageApi.ref(storage, imagePath);
    await storageApi.uploadBytes(imageRef, file);
    return { imageUrl: await storageApi.getDownloadURL(imageRef), imagePath };
}

function requireFirebaseForm(statusEl) {
    showStatus(statusEl, 'Mode local: activez Firebase avec ?backend=firebase pour ajouter de nouveaux produits.', 'error');
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        || crypto.randomUUID();
}

async function saveFirebaseProduct(form, statusEl, button) {
    const { auth, db, firestore } = await loadFirebaseContext();
    const data = new FormData(form);
    const imageFile = data.get('image');
    if (!imageFile || imageFile.size === 0) throw new Error('المرجو اختيار صورة صالحة.');
    const { imageUrl, imagePath } = await uploadImage(imageFile, 'products');
    const docRef = firestore.doc(firestore.collection(db, 'products'));
    const name = data.get('name').trim();
    const brand = data.get('brand').trim();
    const category = data.get('category');
    const description = data.get('description').trim();
    const regularPrice = Number(data.get('price'));
    const promoPrice = data.get('promoPrice') ? Number(data.get('promoPrice')) : null;
    const hasPromo = promoPrice && promoPrice < regularPrice;

    await firestore.setDoc(docRef, {
        id: docRef.id,
        type: 'product',
        name,
        slug: slugify(name),
        brand,
        category,
        description,
        shortDescription: description,
        price: regularPrice,
        priceMAD: hasPromo ? promoPrice : regularPrice,
        promoPrice: hasPromo ? promoPrice : null,
        oldPriceMAD: hasPromo ? regularPrice : null,
        imageUrl,
        image: imageUrl,
        imagePath,
        gallery: [imageUrl],
        stock: 24,
        stockStatus: 'En stock',
        tags: [brand, getCategoryLabel(category)],
        keywords: [name, brand, category, getCategoryLabel(category)],
        rating: 4.7,
        reviewsCount: 0,
        isPromotion: Boolean(hasPromo),
        isFeatured: false,
        isPublished: true,
        active: true,
        sourceUrl: 'admin-upload',
        imageNeedsReview: false,
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
        createdBy: auth.currentUser.uid
    });

    showStatus(statusEl, 'تم حفظ المنتج بنجاح!', 'success');
    form.reset();
    button.disabled = false;
}

async function saveFirebasePack(form, statusEl, button) {
    const { auth, db, firestore } = await loadFirebaseContext();
    const data = new FormData(form);
    const imageFile = data.get('image');
    if (!imageFile || imageFile.size === 0) throw new Error('المرجو اختيار صورة صالحة.');
    const { imageUrl, imagePath } = await uploadImage(imageFile, 'packs');
    const endTimeValue = data.get('endTime');
    const parsedDate = endTimeValue ? new Date(endTimeValue) : null;

    await firestore.addDoc(firestore.collection(db, 'products'), {
        type: 'pack',
        name: data.get('name').trim(),
        description: data.get('description').trim(),
        promoPrice: Number(data.get('promoPrice')),
        packType: data.get('packType'),
        endTime: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : null,
        imageUrl,
        imagePath,
        active: true,
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
        createdBy: auth.currentUser.uid
    });

    showStatus(statusEl, 'تم حفظ الباك / العرض بنجاح!', 'success');
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
            if (!isFirebaseEnabled()) {
                requireFirebaseForm(productStatus);
                return;
            }
            await saveFirebaseProduct(productForm, productStatus, button);
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
            if (!isFirebaseEnabled()) {
                requireFirebaseForm(packStatus);
                return;
            }
            await saveFirebasePack(packForm, packStatus, button);
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
    return Number(product.priceMAD || product.promoPrice || product.price || 0);
}

function refreshEditableProducts() {
    editableProducts = applyLocalProductOverrides(mockProducts, { includeInactive: true });
}

function renderProductsList() {
    if (!productsList) return;
    refreshEditableProducts();
    const query = normalizeText(productSearch?.value);
    const products = editableProducts.filter((product) => {
        const haystack = normalizeText([product.name, product.brand, product.category, product.categoryLabel, product.id].join(' '));
        return !query || query.split(/\s+/).every((word) => haystack.includes(word));
    });

    productsList.innerHTML = products.map((product) => `
        <article class="admin-product-row ${product.active === false ? 'is-inactive' : ''}">
            <img src="${escapeHtml(product.image || product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy">
            <div>
                <strong>${escapeHtml(product.name)}</strong>
                <span>${escapeHtml(product.brand)} · ${escapeHtml(getCategoryLabel(product.category))}</span>
                <small>${escapeHtml(product.id)}</small>
            </div>
            <div class="admin-product-price">${getProductPrice(product).toFixed(2)} DH</div>
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
        <option value="${escapeHtml(category.slug)}" ${category.slug === selectedCategory ? 'selected' : ''}>${escapeHtml(category.name)}</option>
    `).join('');
}

function editProduct(productId) {
    const product = editableProducts.find((item) => item.id === productId);
    if (!product || !productEditor) return;

    productEditor.hidden = false;
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editName').value = product.name || '';
    document.getElementById('editBrand').value = product.brand || '';
    document.getElementById('editPrice').value = getProductPrice(product);
    document.getElementById('editOldPrice').value = product.oldPriceMAD || '';
    document.getElementById('editStockStatus').value = product.stockStatus || 'En stock';
    document.getElementById('editImage').value = product.image || product.imageUrl || '';
    document.getElementById('editDescription').value = product.shortDescription || product.description || '';
    document.getElementById('editActive').checked = product.active !== false;
    populateCategorySelect(product.category);
    productEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function readProductEditor() {
    const priceMAD = Number(document.getElementById('editPrice').value);
    const oldPriceMAD = Number(document.getElementById('editOldPrice').value) || null;
    const image = document.getElementById('editImage').value.trim();

    return {
        name: document.getElementById('editName').value.trim(),
        brand: document.getElementById('editBrand').value.trim(),
        priceMAD,
        oldPriceMAD: oldPriceMAD && oldPriceMAD > priceMAD ? oldPriceMAD : null,
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

logoutBtn?.addEventListener('click', async () => {
    if (!isFirebaseEnabled()) {
        window.location.href = 'index.html';
        return;
    }
    const { auth, authApi } = await loadFirebaseContext();
    await authApi.signOut(auth);
    window.location.href = 'index.html';
});

initTabs();
initForms();
initProductManagement();
initAdminGuard();
