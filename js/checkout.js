import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { showToast, formatCurrency } from './utils.js';
import { updateCartCount } from './main.js';

const CART_KEY = 'parashop_cart';
const checkoutForm = document.getElementById('checkout-form');
const orderTotalEl = document.getElementById('order-total-amount');
const summaryList = document.getElementById('summary-items-list');

// ============================================
// 1. حساب السعر الفعلي (يدعم promoPrice)
// ============================================
function getEffectivePrice(item) {
    return item.promoPrice && item.promoPrice < item.price ? item.promoPrice : item.price;
}

// ============================================
// 2. عرض ملخص الطلب في صفحة Checkout
// ============================================
function renderOrderSummary() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    if (cart.length === 0) {
        showToast('سلتك فارغة! سيتم تحويلك للمتجر.', 'error');
        setTimeout(() => { window.location.href = 'shop.html'; }, 1500);
        return;
    }

    let total = 0;
    let html = '';

    cart.forEach(item => {
        const price = getEffectivePrice(item);
        const subtotal = price * (item.quantity || 1);
        total += subtotal;

        html += `
            <div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f0f0f0;">
                <img src="${item.imageUrl}" alt="${item.name}" style="width:55px; height:55px; object-fit:cover; border-radius:10px; border:1px solid #eee;">
                <div style="flex:1;">
                    <p style="margin:0; font-weight:700; font-size:0.9rem; color:#333;">${item.name}</p>
                    <p style="margin:4px 0 0; color:#9e9e9e; font-size:0.8rem;">${formatCurrency(price)} × ${item.quantity || 1}</p>
                </div>
                <span style="font-weight:800; color:#0d7c3e; white-space:nowrap;">${formatCurrency(subtotal)}</span>
            </div>
        `;
    });

    if (summaryList) summaryList.innerHTML = html;
    if (orderTotalEl) orderTotalEl.textContent = formatCurrency(total);
}

// ============================================
// 3. معالجة الطلب (COD فقط - بدون Stripe)
// ============================================
async function processOrder(e) {
    e.preventDefault();

    // قلبنا على البوطونة بالـ class ديالها حيت كاينه برا الفورم
    const btn = document.querySelector('.btn-confirm'); 
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري معالجة الطلب...';

    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    if (cart.length === 0) {
        showToast("سلتك فارغة!", "error");
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    // التحقق من الحقول
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim().replace(/\s+/g, '');
    const city = document.getElementById('city').value.trim();
    const address = document.getElementById('address').value.trim();

    if (!firstName || !lastName || !whatsapp || !city || !address) {
        showToast("المرجو ملء جميع الحقول الإجبارية", "error");
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const phoneRegex = /^(06|07|05)\d{8}$/;
    if (!phoneRegex.test(whatsapp)) {
        showToast("رقم واتساب غير صالح (مثال: 0675698351)", "error");
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
    }

    const email = (document.getElementById('email')?.value || '').trim();
    const total = cart.reduce((sum, item) => sum + getEffectivePrice(item) * (item.quantity || 1), 0);

    const orderData = {
        firstName,
        lastName,
        email,
        whatsapp,
        city,
        address,
        items: cart,
        total,
        paymentMethod: 'COD',
        status: 'pending',
        createdAt: serverTimestamp()
    };

    try {
        const docRef = await addDoc(collection(db, "orders"), orderData);
        const orderId = docRef.id;

        // مسح السلة
        localStorage.removeItem(CART_KEY);
        updateCartCount();

        // بناء رسالة واتساب
        const itemsList = cart.map((item, i) => {
            const p = getEffectivePrice(item);
            return `${i+1}. ${item.name} × ${item.quantity || 1} = ${formatCurrency(p * (item.quantity || 1))}`;
        }).join('\n');

        const waMessage = `🛒 *طلب جديد - Parashop Tawfiq*

👤 *العميل:* ${firstName} ${lastName}
📞 *واتساب:* ${whatsapp}
📧 *الإيميل:* ${email || 'غير محدد'}
🏙️ *المدينة:* ${city}
📍 *العنوان:* ${address}

📦 *المنتجات:*
${itemsList}

💰 *المجموع:* ${formatCurrency(total)}
💳 *طريقة الدفع:* الدفع عند الاستلام
🆔 *رقم الطلب:* #${orderId.slice(0,8)}
🕐 *التاريخ:* ${new Date().toLocaleString('ar-MA')}`;

        const waUrl = `https://wa.me/212675698351?text=${encodeURIComponent(waMessage)}`;

        // تحويل لصفحة النجاح أو واتساب
        showToast("✅ تم تسجيل طلبك بنجاح!", "success");

        setTimeout(() => {
            window.open(waUrl, '_blank');
            window.location.href = 'success.html';
        }, 1500);

    } catch (error) {
        console.error("Order error:", error);
        showToast("حدث خطأ أثناء تسجيل الطلب. حاول مرة أخرى.", "error");
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ============================================
// 4. التهيئة
// ============================================
if (checkoutForm) {
    checkoutForm.addEventListener('submit', processOrder);
}

// عرض ملخص الطلب عند فتح الصفحة
renderOrderSummary();
console.log("Checkout.js v2 Loaded ✅");
