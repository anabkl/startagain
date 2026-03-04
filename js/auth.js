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
export async function registerUser(email, password, userData, onError) {
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
            role: 'client',
            createdAt: new Date().toISOString()
        });

        showToast("تم إنشاء الحساب بنجاح! 🎉", "success");
        window.location.href = 'index.html';
    } catch (error) {
        console.error(error);
        const msg = getRegisterErrorMessage(error.code);
        if (typeof onError === 'function') {
            onError(msg, error.code);
        } else {
            showToast(msg, "error");
        }
    }
}

function getRegisterErrorMessage(code) {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'هذا البريد الإلكتروني مستخدم بالفعل. جرب تسجيل الدخول.';
        case 'auth/weak-password':
            return 'كلمة المرور ضعيفة جداً. استخدم 6 أحرف على الأقل.';
        case 'auth/invalid-email':
            return 'صيغة البريد الإلكتروني غير صالحة.';
        case 'auth/operation-not-allowed':
            return 'تسجيل الحسابات غير مفعّل حالياً. تواصل معنا.';
        default:
            return 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.';
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
