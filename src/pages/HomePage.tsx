import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ShieldCheck, Heart, Clock, Lock, Zap, Activity, Shield, Users, CheckCircle, Crown, PenLine, Send, Sparkles, Bot, Loader2, Save, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import CryptoJS from "crypto-js";
import { HomeSkeleton } from "@/components/LoadingSkeletons";
import { cn } from "@/lib/utils";
import { askCarnet, getCarnetPrompt, type UserContext } from "@/lib/carnet";
import BiometricGuard from "@/components/BiometricGuard";

// SEL DE SÉCURITÉ STATIQUE (Ne pas changer une fois en prod !)
const AES_SALT = import.meta.env.VITE_AES_SALT || "LS_PROT_9X_!v2_Zq78";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, profile, checkIn } = useAuth();
  const { t, lang } = useTranslation();
  const [secretsCount, setSecretsCount] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diaryText, setDiaryText] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [savingDiary, setSavingDiary] = useState(false);
  const [carnetReply, setCarnetReply] = useState<string | null>(null);
  const [carnetLoading, setCarnetLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"journal" | "carnet">("journal");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "carnet"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Clé de chiffrement renforcée : UID + Sel
  const encryptionKey = (user?.uid || "fallback-key") + AES_SALT;

  const moods = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😌", label: "Peaceful" },
    { emoji: "🤔", label: "Reflective" },
    { emoji: "😔", label: "Melancholic" },
    { emoji: "✨", label: "Inspired" },
  ];

  // Security Score Calculation
  const getSecurityScore = () => {
    let score = 0;
    const checks = {
      profile: !!profile?.photo_url,
      contacts: contactsCount > 0,
      secrets: secretsCount > 0,
      timer: (profile?.timer_days ?? 30) > 0,
    };

    if (checks.profile) score += 20;
    if (checks.contacts) score += 30;
    if (checks.secrets) score += 30;
    if (checks.timer) score += 20;

    return { score, checks };
  };

  useEffect(() => {
    if (!user) return;
    const qS = query(collection(db, "secrets"), where("user_id", "==", user.uid));
    const qC = query(collection(db, "contacts"), where("user_id", "==", user.uid));

    const unsubS = onSnapshot(qS, (snap) => {
      setSecretsCount(snap.size);
      setLoading(false);
    });
    const unsubC = onSnapshot(qC, (snap) => {
      setContactsCount(snap.size);
      setLoading(false);
    });

    const timer = setTimeout(() => setLoading(false), 500);

    return () => { unsubS(); unsubC(); clearTimeout(timer); };
  }, [user]);

  const handleAskCarnet = useCallback(async () => {
    setCarnetLoading(true);
    setCarnetReply(null);
    const { score } = getSecurityScore();
    const stats = getStats();
    const ctx: UserContext = {
      name: profile?.display_name,
      email: user?.email,
      lang: lang ?? "fr",
      timerDays: profile?.timer_days,
      daysElapsed: stats.elapsed,
      lastCheckIn: profile?.last_check_in ? new Date(profile.last_check_in).toLocaleDateString() : null,
      secretsCount,
      contactsCount,
      securityScore: score,
      hasPremium: profile?.is_premium,
      hasPhoto: !!profile?.photo_url,
      mood: selectedMood,
    };
    try {
      const message = diaryText.trim() || await getCarnetPrompt(lang ?? "fr");
      const reply = await askCarnet(message, selectedMood, [], ctx);
      setCarnetReply(reply);
      if (!diaryText.trim()) {
        const prompt = await getCarnetPrompt(lang ?? "fr");
        setDiaryText(prompt + "\n\n");
      }
    } catch {
      setCarnetReply("Je suis là avec toi. Dis-moi ce que tu ressens... ✨");
    }
    setCarnetLoading(false);
  }, [diaryText, selectedMood, lang, profile, secretsCount, contactsCount, user]);

  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || carnetLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user" as const, text: userMsg }]);
    setCarnetLoading(true);
    const { score } = getSecurityScore();
    const stats = getStats();
    const ctx: UserContext = {
      name: profile?.display_name,
      email: user?.email,
      lang: lang ?? "fr",
      timerDays: profile?.timer_days,
      daysElapsed: stats.elapsed,
      lastCheckIn: profile?.last_check_in ? new Date(profile.last_check_in).toLocaleDateString() : null,
      secretsCount,
      contactsCount,
      securityScore: score,
      hasPremium: profile?.is_premium,
      hasPhoto: !!profile?.photo_url,
      mood: selectedMood,
    };
    try {
      const history = chatMessages.map(m => ({ role: m.role, text: m.text }));
      const reply = await askCarnet(userMsg, selectedMood, history, ctx);
      setChatMessages(prev => [...prev, { role: "carnet" as const, text: reply }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Chat error:", errMsg);
      setChatMessages(prev => [...prev, { role: "carnet" as const, text: `⚠️ API Error: ${errMsg}` }]);
    }
    setCarnetLoading(false);
  }, [chatInput, chatMessages, carnetLoading, selectedMood, profile, secretsCount, contactsCount, user, lang, t]);

  if (loading) return <HomeSkeleton />;

  const lastCheckDate = profile?.last_check_in
    ? new Date(profile.last_check_in).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    })
    : t("home.never");

  const getStats = () => {
    const total = profile?.timer_days ?? 30;
    if (!profile?.last_check_in) return { elapsed: 0, total, pct: 0 };
    const last = new Date(profile.last_check_in).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    const processedElapsed = Math.min(total, elapsed);
    const pct = Math.floor(((total - processedElapsed) / total) * 100);
    return { elapsed: processedElapsed, total, pct };
  };

  const { elapsed, total, pct } = getStats();

  const handlePulse = () => {
    checkIn();
    toast.success(t("home.confirmed"), {
      icon: <Activity className="h-4 w-4 text-primary" />,
      style: { borderRadius: '20px', background: 'rgba(var(--background), 0.8)', backdropFilter: 'blur(10px)' }
    });
  };

  const saveDiaryEntry = async () => {
    if (!diaryText.trim() || !user) return;
    setSavingDiary(true);
    try {
      const encryptedContent = CryptoJS.AES.encrypt(diaryText.trim(), encryptionKey).toString();
      await addDoc(collection(db, "secrets"), {
        user_id: user.uid,
        title: `Pensée ${selectedMood || ""} du ${new Date().toLocaleDateString()}`,
        content: encryptedContent,
        category: "message",
        created_at: serverTimestamp(),
        is_encrypted: true,
        mood: selectedMood
      });
      toast.success(t("diary.saved"));
      setDiaryText("");
      setSelectedMood(null);
      setCarnetReply(null);
      setDiaryOpen(false);
    } catch (e) {
      console.error("Diary save error:", e);
      toast.error("Erreur lors de la sauvegarde.");
    }
    setSavingDiary(false);
  };

  // Sauvegarde de TOUTE la conversation Carnet
  const saveCarnetSession = async (save: boolean) => {
    if (!save) {
      setChatMessages([]);
      setShowSaveConfirm(false);
      setDiaryOpen(false);
      return;
    }

    if (chatMessages.length === 0 || !user) return;
    setSavingDiary(true);
    try {
      const sessionText = chatMessages.map(m =>
        `${m.role === 'user' ? 'Utilisateur' : 'Carnet'}: ${m.text}`
      ).join('\n\n');

      const encryptedContent = CryptoJS.AES.encrypt(sessionText, encryptionKey).toString();
      await addDoc(collection(db, "secrets"), {
        user_id: user.uid,
        title: `Échange avec Carnet - ${new Date().toLocaleDateString()}`,
        content: encryptedContent,
        category: "message",
        created_at: serverTimestamp(),
        is_encrypted: true,
        mood: selectedMood || "🤖"
      });
      toast.success("Conversation sauvegardée dans votre coffre-fort 🔐");
      setChatMessages([]);
      setShowSaveConfirm(false);
      setDiaryOpen(false);
    } catch (e) {
      console.error("Carnet session save error:", e);
      toast.error("Erreur de sauvegarde.");
    }
    setSavingDiary(false);
  };

  const handleRecordAppState = async () => {
    if (!user) return;
    setCarnetLoading(true);
    try {
      const { score } = getSecurityScore();
      const stats = getStats();
      const report = `📊 RAPPORT D'ÉTAT LIFE SWITCH
Date: ${new Date().toLocaleString()}

🛡️ SÉCURITÉ
- Score Global: ${score}/100
- Profil: ${profile?.photo_url ? "Complet" : "Incomplet"}
- Identité: ${profile?.display_name || "Non définie"}

⏱️ PROTOCOLE DE VIE
- Minuteur: ${profile?.timer_days} jours
- État: ${stats.total - stats.elapsed} jours restants avant alerte
- Dernier signe de vie: ${profile?.last_check_in ? new Date(profile.last_check_in).toLocaleString() : "Jamais"}

🔐 COFFRE-FORT & RÉSEAU
- Secrets protégés: ${secretsCount}
- Proches désignés: ${contactsCount}

✨ HUMEUR
- Ressenti: ${selectedMood || "Neutre"}

Rapport généré et chiffré par Carnet.`;

      const encryptedContent = CryptoJS.AES.encrypt(report, encryptionKey).toString();
      await addDoc(collection(db, "secrets"), {
        user_id: user.uid,
        title: `Rapport Carnet ${new Date().toLocaleDateString()}`,
        content: encryptedContent,
        category: "doc",
        created_at: serverTimestamp(),
        is_encrypted: true
      });

      setChatMessages(prev => [...prev, {
        role: "carnet",
        text: t("carnet.record_done")
      }]);
      toast.success(t("carnet.record_success"));
    } catch (e) {
      toast.error(t("carnet.record_failed"));
    } finally {
      setCarnetLoading(false);
    }
  };

  const { score, checks } = getSecurityScore();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 pb-32 pt-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-20%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col gap-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black text-foreground tracking-tight leading-none">
              Salut, {profile?.display_name?.split(" ")[0] || "Explorateur"} 👋
            </h2>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("home.system_active") || "PROTOCOLE ACTIF"}</p>
            </div>
          </div>
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-card/60 backdrop-blur-xl border border-white/5 shadow-2xl"
          >
            <Shield className="h-5 w-5 text-primary" />
          </motion.div>
        </motion.div>

        {/* Status Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="rounded-[28px] bg-card/40 backdrop-blur-xl p-5 border border-white/10 shadow-xl flex flex-col gap-4 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <Heart className="h-5 w-5 fill-emerald-500/10" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">{lastCheckDate}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5">{t("home.last_life")}</p>
            </div>
          </div>

          <div className="rounded-[28px] bg-card/40 backdrop-blur-xl p-5 border border-white/10 shadow-xl flex flex-col gap-4 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">{secretsCount}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5">{t("home.secrets_prot")}</p>
            </div>
          </div>
        </motion.div>

        {/* Security Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[32px] bg-card/40 backdrop-blur-xl p-6 border border-white/10 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{t("home.security_score")}</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-lg font-black tracking-tighter leading-none italic uppercase">{score === 100 ? "OPTIMAL" : "CRITIQUE"}</p>
                </div>
              </div>
            </div>
            {profile?.is_premium && (
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
                <Crown className="h-3 w-3 text-primary" />
                <span className="text-[8px] font-black text-primary uppercase italic">PRO</span>
              </div>
            )}
            <div className="text-3xl font-black text-amber-500 italic tracking-tighter ml-auto">{score}%</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Profile", ok: checks.profile, icon: Zap, path: "/settings" },
              { label: "Secrets", ok: checks.secrets, icon: Lock, path: "/vault" },
              { label: "Contacts", ok: checks.contacts, icon: Users, path: "/contacts" },
              { label: "Timer", ok: checks.timer, icon: Clock, path: "/settings" },
            ].map((c, i) => (
              <button key={i} onClick={() => navigate(c.path)} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95 text-left", c.ok ? "bg-amber-500/5 border-amber-500/20 text-amber-500" : "bg-muted/30 border-white/5 opacity-40 hover:opacity-60")}>
                <c.icon className="h-3 w-3 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-widest">{c.label}</span>
                {c.ok && <CheckCircle className="ml-auto h-3 w-3" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Progress Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[32px] bg-secondary/30 backdrop-blur-md p-6 border border-white/5 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <Activity className="h-16 w-16 text-primary" />
          </div>

          <div className="flex items-end justify-between mb-5">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("home.presence_window") || "FENÊTRE DE PRÉSENCE"}</p>
              <p className="text-[11px] font-bold text-foreground opacity-80">
                Pulse requis d'ici <span className="text-primary font-black">{total - elapsed} {t("profile.days_suffix")}</span>
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-primary tracking-tighter leading-none">{pct}%</span>
              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">SÉCURITÉ</span>
            </div>
          </div>

          <div className="relative h-4 w-full bg-secondary/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-all duration-1000 relative",
                pct > 20 ? "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]" : "bg-destructive shadow-[0_0_15px_rgba(var(--destructive),0.6)]"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 skew-x-12 animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Pulse Interactive Area */}
        <div className="mt-4 flex flex-col items-center justify-center relative py-10">
          <AnimatePresence>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute h-72 w-72 bg-primary/20 rounded-full blur-[60px] pointer-events-none"
            />
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handlePulse}
            className="group relative flex h-60 w-60 items-center justify-center rounded-full touch-manipulation z-20"
          >
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/10 opacity-30 duration-[3000ms]" />
            <div className="absolute inset-4 rounded-full border border-primary/20 animate-[spin_10s_linear_infinite] border-dashed" />
            <div className="absolute inset-8 rounded-full border border-primary/10 animate-[spin_15s_linear_infinite_reverse]" />

            <div className="relative z-10 flex h-44 w-44 flex-col items-center justify-center rounded-full bg-primary shadow-[0_20px_60px_rgba(var(--primary),0.5)] border-4 border-white/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20" />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative flex flex-col items-center"
              >
                <Zap className="h-12 w-12 text-primary-foreground mb-2 fill-primary-foreground/20" />
                <span className="text-2xl font-black text-primary-foreground tracking-tighter uppercase">{t("home.pulse_btn") || "PULSE"}</span>
              </motion.div>

              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-[-100%] bg-white/10 blur-2xl"
              />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Floating FAB */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setDiaryOpen(true)}
        className="fixed bottom-24 right-6 z-40 h-16 w-16 rounded-full bg-primary shadow-[0_15px_35px_rgba(var(--primary),0.4)] flex items-center justify-center border-4 border-white/20 group"
      >
        <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 pointer-events-none" />
        <PenLine className="h-7 w-7 text-primary-foreground group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Dialog with 2 tabs */}
      <Dialog open={diaryOpen} onOpenChange={(o) => { if (!o) { if (chatMessages.length > 0) { setShowSaveConfirm(true); } else { setDiaryOpen(false); setActiveTab("journal"); } } else { setDiaryOpen(true); } }}>
        <DialogContent className="max-w-[92vw] w-full rounded-[40px] p-0 overflow-hidden border-none shadow-2xl bg-background">
          <BiometricGuard>
            <DialogTitle className="sr-only">Journal &amp; Carnet</DialogTitle>

            <div className="flex border-b border-white/5">
              <button
                onClick={() => setActiveTab("journal")}
                className={cn(
                  "flex-1 py-4 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                  activeTab === "journal"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                <PenLine className="h-3.5 w-3.5" />
                {t("diary.title")}
              </button>
              <button
                onClick={() => setActiveTab("carnet")}
                className={cn(
                  "flex-1 py-4 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                  activeTab === "carnet"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                Carnet ✨
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ─── JOURNAL TAB ─── */}
              {activeTab === "journal" && (
                <motion.div
                  key="journal"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-5"
                >
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t("diary.mood")}</p>
                    <div className="flex justify-between">
                      {moods.map((m) => (
                        <button
                          key={m.emoji}
                          onClick={() => setSelectedMood(m.emoji)}
                          className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center text-2xl transition-all active:scale-90",
                            selectedMood === m.emoji ? "bg-primary scale-110" : "bg-secondary/40 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                          )}
                        >
                          {m.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    value={diaryText}
                    onChange={(e) => setDiaryText(e.target.value)}
                    placeholder={t("diary.placeholder")}
                    className="min-h-[140px] rounded-3xl bg-secondary/30 border-none p-5 text-base font-medium placeholder:opacity-40 focus-visible:ring-primary/20"
                    autoFocus
                  />

                  <Button
                    onClick={saveDiaryEntry}
                    disabled={savingDiary || !diaryText.trim()}
                    className="w-full h-14 rounded-[24px] font-black italic text-lg uppercase tracking-tight gap-3"
                  >
                    {savingDiary ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <><Send className="h-5 w-5" />{t("diary.save")}</>
                    )}
                  </Button>

                  <button
                    onClick={() => setDiaryOpen(false)}
                    className="w-full text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-primary transition-colors"
                  >
                    {t("common.back")}
                  </button>
                </motion.div>
              )}

              {/* ─── CARNET CHAT TAB ─── */}
              {activeTab === "carnet" && (
                <motion.div
                  key="carnet"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col h-[480px] relative"
                >
                  <AnimatePresence>
                    {showSaveConfirm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
                      >
                        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                          <Save className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">Sauvegarder l'échange ?</h3>
                        <p className="text-sm font-medium text-muted-foreground mb-8">Voulez-vous enregistrer cette conversation dans votre coffre-fort chiffré ?</p>

                        <div className="w-full space-y-3">
                          <Button
                            onClick={() => saveCarnetSession(true)}
                            className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest gap-2"
                          >
                            <CheckCircle className="h-5 w-5" /> Oui, sécuriser
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => saveCarnetSession(false)}
                            className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground"
                          >
                            Non, supprimer
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="px-6 pt-4 pb-3 flex items-center gap-3 border-b border-white/5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black">Carnet</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Compagnon IA</p>
                    </div>
                    <div className="ml-auto">
                      {chatMessages.length > 0 && (
                        <button
                          onClick={() => setShowSaveConfirm(true)}
                          className="h-8 px-3 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20 transition-colors"
                        >
                          <XCircle className="h-3 w-3" /> Terminer
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {chatMessages.length === 0 && (() => {
                      const firstName = (profile?.display_name || user?.email?.split("@")[0] || "toi").split(" ")[0];
                      const welcome = t("carnet.welcome", { name: firstName });
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start gap-2"
                        >
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                          <div className="max-w-[80%] bg-secondary/60 rounded-3xl rounded-bl-md px-4 py-3 text-sm font-medium leading-relaxed">
                            {welcome}
                          </div>
                        </motion.div>
                      );
                    })()}
                    {chatMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                      >
                        {msg.role === "carnet" && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center mr-2 mt-1 shrink-0">
                            <Bot className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[75%] rounded-3xl px-4 py-3 text-sm font-medium leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-secondary/60 text-foreground rounded-bl-md"
                        )}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                    {carnetLoading && (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <div className="bg-secondary/60 rounded-3xl rounded-bl-md px-4 py-3 flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  {chatMessages.length > 0 && (
                    <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
                      <button
                        onClick={handleRecordAppState}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all outline-none"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {t("carnet.record_state")} 📊
                      </button>
                      <button
                        onClick={() => { setChatInput(t("carnet.save_exchange_cmd")); setTimeout(() => handleChatSend(), 100); }}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-secondary/40 border border-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all outline-none"
                      >
                        <PenLine className="h-3 w-3" />
                        {t("carnet.save_exchange")} 📓
                      </button>
                    </div>
                  )}

                  <div className="px-4 pb-5 pt-2 border-t border-white/5">
                    <div className="flex gap-2 items-end">
                      <Textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                        placeholder={t("carnet.placeholder")}
                        className="flex-1 min-h-[44px] max-h-[100px] rounded-2xl bg-secondary/40 border-none p-3 text-sm font-medium placeholder:opacity-40 focus-visible:ring-primary/20 resize-none"
                        rows={1}
                      />
                      <button
                        onClick={handleChatSend}
                        disabled={carnetLoading || !chatInput.trim()}
                        className="h-11 w-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg shrink-0 disabled:opacity-40 active:scale-90 transition-all"
                      >
                        {carnetLoading ? (
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </BiometricGuard>
        </DialogContent>
      </Dialog>
    </div>
  );
}
