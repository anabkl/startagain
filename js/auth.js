import {
    apiFetch,
    clearSession,
    getAccessToken,
    getCurrentUser,
    rehydrateSessionFromStorage,
    saveAuthSession
} from './api.js';
import { showToast } from './utils.js';

export {
    apiFetch,
    clearSession,
    getAccessToken,
    getCurrentUser,
    rehydrateSessionFromStorage,
    saveAuthSession
};

function normalizeRole(role) {
    return role === 'admin' ? 'admin' : 'user';
}

export async function registerUser(email, password, userData = {}, onError) {
    try {
        const fullName = userData.name
            || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim()
            || 'Client';

        await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: fullName,
                email: String(email || '').trim().toLowerCase(),
                password,
                role: 'client',
                whatsapp: userData.whatsapp || '',
                city: userData.city || '',
                address: userData.address || ''
            })
        });

        const data = await loginUser(email, password, { suppressRedirect: true, rememberMe: true });
        showToast('تم إنشاء الحساب بنجاح.', 'success');
        window.location.href = 'profile.html';
        return data;
    } catch (error) {
        if (typeof onError === 'function') onError(error.message, 'api/register_failed');
        else showToast(error.message, 'error');
        throw error;
    }
}

export async function loginUser(email, password, { suppressRedirect = false, rememberMe = false } = {}) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: String(email || '').trim().toLowerCase(),
            password,
            rememberMe
        })
    });

    saveAuthSession(data, rememberMe && normalizeRole(data?.user?.role) === 'user');
    showToast('مرحباً بك مجدداً.', 'success');

    if (!suppressRedirect) {
        window.location.href = normalizeRole(data?.user?.role) === 'admin' ? 'admin.html' : 'profile.html';
    }

    return data;
}

export async function logoutUser() {
    try {
        await apiFetch('/auth/logout', { method: 'POST' }, { requiresAuth: true, retryOn401: false });
    } catch {
        // Session cleanup should still happen if Render is asleep.
    } finally {
        clearSession();
        window.location.href = 'index.html';
    }
}

export function bindLogoutButton(buttonSelector = '[data-logout], #logoutBtn') {
    document.querySelectorAll(buttonSelector).forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            logoutUser();
        });
    });
}
