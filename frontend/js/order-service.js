import { isFirebaseEnabled } from './runtime-config.js';

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
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PM-${Date.now().toString(36).toUpperCase()}-${random}`;
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

function getNowIso() {
    return new Date().toISOString();
}

function normalizeStatus(status) {
    if (!status || status === 'pending') return DEFAULT_ORDER_STATUS;
    return ORDER_STATUSES.includes(status) ? status : DEFAULT_ORDER_STATUS;
}

function normalizeOrder(orderData, id, source = 'local') {
    const now = getNowIso();
    const subtotal = Number(orderData.subtotal ?? orderData.total ?? 0);
    const deliveryFee = Number(orderData.deliveryFee || 0);
    const deliveryLabel = orderData.deliveryLabel || 'A confirmer';
    const total = Number(orderData.total ?? subtotal + deliveryFee);
    const status = normalizeStatus(orderData.status);

    return {
        id,
        firstName: orderData.firstName || '',
        lastName: orderData.lastName || '',
        email: orderData.email || '',
        phoneOriginal: orderData.phoneOriginal || orderData.whatsapp || '',
        phoneNormalized: orderData.phoneNormalized || orderData.whatsapp || '',
        whatsapp: orderData.phoneNormalized || orderData.whatsapp || '',
        city: orderData.city || '',
        address: orderData.address || '',
        paymentMethod: orderData.paymentMethod || 'COD',
        items: Array.isArray(orderData.items) ? orderData.items : [],
        subtotal,
        deliveryFee,
        deliveryLabel,
        total,
        status,
        statusHistory: Array.isArray(orderData.statusHistory) && orderData.statusHistory.length
            ? orderData.statusHistory
            : [{ status, at: now, note: 'Commande creee' }],
        createdAt: orderData.createdAt || now,
        updatedAt: orderData.updatedAt || now,
        source
    };
}

function getOrderTimestamp(order) {
    const value = order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt;
    const date = value ? new Date(value) : new Date(0);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

function saveOrderLocally(orderData) {
    const order = normalizeOrder(orderData, createLocalOrderId(), 'local');
    const orders = safeParseOrders();
    orders.unshift(order);
    writeLocalOrders(orders);
    return order;
}

export async function saveOrder(orderData) {
    if (!isFirebaseEnabled()) {
        const order = saveOrderLocally(orderData);
        return { id: order.id, source: 'local', order };
    }

    try {
        const order = await saveOrderToFirebase(orderData);
        return { id: order.id, source: 'firebase', order };
    } catch (error) {
        console.info('Order saved locally for demo mode:', error?.message || error);
        const order = saveOrderLocally(orderData);
        return { id: order.id, source: 'local', order };
    }
}

export async function listOrders() {
    if (!isFirebaseEnabled()) {
        return safeParseOrders()
            .map((order) => normalizeOrder(order, order.id, order.source || 'local'))
            .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
    }

    try {
        const { db, firestore } = await getFirestoreApi();
        const q = firestore.query(firestore.collection(db, 'orders'), firestore.orderBy('createdAt', 'desc'));
        const snap = await firestore.getDocs(q);
        return snap.docs.map((item) => normalizeFirebaseOrder(item.id, item.data()));
    } catch (error) {
        console.info('Using local orders for admin demo:', error?.message || error);
        return safeParseOrders()
            .map((order) => normalizeOrder(order, order.id, order.source || 'local'))
            .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
    }
}

export async function getOrderById(orderId, source = null) {
    if (!orderId) return null;

    if (source !== 'firebase' || !isFirebaseEnabled()) {
        const order = safeParseOrders().find((item) => item.id === orderId);
        return order ? normalizeOrder(order, order.id, order.source || 'local') : null;
    }

    try {
        const { db, firestore } = await getFirestoreApi();
        const snap = await firestore.getDoc(firestore.doc(db, 'orders', orderId));
        return snap.exists() ? normalizeFirebaseOrder(snap.id, snap.data()) : null;
    } catch {
        const order = safeParseOrders().find((item) => item.id === orderId);
        return order ? normalizeOrder(order, order.id, order.source || 'local') : null;
    }
}

export async function updateOrderStatus(orderId, status, note = 'Status updated') {
    const statusEntry = { status, at: getNowIso(), note };

    if (!isFirebaseEnabled()) {
        const orders = safeParseOrders();
        const order = orders.find((item) => item.id === orderId);
        if (!order) throw new Error('Order not found');
        order.status = status;
        order.updatedAt = statusEntry.at;
        order.statusHistory = [...(order.statusHistory || []), statusEntry];
        writeLocalOrders(orders);
        return order;
    }

    const { db, firestore } = await getFirestoreApi();
    const orderRef = firestore.doc(db, 'orders', orderId);
    await firestore.updateDoc(orderRef, {
        status,
        updatedAt: firestore.serverTimestamp(),
        statusHistory: firestore.arrayUnion(statusEntry)
    });
    return getOrderById(orderId, 'firebase');
}

export async function deleteOrder(orderId) {
    if (!isFirebaseEnabled()) {
        writeLocalOrders(safeParseOrders().filter((order) => order.id !== orderId));
        return true;
    }

    const { db, firestore } = await getFirestoreApi();
    await firestore.deleteDoc(firestore.doc(db, 'orders', orderId));
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
WhatsApp: ${order.phoneNormalized || order.whatsapp || order.phoneOriginal}
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
