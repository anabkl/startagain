import { getAuthErrorMessage, loginUser } from './auth.js';

const form = document.getElementById('login-form');
const statusEl = document.getElementById('auth-status');
const submitBtn = document.getElementById('login-submit');

function setStatus(message, type = '') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `auth-status ${type}`;
}

form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connexion...';

    try {
        const { role } = await loginUser(
            document.getElementById('email').value.trim(),
            document.getElementById('password').value
        );
        setStatus('Connexion reussie. Redirection...', 'success');
        window.setTimeout(() => {
            window.location.href = role === 'admin' ? 'orders.html' : 'profile.html';
        }, 750);
    } catch (error) {
        console.error(error);
        setStatus(getAuthErrorMessage(error), 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Se connecter';
    }
});
