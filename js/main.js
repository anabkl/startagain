// تحديث رقم المنتجات في السلة
export function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('parashop_cart')) || [];
    const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.header__cart-count, #cart-count');
    
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. تشغيل قائمة الهاتف (Mobile Menu)
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mainNav.classList.toggle('open');
        });
    }

    // 2. تشغيل السلايدر (Hero Slider)
    const slides = document.querySelectorAll('.hero__slide');
    const dots = document.querySelectorAll('.hero__dot');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    let currentSlide = 0;
    let slideInterval;

    function goToSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        currentSlide = (n + slides.length) % slides.length;
        if(slides[currentSlide]) slides[currentSlide].classList.add('active');
        if(dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }
    function startSlider() { slideInterval = setInterval(nextSlide, 5000); }

    if (slides.length > 0) {
        if(nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); clearInterval(slideInterval); startSlider(); });
        if(prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); clearInterval(slideInterval); startSlider(); });
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
                clearInterval(slideInterval);
                startSlider();
            });
        });
        startSlider();
    }

    // 3. زر الرجوع للأعلى (Back to Top)
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.visibility = 'visible';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.visibility = 'hidden';
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 4. تحديث العداد عند تحميل الصفحة
    updateCartCount();
    
    // الاستماع لأي تغيير في السلة من صفحات أخرى
    window.addEventListener('storage', updateCartCount);
});
