import { apiFetch } from './auth.js';
import { showToast } from './utils.js';

// دالة إضافة منتج (خاصة بالعمال والأدمن عبر API)
export async function uploadProduct(productData, imageFile) {
    try {
        // ملاحظة: رفع الصور متوقف مؤقتاً حتى نزيدو API خاصة بالصور.
        // غنصيفطو غير البيانات دابا لـ MongoDB.

        const newProduct = {
            name: productData.name,
            brand: productData.brand,
            category: productData.category,
            price: Number(productData.price),
            promoPrice: productData.promoPrice ? Number(productData.promoPrice) : null,
            description: productData.description,
            stock: 100, // مخزون افتراضي
            image_url: null, // مسار الصورة خاوي حالياً
            sku: "PROD-" + Date.now()
        };

        // إرسال البيانات للباكاند ديال Render
        await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify(newProduct)
        }, { requiresAuth: true });

        showToast("تم إضافة المنتج للمتجر بنجاح! ✅", "success");
        return true;
    } catch (error) {
        console.error(error);
        showToast("فشل الرفع: " + error.message, "error");
        return false;
    }
}