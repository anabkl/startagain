const GA_ID = window.PARAPHARMACIE_GA_ID || document.querySelector('meta[name="google-analytics-id"]')?.content || '';
const LOCAL_EVENTS_KEY = 'parapharmacie_analytics_events';

function rememberEvent(name, params = {}) {
    try {
        const events = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY)) || [];
        events.push({ name, params, at: new Date().toISOString(), path: window.location.pathname });
        localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(events.slice(-100)));
    } catch {
        // Analytics must never interrupt the storefront.
    }
}

function injectGoogleAnalytics() {
    if (!GA_ID || window.gtag) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
        anonymize_ip: true,
        send_page_view: true
    });
}

export function trackEvent(name, params = {}) {
    rememberEvent(name, params);

    if (window.gtag) {
        window.gtag('event', name, params);
    }
}

export function trackSearch(term, resultCount = null) {
    trackEvent('search', {
        search_term: term,
        result_count: resultCount
    });
}

export function trackAddToCart(product, quantity = 1, price = 0) {
    trackEvent('add_to_cart', {
        currency: 'MAD',
        value: Number(price || 0) * quantity,
        items: [{
            item_id: product?.id,
            item_name: product?.name,
            item_brand: product?.brand,
            item_category: product?.category,
            price: Number(price || 0),
            quantity
        }]
    });
}

export function trackPurchase(order) {
    trackEvent('purchase', {
        transaction_id: order?.id,
        currency: 'MAD',
        value: Number(order?.total || 0),
        payment_type: order?.paymentMethod || 'COD',
        shipping: Number(order?.deliveryFee || 0)
    });
}

injectGoogleAnalytics();
