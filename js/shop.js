import { db } from './firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { showToast, formatCurrency } from './utils.js';
import { updateCartCount } from './main.js';

const productsContainer = document.getElementById('products-container');
const searchBar = document.getElementById('search-bar');

let allProducts = [];

async function fetchProducts() {
    if (!productsContainer) return;
    
    productsContainer.innerHTML = '<p style="text-align:center; width:100%; color: var(--green-main); font-weight:bold; font-size:1.2rem;">جاري تحميل المنتجات... ⏳</p>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayProducts(allProducts);
    } catch (error) {
        console.error("Error fetching products: ", error);
        productsContainer.innerHTML = '<p style="text-align:center; width:100%; color: red; font-weight:bold;">حدث خطأ أثناء تحميل المنتجات من قاعدة البيانات.</p>';
    }
}

function displayProducts(products) {
    productsContainer.innerHTML = '';
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<p style="text-align:center; width:100%; font-size:1.2rem; color:#757575;">لا توجد منتجات مطابقة لبحثك.</p>';
        return;
    }

    products.forEach(product => {
        const price = product.price || 0;
        const promoPrice = product.promoPrice;
        const hasPromo = promoPrice && promoPrice < price;

        let priceHtml = '';
        let badgeHtml = '';

        if (hasPromo) {
            const discount = Math.round(((price - promoPrice) / price) * 100);
            badgeHtml = `<span class="badge badge--promo" style="background:#e74c3c; color:#fff; padding:5px 10px; border-radius:8px; font-weight:bold; position:absolute; top:10px; right:10px; z-index:1;">-${discount}%</span>`;
            priceHtml = `
                <span class="price--current" style="color:var(--green-main); font-weight:900; font-size:1.2rem;">${formatCurrency(promoPrice)}</span>
                <span class="price--old" style="text-decoration:line-through; color:#9e9e9e; font-size:0.9rem; margin-right:8px;">${formatCurrency(price)}</span>
            `;
        } else {
            priceHtml = `<span class="price--current" style="color:var(--green-main); font-weight:900; font-size:1.2rem;">${formatCurrency(price)}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cssText = 'position:relative; background:#fff; border-radius:16px; box-shadow:0 4px 15px rgba(0,0,0,0.05); padding:15px; transition:transform 0.3s; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer;';
        
        card.onmouseover = () => card.style.transform = 'translateY(-5px)';
        card.onmouseout = () => card.style.transform = 'translateY(0)';

        card.innerHTML = `
            ${badgeHtml}
            <div class="product-card__image" style="background: url('${product.imageUrl || 'assets/images/photopharamcie.png'}') center/contain no-repeat; height: 180px; border-radius:12px; margin-bottom:15px;"></div>
            
            <div class="product-card__info" style="text-align:right; flex-grow:1; display:flex; flex-direction:column;">
                <span class="product-card__category" style="color:#757575; font-size:0.85rem;">${product.category || 'غير محدد'}</span>
                <h3 class="product-card__title" style="margin:8px 0 15px; font-size:1.1rem; color:#212121; line-height:1.4;">${product.name}</h3>
                
                <div style="margin-top:auto;">
                    <div class="product-card__price" style="margin-bottom:15px;">${priceHtml}</div>
                    <button class="btn btn--cart" style="width:100%; background:var(--green-main); color:#fff; border:none; padding:12px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:1rem; transition:background 0.3s;" onclick="addToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i> أضف للسلة
                    </button>
                </div>
            </div>
        `;
        productsContainer.appendChild(card);
    });
}

if (searchBar) {
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredProducts = allProducts.filter(product => 
            (product.name && product.name.toLowerCase().includes(searchTerm)) || 
            (product.brand && product.brand.toLowerCase().includes(searchTerm)) || 
            (product.category && product.category.toLowerCase().includes(searchTerm))
        );
        displayProducts(filteredProducts);
    });
}

window.filterByCategory = function(category) {
    if (searchBar) searchBar.value = '';
    if (category === 'all') {
        displayProducts(allProducts);
    } else {
        const filteredProducts = allProducts.filter(product => product.category === category);
        displayProducts(filteredProducts);
    }
};

window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if(product) {
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
