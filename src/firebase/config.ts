import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBTJfsFGo2y7btsCn7rX5-k-9fnMLdGMDE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chatcart-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chatcart-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chatcart-2026.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "74124479698",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:74124479698:web:484f3e77a07eb11c20f10b"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use initializeFirestore with multi-tab persistent cache and auto-detect long polling to prevent streaming drops
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalAutoDetectLongPolling: true
});

export const storage = getStorage(app, "gs://chatcart-2026.firebasestorage.app");

