// js/cart.js
import { updateCartCount } from './main.js';
import { showToast } from './utils.js';

// ============================================
// 1. عناصر DOM
// ============================================
const cartItemsContainer = document.getElementById('cart-items');   // tbody للجدول
const cartCardsContainer = document.getElementById('cart-cards');   // بطاقات الموبايل
const cartTotalElement   = document.getElementById('cart-total');
const cartCountElement   = document.getElementById('cart-count');
const cartEmptyDiv       = document.getElementById('cart-empty');
const cartContentDiv     = document.getElementById('cart-content');
const checkoutBtn        = document.getElementById('checkout-btn');

const CART_KEY = 'parashop_cart';

// ============================================
// 2. دالة الحصول على السعر الفعلي
//    تدعم promoPrice و discountPrice
// ============================================
function getEffectivePrice(item) {
    return item.promoPrice || item.discountPrice || item.price;
}

// ============================================
// 3. دالة رسم السلة (Render)
// ============================================
function renderCart() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    // --- حالة السلة الفارغة ---
    if (cart.length === 0) {
        cartEmptyDiv.style.display   = 'flex';
        cartContentDiv.style.display = 'none';
        return;
    }

    cartEmptyDiv.style.display   = 'none';
    cartContentDiv.style.display = 'block';

    let total     = 0;
    let totalQty  = 0;
    let tableHTML = '';
    let cardsHTML = '';

    cart.forEach((item, index) => {
        const price    = getEffectivePrice(item);
        const subtotal = price * item.quantity;
        total    += subtotal;
        totalQty += item.quantity;

        // --- صف الجدول (Desktop) ---
        tableHTML += `
            <tr class="cart-table__row">
                <td class="cart-table__product">
                    <img src="${item.imageUrl}" alt="${item.name}" class="cart-table__img">
                    <span class="cart-table__name">${item.name}</span>
                </td>
                <td class="cart-table__price">${price.toFixed(2)} DH</td>
                <td class="cart-table__qty">
                    <div class="qty-control">
                        <button class="qty-control__btn" data-action="decrease" data-index="${index}" aria-label="إنقاص الكمية">−</button>
                        <input  class="qty-control__input" type="number" min="1" max="99" value="${item.quantity}" data-index="${index}" aria-label="الكمية">
                        <button class="qty-control__btn" data-action="increase" data-index="${index}" aria-label="زيادة الكمية">+</button>
                    </div>
                </td>
                <td class="cart-table__subtotal">${subtotal.toFixed(2)} DH</td>
                <td class="cart-table__remove">
                    <button class="btn-remove" data-index="${index}" aria-label="حذف المنتج">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;

        // --- بطاقة الموبايل ---
        cardsHTML += `
            <div class="cart-card">
                <img src="${item.imageUrl}" alt="${item.name}" class="cart-card__img">
                <div class="cart-card__details">
                    <h4 class="cart-card__name">${item.name}</h4>
                    <p class="cart-card__price">${price.toFixed(2)} DH</p>
                    <div class="qty-control">
                        <button class="qty-control__btn" data-action="decrease" data-index="${index}">−</button>
                        <input  class="qty-control__input" type="number" min="1" max="99" value="${item.quantity}" data-index="${index}">
                        <button class="qty-control__btn" data-action="increase" data-index="${index}">+</button>
                    </div>
                    <p class="cart-card__subtotal">المجموع: <strong>${subtotal.toFixed(2)} DH</strong></p>
                </div>
                <button class="btn-remove" data-index="${index}" aria-label="حذف المنتج">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    });

    // --- تحديث DOM ---
    cartItemsContainer.innerHTML = tableHTML;
    cartCardsContainer.innerHTML = cardsHTML;
    cartTotalElement.innerText   = total.toFixed(2) + ' DH';
    cartCountElement.innerText   = totalQty;
}

// ============================================
// 4. تحديث الكمية
// ============================================
function updateQuantity(index, newQty) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const qty  = parseInt(newQty);

    if (isNaN(qty) || qty < 1) {
        showToast('الكمية غير صالحة', 'error');
        renderCart();
        return;
    }

    if (qty > 99) {
        showToast('الحد الأقصى هو 99', 'error');
        renderCart();
        return;
    }

    cart[index].quantity = qty;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

// ============================================
// 5. حذف منتج من السلة
// ============================================
function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const removedItem = cart[index];
    cart.splice(index, 1);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
    updateCartCount();
    showToast(`تم حذف "${removedItem.name}" من السلة`, 'error');
}

// ============================================
// 6. Event Delegation (بدل onclick في HTML)
// ============================================
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (target) {
        const index  = parseInt(target.dataset.index);
        const action = target.dataset.action;
        const cart   = JSON.parse(localStorage.getItem(CART_KEY)) || [];

        if (action === 'increase') {
            updateQuantity(index, cart[index].quantity + 1);
        } else if (action === 'decrease') {
            if (cart[index].quantity > 1) {
                updateQuantity(index, cart[index].quantity - 1);
            } else {
                removeFromCart(index);
            }
        }
        return;
    }

    const removeBtn = e.target.closest('.btn-remove');
    if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        removeFromCart(index);
    }
});

// Event Listener للـ input المباشر على الكمية
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('qty-control__input')) {
        const index = parseInt(e.target.dataset.index);
        updateQuantity(index, e.target.value);
    }
});

// ============================================
// 7. التهيئة
// ============================================
renderCart();
console.log("Cart.js Loaded ✅");