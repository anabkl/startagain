import { db } from './firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { showToast, formatCurrency } from './utils.js';
import { updateCartCount } from './main.js';

const productsContainer = document.getElementById('products-container');
const searchBar = document.getElementById('search-bar');
const categoryButtons = document.getElementById('category-buttons');

let allProducts = [];

// --- خوارزميات البحث الذكي (Smart Search) ---
function normalizeSearchText(text) {
    if (!text) return '';
    return text.toLowerCase().trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, ''); // مسح التشكيل
}

function smartMatch(target, query) {
    if (!target) return false;
    const normTarget = normalizeSearchText(target);
    const normQuery = normalizeSearchText(query);
    
    // تقسيم البحث لكلمات باش يقدر يقلب عليهم واخا يكونو متباعدين
    const queryWords = normQuery.split(' ').filter(word => word.length > 0);
    
    // خاص كل الكلمات اللي كتب الكليان تكون كاينة فـ اسم المنتج أو الماركة
    return queryWords.every(word => normTarget.includes(word));
}
// ----------------------------------------------

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
}

function safeCssUrl(url) {
    if (!url) return 'assets/images/photopharamcie.png';
    if (!/^(https?:|data:)/.test(url)) return 'assets/images/photopharamcie.png';
    return url.replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
}

async function fetchProducts() {
    if (!productsContainer) return;
    
    productsContainer.innerHTML = '<p style="text-align:center; width:100%; color: var(--green-main); font-weight:bold; font-size:1.2rem;">جاري تحميل المنتجات... ⏳</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        buildCategoryButtons(allProducts);

        // Check for search query param
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
                if (searchBar) searchBar.value = q;
                const filtered = allProducts.filter(product =>
                    smartMatch(product.name, q) ||
                    smartMatch(product.brand, q) ||
                    smartMatch(product.category, q)
                );
                displayProducts(filtered);
            } else {
            displayProducts(allProducts);
        }
    } catch (error) {
        console.error("Error fetching products: ", error);
        productsContainer.innerHTML = '<p style="text-align:center; width:100%; color: red; font-weight:bold;">حدث خطأ أثناء تحميل المنتجات من قاعدة البيانات.</p>';
    }
}

function buildCategoryButtons(products) {
    if (!categoryButtons) return;
    // Extract unique categories from actual products
    const categories = [...new Set(products
        .filter(p => p.type !== 'pack' && p.category)
        .map(p => p.category))];
    
    let html = '<button onclick="filterByCategory(\'all\')" class="cat-btn active" id="cat-all">الكل</button>';
    categories.forEach(cat => {
        const safeCat = cat.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += `<button onclick="filterByCategory('${safeCat}')" class="cat-btn">${escapeHtml(cat)}</button>`;
    });
    categoryButtons.innerHTML = html;
}

