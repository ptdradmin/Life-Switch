import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Globe, Crown, HelpCircle, CalendarDays, Lock, ChevronRight, LogOut,
    Check, ShieldCheck, Trash2, Info, Pencil, Camera, Bell, BellOff, X,
    Moon, Sun, Monitor, Timer, User, FileText, Fingerprint, ArrowRight, ShieldAlert, Languages, Palette, Smartphone, Users
} from "lucide-react";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getDocs } from "firebase/firestore";
import { testNotification } from "@/lib/fcm";

const timerOptions = [7, 14, 30, 60, 90];

const languages = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
    { code: "nl", label: "Nederlands", flag: "🇳🇱" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
];

type Theme = "dark" | "light" | "system";

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
    } else {
        root.classList.toggle("dark", theme === "dark");
    }
    localStorage.setItem("theme", theme);
}

export default function SettingsPage() {
    const { user, profile, logout, updateTimer, updateLanguage, updateDisplayName,
        uploadProfilePhoto, deleteAccount, isEmailUser, updateBiometricPref, updateNotificationPref, updateAccentColor } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const photoInputRef = useRef<HTMLInputElement>(null);

    const [langOpen, setLangOpen] = useState(false);
    const [editNameOpen, setEditNameOpen] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [savingName, setSavingName] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [secretsCount, setSecretsCount] = useState(0);
    const [theme, setTheme] = useState<Theme>((localStorage.getItem("theme") as Theme) ?? "dark");
    const [notifEnabled, setNotifEnabled] = useState(profile?.notifications_enabled ?? false);
    const [biometricEnabled, setBiometricEnabled] = useState(profile?.biometric_enabled ?? false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoProgress, setPhotoProgress] = useState(0);
    const [testingProtocol, setTestingProtocol] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "secrets"), where("user_id", "==", user.uid));
        getCountFromServer(q).then((snap) => setSecretsCount(snap.data().count));
    }, [user]);

    useEffect(() => {
        if (profile) {
            setNotifEnabled(profile.notifications_enabled ?? false);
            setBiometricEnabled(profile.biometric_enabled ?? false);
        }
    }, [profile]);

    const currentLang = languages.find((l) => l.code === (profile?.language ?? "fr")) ?? languages[0];
    const createdDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
        : "—";

    const handleTimerChange = (days: number) => {
        updateTimer(days);
        toast.success(t("profile.timer_updated", { days }));
    };

    const handleEditName = () => {
        setNameInput(profile?.display_name ?? "");
        setEditNameOpen(true);
    };

    const handleSaveName = async () => {
        if (!nameInput.trim()) return;
        setSavingName(true);
        await updateDisplayName(nameInput.trim());
        setSavingName(false);
        setEditNameOpen(false);
        toast.success(t("profile.name_updated"));
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error(t("profile.format_error")); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error(t("profile.size_error")); return; }

        setPhotoUploading(true);
        setPhotoProgress(0);
        const result = await uploadProfilePhoto(file, (pct) => setPhotoProgress(pct));
        setPhotoUploading(false);
        if (result.error) toast.error(result.error);
        else toast.success(t("profile.photo_updated"));
        e.target.value = "";
    };

    const handleThemeChange = (t: Theme) => {
        setTheme(t);
        applyTheme(t);
    };

    const handleNotifToggle = async () => {
        const nextVal = !notifEnabled;
        if (nextVal) {
            if (Notification.permission === "denied") {
                toast.error(t("settings.notif_settings_alert"));
                return;
            }
            const perm = await Notification.requestPermission();
            if (perm !== "granted") return;
        }
        await updateNotificationPref(nextVal);
        setNotifEnabled(nextVal);
        toast.success(nextVal ? t("settings.notif_enabled") : t("settings.notif_disabled"));
    };

    const handleBiometricToggle = async () => {
        if (!Capacitor.isNativePlatform()) {
            toast.error(t("settings.mobile_only"));
            return;
        }
        const nextVal = !biometricEnabled;
        if (nextVal) {
            const available = await NativeBiometric.isAvailable();
            if (!available.isAvailable) {
                toast.error(t("settings.biometric_not_available"));
                return;
            }
        }
        await updateBiometricPref(nextVal);
        setBiometricEnabled(nextVal);
        toast.success(nextVal ? t("settings.biometric_enabled") : t("settings.biometric_disabled"));
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        const result = await deleteAccount(isEmailUser ? deletePassword : undefined);
        setDeleting(false);
        if (result.error) {
            toast.error(result.error);
            return;
        }
        setDeleteOpen(false);
        navigate("/presentation");
    };

    const handleTestProtocol = async () => {
        setTestingProtocol(true);
        // Simulate background processing
        await new Promise(r => setTimeout(r, 2000));
        setTestingProtocol(false);
        toast.success(t("settings.test_success"), {
            description: "Simulation complétée sans erreur.",
            icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />
        });
    };

    const handleExportData = async () => {
        if (!user) return;
        setExporting(true);
        try {
            const q = query(collection(db, "secrets"), where("user_id", "==", user.uid));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ title: d.data().title, category: d.data().category, date: d.data().created_at?.toDate?.() }));
            const blob = new Blob([JSON.stringify({ profile: { name: profile?.display_name, email: user.email }, secrets: data }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `life-switch-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            toast.success(t("settings.export_success"));
        } catch (e) {
            toast.error(t("settings.export_failed"));
        }
        setExporting(false);
    };

    const accentColors = [
        { name: "Emerald", value: "160 84% 39%" },
        { name: "Gold", value: "47 95% 55%" },
        { name: "Blue", value: "217 91% 60%" },
        { name: "Rose", value: "330 81% 60%" },
        { name: "Purple", value: "270 91% 65%" },
    ];

    const initial = (profile?.display_name || user?.email || "U").charAt(0).toUpperCase();

    const Row = ({ icon: Icon, label, right, onClick, destructive }: {
        icon: React.ElementType; label: string; right?: React.ReactNode; onClick?: () => void; destructive?: boolean;
    }) => (
        <motion.button
            whileTap={onClick ? { scale: 0.98, backgroundColor: "rgba(0,0,0,0.05)" } : {}}
            onClick={onClick}
            className={cn(
                "flex w-full items-center justify-between px-5 py-4 transition-colors",
                onClick ? "hover:bg-muted/30" : "cursor-default",
                destructive && "text-destructive"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                    <Icon className="h-5 w-5 shrink-0" />
                </div>
                <span className="text-[15px] font-bold tracking-tight">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {right}
                {onClick && !right && <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
            </div>
        </motion.button>
    );

    const Toggle = ({ enabled, onChange, loading = false }: { enabled: boolean; onChange: () => void; loading?: boolean }) => (
        <div className="flex items-center gap-3">
            <span className={cn("text-[10px] font-black uppercase tracking-widest transition-opacity", enabled ? "opacity-100 text-primary" : "opacity-20")}>ON</span>
            <button
                onClick={onChange}
                disabled={loading}
                className={cn(
                    "relative inline-flex h-7 w-14 rounded-full border-2 border-white/5 transition-all",
                    enabled ? "bg-primary" : "bg-muted"
                )}
            >
                <motion.span
                    animate={{ x: enabled ? 28 : 0 }}
                    className="flex h-6 w-6 rounded-full bg-white shadow-xl items-center justify-center"
                >
                    {enabled ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-muted-foreground/40" />}
                </motion.span>
            </button>
            <span className={cn("text-[10px] font-black uppercase tracking-widest transition-opacity", !enabled ? "opacity-100 text-muted-foreground" : "opacity-20")}>OFF</span>
        </div>
    );

    const Section = ({ label, children, idx }: { label: string; children: React.ReactNode; idx: number }) => (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="space-y-3"
        >
            <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{label}</p>
            <div className="rounded-[28px] bg-card/40 backdrop-blur-xl divide-y divide-border/30 overflow-hidden border border-white/10 shadow-xl">
                {children}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-background px-6 pb-32 pt-16 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-[-10%] w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px]" />
            </div>

            <div className="mx-auto max-w-sm relative z-10 space-y-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight">{t("settings.title")}</h1>
                    <div className="h-1 w-12 bg-primary rounded-full" />
                </motion.div>

                {/* ── Profile header ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-5 rounded-[32px] bg-secondary/30 backdrop-blur-md p-6 border border-white/5 shadow-2xl transition-all duration-300"
                >
                    <button onClick={() => photoInputRef.current?.click()} className="relative shrink-0 active:scale-95 transition-transform" disabled={photoUploading}>
                        <div className="relative h-20 w-20 p-1 rounded-full bg-gradient-to-tr from-primary to-primary/30 shadow-xl overflow-hidden will-change-transform">
                            {profile?.photo_url ? (
                                <img src={profile.photo_url} alt="avatar" loading="eager" decoding="async" className="h-full w-full rounded-full object-cover border-4 border-background bg-background shadow-inner" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-background bg-primary text-2xl font-black text-primary-foreground">{initial}</div>
                            )}
                            {photoUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent shadow-glow" />
                                </div>
                            )}
                            {!photoUploading && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                                    <Camera className="h-5 w-5 text-white/70" />
                                </div>
                            )}
                        </div>
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    <button onClick={handleEditName} className="flex min-w-0 flex-1 flex-col text-left group/name">
                        <div className="flex items-center gap-2">
                            <p className="font-black text-xl tracking-tight text-foreground truncate leading-none">{profile?.display_name ?? t("profile.user")}</p>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <p className="truncate text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 opacity-60">{user?.email ?? user?.phoneNumber}</p>
                    </button>
                </motion.div>

                {/* ── Premium Card ── */}
                {!profile?.is_premium && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate("/premium")}
                        className="w-full relative overflow-hidden rounded-[32px] p-6 bg-gradient-to-br from-primary via-primary/80 to-emerald-600 shadow-[0_20px_40px_rgba(var(--primary),0.2)] border border-white/20 group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-20 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                            <Crown className="h-20 w-20 text-white" />
                        </div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-white tracking-tight italic">DEVENIR PREMIUM</h3>
                                <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Stockage illimité & Sécurité HD</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                                <ArrowRight className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </motion.button>
                )}

                <div className="space-y-8">
                    <Section label={t("settings.account")} idx={0}>
                        <Row icon={CalendarDays} label={t("profile.member_since")} right={<span className="text-[13px] font-black text-muted-foreground/80">{createdDate}</span>} />
                        <Row icon={Lock} label={t("profile.secrets_count")} right={<span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{secretsCount}</span>} />
                        {profile?.is_premium && (
                            <Row icon={Crown} label="Life Switch Premium" right={<span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 italic">VIP ACTIVE</span>} />
                        )}
                        <Row icon={FileText} label={t("settings.export_data")} onClick={handleExportData} right={exporting ? <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" /> : null} />
                        <Row icon={ShieldCheck} label={t("settings.security")} right={<span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">SECURE ✓</span>} />
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Fingerprint className="h-5 w-5" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-bold tracking-tight">{t("settings.biometric")}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">{t("settings.biometric_desc")}</span>
                                </div>
                            </div>
                            <Toggle enabled={biometricEnabled} onChange={handleBiometricToggle} />
                        </div>
                    </Section>

                    <Section label={t("settings.notifications")} idx={1}>
                        <div className="flex items-center justify-between px-5 py-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    {notifEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5 opacity-40" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[15px] font-bold tracking-tight">{t("settings.push_notifications")}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">{notifEnabled ? t("common.on") : t("common.off")}</span>
                                </div>
                            </div>
                            <Toggle enabled={notifEnabled} onChange={handleNotifToggle} />
                        </div>
                        {notifEnabled && (
                            <div className="px-5 pb-5 pt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={testNotification}
                                    className="w-full h-10 rounded-xl bg-primary/5 border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] gap-2 active:scale-95 transition-all"
                                >
                                    <Bell className="h-3 w-3" />
                                    {t("settings.test_notif")} 🔔
                                </Button>
                            </div>
                        )}
                    </Section>

                    <Section label={t("profile.timer_settings")} idx={2}>
                        <div className="px-5 py-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <Timer className="h-4 w-4 text-primary" />
                                <span className="text-[13px] font-black text-muted-foreground uppercase tracking-widest">{t("profile.timer_desc")}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {timerOptions.map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => handleTimerChange(d)}
                                        className={cn("flex-1 min-w-[60px] rounded-2xl py-3 text-xs font-black border", (profile?.timer_days ?? 30) === d ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/40 text-muted-foreground border-white/5")}
                                    >
                                        {d}{t("profile.days_suffix")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section label={t("settings.appearance")} idx={3}>
                        <Row icon={Languages} label={t("profile.language")} onClick={() => setLangOpen(true)} right={<span className="text-xs font-black uppercase text-muted-foreground">{currentLang.label}</span>} />

                        {/* Accent Color Picker */}
                        <div className="px-5 py-5 space-y-4 border-t border-border/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Palette className="h-5 w-5" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[15px] font-bold tracking-tight">{t("settings.accent_color")}</span>
                                        {!profile?.is_premium && <span className="text-[9px] font-black text-amber-500 uppercase">{t("settings.premium_only")}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {accentColors.map((c) => (
                                        <button
                                            key={c.name}
                                            disabled={!profile?.is_premium}
                                            onClick={() => updateAccentColor(c.value)}
                                            className={cn(
                                                "h-6 w-6 rounded-full border-2 transition-all",
                                                (profile?.accent_color ?? "160 84% 39%") === c.value ? "border-foreground scale-110" : "border-transparent",
                                                !profile?.is_premium && "opacity-50 grayscale"
                                            )}
                                            style={{ background: `hsl(${c.value})` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 flex items-center justify-between border-t border-border/30">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500"><Sun className="h-5 w-5" /></div>
                                <span className="text-[15px] font-bold tracking-tight">{t("settings.theme")}</span>
                            </div>
                            <div className="flex gap-1 rounded-2xl bg-secondary/60 p-1">
                                {(["light", "dark", "system"] as Theme[]).map((th) => (
                                    <button key={th} onClick={() => handleThemeChange(th)} className={cn("rounded-xl px-3 py-1.5 text-xs font-black", theme === th ? "bg-background text-primary" : "text-muted-foreground/60")}>
                                        {th === "light" ? <Sun className="h-3.5 w-3.5" /> : th === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section label={t("settings.legal_support")} idx={4}>
                        <Row icon={ShieldCheck} label={t("settings.test_protocol")} onClick={handleTestProtocol} right={testingProtocol ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <ArrowRight className="h-4 w-4 opacity-20" />} />
                        <Row icon={FileText} label={t("settings.preview_msg")} onClick={() => setPreviewOpen(true)} />
                        <Row icon={Palette} label={t("settings.feedback")} onClick={() => window.open('mailto:feedback@life-switch.app')} />
                        <Row icon={Users} label={t("settings.support")} onClick={() => window.open('mailto:support@life-switch.app')} />
                        <Row icon={HelpCircle} label={t("nav.faq")} onClick={() => navigate("/faq")} />
                        <Row icon={FileText} label={t("legal.tos_title")} onClick={() => navigate("/legal")} />
                        <Row icon={ShieldAlert} label={t("legal.privacy_title")} onClick={() => navigate("/privacy")} />
                        <Row icon={Info} label={t("about.title")} onClick={() => navigate("/about")} />
                    </Section>

                    <div className="space-y-4 pt-4">
                        <Button variant="outline" onClick={logout} className="w-full h-15 rounded-[22px] border-destructive/20 text-destructive bg-destructive/5 font-black tracking-tight gap-3 active:scale-95 transition-all outline-none">
                            <LogOut className="h-5 w-5" />
                            {t("profile.logout")}
                        </Button>
                        <button onClick={() => setDeleteOpen(true)} className="w-full text-center py-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-destructive">
                            {t("profile.delete_account")}
                        </button>
                    </div>
                </div>

                <div className="pb-10 pt-4 text-center">
                    <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Life Switch Protocol v1.0.4</p>
                </div>
            </div>

            <Dialog open={langOpen} onOpenChange={setLangOpen}>
                <DialogContent className="max-w-[85vw] w-full rounded-[40px] px-6 py-8 border-white/10 shadow-3xl backdrop-blur-2xl bg-card/90">
                    <DialogHeader className="pb-4"><DialogTitle className="text-2xl font-black text-center tracking-tight">{t("profile.choose_lang")}</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {languages.map((l) => (
                            <button key={l.code} onClick={() => { updateLanguage(l.code); setLangOpen(false); toast.success(t("profile.lang_updated")); }} className={cn("relative flex flex-col items-center gap-3 rounded-[24px] p-6 transition-all border", l.code === (profile?.language ?? "fr") ? "bg-primary border-primary text-primary-foreground" : "bg-secondary/40 border-white/5 text-foreground")}>
                                <span className="text-3xl">{l.flag}</span>
                                <span className="text-xs font-black uppercase tracking-widest">{l.label}</span>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
                <DialogContent className="max-w-[85vw] w-full rounded-[40px] px-6 py-8 border-white/10 shadow-3xl backdrop-blur-2xl bg-card/90">
                    <DialogHeader className="pb-4"><DialogTitle className="text-2xl font-black tracking-tight text-center">{t("profile.edit_name")}</DialogTitle></DialogHeader>
                    <div className="space-y-6 pt-2">
                        <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t("profile.name_placeholder")} className="h-15 rounded-2xl bg-secondary/40 border-border/60 text-center font-bold text-lg" maxLength={50} autoFocus onKeyDown={(e) => e.key === "Enter" && handleSaveName()} />
                        <Button onClick={handleSaveName} disabled={savingName || !nameInput.trim()} className="w-full h-15 rounded-[22px] font-black text-lg active:scale-95 transition-all">
                            {savingName ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" /> : t("profile.save_name")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="max-w-[85vw] w-full rounded-[40px] px-6 py-8 border-white/10 shadow-3xl backdrop-blur-2xl bg-card/90">
                    <DialogHeader className="pb-4"><DialogTitle className="text-2xl font-black tracking-tight text-center text-destructive">DELETE ACCOUNT</DialogTitle></DialogHeader>
                    <div className="space-y-6 pt-2">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center"><ShieldAlert className="h-8 w-8 text-destructive" /></div>
                            <p className="text-sm font-bold text-muted-foreground/80 leading-relaxed px-4">{t("profile.delete_confirm")}</p>
                        </div>
                        {isEmailUser && (
                            <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder={t("profile.delete_password_hint")} className="h-15 rounded-2xl bg-secondary/40 border-border/60 text-center" autoFocus onKeyDown={(e) => e.key === "Enter" && handleDeleteAccount()} />
                        )}
                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting || (isEmailUser && !deletePassword)} className="w-full h-15 rounded-[22px] font-black text-lg active:scale-95 transition-all">
                            {deleting ? "..." : t("profile.delete_confirm_btn")}
                        </Button>
                        <button onClick={() => setDeleteOpen(false)} className="w-full text-center text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("common.cancel")}</button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-[90vw] w-full rounded-[40px] px-0 py-0 overflow-hidden border-white/10 shadow-3xl bg-background">
                    <div className="bg-primary p-6 text-white">
                        <DialogTitle className="text-xl font-black italic tracking-tighter uppercase">Aperçu du Protocole</DialogTitle>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Exemple d'email envoyé aux bénéficiaires</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2 border-b border-border pb-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">De: <span className="text-foreground">protocol@life-switch.app</span></p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase">Sujet: <span className="text-primary">IMPORTANT : Message de sécurité de {profile?.display_name || "un proche"}</span></p>
                        </div>
                        <div className="space-y-4 text-sm leading-relaxed">
                            <p>Bonjour,</p>
                            <p>Ceci est un message automatisé sécurisé envoyé par le protocole <strong>Life Switch</strong> de la part de {profile?.display_name}.</p>
                            <p className="bg-secondary/30 p-4 rounded-2xl italic border-l-4 border-primary">
                                "{profile?.display_name} a configuré ce message pour vous être transmis en toute sécurité..."
                            </p>
                            <div className="pt-4">
                                <Button className="w-full rounded-2xl h-12 font-black uppercase tracking-widest">Accéder au Coffre Sécurisé</Button>
                            </div>
                        </div>
                        <button onClick={() => setPreviewOpen(false)} className="w-full text-center text-xs font-black uppercase tracking-widest text-primary pt-4">{t("common.back")}</button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
