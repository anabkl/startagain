import { apiFetch } from './auth.js';
import { hasCurrentProductPrice, hasCurrentStockVerification, isProductOrderable, verifiedProductPrice } from './product-schema.js';

export const DEFAULT_ORDER_STATUS = 'في الانتظار';
export const ORDER_STATUSES = [
    'في الانتظار',
    'تم التأكيد',
    'قيد التحضير',
    'في التوصيل',
    'تم التسليم',
    'ملغي'
];

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

function normalizeOrder(apiOrder = {}) {
    const shipping = apiOrder.shipping_address || apiOrder.shippingAddress || {};
    const fullName = String(apiOrder.customer_name || apiOrder.customerName || '').trim();
    const [firstFromName = '', ...rest] = fullName.split(/\s+/);
    const firstName = shipping.first_name || shipping.firstName || apiOrder.firstName || firstFromName;
    const lastName = shipping.last_name || shipping.lastName || apiOrder.lastName || rest.join(' ');

    const phoneOriginal = String(shipping.whatsapp || shipping.phone || apiOrder.whatsapp || apiOrder.phone || '').trim();
    const phoneNormalized = normalizePhone(phoneOriginal);

    const subtotal = Number(apiOrder.subtotal ?? apiOrder.total ?? 0);
    const deliveryFee = Number(apiOrder.deliveryFee || apiOrder.delivery_fee || 0);
    const total = Number(apiOrder.total ?? subtotal + deliveryFee);

    return {
        id: String(apiOrder._id || apiOrder.id || ''),
        firstName: firstName || '',
        lastName: lastName || '',
        email: shipping.email || apiOrder.email || '',
        phoneOriginal,
        phoneNormalized,
        whatsappMasked: maskPhone(phoneNormalized || phoneOriginal),
        whatsapp: phoneNormalized || phoneOriginal,
        city: shipping.city || apiOrder.city || '',
        address: shipping.address || apiOrder.address || '',
        paymentMethod: String(apiOrder.payment_method || apiOrder.paymentMethod || 'COD').toUpperCase(),
        items: Array.isArray(apiOrder.items) ? apiOrder.items.map((item) => ({
            ...item,
            name: item.name || item.product_name || item.product?.name || item.productName || item.product_id || item.productId || 'Produit',
            effectivePrice: Number(item.unit_price ?? item.effectivePrice ?? item.priceMAD ?? item.price ?? 0),
            priceMAD: Number(item.unit_price ?? item.priceMAD ?? item.price ?? 0),
            quantity: Number(item.quantity || 1)
        })) : [],
        subtotal,
        deliveryFee,
        deliveryLabel: apiOrder.deliveryLabel || apiOrder.delivery_label || 'A confirmer',
        total,
        status: normalizeStatus(apiOrder.status),
        statusHistory: Array.isArray(apiOrder.statusHistory) && apiOrder.statusHistory.length
            ? apiOrder.statusHistory
            : [{ status: normalizeStatus(apiOrder.status), at: apiOrder.updatedAt || apiOrder.createdAt || getNowIso(), note: 'Commande creee' }],
        createdAt: apiOrder.createdAt || getNowIso(),
        updatedAt: apiOrder.updatedAt || apiOrder.createdAt || getNowIso(),
        source: 'api'
    };
}

export async function saveOrder(orderData) {
    assertOrderPricesVerified(orderData);
    const payload = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    }, { requiresAuth: false });

    const order = normalizeOrder(payload?.order || payload);
    return { id: order.id, source: 'api', order };
}

export async function listOrders() {
    const payload = await apiFetch('/orders', {}, { requiresAuth: true });
    return pickArray(payload)
        .map(normalizeOrder)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listMyOrders() {
    const payload = await apiFetch('/orders/my-orders', {}, { requiresAuth: true });
    return pickArray(payload)
        .map(normalizeOrder)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrderById(orderId) {
    if (!orderId) return null;
    const payload = await apiFetch(`/orders/${encodeURIComponent(orderId)}`, {}, { requiresAuth: true });
    return normalizeOrder(payload?.order || payload);
}

export async function updateOrderStatus(orderId, status, note = 'Status updated') {
    if (!orderId) throw new Error('Order not found');

    const body = JSON.stringify({ status, note });
    try {
        const payload = await apiFetch(`/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PATCH',
            body
        }, { requiresAuth: true });
        return normalizeOrder(payload?.order || payload);
    } catch {
        const payload = await apiFetch(`/orders/${encodeURIComponent(orderId)}`, {
            method: 'PATCH',
            body
        }, { requiresAuth: true });
        return normalizeOrder(payload?.order || payload);
    }
}

export async function deleteOrder(orderId) {
    if (!orderId) throw new Error('Order not found');
    await apiFetch(`/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE'
    }, { requiresAuth: true });
    return true;
}

export function buildWhatsAppOrderMessage(order, orderId, formatCurrency) {
    assertOrderPricesVerified(order);
    const itemsList = (order.items || []).map((item, index) => {
        const quantity = item.quantity || 1;
        const price = verifiedProductPrice(orderItemPriceEvidence(item));
        return `${index + 1}. ${item.name} x ${quantity} = ${formatCurrency(price * quantity)}`;
    }).join('\n');

    return `Nouvelle commande - parapharmacie.me\n\nClient: ${order.firstName} ${order.lastName}\nWhatsApp: ${order.whatsappMasked || order.whatsapp || '***'}\nEmail: ${order.email || 'Non renseigne'}\nVille: ${order.city}\nAdresse: ${order.address}\n\nProduits:\n${itemsList}\n\nSous-total: ${formatCurrency(order.subtotal || order.total || 0)}\nLivraison: ${order.deliveryLabel || 'A confirmer'}\nTotal: ${formatCurrency(order.total || 0)}\nPaiement: Paiement a la livraison\nStatut: ${order.status || DEFAULT_ORDER_STATUS}\nCommande: #${String(orderId).slice(0, 12)}\nDate: ${new Date(order.createdAt || Date.now()).toLocaleString('fr-MA')}`;
}
