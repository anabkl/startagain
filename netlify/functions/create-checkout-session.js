// Card payments are planned but not active. Keep the legacy endpoint present
// so old clients fail closed instead of creating a Stripe session from
// browser-controlled names, prices, quantities, or totals.

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    return {
        statusCode: 410,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        },
        body: JSON.stringify({
            error: 'Le paiement par carte est bientôt disponible. Seul le paiement à la livraison est actif.'
        })
    };
};
