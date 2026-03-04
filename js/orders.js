import { db, auth } from './firebase.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { formatCurrency } from './utils.js';

const ordersList = document.getElementById('orders-list');

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        fetchOrders();
    }
});

async function fetchOrders() {
    if (!ordersList) return;
    ordersList.innerHTML = '<tr><td colspan="7" style="text-align:center;">جاري جلب الطلبيات... ⏳</td></tr>';

    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        ordersList.innerHTML = '';
        
        if (querySnapshot.empty) {
            ordersList.innerHTML = '<tr><td colspan="7" style="text-align:center;">لا توجد طلبيات بعد.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-MA') : '---';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-family: monospace; font-size: 0.85rem; color: #757575;">#${doc.id.slice(0,8)}</td>
                <td><strong>${order.firstName} ${order.lastName}</strong></td>
                <td>${order.city}</td>
                <td style="font-weight: 800; color: #0d7c3e;">${formatCurrency(order.total)}</td>
                <td>${order.paymentMethod === 'COD' ? 'عند الاستلام' : 'بطاقة بنكية'}</td>
                <td><span class="status-badge ${order.paymentMethod === 'STRIPE' ? 'status--paid' : 'status--pending'}">
                    ${order.paymentMethod === 'STRIPE' ? 'مدفوع' : 'في الانتظار'}
                </span></td>
                <td>
                    <a href="https://wa.me/${order.whatsapp.replace(/\s/g, '')}?text=مرحباً ${order.firstName}، نحن متجر Parashop Tawfiq بخصوص طلبك رقم ${doc.id.slice(0,8)}" 
                       target="_blank" class="btn-wa">
                        <i class="fab fa-whatsapp"></i> واتساب
                    </a>
                </td>
            `;
            ordersList.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        ordersList.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">خطأ في الصلاحيات. تأكد أنك Admin.</td></tr>';
    }
}

// دالة لتغيير حالة الطلب يدوياً من طرف العامل
window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: newStatus });
        showToast("تم تحديث حالة الطلب ✅", "success");
        fetchOrders(); // إعادة تحميل الجدول
    } catch (err) {
        showToast("خطأ في التحديث", "error");
    }
};
