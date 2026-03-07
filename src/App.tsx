import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import SplashScreen from "@/components/SplashScreen";
import { setupFCMListener } from "@/lib/fcm";
import { PurchaseService } from "@/lib/purchases";

// Lazy Load Pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const VaultPage = lazy(() => import("@/pages/VaultPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ContactsPage = lazy(() => import("@/pages/ContactsPage"));
const SignupPage = lazy(() => import("@/pages/SignupPage"));
const PresentationPage = lazy(() => import("@/pages/PresentationPage"));
const LibraryPage = lazy(() => import("@/pages/LibraryPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const PremiumPage = lazy(() => import("@/pages/PremiumPage"));
const EmergencyCallPage = lazy(() => import("@/pages/EmergencyCallPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, profile } = useAuth();
  const location = useLocation();
  const [incomingCall, setIncomingCall] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setupFCMListener((callerName) => {
        setIncomingCall(callerName);
      });
    }
  }, [user]);

  if (incomingCall) {
    return (
      <Suspense fallback={<SplashScreen />}>
        <EmergencyCallPage
          callerName={incomingCall}
          onDecline={() => setIncomingCall(null)}
          onAccept={() => setIncomingCall(null)}
        />
      </Suspense>
    );
  }

  // Initial loading state
  if (loading) {
    return <SplashScreen />;
  }

  const getRoutes = () => {
    if (location.pathname === "/presentation") return <Route path="/presentation" element={<PresentationPage />} />;
    if (location.pathname === "/privacy") return <Route path="/privacy" element={<LegalPage />} />;
    if (location.pathname === "/about" && !user) return <Route path="/about" element={<AboutPage />} />;
    if (location.pathname === "/signup" && !user) return <Route path="/signup" element={<SignupPage />} />;
    if (location.pathname === "/login" && !user) return <Route path="/login" element={<LoginPage />} />;
    if (!user) return <Route path="*" element={<PresentationPage />} />;

    if (profile && profile.onboarding_shown !== true && location.pathname !== "/onboarding") {
      return <Route path="*" element={<OnboardingPage />} />;
    }

    return (
      <>
        <Route path="/" element={<HomePage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<NotFound />} />
      </>
    );
  };

  return (
    <Suspense fallback={<SplashScreen />}>
      <Routes>
        {getRoutes()}
      </Routes>
      {user && profile?.onboarding_shown === true && <BottomNav />}
    </Suspense>
  );
}

const App = () => {
  useEffect(() => {
    // Initialize native services in background
    PurchaseService.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <OfflineBanner />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
