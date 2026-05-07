import { getAuthErrorMessage, registerUser } from './auth.js';

const form = document.getElementById('register-form');
const statusEl = document.getElementById('auth-status');
const submitBtn = document.getElementById('register-submit');

function setStatus(message, type = '') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `auth-status ${type}`;
}

function getValue(id) {
    return document.getElementById(id)?.value.trim() || '';
}

form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creation...';

    try {
        await registerUser(getValue('email'), document.getElementById('password').value, {
            name: getValue('name'),
            whatsapp: getValue('whatsapp'),
            city: getValue('city'),
            address: getValue('address')
        });
        setStatus('Compte cree avec succes. Redirection...', 'success');
        window.setTimeout(() => { window.location.href = 'profile.html'; }, 900);
    } catch (error) {
        console.error(error);
        setStatus(getAuthErrorMessage(error), 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Creer mon compte';
    }
});
