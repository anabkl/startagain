// netlify/functions/create-checkout-session.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    // --- التحقق من طريقة الطلب ---
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { items, customerEmail, orderId, metadata } = JSON.parse(event.body);

        // --- التحقق من البيانات ---
        if (!items || !Array.isArray(items) || items.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'لا توجد منتجات في الطلب' })
            };
        }

        // --- بناء line_items لـ Stripe ---
        const line_items = items.map(item => ({
            price_data: {
                currency: 'mad', // الدرهم المغربي
                product_data: {
                    name: item.name,
                    images: item.imageUrl ? [item.imageUrl] : [],
                },
                // Stripe يستخدم أصغر وحدة عملة (سنتيم)
                // 1 DH = 100 سنتيم
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));

        // --- إنشاء Checkout Session ---
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: line_items,
            customer_email: customerEmail || undefined,
            metadata: {
                orderId:      orderId || '',
                customerName: metadata?.customerName || '',
                whatsapp:     metadata?.whatsapp || '',
                city:         metadata?.city || '',
                address:      metadata?.address || '',
            },
            // URLs بعد الدفع
            success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
            cancel_url:  `${process.env.URL}/checkout.html?cancelled=true`,
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: session.url, sessionId: session.id })
        };

    } catch (error) {
        console.error('Stripe session creation error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || 'حدث خطأ في إنشاء جلسة الدفع'
            })
        };
    }
};