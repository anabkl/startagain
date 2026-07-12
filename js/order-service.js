import { apiFetch, apiFetchWithTimeout, getAccessToken } from './auth.js';
import { isApiMode, isFirebaseEnabled } from './runtime-config.js';

export const LOCAL_ORDERS_KEY = 'parapharmacie_orders';
export const DEFAULT_ORDER_STATUS = 'في الانتظار';
export const ORDER_STATUSES = [
    'في الانتظار',
    'تم التأكيد',
    'قيد التحضير',
    'في التوصيل',
    'تم التسليم',
    'ملغي'
];

function createLocalOrderId() {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const random = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    return `PM-${Date.now().toString(36).toUpperCase()}-${random.slice(0, 8)}`;
}

function getNowIso() {
    return new Date().toISOString();
}

function normalizeStatus(status) {
    const value = String(status || '').trim();
    if (!value) return DEFAULT_ORDER_STATUS;

    const map = {
        pending: 'في الانتظار',
        confirmed: 'تم التأكيد',
        preparing: 'قيد التحضير',
        delivery: 'في التوصيل',
        delivering: 'في التوصيل',
        delivered: 'تم التسليم',
        cancelled: 'ملغي',
        canceled: 'ملغي'
    };

    const normalized = map[value.toLowerCase()] || value;
    return ORDER_STATUSES.includes(normalized) ? normalized : DEFAULT_ORDER_STATUS;
}

function normalizePhone(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const digits = raw.replace(/\D+/g, '');
    if (!digits) return '';
    if (digits.startsWith('212')) return `+${digits}`;
    if (digits.startsWith('0')) return `+212${digits.slice(1)}`;
    if (digits.length === 9) return `+212${digits}`;
    return raw.startsWith('+') ? raw : `+${digits}`;
}

function maskPhone(value) {
    const phone = String(value || '').replace(/\s+/g, '');
    if (phone.length < 4) return '***';
    return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
}

function safeParseOrders() {
    try {
        const orders = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY)) || [];
        return Array.isArray(orders) ? orders : [];
    } catch {
        return [];
    }
}

function writeLocalOrders(orders) {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

function pickArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
}

