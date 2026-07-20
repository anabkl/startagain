import './ui-preferences.js';

export const CART_KEY = 'parashop_cart';

export function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

export function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

export function updateCartCount() {
    const count = getCart().reduce((total, item) => total + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.header__cart-count, #cart-count');

    badges.forEach((badge) => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

function initMobileNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    if (!menuToggle || !mainNav) return;

    const mobileNavigation = window.matchMedia('(max-width: 860px)');
    if (mainNav.id) menuToggle.setAttribute('aria-controls', mainNav.id);

    function setNavigationState(open) {
        const isOpen = mobileNavigation.matches && open;

        mainNav.classList.toggle('open', isOpen);
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');

        // A max-height-only menu is still exposed to assistive technology
        // and its invisible links remain keyboard-focusable. Keep the
        // collapsed mobile navigation out of both interaction paths, while
        // restoring the normal landmark as soon as the desktop layout returns.
        const collapsed = mobileNavigation.matches && !isOpen;
        mainNav.toggleAttribute('inert', collapsed);
        if (collapsed) mainNav.setAttribute('aria-hidden', 'true');
        else mainNav.removeAttribute('aria-hidden');
    }

    menuToggle.addEventListener('click', () => {
        setNavigationState(!mainNav.classList.contains('open'));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            setNavigationState(false);
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !mainNav.classList.contains('open')) return;
        event.preventDefault();
        setNavigationState(false);
        menuToggle.focus();
    });

    const resetForBreakpoint = () => setNavigationState(false);
    if (typeof mobileNavigation.addEventListener === 'function') {
        mobileNavigation.addEventListener('change', resetForBreakpoint);
    } else {
        mobileNavigation.addListener(resetForBreakpoint);
    }

    setNavigationState(false);
}

function initHeaderSearch() {
    const searchInput = document.querySelector('.header__search-input');
    const searchBtn = document.querySelector('.header__search-btn');
    const searchForm = searchInput?.closest('form');

    function doSearch() {
        const term = searchInput ? searchInput.value.trim() : '';
        window.location.href = term ? `/boutique/?q=${encodeURIComponent(term)}` : '/boutique/';
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            doSearch();
        });
    } else if (searchBtn) {
        searchBtn.addEventListener('click', doSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') doSearch();
        });
    }
}

function initFaqAccordions() {
    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-faq-question]');
        if (!button) return;

        const item = button.closest('.faq__item');
        const isOpen = item.classList.toggle('open');
        button.setAttribute('aria-expanded', String(isOpen));
    });
}

function initRevealAnimations() {
    const elements = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || elements.length === 0) {
        elements.forEach((element) => element.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    elements.forEach((element) => observer.observe(element));
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileNavigation();
    initHeaderSearch();
    initFaqAccordions();
    initRevealAnimations();
    updateCartCount();
});

window.addEventListener('storage', updateCartCount);
document.addEventListener('content:updated', initRevealAnimations);
