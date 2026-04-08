import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDOtICpZvMdDyRDrdCZL04mWOEuljtXdlE",
  authDomain: "soviet-transformer.firebaseapp.com",
  projectId: "soviet-transformer",
  storageBucket: "soviet-transformer.firebasestorage.app",
  messagingSenderId: "1031779048385",
  appId: "1:1031779048385:web:30e8b657552620a6176d40"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
