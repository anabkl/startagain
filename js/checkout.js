// js/checkout.js
import { db } from './firebase.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { updateCartCount } from './main.js';
import { showToast } from './utils.js';

// ============================================
// 1. ثوابت و عناصر DOM
// ============================================
const CART_KEY       = 'parashop_cart';
const WHATSAPP_NUM   = '212675698351'; // رقم واتساب المتجر
const checkoutForm   = document.getElementById('checkout-form');
const summaryItems   = document.getElementById('order-summary-items');
const orderTotalEl   = document.getElementById('order-total');
const btnConfirm     = document.getElementById('btn-confirm');
const btnConfirmText = document.getElementById('btn-confirm-text');
const btnConfirmLoad = document.getElementById('btn-confirm-loading');

// ============================================
// 2. دالة الحصول على السعر الفعلي
// ============================================
function getEffectivePrice(item) {
    return item.promoPrice || item.discountPrice || item.price;
}

// ============================================
// 3. عرض ملخص الطلب
// ============================================
function renderOrderSummary() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    if (cart.length === 0) {
        showToast('سلتك فارغة! سيتم تحويلك للمتجر.', 'error');
        setTimeout(() => { window.location.href = 'shop.html'; }, 1500);
        return;
    }

    let total = 0;
    let html  = '';

    cart.forEach(item => {
        const price    = getEffectivePrice(item);
        const subtotal = price * item.quantity;
        total += subtotal;

        html += `
            <div class="checkout__summary-item">
                <img src="${item.imageUrl}" alt="${item.name}" class="checkout__summary-img">
                <div class="checkout__summary-info">
                    <p class="checkout__summary-name">${item.name}</p>
                    <p class="checkout__summary-meta">${price.toFixed(2)} DH × ${item.quantity}</p>
                </div>
                <span class="checkout__summary-subtotal">${subtotal.toFixed(2)} DH</span>
            </div>
        `;
    });

    summaryItems.innerHTML    = html;
    orderTotalEl.innerText    = total.toFixed(2) + ' DH';
}

// ============================================
// 4. التحقق من صحة النموذج
// ============================================
function validateForm() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const whatsapp  = document.getElementById('whatsapp').value.trim();
    const city      = document.getElementById('city').value.trim();
    const address   = document.getElementById('address').value.trim();

    if (!firstName) { showToast('الرجاء إدخال الاسم', 'error'); return false; }
    if (!lastName)  { showToast('الرجاء إدخال النسب', 'error'); return false; }
    if (!whatsapp)  { showToast('الرجاء إدخال رقم واتساب', 'error'); return false; }

    // التحقق من صيغة الرقم المغربي
    const phoneRegex = /^(06|07|05)\d{8}$/;
    if (!phoneRegex.test(whatsapp)) {
        showToast('رقم واتساب غير صالح. أدخل رقم مغربي (مثال: 0675698351)', 'error');
        return false;
    }

    if (!city)    { showToast('الرجاء إدخال المدينة', 'error'); return false; }
    if (!address) { showToast('الرجاء إدخال العنوان', 'error'); return false; }

    // التحقق من البريد الإلكتروني (اختياري لكن إذا أدخله يجب أن يكون صالح)
    const email = document.getElementById('email').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('البريد الإلكتروني غير صالح', 'error');
        return false;
    }

    return true;
}

// ============================================
// 5. إنشاء رسالة واتساب
// ============================================
function buildWhatsAppMessage(order) {
    const itemsList = order.products.map((item, i) => {
        const price = getEffectivePrice(item);
        return `${i + 1}. ${item.name} × ${item.quantity} = ${(price * item.quantity).toFixed(2)} DH`;
    }).join('%0A');

    const message = [
        `🛒 *طلب جديد من Parashop Tawfiq*`,
        ``,
        `👤 *العميل:* ${order.customerName}`,
        `📞 *واتساب:* ${order.whatsapp}`,
        `📧 *الإيميل:* ${order.email || 'غير محدد'}`,
        `🏙️ *المدينة:* ${order.city}`,
        `📍 *العنوان:* ${order.address}`,
        ``,
        `📦 *المنتجات:*`,
        `${itemsList}`,
        ``,
        `💰 *المجموع:* ${order.total.toFixed(2)} DH`,
        `💳 *طريقة الدفع:* ${order.paymentMethod === 'COD' ? 'الدفع عند الاستلام' : 'الدفع عبر الإنترنت'}`,
        `📝 *ملاحظات:* ${order.notes || 'لا توجد'}`,
        ``,
        `🕐 *التاريخ:* ${new Date().toLocaleString('ar-MA')}`,
    ].join('%0A');

    return `https://wa.me/${WHATSAPP_NUM}?text=${message}`;
}

