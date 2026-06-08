const ACCESS_TOKEN_KEY = 'parapharmacie_access_token';
const USER_KEY = 'parapharmacie_user';
const API_BASE_KEY = 'parapharmacie_api_base';

export const API_BASE = window.API_BASE
    || localStorage.getItem(API_BASE_KEY)
    || 'https://startagain.onrender.com/api/v1';

let activeRequests = 0;

function parseJson(text, fallback = {}) {
    try {
        return JSON.parse(text);
    } catch {
        return fallback;
    }
}

function normalizeErrorMessage(message) {
    if (!message) return 'Une erreur est survenue.';
    if (/invalid credentials/i.test(message)) return 'البريد أو كلمة المرور غير صحيحة.';
    if (/email already exists/i.test(message)) return 'هذا البريد الإلكتروني مستخدم بالفعل.';
    if (/account temporarily locked/i.test(message)) return 'تم قفل الحساب مؤقتًا بسبب محاولات كثيرة.';
    if (/validation error/i.test(message)) return 'البيانات المدخلة غير صالحة.';
    if (/abort|aborted/i.test(message)) return 'La connexion prend plus de temps que prevu.';
    if (/failed to fetch|network/i.test(message)) return 'الخادم يستيقظ الآن. المرجو المحاولة بعد لحظات.';
    return message;
}

function ensureLoadingOverlay() {
    let overlay = document.getElementById('global-loading-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'global-loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-box" role="status" aria-live="polite" aria-label="Chargement">
            <div class="loading-spinner" aria-hidden="true"></div>
            <p class="loading-eyebrow">Render Free Tier</p>
            <h2>Chargement, Merci de patienter...</h2>
            <p>المرجو الانتظار، الخادم يستيقظ الآن...</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

export function showGlobalLoader() {
    activeRequests += 1;
    ensureLoadingOverlay().classList.add('is-visible');
}

export function hideGlobalLoader() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
        ensureLoadingOverlay().classList.remove('is-visible');
    }
}

export function getAccessToken() {
    const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (sessionToken) return sessionToken;

    const persistedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (persistedToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, persistedToken);
    return persistedToken || '';
}

export function getCurrentUser() {
    const sessionUser = sessionStorage.getItem(USER_KEY);
    if (sessionUser) return parseJson(sessionUser, null);

    const persistedUser = localStorage.getItem(USER_KEY);
    if (persistedUser) {
        sessionStorage.setItem(USER_KEY, persistedUser);
        return parseJson(persistedUser, null);
    }

    return null;
}

export function rehydrateSessionFromStorage() {
    const persistedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const persistedUser = localStorage.getItem(USER_KEY);

    if (persistedToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, persistedToken);
    if (persistedUser) sessionStorage.setItem(USER_KEY, persistedUser);

    return Boolean(persistedToken && persistedUser);
}

export function saveAuthSession({ access_token, user }, rememberMe = false) {
    if (access_token) sessionStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));

    const role = user?.role || user?.type;
    const canPersist = rememberMe && role !== 'admin';
    if (canPersist && access_token && user) {
        localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
}

export function clearSession() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
        saveAuthSession({
            access_token: payload.data.access_token,
            user: getCurrentUser()
        }, Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)));
        return true;
    } catch {
        return false;
    }
}

export async function apiFetch(path, options = {}, { requiresAuth = false, retryOn401 = true, showLoading = true } = {}) {
    if (showLoading) showGlobalLoader();

    try {
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
                return apiFetch(path, options, { requiresAuth, retryOn401: false, showLoading: false });
            }
            clearSession();
            throw new Error('Session expired');
        }

        const payload = parseJson(await response.text(), {});
        if (!response.ok || payload.success === false) {
            throw new Error(normalizeErrorMessage(payload.message || response.statusText));
        }

        return payload.data;
    } catch (error) {
        throw new Error(normalizeErrorMessage(error.message));
    } finally {
        if (showLoading) hideGlobalLoader();
    }
}
