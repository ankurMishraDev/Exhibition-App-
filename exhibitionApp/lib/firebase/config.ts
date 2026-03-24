import { initializeApp, getApps, getApp } from 'firebase/app';
// getReactNativePersistence is in the RN bundle (dist/rn/index.js) but absent from TS types
// @ts-ignore
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDUp5tzUUi_q71Lh3hc8ihMIi5B5rTOxKA',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'plastindia-2026-74ff1.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'plastindia-2026-74ff1',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'plastindia-2026-74ff1.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1030469473648',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1030469473648:web:a7c6298d333988d0d46bb5',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-2HBCQRZP6Z',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// initializeAuth must only be called once. On HMR hot-reloads the app is already
// initialized, so fall back to getAuth() to avoid a duplicate-app error.
let _auth;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  _auth = getAuth(app);
}
export const auth = _auth;

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
