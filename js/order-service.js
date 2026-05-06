import { isFirebaseEnabled } from './runtime-config.js';

const LOCAL_ORDERS_KEY = 'parapharmacie_orders';

function createLocalOrderId() {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `PM-${Date.now().toString(36).toUpperCase()}-${random}`;
}

async function saveOrderToFirebase(orderData) {
    const [{ db }, firestore] = await Promise.all([
        import('./firebase.js'),
        import('https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js')
    ]);

    const docRef = await firestore.addDoc(firestore.collection(db, 'orders'), {
        ...orderData,
        createdAt: firestore.serverTimestamp()
    });

    return docRef.id;
}

function saveOrderLocally(orderData) {
    const orderId = createLocalOrderId();
    const orders = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY)) || [];

    orders.unshift({
        id: orderId,
        ...orderData,
        createdAt: new Date().toISOString(),
        source: 'local-demo'
    });

    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
    return orderId;
}

export async function saveOrder(orderData) {
    if (!isFirebaseEnabled()) {
        return { id: saveOrderLocally(orderData), source: 'local' };
    }

    try {
        const id = await saveOrderToFirebase(orderData);
        return { id, source: 'firebase' };
    } catch (error) {
        console.info('Order saved locally for demo mode:', error?.message || error);
        return { id: saveOrderLocally(orderData), source: 'local' };
    }
}

export function buildWhatsAppOrderMessage(order, orderId, formatCurrency) {
    const itemsList = order.items.map((item, index) => {
        const quantity = item.quantity || 1;
        const price = item.effectivePrice || item.promoPrice || item.price || 0;
        return `${index + 1}. ${item.name} x ${quantity} = ${formatCurrency(price * quantity)}`;
    }).join('\n');

    return `Nouvelle commande - parapharmacie.me

Client: ${order.firstName} ${order.lastName}
WhatsApp: ${order.whatsapp}
Email: ${order.email || 'Non renseigne'}
Ville: ${order.city}
Adresse: ${order.address}

Produits:
${itemsList}

Total: ${formatCurrency(order.total)}
Paiement: Paiement a la livraison
Commande: #${String(orderId).slice(0, 12)}
Date: ${new Date().toLocaleString('fr-MA')}`;
}