// ============================================
// 6. حالة التحميل للزر
// ============================================
function setLoading(isLoading) {
    btnConfirm.disabled          = isLoading;
    btnConfirmText.style.display = isLoading ? 'none' : 'inline';
    btnConfirmLoad.style.display = isLoading ? 'inline' : 'none';
}

// ============================================
// 7. معالجة الدفع عبر Stripe
// ============================================
async function handleStripePayment(order) {
    try {
        setLoading(true);

        // استدعاء Netlify Function لإنشاء Stripe Checkout Session
        const response = await fetch('/.netlify/functions/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: order.products.map(item => ({
                    name:     item.name,
                    price:    getEffectivePrice(item),
                    quantity: item.quantity,
                    imageUrl: item.imageUrl
                })),
                customerEmail: order.email || undefined,
                orderId:       order.firestoreId,
                metadata: {
                    customerName: order.customerName,
                    whatsapp:     order.whatsapp,
                    city:         order.city,
                    address:      order.address
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'خطأ في إنشاء جلسة الدفع');
        }

        // التحويل إلى صفحة Stripe Checkout
        window.location.href = data.url;

    } catch (error) {
        console.error('Stripe Error:', error);
        showToast('حدث خطأ أثناء الاتصال بخدمة الدفع. حاول مرة أخرى.', 'error');
        setLoading(false);
    }
}

// ============================================
// 8. إرسال الطلب (Submit)
// ============================================
checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // --- التحقق ---
    if (!validateForm()) return;

    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    if (cart.length === 0) {
        showToast('السلة فارغة!', 'error');
        return;
    }

    // --- طريقة الدفع المختارة ---
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    // --- حساب المجموع ---
    const total = cart.reduce((acc, item) => {
        return acc + (getEffectivePrice(item) * item.quantity);
    }, 0);

    // --- بناء كائن الطلب ---
    const order = {
        customerName: `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`,
        firstName:    document.getElementById('firstName').value.trim(),
        lastName:     document.getElementById('lastName').value.trim(),
        email:        document.getElementById('email').value.trim(),
        whatsapp:     document.getElementById('whatsapp').value.trim(),
        city:         document.getElementById('city').value.trim(),
        address:      document.getElementById('address').value.trim(),
        notes:        document.getElementById('notes').value.trim(),
        products:     cart,
        total:        total,
        status:       'Pending',
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'pending_cod' : 'pending_online',
        createdAt:     new Date().toISOString()
    };

    setLoading(true);

    try {
        // --- حفظ الطلب في Firestore ---
        const docRef = await addDoc(collection(db, "orders"), order);
        order.firestoreId = docRef.id;

        console.log("Order saved with ID:", docRef.id);

        // --- معالجة حسب طريقة الدفع ---
        if (paymentMethod === 'STRIPE') {
            // الدفع عبر الإنترنت - Stripe
            await handleStripePayment(order);
            // لا نمسح السلة هنا، ننتظر تأكيد الدفع في success page

        } else {
            // الدفع عند الاستلام (COD)
            const whatsappUrl = buildWhatsAppMessage(order);

            // تفريغ السلة
            localStorage.removeItem(CART_KEY);
            updateCartCount();

            showToast('✅ تم تسجيل طلبك بنجاح! سيتم تحويلك لواتساب...', 'success');

            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
                window.location.href = 'index.html';
            }, 2000);
        }

    } catch (error) {
        console.error("Error placing order:", error);
        showToast('حدث خطأ أثناء تسجيل الطلب. حاول مرة أخرى.', 'error');
        setLoading(false);
    }
});

// ============================================
// 9. تبديل طريقة الدفع (UI)
// ============================================
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', () => {
        document.querySelectorAll('.checkout__payment-option').forEach(opt => {
            opt.classList.remove('checkout__payment-option--active');
        });
        radio.closest('.checkout__payment-option').classList.add('checkout__payment-option--active');

        // تغيير نص الزر حسب طريقة الدفع
        const isStripe = radio.value === 'STRIPE';
        btnConfirmText.innerHTML = isStripe
            ? '<i class="fas fa-lock"></i> الدفع الآمن عبر الإنترنت'
            : '<i class="fas fa-check-circle"></i> تأكيد الطلب';
    });
});

// ============================================
// 10. التهيئة
// ============================================
renderOrderSummary();
console.log("Checkout.js Loaded ✅");