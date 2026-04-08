import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, browserPopupRedirectResolver, initializeAuth, browserLocalPersistence } from 'firebase/auth';
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

// Use explicit initialization to avoid issues with bundlers
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
