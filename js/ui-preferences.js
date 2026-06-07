import { apiFetch, getAccessToken, getCurrentUser } from './api.js';

const PREF_LANG_KEY = 'parapharmacie_lang';
const PREF_THEME_KEY = 'parapharmacie_theme';

const labels = {
    en: {
        language: 'AR',
        themeDark: 'Dark mode',
        themeLight: 'Light mode',
        ariaLanguage: 'Switch to Arabic',
        ariaTheme: 'Toggle dark mode'
    },
    ar: {
        language: 'EN',
        themeDark: 'الوضع الليلي',
        themeLight: 'الوضع النهاري',
        ariaLanguage: 'التبديل إلى الإنجليزية',
        ariaTheme: 'تبديل الوضع الليلي'
    }
};

function getInitialLanguage() {
    const saved = localStorage.getItem(PREF_LANG_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
    return document.documentElement.lang === 'ar' ? 'ar' : 'en';
}

let currentLang = getInitialLanguage();
let currentTheme = localStorage.getItem(PREF_THEME_KEY) || 'light';

function applyPreferences() {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = currentTheme;
    localStorage.setItem(PREF_LANG_KEY, currentLang);
    localStorage.setItem(PREF_THEME_KEY, currentTheme);
}

async function persistPreferences() {
    applyPreferences();
    if (!getAccessToken()) return;

    try {
        await apiFetch('/users/preferences', {
            method: 'PATCH',
            body: JSON.stringify({
                lang: currentLang,
                theme: currentTheme
            })
        }, { requiresAuth: true, showLoading: false });
    } catch {
        // Local preferences are already persisted; the server can catch up later.
    }
}

function getMountPoint() {
    return document.querySelector('.header__actions')
        || document.querySelector('.auth-preferences-slot')
        || document.querySelector('.header-controls')
        || document.querySelector('.sidebar__logout')
        || document.querySelector('header .container')
        || document.querySelector('header')
        || document.body;
}

function renderControls() {
    const langButton = document.getElementById('global-lang-toggle');
    const themeButton = document.getElementById('global-theme-toggle');
    const copy = labels[currentLang];

    if (langButton) {
        langButton.textContent = copy.language;
        langButton.setAttribute('aria-label', copy.ariaLanguage);
    }

    if (themeButton) {
        const dark = currentTheme === 'dark';
        themeButton.innerHTML = `<span aria-hidden="true">${dark ? '☀' : '☾'}</span><span>${dark ? copy.themeLight : copy.themeDark}</span>`;
        themeButton.setAttribute('aria-pressed', String(dark));
        themeButton.setAttribute('aria-label', copy.ariaTheme);
    }
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
        <button class="preference-btn preference-btn--lang" id="global-lang-toggle" type="button"></button>
        <button class="preference-btn preference-btn--theme" id="global-theme-toggle" type="button"></button>
    `;

    getMountPoint().appendChild(controls);

    document.getElementById('global-lang-toggle')?.addEventListener('click', async () => {
        currentLang = currentLang === 'ar' ? 'en' : 'ar';
        await persistPreferences();
        renderControls();
    });

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
    if (prefs.lang === 'ar' || prefs.lang === 'en') currentLang = prefs.lang;
    if (prefs.theme === 'dark' || prefs.theme === 'light') currentTheme = prefs.theme;
    applyPreferences();
}

hydrateFromUser();
document.addEventListener('DOMContentLoaded', mountControls);
