import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { showToast, formatCurrency } from './utils.js';
import { updateCartCount } from './main.js';

const checkoutForm = document.getElementById('checkout-form');
const orderTotalEl = document.getElementById('order-total-amount');

// إعدادات EmailJS الخاصة بك
const EMAILJS_SERVICE_ID = "service_ptbss3h";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID"; // صايب Template في EmailJS وخد ID ديالو
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY"; // خدها من Account Settings في EmailJS

async function processOrder(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري معالجة الطلب...';

    const cart = JSON.parse(localStorage.getItem('parashop_cart')) || [];
    if (cart.length === 0) {
        showToast("سلتك فارغة!", "error");
        btn.disabled = false;
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.promoPrice || item.price) * item.quantity, 0);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    const orderData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        whatsapp: document.getElementById('whatsapp').value,
        city: document.getElementById('city').value,
        address: document.getElementById('address').value,
        items: cart,
        total: total,
        paymentMethod: paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp()
    };

    try {
        // 1. تسجيل الطلب في Firestore
        const docRef = await addDoc(collection(db, "orders"), orderData);
        const orderId = docRef.id;

        // 2. إرسال إشعار بالإيميل عبر EmailJS
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            customer_name: orderData.firstName + " " + orderData.lastName,
            order_id: orderId,
            total_amount: formatCurrency(total),
            customer_whatsapp: orderData.whatsapp,
            customer_email: orderData.email
        }, EMAILJS_PUBLIC_KEY);

        // 3. مسح السلة
        localStorage.removeItem('parashop_cart');
        updateCartCount();

        // 4. فتح الواتساب تلقائياً لتأكيد الطلب (نمرتك: +212675698351)
        const waMessage = `مرحباً Parashop Tawfiq، قمت بطلب رقم #${orderId.slice(0,6)} بمبلغ ${formatCurrency(total)}. المرجو تأكيد الطلب.`;
        const waUrl = `https://wa.me/212675698351?text=${encodeURIComponent(waMessage)}`;
        
        showToast("تم تسجيل طلبك بنجاح! جاري تحويلك للواتساب...", "success");
        
        setTimeout(() => {
            window.location.href = waUrl;
        }, 2000);

    } catch (error) {
        console.error(error);
        showToast("حدث خطأ في الشبكة، حاول ثانية", "error");
        btn.disabled = false;
    }
}

if (checkoutForm) {
    checkoutForm.addEventListener('submit', processOrder);
}
