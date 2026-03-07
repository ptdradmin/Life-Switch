import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Shield, Globe, Check, Eye, EyeOff, User, Mail, Lock, Phone, MapPin, Globe2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
    { code: "fr", label: "Français" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" },
    { code: "it", label: "Italiano" },
    { code: "pt", label: "Português" },
    { code: "ar", label: "العربية" },
    { code: "zh", label: "中文" },
    { code: "ja", label: "日本語" },
    { code: "ru", label: "Русский" },
];

export default function SignupPage() {
    const { signup, loginWithGoogle, loginWithPhone, confirmOtp, updateLanguage, currentLanguage: lang } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<"input" | "otp">("input");
    const [authMode, setAuthMode] = useState<"email" | "phone">("email");
    const [langOpen, setLangOpen] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [showLoginHint, setShowLoginHint] = useState(false);

    const translateAuthError = (error: string): string => {
        if (error.includes("email-already-in-use")) return t("auth.error_email_in_use");
        if (error.includes("invalid-email")) return t("auth.error_invalid_email");
        if (error.includes("weak-password")) return t("auth.error_weak_password");
        if (error.includes("wrong-password") || error.includes("invalid-credential")) return t("auth.error_wrong_password");
        if (error.includes("user-not-found")) return t("auth.error_user_not_found");
        if (error.includes("too-many-requests")) return t("auth.error_too_many_requests");
        if (error.includes("network-request-failed")) return t("auth.error_network");
        if (error.includes("requires-recent-login")) return t("profile.delete_relogin");
        return error;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error(t("login.fill_all"));
            return;
        }
        setSubmitting(true);
        const result = await signup(email, password, {
            name,
            phone,
            postal_code: postalCode,
            city,
            country
        });
        setSubmitting(false);

        if (result.error) {
            if (result.error.includes("email-already-in-use")) {
                setShowLoginHint(true);
            }
            toast.error(translateAuthError(result.error));
        } else {
            toast.success(t("login.signup_success"));
            navigate("/login");
        }
    };

    const handlePhoneSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber) { toast.error(t("login.fill_all")); return; }
        setSubmitting(true);
        const result = await loginWithPhone(phoneNumber, "recaptcha-container-signup");
        setSubmitting(false);
        if (result.error) { toast.error(result.error); }
        else { setStep("otp"); toast.success(t("auth.send_code")); }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) { toast.error(t("login.fill_all")); return; }
        setSubmitting(true);
        const result = await confirmOtp(otp);
        setSubmitting(false);
        if (result.error) { toast.error(result.error); }
        else { toast.success(t("login.welcome")); }
    };

    const handleGoogleLogin = async () => {
        setSubmitting(true);
        const result = await loginWithGoogle();
        setSubmitting(false);
        if (result.error) { toast.error(result.error); }
        else { toast.success(t("login.welcome")); }
    };

    return (
        <div className="flex min-h-screen flex-col items-center bg-background px-6 pt-12 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-20 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-20 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
            </div>

            {/* Floating Language Switcher */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed top-6 right-6 z-50"
            >
                <button
                    onClick={() => setLangOpen(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card/60 backdrop-blur-xl shadow-xl border border-white/10 hover:border-primary/50 transition-all hover:scale-105"
                >
                    <Globe className="h-5 w-5 text-primary" />
                </button>
            </motion.div>

            <div className="w-full max-w-sm space-y-8 relative z-10 pb-12">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("common.back") || "Back"}
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <div className="mx-auto relative inline-block">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-primary shadow-[0_15px_35px_rgba(var(--primary),0.3)]">
                            <Shield className="h-10 w-10 text-primary-foreground" />
                        </div>
                        <div className="absolute inset-0 -m-2 border border-dashed border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tight text-foreground">{t("signup.title")}</h1>
                        <p className="text-sm font-medium text-muted-foreground px-4 leading-relaxed">{t("signup.subtitle")}</p>
                    </div>
                </motion.div>

                <div className="flex p-1 gap-1 bg-secondary/50 rounded-2xl border border-border/40">
                    <button
                        onClick={() => { setAuthMode("email"); setStep("input"); }}
                        className={cn(
                            "flex-1 h-10 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                            authMode === "email" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t("login.email_tab")}
                    </button>
                    <button
                        onClick={() => { setAuthMode("phone"); setStep("input"); }}
                        className={cn(
                            "flex-1 h-10 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                            authMode === "phone" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t("auth.phone")}
                    </button>
                </div>

                <motion.div
                    key={authMode}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {authMode === "email" ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-3">
                                {/* Name */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder={t("contacts.name")}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-14 rounded-2xl pl-12 bg-card/40 border-border/60 focus:bg-card transition-all"
                                        autoComplete="name"
                                    />
                                </div>

                                {/* Email */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <Input
                                        type="email"
                                        placeholder={t("login.email")}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-14 rounded-2xl pl-12 bg-card/40 border-border/60 focus:bg-card transition-all"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <Input
                                        type={showPwd ? "text" : "password"}
                                        placeholder={t("login.password")}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-14 rounded-2xl pl-12 pr-12 bg-card/40 border-border/60 focus:bg-card transition-all"
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(v => !v)}
                                        className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Login Hint */}
                                <AnimatePresence>
                                    {showLoginHint && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-[11px] text-amber-500 font-semibold leading-relaxed"
                                        >
                                            💡 {t("auth.error_email_in_use")}
                                            <button type="button" onClick={() => navigate("/login")} className="ml-1 font-black underline decoration-2">
                                                {t("login.signin")}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Optional Phone */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <Input
                                        type="tel"
                                        placeholder={t("signup.phone_optional")}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="h-14 rounded-2xl pl-12 bg-card/40 border-border/60 focus:bg-card transition-all"
                                        autoComplete="tel"
                                    />
                                </div>

                                {/* Address Bits */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative group col-span-1">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder={t("signup.postal_code")}
                                            value={postalCode}
                                            onChange={(e) => setPostalCode(e.target.value)}
                                            className="h-14 rounded-2xl pl-12 bg-card/40 border-border/60 focus:bg-card transition-all"
                                            autoComplete="postal-code"
                                            maxLength={10}
                                        />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder={t("signup.city")}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="h-14 rounded-2xl px-4 bg-card/40 border-border/60 focus:bg-card transition-all"
                                        autoComplete="address-level2"
                                    />
                                </div>

                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Globe2 className="h-4 w-4" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder={t("signup.country")}
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="h-14 rounded-2xl pl-12 bg-card/40 border-border/60 focus:bg-card transition-all"
                                        autoComplete="country-name"
                                    />
                                </div>
                            </div>

                            <div className="py-2 text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground/40 leading-relaxed tracking-widest">
                                    {t("signup.terms_prefix") || "En m'inscrivant, j'accepte les"}{" "}
                                    <button type="button" onClick={() => navigate("/legal")} className="text-primary hover:text-primary/70">{t("legal.tos_title")}</button>
                                    {" "}{t("common.and") || "et"}{" "}
                                    <button type="button" onClick={() => navigate("/privacy")} className="text-primary hover:text-primary/70">{t("legal.privacy_title")}</button>
                                </p>
                            </div>

                            <Button type="submit" disabled={submitting} className="h-15 w-full rounded-[20px] text-lg font-black shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all gap-2">
                                {submitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                ) : (
                                    <>
                                        {t("signup.button")}
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.form
                                key={step}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={step === "input" ? handlePhoneSignup : handleVerifyOtp}
                                className="space-y-4"
                            >
                                {step === "input" ? (
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <Input type="tel" placeholder="+33 6 ..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-14 rounded-2xl pl-12 bg-card/40 border-border/60" autoComplete="tel" />
                                        </div>
                                        <div id="recaptcha-container-signup" className="flex justify-center overflow-hidden rounded-xl"></div>
                                        <Button type="submit" disabled={submitting} className="h-15 w-full rounded-[20px] text-lg font-black shadow-lg shadow-primary/20">
                                            {submitting ? "..." : t("auth.send_code")}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-center">
                                        <p className="text-xs text-muted-foreground mb-2">Entrez le code envoyé au {phoneNumber}</p>
                                        <Input type="text" placeholder={t("auth.otp")} value={otp} onChange={(e) => setOtp(e.target.value)} className="h-14 rounded-2xl text-center text-2xl font-black tracking-[0.5em] bg-card/40 border-border/60" />
                                        <Button type="submit" disabled={submitting} className="h-15 w-full rounded-[20px] text-lg font-black shadow-lg shadow-primary/20 uppercase tracking-widest">
                                            {submitting ? "..." : t("auth.verify")}
                                        </Button>
                                        <button onClick={() => setStep("input")} className="text-[10px] font-black uppercase text-muted-foreground/60 hover:text-primary transition-colors tracking-widest">
                                            {t("common.back")}
                                        </button>
                                    </div>
                                )}
                            </motion.form>
                        </AnimatePresence>
                    )}
                </motion.div>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                        <span className="bg-background px-4 text-muted-foreground/40">{t("login.continue_with")}</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={submitting}
                    className="h-14 w-full rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest bg-card/40 backdrop-blur-md border-border/60 hover:border-primary/30 transition-all hover:bg-card"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </Button>

                <p className="text-center text-sm font-medium text-muted-foreground pt-4">
                    {t("login.has_account")}{" "}
                    <button onClick={() => navigate("/login")} className="font-black text-primary hover:opacity-70 transition-opacity">
                        {t("login.signin")}
                    </button>
                </p>
            </div>

            <Dialog open={langOpen} onOpenChange={setLangOpen}>
                <DialogContent className="max-w-sm rounded-[32px] border-white/10 shadow-2xl backdrop-blur-xl bg-card/90">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="text-2xl font-black text-center tracking-tight">{t("profile.choose_lang")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {languages.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => { updateLanguage(l.code); setLangOpen(false); }}
                                className={cn(
                                    "flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-black transition-all border",
                                    l.code === lang
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                        : "bg-secondary/40 border-transparent hover:border-primary/30 hover:bg-secondary/60"
                                )}
                            >
                                {l.label}
                                {l.code === lang && <Check className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
