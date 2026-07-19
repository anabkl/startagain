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
    if (amount === null || amount === undefined || amount === '') return 'Prix à confirmer';
    const numericAmount = Number(amount);
    return Number.isFinite(numericAmount)
        ? `${numericAmount.toFixed(2)} DH`
        : 'Prix à confirmer';
}

// Small text status line (form feedback: success/error), e.g. #login-status, #profile-status
export function setStatus(element, message = '', type = '') {
    if (!element) return;
    element.textContent = message;
    element.dataset.type = type;
    element.hidden = !message;
}

// Non-blocking inline banner for features that genuinely need the backend
// (pending/error state + optional retry button), used instead of a
// full-screen loading overlay. `container` must already carry
// aria-live="polite" in markup so assistive tech announces updates.
export function renderStatusBanner(container, { state = 'idle', message = '', onRetry } = {}) {
    if (!container) return;

    if (state === 'idle' || !message) {
        container.hidden = true;
        container.innerHTML = '';
        return;
    }

    container.hidden = false;
    container.dataset.type = state;

    const icon = state === 'pending'
        ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
    const retryButton = onRetry
        ? '<button type="button" class="status-banner__retry">Réessayer</button>'
        : '';

    container.innerHTML = `${icon}<span>${message}</span>${retryButton}`;

    if (onRetry) {
        container.querySelector('.status-banner__retry')?.addEventListener('click', onRetry);
    }
}
