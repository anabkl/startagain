import { apiFetch, apiFetchWithTimeout, getAccessToken } from './auth.js';
import { isApiMode, isFirebaseEnabled } from './runtime-config.js';
import { hasCurrentProductPrice, hasCurrentStockVerification, isProductOrderable, verifiedProductPrice } from './product-schema.js';

export const LOCAL_ORDERS_KEY = 'parapharmacie_orders';
const ORDER_ATTEMPT_KEY = 'parapharmacie_order_attempt';
const ORDER_RECEIPT_KEY = 'parapharmacie_order_receipt';
const RECEIPT_TTL_MS = 30 * 60 * 1000;
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

function createRequestId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const random = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `web-${random}`;
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
        const orders = JSON.parse(sessionStorage.getItem(LOCAL_ORDERS_KEY)) || [];
        return Array.isArray(orders) ? orders : [];
    } catch {
        return [];
    }
}

function writeLocalOrders(orders) {
    sessionStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

function attemptFingerprint(orderData) {
    return JSON.stringify({
        items: (orderData.items || []).map((item) => ({
            product_id: String(item.apiId || item.product_id || item.id),
            quantity: Number(item.quantity || 1)
        })),
        firstName: orderData.firstName || '',
        lastName: orderData.lastName || '',
        email: orderData.email || '',
        whatsapp: orderData.phoneNormalized || orderData.whatsapp || orderData.phoneOriginal || '',
        city: orderData.city || '',
        address: orderData.address || '',
        paymentMethod: String(orderData.paymentMethod || 'cod').toLowerCase()
    });
}

let volatileAttempt = null;

export function getOrCreateOrderRequestId(orderData) {
    const fingerprint = attemptFingerprint(orderData);
    let stored = volatileAttempt;
    try {
        stored = JSON.parse(sessionStorage.getItem(ORDER_ATTEMPT_KEY)) || stored;
    } catch {
        // Privacy/storage settings may disable sessionStorage. The in-memory
        // key still protects retries while this page remains loaded.
    }
    if (stored?.fingerprint === fingerprint && stored?.requestId) return stored.requestId;

    volatileAttempt = { fingerprint, requestId: createRequestId() };
    try {
        sessionStorage.setItem(ORDER_ATTEMPT_KEY, JSON.stringify(volatileAttempt));
    } catch {
        // Best effort only; the server remains authoritative.
    }
    return volatileAttempt.requestId;
}

export function clearOrderRequestId() {
    volatileAttempt = null;
    try {
        sessionStorage.removeItem(ORDER_ATTEMPT_KEY);
    } catch {
        // Best effort after a server-confirmed request.
    }
}

export function saveOrderReceipt(order) {
    const receipt = {
        id: order.id,
        source: order.source || 'api',
        items: (order.items || []).map((item) => ({
            name: item.name || 'Produit',
            quantity: Number(item.quantity || 1)
        })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        deliveryLabel: order.deliveryLabel || 'À confirmer',
        total: order.total,
        expiresAt: Date.now() + RECEIPT_TTL_MS
    };
    try {
        sessionStorage.setItem(ORDER_RECEIPT_KEY, JSON.stringify(receipt));
    } catch {
        // The success route can still render the order id from its URL.
    }
    return receipt;
}

function readOrderReceipt(orderId) {
    try {
        const receipt = JSON.parse(sessionStorage.getItem(ORDER_RECEIPT_KEY));
        if (!receipt || receipt.id !== orderId || Number(receipt.expiresAt) < Date.now()) {
            sessionStorage.removeItem(ORDER_RECEIPT_KEY);
            return null;
        }
        return receipt;
    } catch {
        return null;
    }
}

function pickArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
}

function orderItemPriceEvidence(item = {}) {
    return {
        priceMAD: item.priceMAD ?? item.effectivePrice ?? item.unit_price,
        priceSource: item.priceSource ?? item.price_source,
        priceVerifiedAt: item.priceVerifiedAt ?? item.price_verified_at
    };
}

export function assertOrderPricesVerified(orderData) {
    const items = Array.isArray(orderData?.items) ? orderData.items : [];
    if (!items.length) throw new Error('La commande ne contient aucune référence.');

    for (const item of items) {
        const orderableItem = { ...item, ...orderItemPriceEvidence(item) };
        if (!hasCurrentProductPrice(orderableItem)) {
            throw new Error(`Prix non vérifié pour ${item.name || item.id || 'une référence'}.`);
        }
        if (item.deliveryEligible !== true) {
            throw new Error(`Livraison non confirmée pour ${item.name || item.id || 'une référence'}.`);
        }
        if (!hasCurrentStockVerification(item)) {
            throw new Error(`Stock non vérifié ou périmé pour ${item.name || item.id || 'une référence'}.`);
        }
        if (Number(item.stock) <= 0) {
            throw new Error(`Stock indisponible pour ${item.name || item.id || 'une référence'}.`);
        }
        if (!isProductOrderable(orderableItem)) {
            throw new Error(`Commande en ligne non autorisée pour ${item.name || item.id || 'une référence'}.`);
        }
    }
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
    const subtotalValue = orderData.subtotal ?? orderData.total;
    const deliveryFeeValue = orderData.deliveryFee ?? orderData.delivery_fee;
    const totalValue = orderData.total;
    const subtotal = Number.isFinite(Number(subtotalValue)) ? Number(subtotalValue) : null;
    const deliveryFee = Number.isFinite(Number(deliveryFeeValue)) ? Number(deliveryFeeValue) : null;
    const calculatedTotal = subtotal !== null && deliveryFee !== null ? subtotal + deliveryFee : null;
    const total = Number.isFinite(Number(totalValue)) ? Number(totalValue) : calculatedTotal;
    const status = normalizeStatus(orderData.status);
    const deliveryCoverageStatus = orderData.delivery_service_confirmed === true
        ? 'confirmed_local'
        : orderData.delivery_service_confirmed === false
            ? 'pending_confirmation'
            : orderData.deliveryCoverageStatus || orderData.delivery_coverage_status || 'pending_confirmation';

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
        deliveryCoverageStatus,
        deliveryNotice: orderData.deliveryNotice || orderData.delivery_notice || '',
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
    assertOrderPricesVerified(orderData);
    const email = String(orderData.email || '').trim();
    return {
        items: (orderData.items || []).map((item) => ({
            product_id: String(item.apiId || item.product_id || item.id),
            quantity: Number(item.quantity || 1)
        })),
        shipping_address: {
            first_name: orderData.firstName || '',
            last_name: orderData.lastName || '',
            whatsapp: orderData.phoneNormalized || orderData.whatsapp || orderData.phoneOriginal || '',
            city: orderData.city || '',
            address: orderData.address || '',
            country_code: 'MA',
            ...(email ? { email } : {})
        },
        payment_method: String(orderData.paymentMethod || 'cod').toLowerCase(),
        request_id: orderData.requestId || getOrCreateOrderRequestId(orderData)
    };
}

async function saveOrderToApi(orderData) {
    const payload = await apiFetchWithTimeout('/orders', {
        method: 'POST',
        body: JSON.stringify(toApiOrderPayload(orderData))
    }, 15000, { requiresAuth: Boolean(getAccessToken()) });

    const serverReceipt = payload?.order || payload || {};
    const serverFee = Number(serverReceipt.delivery_fee);
    const serverCoverageConfirmed = serverReceipt.delivery_service_confirmed === true;
    const normalized = normalizeOrder({
        ...orderData,
        ...serverReceipt,
        // Once the API accepts the request, display its server-priced lines.
        // Browser evidence remains only a preflight guard, never the receipt.
        items: serverReceipt.items || [],
        subtotal: serverReceipt.subtotal,
        deliveryFee: serverReceipt.delivery_fee,
        deliveryLabel: Number.isFinite(serverFee)
            ? `${serverFee.toFixed(2)} DH${serverCoverageConfirmed ? ' (Khouribga)' : ' (couverture à confirmer)'}`
            : 'À confirmer',
        deliveryNotice: serverReceipt.delivery_notice || '',
        deliveryCoverageStatus: serverCoverageConfirmed ? 'confirmed_local' : 'pending_confirmation',
        total: serverReceipt.total
    }, serverReceipt._id || serverReceipt.id, 'api');

    return normalized;
}

export async function saveOrder(orderData) {
    assertOrderPricesVerified(orderData);
    if (isFirebaseEnabled()) {
        const order = await saveOrderToFirebase(orderData);
        return { id: order.id, source: 'firebase', order };
    }

    if (isApiMode()) {
        const order = await saveOrderToApi(orderData);
        if (!order.id) throw new Error('Le service de commande n’a pas confirmé l’enregistrement.');
        return { id: order.id, source: 'api', order };
    }

    // Local persistence is an explicit mock/demo backend mode only. A
    // configured remote rejection must propagate so checkout preserves cart.
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

    const receipt = readOrderReceipt(orderId);
    if (receipt) return normalizeOrder(receipt, receipt.id, receipt.source || source || 'api');

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
        const serverPrice = Number(item.price);
        const verifiedPrice = verifiedProductPrice(orderItemPriceEvidence(item));
        const price = Number.isFinite(serverPrice) && serverPrice > 0 ? serverPrice : verifiedPrice;
        const serverSubtotal = Number(item.subtotal);
        const lineSubtotal = Number.isFinite(serverSubtotal) && serverSubtotal > 0
            ? serverSubtotal
            : price === null ? null : price * quantity;
        return `${index + 1}. ${item.name} x ${quantity} = ${formatCurrency(lineSubtotal)}`;
    }).join('\n');

    const subtotal = Number(order.subtotal);
    const total = Number(order.total);

    return `Nouvelle commande - parapharmacie.me

Client: ${order.firstName} ${order.lastName}
WhatsApp: ${order.phoneNormalized || order.whatsappMasked || order.whatsapp || '***'}
Email: ${order.email || 'Non renseigne'}
Ville: ${order.city}
Adresse: ${order.address}

Produits:
${itemsList}

Sous-total: ${formatCurrency(Number.isFinite(subtotal) && subtotal > 0 ? subtotal : null)}
Livraison: ${order.deliveryLabel || 'A confirmer'}
Total: ${formatCurrency(Number.isFinite(total) && total > 0 ? total : null)}
Paiement: Paiement a la livraison
Statut: ${order.status || DEFAULT_ORDER_STATUS}
Commande: #${String(orderId).slice(0, 12)}
Date: ${new Date(order.createdAt || Date.now()).toLocaleString('fr-MA')}`;
}
