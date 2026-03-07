import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ── App Check ──────────────────────────────────────────────────────────────
// In development (localhost), Firebase accepts the debug token automatically.
// In production, ReCaptchaV3Provider is used (configure site key in .env).
if (import.meta.env.DEV) {
    // Inject the debug token BEFORE initializeAppCheck is called
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = "046E7AC1-CE7B-4882-9F48-AD579AB55C01";
}

if (import.meta.env.VITE_FIREBASE_RECAPTCHA_KEY) {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_FIREBASE_RECAPTCHA_KEY),
        isTokenAutoRefreshEnabled: true,
    });
}
// ──────────────────────────────────────────────────────────────────────────

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code !== "failed-precondition" && err.code !== "unimplemented") {
        console.error("Firestore persistence failed:", err.code);
    }
});

export const storage = getStorage(app);

// Messaging may not be supported in all environments (e.g. non-HTTPS / incognito)
export const messaging = async () => (await isSupported()) ? getMessaging(app) : null;

export default app;
