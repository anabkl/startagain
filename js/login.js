import {
    getAccessToken,
    getCurrentUser,
    loginUser,
    rehydrateSessionFromStorage
} from './auth.js';
import { setStatus as setStatusText } from './utils.js';

const form = document.getElementById('login-form');
const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const togglePassword = document.getElementById('toggle-password');
const rememberInput = document.getElementById('remember-me');
const submitButton = document.getElementById('login-submit');
const statusEl = document.getElementById('login-status');

function setStatus(message = '', type = '') {
    setStatusText(statusEl, message, type);
}

function normalizeRole(role) {
    return role === 'admin' ? 'admin' : 'user';
}

function redirectRememberedSession() {
    rehydrateSessionFromStorage();
    const token = getAccessToken();
    const user = getCurrentUser();
    if (!token || !user) return;

    window.location.replace(normalizeRole(user.role) === 'admin' ? 'admin.html' : 'profile.html');
}

redirectRememberedSession();

togglePassword?.addEventListener('click', () => {
    const shouldShow = passwordInput.type === 'password';
    passwordInput.type = shouldShow ? 'text' : 'password';
    togglePassword.setAttribute(
        'aria-label',
        shouldShow ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
    );
    togglePassword.innerHTML = shouldShow
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
});

form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connexion...';

    try {
        const data = await loginUser(emailInput.value, passwordInput.value, {
            rememberMe: rememberInput?.checked,
            suppressRedirect: true
        });

        const destination = normalizeRole(data?.user?.role) === 'admin'
            ? 'admin.html'
            : 'profile.html';
        window.location.href = destination;
    } catch (error) {
        setStatus(error.message || 'تعذر تسجيل الدخول. حاول مرة أخرى.', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Se connecter';
    }
});