function getOrderTimestamp(order) {
    const value = order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt;
    const date = value ? new Date(value) : new Date(0);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeOrder(orderData = {}, id = null, source = orderData.source || 'api') {
    const now = getNowIso();
    const shipping = orderData.shipping_address || orderData.shippingAddress || {};
    const fullName = String(orderData.customer_name || orderData.customerName || '').trim();
    const [firstFromName = '', ...rest] = fullName.split(/\s+/);
    const firstName = shipping.first_name || shipping.firstName || orderData.firstName || firstFromName;
    const lastName = shipping.last_name || shipping.lastName || orderData.lastName || rest.join(' ');
    const phoneOriginal = String(
        orderData.phoneOriginal
        || shipping.whatsapp
        || shipping.phone
        || orderData.whatsapp
        || orderData.phone
        || ''
    ).trim();
    const phoneNormalized = orderData.phoneNormalized || normalizePhone(phoneOriginal);
    const subtotal = Number(orderData.subtotal ?? orderData.total ?? 0);
    const deliveryFee = Number(orderData.deliveryFee || orderData.delivery_fee || 0);
    const total = Number(orderData.total ?? subtotal + deliveryFee);
    const status = normalizeStatus(orderData.status);

    return {
        id: String(id || orderData._id || orderData.id || ''),
        firstName: firstName || '',
        lastName: lastName || '',
        email: shipping.email || orderData.email || '',
        phoneOriginal,
        phoneNormalized,
        whatsappMasked: maskPhone(phoneNormalized || phoneOriginal),
        whatsapp: phoneNormalized || phoneOriginal,
        city: shipping.city || orderData.city || '',
        address: shipping.address || orderData.address || '',
        paymentMethod: String(orderData.payment_method || orderData.paymentMethod || 'COD').toUpperCase(),
        items: Array.isArray(orderData.items) ? orderData.items.map((item) => ({
            ...item,
            id: item.id || item.product_id || item.productId,
            apiId: item.apiId || item.product_id || item.productId || null,
            product_id: item.apiId || item.product_id || item.productId || item.id,
            name: item.name || item.product_name || item.product?.name || item.productName || item.product_id || item.productId || 'Produit',
            effectivePrice: Number(item.unit_price ?? item.effectivePrice ?? item.priceMAD ?? item.price ?? 0),
            priceMAD: Number(item.unit_price ?? item.priceMAD ?? item.price ?? 0),
            quantity: Number(item.quantity || 1),
            image: item.image || item.imageUrl || item.image_url || item.product?.image_url || ''
        })) : [],
        subtotal,
        deliveryFee,
        deliveryLabel: orderData.deliveryLabel || orderData.delivery_label || 'A confirmer',
        total,
        status,
        statusHistory: Array.isArray(orderData.statusHistory) && orderData.statusHistory.length
            ? orderData.statusHistory
            : [{ status, at: orderData.updatedAt || orderData.createdAt || orderData.created_at || now, note: 'Commande creee' }],
        createdAt: orderData.createdAt || orderData.created_at || now,
        updatedAt: orderData.updatedAt || orderData.updated_at || orderData.createdAt || orderData.created_at || now,
        source
    };
}

function normalizeFirebaseOrder(id, data) {
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
    const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt;
    return normalizeOrder({ ...data, createdAt, updatedAt }, data.id || id, 'firebase');
}

async function getFirestoreApi() {
    const [{ db }, firestore] = await Promise.all([
        import('./firebase.js'),
        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js')
    ]);
    return { db, firestore };
}

function saveOrderLocally(orderData) {
    const order = normalizeOrder(orderData, createLocalOrderId(), 'local');
    const orders = safeParseOrders();
    orders.unshift(order);
    writeLocalOrders(orders);
    return order;
}

function cacheOrderLocally(orderData) {
    const order = normalizeOrder(orderData, orderData.id, orderData.source || 'api');
    if (!order.id) return order;
    const orders = safeParseOrders().filter((item) => item.id !== order.id);
    orders.unshift(order);
    writeLocalOrders(orders);
    return order;
}

async function saveOrderToFirebase(orderData) {
    const { db, firestore } = await getFirestoreApi();
    const docRef = firestore.doc(firestore.collection(db, 'orders'));
    const order = normalizeOrder(orderData, docRef.id, 'firebase');

    await firestore.setDoc(docRef, {
        ...order,
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp()
    });

    return order;
}

export function toApiOrderPayload(orderData) {
    return {
        items: (orderData.items || []).map((item) => ({
            product_id: String(item.apiId || item.product_id || item.id),
            quantity: Number(item.quantity || 1)
        })),
        shipping_address: {
            first_name: orderData.firstName || '',
            last_name: orderData.lastName || '',
            email: orderData.email || '',
            whatsapp: orderData.phoneNormalized || orderData.whatsapp || orderData.phoneOriginal || '',
            city: orderData.city || '',
            address: orderData.address || ''
        },
        payment_method: String(orderData.paymentMethod || 'cod').toLowerCase()
    };
}

async function saveOrderToApi(orderData) {
    const payload = await apiFetchWithTimeout('/orders', {
        method: 'POST',
        body: JSON.stringify(toApiOrderPayload(orderData))
    }, 15000, { requiresAuth: Boolean(getAccessToken()) });

    const normalized = normalizeOrder({
        ...orderData,
        ...(payload?.order || payload || {}),
        items: payload?.items || payload?.order?.items || orderData.items,
        total: payload?.total ?? payload?.order?.total ?? orderData.total
    }, payload?._id || payload?.id || payload?.order?._id || payload?.order?.id, 'api');

    return normalized;
}

export async function saveOrder(orderData) {
    if (isFirebaseEnabled()) {
        try {
            const order = await saveOrderToFirebase(orderData);
            return { id: order.id, source: 'firebase', order };
        } catch (error) {
            console.info('Order saved locally for demo mode:', error?.message || error);
        }
    }

    if (isApiMode()) {
        try {
            const order = await saveOrderToApi(orderData);
            if (order.id) {
                cacheOrderLocally(order);
                return { id: order.id, source: 'api', order };
            }
        } catch (error) {
            console.info('Order saved locally after API fallback:', error?.message || error);
        }
    }

    const order = saveOrderLocally(orderData);
    return { id: order.id, source: 'local', order };
}

export async function listOrders() {
    if (isFirebaseEnabled()) {
        try {
            const { db, firestore } = await getFirestoreApi();
            const q = firestore.query(firestore.collection(db, 'orders'), firestore.orderBy('createdAt', 'desc'));
            const snap = await firestore.getDocs(q);
            return snap.docs.map((item) => normalizeFirebaseOrder(item.id, item.data()));
        } catch (error) {
            console.info('Using local orders for admin demo:', error?.message || error);
        }
    }

    if (isApiMode()) {
        try {
            const payload = await apiFetchWithTimeout('/orders', {}, 8000, { requiresAuth: true });
            return pickArray(payload)
                .map((item) => normalizeOrder(item, item._id || item.id, 'api'))
                .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
        } catch (error) {
            console.info('Using local orders after API fallback:', error?.message || error);
        }
    }

    return safeParseOrders()
        .map((order) => normalizeOrder(order, order.id, order.source || 'local'))
        .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
}

export async function listMyOrders() {
    if (isApiMode() && getAccessToken()) {
        try {
            const payload = await apiFetchWithTimeout('/orders/me', {}, 8000, { requiresAuth: true });
            return pickArray(payload)
                .map((item) => normalizeOrder(item, item._id || item.id, 'api'))
                .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
        } catch {
            try {
                const payload = await apiFetchWithTimeout('/orders/my-orders', {}, 8000, { requiresAuth: true });
                return pickArray(payload)
                    .map((item) => normalizeOrder(item, item._id || item.id, 'api'))
                    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
            } catch (error) {
                console.info('Using local profile orders after API fallback:', error?.message || error);
            }
        }
    }

    return safeParseOrders()
        .map((order) => normalizeOrder(order, order.id, order.source || 'local'))
        .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
}

export async function getOrderById(orderId, source = null) {
    if (!orderId) return null;

    const localOrder = safeParseOrders().find((item) => item.id === orderId);
    if (source === 'local' || localOrder) {
        return localOrder ? normalizeOrder(localOrder, localOrder.id, localOrder.source || 'local') : null;
    }

    if (source === 'firebase' && isFirebaseEnabled()) {
        try {
            const { db, firestore } = await getFirestoreApi();
            const snap = await firestore.getDoc(firestore.doc(db, 'orders', orderId));
            return snap.exists() ? normalizeFirebaseOrder(snap.id, snap.data()) : null;
        } catch {
            return null;
        }
    }

    if (isApiMode() && getAccessToken()) {
        try {
            const payload = await apiFetch(`/orders/${encodeURIComponent(orderId)}`, {}, { requiresAuth: true });
            return normalizeOrder(payload?.order || payload, orderId, 'api');
        } catch {
            return null;
        }
    }

    return null;
}

export async function updateOrderStatus(orderId, status, note = 'Status updated') {
    if (!orderId) throw new Error('Order not found');
    const statusEntry = { status, at: getNowIso(), note };

    const orders = safeParseOrders();
    const localOrder = orders.find((item) => item.id === orderId);
    if (localOrder) {
        localOrder.status = status;
        localOrder.updatedAt = statusEntry.at;
        localOrder.statusHistory = [...(localOrder.statusHistory || []), statusEntry];
        writeLocalOrders(orders);
        return normalizeOrder(localOrder, localOrder.id, localOrder.source || 'local');
    }

    if (isFirebaseEnabled()) {
        const { db, firestore } = await getFirestoreApi();
        const orderRef = firestore.doc(db, 'orders', orderId);
        await firestore.updateDoc(orderRef, {
            status,
            updatedAt: firestore.serverTimestamp(),
            statusHistory: firestore.arrayUnion(statusEntry)
        });
        return getOrderById(orderId, 'firebase');
    }

    const body = JSON.stringify({ status, note });
    try {
        const payload = await apiFetch(`/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PATCH',
            body
        }, { requiresAuth: true });
        return normalizeOrder(payload?.order || payload, orderId, 'api');
    } catch {
        const payload = await apiFetch(`/orders/${encodeURIComponent(orderId)}`, {
            method: 'PATCH',
            body
        }, { requiresAuth: true });
        return normalizeOrder(payload?.order || payload, orderId, 'api');
    }
}

export async function deleteOrder(orderId) {
    if (!orderId) throw new Error('Order not found');

    const orders = safeParseOrders();
    const hasLocal = orders.some((order) => order.id === orderId);
    if (hasLocal) {
        writeLocalOrders(orders.filter((order) => order.id !== orderId));
        return true;
    }

    if (isFirebaseEnabled()) {
        const { db, firestore } = await getFirestoreApi();
        await firestore.deleteDoc(firestore.doc(db, 'orders', orderId));
        return true;
    }

    await apiFetch(`/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE'
    }, { requiresAuth: true });
    return true;
}

export function buildWhatsAppOrderMessage(order, orderId, formatCurrency) {
    const itemsList = (order.items || []).map((item, index) => {
        const quantity = item.quantity || 1;
        const price = item.effectivePrice || item.priceMAD || item.promoPrice || item.price || 0;
        return `${index + 1}. ${item.name} x ${quantity} = ${formatCurrency(price * quantity)}`;
    }).join('\n');

    return `Nouvelle commande - parapharmacie.me

Client: ${order.firstName} ${order.lastName}
WhatsApp: ${order.phoneNormalized || order.whatsappMasked || order.whatsapp || '***'}
Email: ${order.email || 'Non renseigne'}
Ville: ${order.city}
Adresse: ${order.address}

Produits:
${itemsList}

Sous-total: ${formatCurrency(order.subtotal || order.total || 0)}
Livraison: ${order.deliveryLabel || 'A confirmer'}
Total: ${formatCurrency(order.total || 0)}
Paiement: Paiement a la livraison
Statut: ${order.status || DEFAULT_ORDER_STATUS}
Commande: #${String(orderId).slice(0, 12)}
Date: ${new Date(order.createdAt || Date.now()).toLocaleString('fr-MA')}`;
}
