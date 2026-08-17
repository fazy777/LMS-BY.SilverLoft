import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Client-side Firebase configuration (Browser safe)
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBlrTL2sUWFAVMLh48IIVJYPjZTrMeOTOE",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "lms-nextjs-42ab6.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "lms-nextjs-42ab6",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lms-nextjs-42ab6.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "308741916480",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:308741916480:web:4ac008a05dbdeb45d41ca5"
};

// Initialize Firebase Client (guard against reinitialization during Fast Refresh)
export const App = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const Authentication = getAuth(App);
export const googleProvider = new GoogleAuthProvider();
