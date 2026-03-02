import { auth, db } from './firebase.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { showToast } from './utils.js';

// --- 1. خلق حساب جديد (Register) ---
export async function registerUser(email, password, userData) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // حفظ المعلومات فـ Firestore (Collection: users)
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            firstName: userData.firstName,
            lastName: userData.lastName,
            whatsapp: userData.whatsapp,
            city: userData.city,
            address: userData.address,
            role: 'client', // افتراضياً أي واحد كيتسجل هو كليان
            createdAt: new Date().toISOString()
        });

        showToast("تم إنشاء الحساب بنجاح! 🎉", "success");
        window.location.href = 'index.html';
    } catch (error) {
        console.error(error);
        showToast("خطأ في التسجيل: " + error.message, "error");
    }
}

// --- 2. تسجيل الدخول (Login) ---
export async function loginUser(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("مرحباً بك مجدداً! 👋", "success");
        
        // التحقق واش هو Admin باش نصيفطوه لـ Orders
        const user = auth.currentUser;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            window.location.href = 'orders.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        showToast("خطأ: البريد أو كلمة المرور غير صحيحة", "error");
    }
}

// --- 3. تسجيل الخروج ---
export async function logoutUser() {
    await signOut(auth);
    window.location.href = 'index.html';
}
