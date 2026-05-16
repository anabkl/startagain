import { showToast } from './utils.js';

const ACCESS_TOKEN_KEY = 'parapharmacie_access_token';
const USER_KEY = 'parapharmacie_user';
const API_BASE = `${window.location.origin}/api/v1`;

function parseJson(text, fallback = {}) {
    try {
        return JSON.parse(text);
    } catch {
        return fallback;
    }
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
}

export function getCurrentUser() {
    return parseJson(localStorage.getItem(USER_KEY) || 'null', null);
}

function setSession({ access_token, user }) {
    if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function normalizeErrorMessage(message) {
    if (!message) return 'Une erreur est survenue.';
    if (/invalid credentials/i.test(message)) return 'البريد أو كلمة المرور غير صحيحة.';
    if (/email already exists/i.test(message)) return 'هذا البريد الإلكتروني مستخدم بالفعل.';
    if (/account temporarily locked/i.test(message)) return 'تم قفل الحساب مؤقتًا بسبب محاولات كثيرة.';
    if (/validation error/i.test(message)) return 'البيانات المدخلة غير صالحة.';
    return message;
}

export async function apiFetch(path, options = {}, { requiresAuth = false, retryOn401 = true } = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (requiresAuth) {
        const access = getAccessToken();
        if (access) headers.Authorization = `Bearer ${access}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers
    });

    if (response.status === 401 && requiresAuth && retryOn401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return apiFetch(path, options, { requiresAuth, retryOn401: false });
        }
        clearSession();
        throw new Error('Session expired');
    }

    const payload = parseJson(await response.text(), {});
    if (!response.ok || payload.success === false) {
        throw new Error(normalizeErrorMessage(payload.message || response.statusText));
    }

    return payload.data;
}

async function refreshAccessToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        const payload = parseJson(await response.text(), {});
        if (!response.ok || payload.success === false || !payload.data?.access_token) return false;
        setSession({ access_token: payload.data.access_token, user: getCurrentUser() });
        return true;
    } catch {
        return false;
    }
}

export async function registerUser(email, password, userData, onError) {
    try {
        const fullName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Client';
        await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: fullName,
                email: String(email || '').trim().toLowerCase(),
                password,
                role: 'client'
            })
        });

        await loginUser(email, password, { suppressRedirect: true });
        showToast('تم إنشاء الحساب بنجاح! 🎉', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        const message = normalizeErrorMessage(error.message);
        if (typeof onError === 'function') onError(message, 'api/register_failed');
        else showToast(message, 'error');
        throw error;
    }
}

export async function loginUser(email, password, { suppressRedirect = false } = {}) {
    try {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: String(email || '').trim().toLowerCase(),
                password
            })
        });

        setSession({ access_token: data.access_token, user: data.user });
        showToast('مرحباً بك مجدداً! 👋', 'success');

        if (!suppressRedirect) {
            window.location.href = data?.user?.role === 'admin' ? 'admin.html' : 'index.html';
        }

        return data;
    } catch (error) {
        const message = normalizeErrorMessage(error.message);
        showToast(message, 'error');
        throw error;
    }
}

export async function logoutUser() {
    try {
        await apiFetch('/auth/logout', { method: 'POST' }, { requiresAuth: true, retryOn401: false });
    } catch {
        // silent cleanup
    } finally {
        clearSession();
        window.location.href = 'index.html';
    }
}

export function bindLogoutButton(buttonSelector = '[data-logout]') {
    document.querySelectorAll(buttonSelector).forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            logoutUser();
        });
    });
}
