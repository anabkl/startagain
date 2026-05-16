import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyBZWUJXCOC3jtm7IknFMIZaX99vaFCbcp8",
  authDomain: "startagain-5da50.firebaseapp.com",
  projectId: "startagain-5da50",
  storageBucket: "startagain-5da50.firebasestorage.app",
  messagingSenderId: "938162420012",
  appId: "1:938162420012:web:900be24e9e2194c19dd489",
  measurementId: "G-ZQNRLP6NSW"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
