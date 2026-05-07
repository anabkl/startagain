import { auth, db } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { doc, getDoc, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { normalizeMoroccanPhone } from './phone.js';
import { showToast } from './utils.js';

export { normalizeMoroccanPhone };

export async function registerUser(email, password, userData) {
    const name = String(userData.name || '').trim();
    const phone = normalizeMoroccanPhone(userData.whatsapp);
    if (!name) throw new Error('المرجو إدخال الاسم الكامل.');
    if (!phone.isValid) throw new Error('رقم واتساب غير صالح. استعمل 0675698351 أو +212675698351.');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name, photoURL: userData.photoURL || '' });

    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email: user.email,
        city: userData.city || '',
        address: userData.address || '',
        whatsapp: phone.normalized,
        phoneOriginal: phone.original,
        role: 'user',
        photoURL: userData.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    showToast('تم إنشاء الحساب بنجاح.', 'success');
    return user;
}

export async function loginUser(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const role = userDoc.exists() ? userDoc.data().role : 'user';
    showToast('مرحباً بك مجدداً.', 'success');
    return { user, role };
}

export async function logoutUser() {
    await signOut(auth);
    window.location.href = 'index.html';
}

export function getAuthErrorMessage(error) {
    const code = error?.code;
    if (code === 'auth/email-already-in-use') return 'هذا البريد الإلكتروني مستخدم بالفعل. جرب تسجيل الدخول.';
    if (code === 'auth/weak-password') return 'كلمة المرور ضعيفة. استعمل 6 أحرف على الأقل.';
    if (code === 'auth/invalid-email') return 'صيغة البريد الإلكتروني غير صالحة.';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    if (code === 'auth/too-many-requests') return 'محاولات كثيرة. حاول مرة أخرى بعد قليل.';
    if (error?.message) return error.message;
    return 'حدث خطأ. حاول مرة أخرى.';
}
