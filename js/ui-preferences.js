import { apiFetch, getAccessToken, getCurrentUser } from './api.js';

const PREF_THEME_KEY = 'parapharmacie_theme';

const themeLabels = {
    dark: 'Mode sombre',
    light: 'Mode clair'
};

let currentTheme = localStorage.getItem(PREF_THEME_KEY) || 'light';

function applyPreferences() {
    document.documentElement.dataset.theme = currentTheme;
    localStorage.setItem(PREF_THEME_KEY, currentTheme);
}

async function persistPreferences() {
    applyPreferences();
    if (!getAccessToken()) return;

    try {
        await apiFetch('/users/preferences', {
            method: 'PATCH',
            body: JSON.stringify({ theme: currentTheme })
        }, { requiresAuth: true });
    } catch {
        // Local theme is already saved, so the UI should never feel broken.
    }
}

function getMountPoint() {
    return document.querySelector('.header__actions')
        || document.querySelector('.orders-actions')
        || document.querySelector('.auth-preferences-slot')
        || document.querySelector('.header-controls')
        || document.querySelector('.sidebar__logout')
        || document.querySelector('header .container')
        || document.querySelector('header')
        || document.body;
}

function renderControls() {
    const themeButton = document.getElementById('global-theme-toggle');
    if (!themeButton) return;

    const dark = currentTheme === 'dark';
    const label = dark ? themeLabels.light : themeLabels.dark;
    themeButton.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '☾'}</span>`;
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', label);
    themeButton.setAttribute('title', label);
}

function mountControls() {
    if (document.getElementById('global-preference-controls')) {
        renderControls();
        return;
    }

    const controls = document.createElement('div');
    controls.id = 'global-preference-controls';
    controls.className = 'global-preference-controls';
    controls.innerHTML = `
        <button class="preference-btn preference-btn--theme" id="global-theme-toggle" type="button"></button>
    `;

    getMountPoint().appendChild(controls);

    document.getElementById('global-theme-toggle')?.addEventListener('click', async () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        await persistPreferences();
        renderControls();
    });

    renderControls();
}

function hydrateFromUser() {
    const user = getCurrentUser();
    const prefs = user?.preferences || {};
    if (prefs.theme === 'dark' || prefs.theme === 'light') currentTheme = prefs.theme;
    applyPreferences();
}

hydrateFromUser();
document.addEventListener('DOMContentLoaded', mountControls);