function displayProducts(products) {
    productsContainer.innerHTML = '';
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<p style="text-align:center; width:100%; font-size:1.2rem; color:#757575;">لا توجد منتجات مطابقة لبحثك.</p>';
        return;
    }

    products.forEach(product => {
        if (product.type === 'pack') {
            const promoPrice = product.promoPrice;
            const packCard = document.createElement('div');
            packCard.className = 'pack-promo-card';
            packCard.style.cssText = 'width:100%; background: linear-gradient(135deg, #0d7c3e, #1a9e52); border-radius:16px; box-shadow:0 6px 25px rgba(13,124,62,0.3); padding:25px 30px; margin-bottom:20px; display:flex; align-items:center; gap:25px; cursor:pointer; transition:transform 0.3s;';
            packCard.onmouseover = () => packCard.style.transform = 'translateY(-4px)';
            packCard.onmouseout = () => packCard.style.transform = 'translateY(0)';

            const typeBadge = product.packType === 'باك ترويجي' ? '📦 باك ترويجي' : '🔥 عرض خاص';
            packCard.innerHTML = `
                <div style="flex-shrink:0; width:160px; height:160px; background: url('${safeCssUrl(product.imageUrl)}') center/cover no-repeat; border-radius:12px; border:3px solid rgba(255,255,255,0.4);"></div>
                <div style="flex-grow:1; color:#fff; text-align:right;">
                    <span style="background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:20px; font-size:0.85rem; font-weight:bold;">${typeBadge}</span>
                    <h2 style="margin:10px 0 8px; font-size:1.5rem; font-weight:900;">${escapeHtml(product.name)}</h2>
                    <p style="margin:0 0 15px; opacity:0.9; font-size:0.95rem; line-height:1.6;">${escapeHtml(product.description || '')}</p>
                    <div style="display:flex; align-items:center; gap:20px;">
                        ${promoPrice ? `<span style="font-size:1.8rem; font-weight:900;">${formatCurrency(promoPrice)}</span>` : ''}
                        <button class="btn" style="background:#fff; color:#0d7c3e; border:none; padding:12px 25px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:1rem; transition:background 0.3s;" onclick="addToCart('${escapeHtml(product.id)}')">
                            <i class="fas fa-cart-plus"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(packCard);
            return;
        }

        const price = product.price || 0;
        const promoPrice = product.promoPrice;
        const hasPromo = promoPrice && promoPrice < price;
        const outOfStock = product.stock === 0;

        let priceHtml = '';
        let badgeHtml = '';

        if (outOfStock) {
            badgeHtml = `<span style="background:#ffebee; color:#c62828; padding:5px 10px; border-radius:8px; font-weight:bold; position:absolute; top:10px; right:10px; z-index:1; font-size:0.8rem;">نفذ من المخزون</span>`;
        } else if (hasPromo) {
            const discount = Math.round(((price - promoPrice) / price) * 100);
            badgeHtml = `<span style="background:#e74c3c; color:#fff; padding:5px 10px; border-radius:8px; font-weight:bold; position:absolute; top:10px; right:10px; z-index:1;">-${discount}%</span>`;
        }

        if (hasPromo) {
            priceHtml = `
                <span style="color:var(--green-main); font-weight:900; font-size:1.2rem;">${formatCurrency(promoPrice)}</span>
                <span style="text-decoration:line-through; color:#9e9e9e; font-size:0.9rem; margin-right:8px;">${formatCurrency(price)}</span>
            `;
        } else {
            priceHtml = `<span style="color:var(--green-main); font-weight:900; font-size:1.2rem;">${formatCurrency(price)}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cssText = 'position:relative; background:#fff; border-radius:16px; box-shadow:0 4px 15px rgba(0,0,0,0.05); padding:15px; transition:transform 0.3s, box-shadow 0.3s; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer;';
        
        card.onmouseover = () => { card.style.transform = 'translateY(-5px)'; card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; };
        card.onmouseout = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; };

        // Navigate to product detail on card click (except buttons)
        card.onclick = (e) => {
            if (e.target.tagName.toUpperCase() !== 'BUTTON' && !e.target.closest('button')) {
                window.location.href = `product.html?id=${product.id}`;
            }
        };

        card.innerHTML = `
            ${badgeHtml}
            <div style="background: url('${safeCssUrl(product.imageUrl)}') center/contain no-repeat; height: 180px; border-radius:12px; margin-bottom:15px;"></div>
            
            <div style="text-align:right; flex-grow:1; display:flex; flex-direction:column;">
                <span style="color:#757575; font-size:0.85rem;">${escapeHtml(product.category || 'غير محدد')}</span>
                <h3 style="margin:8px 0 15px; font-size:1rem; color:#212121; line-height:1.4;">${escapeHtml(product.name)}</h3>
                
                <div style="margin-top:auto;">
                    <div style="margin-bottom:12px;">${priceHtml}</div>
                    <button style="width:100%; background:${outOfStock ? '#bdbdbd' : 'var(--green-main)'}; color:#fff; border:none; padding:12px; border-radius:10px; cursor:${outOfStock ? 'not-allowed' : 'pointer'}; font-weight:bold; font-size:0.95rem; transition:background 0.3s;" 
                        ${outOfStock ? 'disabled' : `onclick="addToCart('${product.id}')"`}>
                        <i class="fas fa-cart-plus"></i> ${outOfStock ? 'نفذ من المخزون' : 'أضف للسلة'}
                    </button>
                </div>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

if (searchBar) {
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        
        // إرجاع زر "الكل" للحالة النشطة
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        const catAll = document.getElementById('cat-all');
        if (catAll) catAll.classList.add('active');

        // تطبيق خوارزمية البحث الذكي
        const filteredProducts = allProducts.filter(product => 
            smartMatch(product.name, searchTerm) || 
            smartMatch(product.brand, searchTerm) || 
            smartMatch(product.category, searchTerm)
        );
        displayProducts(filteredProducts);
    });
}

window.filterByCategory = function(category) {
    if (searchBar) searchBar.value = '';
    // Update active button
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if (category === 'all') {
        const catAll = document.getElementById('cat-all');
        if (catAll) catAll.classList.add('active');
        displayProducts(allProducts);
    } else {
        // Find and activate matching button
        document.querySelectorAll('.cat-btn').forEach(b => {
            if (b.textContent === category) b.classList.add('active');
        });
        const filteredProducts = allProducts.filter(product => product.category === category);
        displayProducts(filteredProducts);
    }
};

window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if(product) {
        if (product.stock === 0) {
            showToast('هذا المنتج نفذ من المخزون', 'error');
            return;
        }
        let cart = JSON.parse(localStorage.getItem('parashop_cart')) || [];
        const existingItem = cart.find(item => item.id === productId);
        if(existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({...product, quantity: 1});
        }
        localStorage.setItem('parashop_cart', JSON.stringify(cart));
        
        showToast(`تمت إضافة "${product.name}" إلى السلة!`, 'success');
        updateCartCount();
    }
};

document.addEventListener('DOMContentLoaded', fetchProducts);
