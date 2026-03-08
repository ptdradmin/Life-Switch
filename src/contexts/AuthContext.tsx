import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import { uploadFile } from "@/lib/storage";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
  type ConfirmationResult
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDocFromCache
} from "firebase/firestore";
import { requestNotificationPermission } from "@/lib/fcm";

interface Profile {
  language: string;
  timer_days: number;
  last_check_in: any;
  display_name: string | null;
  photo_url?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  onboarding_shown?: boolean;
  created_at: any;
  email?: string | null;
  biometric_enabled?: boolean;
  notifications_enabled?: boolean;
  is_premium?: boolean;
  premium_since?: string | null;
  subscription_id?: string | null;
  accent_color?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, extraData?: { name?: string; phone?: string; postal_code?: string; city?: string; country?: string }) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  loginWithPhone: (phoneNumber: string, containerId: string) => Promise<{ error?: string }>;
  confirmOtp: (otp: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateTimer: (days: number) => Promise<void>;
  updateLanguage: (lang: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  uploadProfilePhoto: (file: File, onProgress?: (pct: number) => void) => Promise<{ error?: string }>;
  currentLanguage: string;
  checkIn: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<{ error?: string }>;
  markOnboardingComplete: () => Promise<void>;
  isEmailUser: boolean;
  updateBiometricPref: (enabled: boolean) => Promise<void>;
  updateNotificationPref: (enabled: boolean) => Promise<void>;
  updateAccentColor: (color: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [localLanguage, setLocalLanguage] = useState<string>(localStorage.getItem("preferred_language") || "fr");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: () => void = () => { };
    let isMounted = true;

    const initAuth = async () => {
      // 1. Detect if we are returning from a Google redirect
      const isRedirecting = localStorage.getItem("pending_google_login") === "true";

      if (isRedirecting) {
        console.log("MOBILE: Redirect detected, locking loading screen.");
        setLoading(true);
      }

      // 1. Force local persistence for mobile session recovery
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (err) {
        console.error("Persistence error:", err);
      }

      // 2. Process Redirect Result
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && isMounted) {
          setUser(result.user);
          localStorage.removeItem("pending_google_login");
        }
      } catch (error) {
        console.error("Redirect processing error:", error);
        localStorage.removeItem("pending_google_login");
      }

      // 3. Listen for Auth State
      const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
        if (!isMounted) return;

        if (u) {
          setUser(u);
          localStorage.removeItem("pending_google_login");

          const profileRef = doc(db, "profiles", u.uid);
          unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            if (!isMounted) return;
            if (docSnap.exists()) {
              const data = docSnap.data() as any;
              setProfile({
                ...data,
                last_check_in: data.last_check_in?.toDate ? data.last_check_in.toDate() : data.last_check_in,
                created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
              });
              if (data.accent_color) {
                document.documentElement.style.setProperty('--primary', data.accent_color);
              }
              setLoading(false);
            } else {
              const defaultProfile = {
                language: localLanguage || "fr",
                timer_days: 30,
                last_check_in: serverTimestamp(),
                display_name: u.displayName || "",
                created_at: serverTimestamp(),
                onboarding_shown: false,
                email: u.email
              };
              setDoc(profileRef, defaultProfile).then(() => {
                if (isMounted) {
                  setProfile(defaultProfile as any);
                  setLoading(false);
                }
              });
            }
          }, (err) => {
            console.error("Profile sync error:", err);
            setLoading(false);
          });
          requestNotificationPermission(u.uid);
        } else {
          const stillRedirecting = localStorage.getItem("pending_google_login") === "true";

          if (!stillRedirecting) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          } else {
            // Force a 5-second wait for mobile session restoration (down from 10s)
            setTimeout(() => {
              if (isMounted && !auth.currentUser) {
                console.log("MOBILE: Giving up on redirect restoration.");
                localStorage.removeItem("pending_google_login");
                setLoading(false);
              }
            }, 5000);
          }
        }
      });

      return unsubscribeAuth;
    };

    const cleanupPromise = initAuth();
    return () => {
      isMounted = false;
      cleanupPromise.then(unsub => unsub && unsub());
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signup = async (
    email: string,
    password: string,
    extraData?: { name?: string; phone?: string; postal_code?: string; city?: string; country?: string }
  ) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Save extra fields to profile immediately
      if (extraData && Object.keys(extraData).some(k => !!(extraData as any)[k])) {
        const profileRef = doc(db, "profiles", cred.user.uid);
        await setDoc(profileRef, {
          language: localLanguage || "fr",
          timer_days: 30,
          last_check_in: serverTimestamp(),
          display_name: extraData.name || cred.user.displayName || "",
          phone: extraData.phone || null,
          postal_code: extraData.postal_code || null,
          city: extraData.city || null,
          country: extraData.country || null,
          created_at: serverTimestamp(),
          email: cred.user.email
        }, { merge: true });
      }
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // signInWithPopup works on iOS Safari when triggered by a user click.
      // signInWithRedirect fails on iOS 17+ due to Apple's ITP blocking cross-site cookies.
      await signInWithPopup(auth, provider);
      return {};
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        // Only fall back to redirect if popup is explicitly blocked by the browser
        localStorage.setItem("pending_google_login", "true");
        await signInWithRedirect(auth, provider);
        return {};
      }
      return { error: error.message };
    }
  };

  const loginWithPhone = async (phoneNumber: string, containerId: string) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        sitekey: import.meta.env.VITE_FIREBASE_RECAPTCHA_KEY || undefined
      });
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const confirmOtp = async (otp: string) => {
    try {
      if (!confirmationResult) return { error: "No confirmation result found" };
      await confirmationResult.confirm(otp);
      setConfirmationResult(null);
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateTimer = async (days: number) => {
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, { timer_days: days });
  };

  const updateLanguage = async (newLang: string) => {
    setLocalLanguage(newLang);
    localStorage.setItem("preferred_language", newLang);
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, { language: newLang });
  };

  const updateDisplayName = async (name: string) => {
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, { display_name: name });
  };

  const uploadProfilePhoto = async (file: File, onProgress?: (pct: number) => void): Promise<{ error?: string }> => {
    if (!user) return { error: "No user" };
    try {
      // Compression côté client
      const compressedFile = await new Promise<File>((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));
            else reject(new Error("Compression failed"));
          }, "image/jpeg", 0.8);
        };
        img.onerror = () => reject(new Error("Image load error"));
      });

      // Upload vers Supabase Storage (gratuit, pas de CORS)
      const url = await uploadFile(compressedFile, "avatars", user.uid, onProgress);

      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, { photo_url: url });
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const currentLanguage = profile?.language || localLanguage;

  const checkIn = async () => {
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, { last_check_in: serverTimestamp() });
  };

  const deleteAccount = async (password?: string): Promise<{ error?: string }> => {
    if (!user) return { error: "No user" };
    try {
      if (password && user.email) {
        // Email/password re-authentication
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }
      // For Google/phone users without password, we proceed directly
      // (Firebase allows deletion if session is recent enough)
      const profileRef = doc(db, "profiles", user.uid);
      await deleteDoc(profileRef);
      await deleteUser(user);
      return {};
    } catch (error: any) {
      return { error: error.code || error.message };
    }
  };

  const markOnboardingComplete = async () => {
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, { onboarding_shown: true });
  };

  const updateBiometricPref = async (enabled: boolean) => {
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, { biometric_enabled: enabled });
    localStorage.setItem(`biometric_${user.uid}`, enabled ? "true" : "false");
  };

  const updateNotificationPref = async (enabled: boolean) => {
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, { notifications_enabled: enabled });
    localStorage.setItem(`notifications_${user.uid}`, enabled ? "true" : "false");
  };

  const updateAccentColor = async (color: string) => {
    if (!user) return;
    const profileRef = doc(db, "profiles", user.uid);
    await updateDoc(profileRef, { accent_color: color });
    document.documentElement.style.setProperty('--primary', color);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      login,
      signup,
      loginWithGoogle,
      loginWithPhone,
      confirmOtp,
      logout,
      updateTimer,
      updateLanguage,
      updateDisplayName,
      uploadProfilePhoto,
      currentLanguage,
      checkIn,
      deleteAccount,
      markOnboardingComplete,
      isEmailUser: !!(user?.email && !user?.providerData?.some(p => p.providerId === 'google.com')),
      updateBiometricPref,
      updateNotificationPref,
      updateAccentColor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
