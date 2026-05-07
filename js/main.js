import { trackSearch } from './analytics.js';

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

    menuToggle.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('open');
        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('open');
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

function initHeaderSearch() {
    const searchInput = document.querySelector('.header__search-input');
    const searchBtn = document.querySelector('.header__search-btn');

    function doSearch() {
        const term = searchInput ? searchInput.value.trim() : '';
        if (term) trackSearch(term);
        window.location.href = term ? `shop.html?q=${encodeURIComponent(term)}` : 'shop.html';
    }

    if (searchBtn) searchBtn.addEventListener('click', doSearch);
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
