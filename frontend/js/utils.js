// نظام الإشعارات الاحترافي (Toast Notifications)
export function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span style="margin-right:8px;">${type === 'success' ? '✓' : '!'}</span> ${message}`;

    container.appendChild(toast);

    // تحريك الإشعار للظهور
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // إخفاء الإشعار بعد 3 ثواني
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// دالة لتنسيق الثمن بالدرهم المغربي
export function formatCurrency(amount) {
    return `${Number(amount || 0).toFixed(2)} DH`;
}
