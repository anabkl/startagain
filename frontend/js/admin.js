import { db, storage, auth } from './firebase.js';
import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js';
import { showToast } from './utils.js';

// دالة إضافة منتج (خاصة بالعمال والأدمن)
export async function uploadProduct(productData, imageFile) {
    try {
        // 1. رفع الصورة لـ Storage
        const fileRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(fileRef, imageFile);
        const url = await getDownloadURL(uploadResult.ref);

        // 2. تسجيل البيانات فـ Firestore
        await addDoc(collection(db, "products"), {
            name: productData.name,
            brand: productData.brand,
            category: productData.category,
            price: Number(productData.price),
            promoPrice: productData.promoPrice ? Number(productData.promoPrice) : null,
            description: productData.description,
            imageUrl: url,
            createdAt: serverTimestamp()
        });

        showToast("تم إضافة المنتج للمتجر بنجاح! ✅", "success");
        return true;
    } catch (error) {
        console.error(error);
        showToast("فشل الرفع: " + error.message, "error");
        return false;
    }
}
