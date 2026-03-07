import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import { uploadFile } from "@/lib/storage";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      // Si aucun utilisateur, nous pouvons arrêter le chargement immédiatement
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // 1. Tenter d'obtenir le profil depuis le CACHE immédiatement pour la vitesse
      const profileRef = doc(db, "profiles", u.uid);
      try {
        const cachedSnap = await getDocFromCache(profileRef);
        if (cachedSnap.exists()) {
          const data = cachedSnap.data() as any;
          setProfile({
            ...data,
            last_check_in: data.last_check_in?.toDate ? data.last_check_in.toDate() : data.last_check_in,
            created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
          });
          setLoading(false); // Cache trouvé, nous pouvons afficher l'application !
        }
      } catch (e) {
        // Cache manquant ou erreur, ignorer et laisser onSnapshot gérer
      }

      // 2. Mettre en place un écouteur en temps réel
      unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          const processedProfile: Profile = {
            ...data,
            last_check_in: data.last_check_in?.toDate ? data.last_check_in.toDate() : data.last_check_in,
            created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
          };
          setProfile(processedProfile);
          if (processedProfile.accent_color) {
            document.documentElement.style.setProperty('--primary', processedProfile.accent_color);
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
            setProfile(defaultProfile as any);
            setLoading(false);
          });
        }
      }, (error) => {
        console.error("Erreur de synchronisation du profil :", error);
        setLoading(false);
      });

      requestNotificationPermission(u.uid);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
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
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return {};
    } catch (error: any) {
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
