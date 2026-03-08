import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { ShieldCheck, Heart, Clock, Lock, Zap, Activity, Shield, Users, CheckCircle, Crown, PenLine, Send, Sparkles, Bot, Loader2, Save, XCircle, Flame, Star, Trophy } from "lucide-react";
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
import { askCarnet, getCarnetPrompt, generatePersonalizedQuest, type UserContext, type Quest } from "@/lib/carnet";
import BiometricGuard from "@/components/BiometricGuard";

// SEL DE SÉCURITÉ STATIQUE (Ne pas changer une fois en prod !)
const AES_SALT = import.meta.env.VITE_AES_SALT || "LS_PROT_9X_!v2_Zq78";

// ─── SOUND ENGINE (Web Audio API, no files needed) ───
const Sound = {
  ctx: null as AudioContext | null,
  get(): AudioContext {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return this.ctx;
  },
  play(freq: number, type: OscillatorType, duration: number, volume = 0.15, delay = 0) {
    try {
      const ctx = this.get();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch { /* ignore on unsupported browsers */ }
  },
  click() { this.play(600, "sine", 0.06, 0.08); },
  xp() {
    this.play(523, "sine", 0.1, 0.12);       // C5
    this.play(659, "sine", 0.1, 0.12, 0.1);  // E5
    this.play(784, "sine", 0.15, 0.18, 0.2); // G5
  },
  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => this.play(f, "sine", 0.25, 0.2, i * 0.12));
  },
  pulse() { this.play(220, "sine", 0.3, 0.1); this.play(330, "sine", 0.2, 0.08, 0.15); },
};

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
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "carnet"; text: string }[]>(() => {
    try {
      const saved = localStorage.getItem(`carnet_history_${user?.uid || 'anon'}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [chatInput, setChatInput] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [quickAddContact, setQuickAddContact] = useState<{ name: string; email: string } | null>(null);

  // Clé de chiffrement renforcée : UID + Sel
  const encryptionKey = (user?.uid || "fallback-key") + AES_SALT;

  // ─── GAMIFICATION ───
  const LEVELS = [
    { min: 0, emoji: "🌱", color: "#6B7280" },
    { min: 100, emoji: "📝", color: "#3B82F6" },
    { min: 300, emoji: "🛡️", color: "#8B5CF6" },
    { min: 700, emoji: "✨", color: "#F59E0B" },
    { min: 1500, emoji: "👑", color: "#10B981" },
  ];

  const getLevel = (xp: number) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i };
    }
    return { ...LEVELS[0], index: 0 };
  };

  const getNextLevel = (xp: number) => {
    const currentIndex = getLevel(xp).index;
    return currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
  };

  const [journalXP, setJournalXP] = useState<number>(() => {
    const uid = user?.uid || 'anon';
    return parseInt(localStorage.getItem(`journal_xp_${uid}`) || '0', 10);
  });
  const [journalStreak, setJournalStreak] = useState<number>(() => {
    const uid = user?.uid || 'anon';
    return parseInt(localStorage.getItem(`journal_streak_${uid}`) || '0', 10);
  });
  const [lastEntryDate, setLastEntryDate] = useState<string>(() => {
    const uid = user?.uid || 'anon';
    return localStorage.getItem(`journal_last_date_${uid}`) || '';
  });
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);

  const [todayMission, setTodayMission] = useState<Quest>(() => {
    const uid = user?.uid || 'anon';
    try {
      const saved = localStorage.getItem(`journal_mission_${uid}`);
      if (saved) return JSON.parse(saved);
    } catch { /* fallback */ }
    return { icon: "🌱", text: t("gamification.welcome_mission"), xpBonus: 20 };
  });

  // ─── LANGUAGE SYNC FOR QUESTS ───
  // Ensure the quest is always in the user's language
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const savedLang = localStorage.getItem(`journal_mission_lang_${uid}`);

    // Small delay to ensure translations and profile are ready
    const timer = setTimeout(() => {
      if (savedLang !== lang) {
        refreshQuest();
        localStorage.setItem(`journal_mission_lang_${uid}`, lang || "fr");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [lang, user]);

  const wordCount = diaryText.trim() ? diaryText.trim().split(/\s+/).length : 0;
  const wordGoal = 50;

  const greetingKey = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    if (timeInMinutes >= 1350) return "home.greeting_night"; // 22:30+
    if (hour < 5) return "home.greeting_night"; // 00:00 - 04:59
    if (hour < 12) return "home.greeting_morning";
    if (hour < 18) return "home.greeting_afternoon";
    return "home.greeting_evening";
  }, []);

  const moods = [
    { emoji: "😊", label: t("home.mood_happy") },
    { emoji: "😌", label: t("home.mood_peaceful") },
    { emoji: "🤔", label: t("home.mood_reflective") },
    { emoji: "😔", label: t("home.mood_melancholic") },
    { emoji: "✨", label: t("home.mood_inspired") },
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

  // Persist Carnet history to localStorage
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`carnet_history_${user.uid}`, JSON.stringify(chatMessages));
    } catch { /* ignore */ }
  }, [chatMessages, user]);

  // Periodic refresh logic could go here if needed

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
      const reply = await askCarnet(message, selectedMood, chatMessages, ctx);
      setCarnetReply(reply);
      if (!diaryText.trim()) {
        const prompt = await getCarnetPrompt(lang ?? "fr");
        setDiaryText(prompt + "\n\n");
      }
    } catch {
      setCarnetReply(t("carnet.fallback_reply"));
    }
    setCarnetLoading(false);
  }, [diaryText, selectedMood, lang, profile, secretsCount, contactsCount, user]);

  const refreshQuest = async () => {
    if (!user) return;
    setCarnetLoading(true);
    try {
      const { score } = getSecurityScore();
      const stats = getStats();
      const ctx: UserContext = {
        name: profile?.display_name,
        email: user?.email,
        lang: lang ?? "fr",
        timerDays: profile?.timer_days,
        daysElapsed: stats.elapsed,
        lastCheckIn: profile?.last_check_in ? new Date(profile.last_check_in).toLocaleDateString(lang ?? "fr") : null,
        secretsCount,
        contactsCount,
        securityScore: score,
        hasPremium: profile?.is_premium,
        hasPhoto: !!profile?.photo_url,
        mood: selectedMood,
      };

      const newQuest = await generatePersonalizedQuest(ctx, chatMessages, lang ?? "fr");
      setTodayMission(newQuest);
      localStorage.setItem(`journal_mission_${user.uid}`, JSON.stringify(newQuest));
      toast.success(t("gamification.mission_generated"));
      Sound.xp();
    } catch {
      toast.error(t("gamification.mission_error"));
    }
    setCarnetLoading(false);
  };

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

      // Detect if Carnet proposes a Quest
      const questMatch = reply.match(/\[QUEST:\s*([^|]+)\s*\|\s*([^\]]+)\]/);
      if (questMatch && !todayMission.text.includes(questMatch[2])) {
        const newQuest: Quest = {
          icon: questMatch[1].trim(),
          text: questMatch[2].trim(),
          xpBonus: 20
        };
        setTodayMission(newQuest);
        localStorage.setItem(`journal_mission_${user.uid}`, JSON.stringify(newQuest));
        toast(t("gamification.new_quest_toast"), {
          description: newQuest.text,
          icon: "✨",
        });
      }
      // Detect if Carnet suggests adding a contact/beneficiary
      const lowerReply = reply.toLowerCase();
      if ((lowerReply.includes("bénéficiaire") || lowerReply.includes("beneficiar") || lowerReply.includes("proche") || lowerReply.includes("contact")) &&
        (lowerReply.includes("ajouter") || lowerReply.includes("add") || lowerReply.includes("créer") || lowerReply.includes("ajout"))) {
        setQuickAddContact({ name: "", email: "" });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Chat error:", errMsg);
      setChatMessages(prev => [...prev, { role: "carnet" as const, text: t("carnet.api_error", { error: errMsg }) }]);
    }
    setCarnetLoading(false);
  }, [chatInput, chatMessages, carnetLoading, selectedMood, profile, secretsCount, contactsCount, user, lang, t]);

  if (loading) return <HomeSkeleton />;

  const lastCheckDate = profile?.last_check_in
    ? new Date(profile.last_check_in).toLocaleDateString(lang ?? "fr", {
      day: "numeric",
      month: "long",
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
    Sound.pulse();
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
        title: t("diary.thought_title", { mood: selectedMood || "", date: new Date().toLocaleDateString() }),
        content: encryptedContent,
        category: "message",
        created_at: serverTimestamp(),
        is_encrypted: true,
        mood: selectedMood
      });

      // ─── GAMIFICATION: XP + STREAK ───
      const uid = user.uid;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      // Calculate XP earned
      let earned = 10; // base
      if (wordCount >= 50) earned += 20;
      else if (wordCount >= 20) earned += 10;
      if (selectedMood) earned += 5;
      earned += todayMission.xpBonus; // mission bonus always awarded

      // Update streak
      let newStreak = journalStreak;
      if (lastEntryDate === yesterday) {
        newStreak = journalStreak + 1;
      } else if (lastEntryDate !== today) {
        newStreak = 1;
      }
      if (newStreak > journalStreak) earned += newStreak * 2; // streak bonus

      const newXP = journalXP + earned;
      setJournalXP(newXP);
      setJournalStreak(newStreak);
      setLastEntryDate(today);
      localStorage.setItem(`journal_xp_${uid}`, String(newXP));
      localStorage.setItem(`journal_streak_${uid}`, String(newStreak));
      localStorage.setItem(`journal_last_date_${uid}`, today);

      setXpAnimation(earned);
      setTimeout(() => setXpAnimation(null), 2500);

      // Play sound: level up if new level reached, otherwise XP coins
      const oldLevel = getLevel(journalXP).index;
      const newLevel = getLevel(newXP).index;
      if (newLevel > oldLevel) { Sound.levelUp(); } else { Sound.xp(); }

      toast.success(`✅ ${t("diary.saved")} — +${earned} XP ⭐ ${newStreak > 1 ? `🔥 Streak x${newStreak}` : ''}`, {
        style: { borderRadius: '20px' }
      });
      setDiaryText("");
      setSelectedMood(null);
      setCarnetReply(null);
      setDiaryOpen(false);

      // ─── CHAINED QUESTS: One finished, another appears ───
      setTimeout(() => {
        refreshQuest();
      }, 1000);
    } catch (e) {
      console.error("Diary save error:", e);
      toast.error(t("diary.save_error"));
    }
    setSavingDiary(false);
  };

  // Sauvegarde de TOUTE la conversation Carnet
  const saveCarnetSession = async (save: boolean) => {
    if (!save) {
      setChatMessages([]);
      setShowSaveConfirm(false);
      setDiaryOpen(false);
      if (user) localStorage.removeItem(`carnet_history_${user.uid}`);
      return;
    }

    if (chatMessages.length === 0 || !user) return;
    setSavingDiary(true);
    try {
      const sessionText = chatMessages.map(m =>
        `${m.role === 'user' ? t("carnet.user_label") : t("carnet.bot_label")}: ${m.text}`
      ).join('\n\n');

      const encryptedContent = CryptoJS.AES.encrypt(sessionText, encryptionKey).toString();
      await addDoc(collection(db, "secrets"), {
        user_id: user.uid,
        title: t("carnet.session_title", { date: new Date().toLocaleDateString() }),
        content: encryptedContent,
        category: "message",
        created_at: serverTimestamp(),
        is_encrypted: true,
        mood: selectedMood || "🤖"
      });
      toast.success(t("carnet.session_saved"));
      setChatMessages([]);
      if (user) localStorage.removeItem(`carnet_history_${user.uid}`);
      setShowSaveConfirm(false);
      setDiaryOpen(false);
    } catch (e) {
      console.error("Carnet session save error:", e);
      toast.error(t("carnet.save_error"));
    }
    setSavingDiary(false);
  };

  const handleRecordAppState = async () => {
    if (!user) return;
    setCarnetLoading(true);
    try {
      const { score } = getSecurityScore();
      const stats = getStats();
      const report = `${t("carnet.report_title")}
${t("carnet.report_date", { date: new Date().toLocaleString() })}

${t("carnet.report_security")}
${t("carnet.report_score", { score })}
${t("carnet.report_profile", { status: profile?.photo_url ? t("carnet.profile_complete") : t("carnet.profile_incomplete") })}
${t("carnet.report_identity", { name: profile?.display_name || t("carnet.neutral") })}

${t("carnet.report_protocol")}
${t("carnet.report_timer", { days: profile?.timer_days })}
${t("carnet.report_status", { days: total - elapsed })}
${t("carnet.report_last_sign", { date: profile?.last_check_in ? new Date(profile.last_check_in).toLocaleString() : t("carnet.never") })}

${t("carnet.report_vault")}
${t("carnet.report_secrets", { count: secretsCount })}
${t("carnet.report_contacts", { count: contactsCount })}

${t("carnet.report_mood_title")}
${t("carnet.report_mood_value", { mood: selectedMood || t("carnet.neutral") })}

${t("carnet.report_footer")}`;

      const encryptedContent = CryptoJS.AES.encrypt(report, encryptionKey).toString();
      await addDoc(collection(db, "secrets"), {
        user_id: user.uid,
        title: `${t("carnet.report_prefix")} ${new Date().toLocaleDateString()}`,
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

      <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-6xl relative z-10 flex flex-col gap-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black text-foreground tracking-tight leading-loose pt-4">
              {t(greetingKey, { name: profile?.display_name?.split(" ")[0] || t("home.explorer") })}
            </h2>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("home.system_active")}</p>
            </div>
          </div>
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-card/60 backdrop-blur-xl border border-white/5 shadow-2xl"
          >
            <Shield className="h-5 w-5 text-primary" />
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Heart Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-[32px] bg-card/40 backdrop-blur-xl p-8 border border-white/10 shadow-xl flex flex-col justify-between gap-6 group hover:border-primary/20 transition-all"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
              <Heart className="h-7 w-7 fill-emerald-500/10" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight mb-1">{lastCheckDate}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 italic">{t("home.last_life")}</p>
            </div>
          </motion.div>

          {/* Secrets Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="rounded-[32px] bg-card/40 backdrop-blur-xl p-8 border border-white/10 shadow-xl flex flex-col justify-between gap-6 group hover:border-primary/20 transition-all"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight mb-1">{secretsCount}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 italic">{t("home.secrets_prot")}</p>
            </div>
          </motion.div>

          {/* Progress Timeline Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-[32px] bg-secondary/30 backdrop-blur-md p-8 border border-white/5 shadow-2xl relative overflow-hidden group flex flex-col justify-center lg:col-span-1 md:col-span-2"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
              <Activity className="h-20 w-20 text-primary" />
            </div>

            <div className="flex items-end justify-between mb-6">
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">{t("home.presence_window")}</p>
                <p className="text-sm font-bold text-foreground opacity-90 leading-tight">
                  {t("home.pulse_required")} <br /><span className="text-primary font-black text-lg">{total - elapsed} {t("profile.days_suffix")}</span>
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black text-primary tracking-tighter leading-none italic">{pct}%</span>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t("home.security_badge")}</span>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Security Health Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[40px] bg-card/60 backdrop-blur-2xl p-8 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden h-full group"
          >
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-amber-500/5 rounded-full blur-[80px]" />

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-[22px] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-500/5">
                  <ShieldCheck className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-none mb-2">{t("home.security_score")}</p>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-3xl font-black tracking-tighter leading-none italic uppercase">
                      {score >= 90 ? t("home.optimal") : score >= 60 ? t("home.stable") : t("home.critical")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-5xl font-black text-amber-500 italic tracking-tighter ml-auto drop-shadow-2xl">{score}%</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { labelKey: "home.sec_profile_title", ok: checks.profile, icon: Zap, path: "/settings", desc: t("home.sec_profile_desc") },
                { labelKey: "home.sec_secrets_title", ok: checks.secrets, icon: Lock, path: "/vault", desc: t("home.sec_secrets_desc") },
                { labelKey: "home.sec_contacts_title", ok: checks.contacts, icon: Users, path: "/contacts", desc: t("home.sec_contacts_desc") },
                { labelKey: "home.sec_timer_title", ok: checks.timer, icon: Clock, path: "/settings", desc: t("home.sec_timer_desc") },
              ].map((c, i) => (
                <button
                  key={i}
                  onClick={() => navigate(c.path)}
                  className={cn(
                    "flex flex-col gap-3 p-5 rounded-[24px] border transition-all active:scale-[0.98] text-left relative overflow-hidden group/btn",
                    c.ok
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500"
                      : "bg-muted/20 border-white/5 opacity-50 hover:opacity-100 hover:bg-card/40"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <c.icon className={cn("h-5 w-5", c.ok ? "text-emerald-500" : "text-muted-foreground")} />
                    {c.ok && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest block">{t(c.labelKey)}</span>
                    <span className="text-[9px] font-medium opacity-60 tracking-tight">{c.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Pulse Interactive Area */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center justify-center relative py-12 bg-card/20 rounded-[40px] border border-white/5 backdrop-blur-sm self-stretch"
          >
            <AnimatePresence>
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.1, 0.25, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute h-80 w-80 bg-primary/20 rounded-full blur-[80px] pointer-events-none"
              />
            </AnimatePresence>

            <div className="text-center mb-8 relative z-10">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-1">{t("home.confirm_presence")}</p>
              <h3 className="text-xl font-black tracking-tighter italic uppercase text-foreground/80">{t("home.vitality_active")}</h3>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={handlePulse}
              className="group relative flex h-64 w-64 items-center justify-center rounded-full touch-manipulation z-20"
            >
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/10 opacity-30 duration-[3000ms]" />
              <div className="absolute inset-4 rounded-full border border-primary/30 animate-[spin_10s_linear_infinite] border-dashed" />
              <div className="absolute inset-8 rounded-full border border-primary/20 animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-transparent blur-3xl opacity-0 group-hover:opacity-40 transition-opacity" />

              <div className="relative z-10 flex h-48 w-48 flex-col items-center justify-center rounded-full bg-primary shadow-[0_25px_80px_-10px_rgba(var(--primary),0.6)] border-4 border-white/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/30" />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex flex-col items-center"
                >
                  <Zap className="h-14 w-14 text-primary-foreground mb-3 fill-primary-foreground/20" />
                  <span className="text-3xl font-black text-primary-foreground tracking-tighter italic uppercase">{t("home.pulse_btn")}</span>
                </motion.div>

                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-[-150%] bg-white/10 blur-3xl"
                />
              </div>
            </motion.button>

            <div className="mt-8 flex items-center gap-3 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
              <Activity className="h-3 w-3" />
              {t("home.pulse_valid")}
            </div>
          </motion.div>
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
        <DialogContent className="max-w-[92vw] sm:max-w-2xl w-full rounded-[40px] p-0 overflow-hidden border-none shadow-2xl bg-background">
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
                {t("carnet.title_nav")}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ─── JOURNAL TAB ─── */}
              {activeTab === "journal" && (() => {
                const level = getLevel(journalXP);
                const nextLevel = getNextLevel(journalXP);
                const xpForNextLevel = nextLevel ? nextLevel.min - level.min : 0;
                const xpInCurrentLevel = nextLevel ? journalXP - level.min : 1;
                const levelPct = nextLevel ? Math.min(100, Math.floor((xpInCurrentLevel / xpForNextLevel) * 100)) : 100;

                return (
                  <motion.div
                    key="journal"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-5 space-y-4 relative"
                  >
                    {/* XP Float Animation */}
                    <AnimatePresence>
                      {xpAnimation !== null && (
                        <motion.div
                          initial={{ opacity: 1, y: 0, scale: 1 }}
                          animate={{ opacity: 0, y: -60, scale: 1.5 }}
                          exit={{ opacity: 0 }}
                          className="absolute top-4 right-4 z-50 text-2xl font-black text-primary pointer-events-none"
                        >
                          +{xpAnimation} ⭐
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ─── STATS BAR ─── */}
                    <div className="flex items-center gap-3 bg-secondary/30 rounded-2xl p-3">
                      {/* Level Badge */}
                      <div className="flex flex-col items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
                        <span className="text-xl leading-none">{level.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {t("gamification.level_label")} {t(`gamification.level_${level.index}`)}
                          </span>
                          <span className="text-[10px] font-black text-muted-foreground">{journalXP} XP</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/60 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${levelPct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                        {nextLevel && (
                          <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                            {t("gamification.next_level_desc", {
                              emoji: nextLevel.emoji,
                              label: t(`gamification.level_${level.index + 1}`),
                              xp: nextLevel.min - journalXP
                            })}
                          </p>
                        )}
                      </div>
                      {/* Streak */}
                      <div className="flex flex-col items-center bg-primary/10 border border-primary/20 rounded-2xl px-3 py-2 shrink-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Flame className="h-3 w-3 text-primary fill-primary/20" />
                          <span className="text-lg font-black text-primary leading-none italic">{journalStreak}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{t("gamification.streak_label")}</span>
                      </div>
                    </div>

                    {/* ─── DAILY MISSION ─── */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t("gamification.mission_title")}</span>
                        <span className="ml-auto text-[10px] font-black text-primary/60">{t("gamification.mission_bonus", { xp: todayMission.xpBonus })}</span>
                        <button
                          onClick={refreshQuest}
                          disabled={carnetLoading}
                          className="p-1 hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-30"
                          title={t("gamification.mission_refresh")}
                        >
                          <Sparkles className={cn("h-3 w-3 text-primary", carnetLoading && "animate-spin")} />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-foreground/80">{todayMission.icon} {todayMission.text}</p>
                      <button
                        onClick={() => setDiaryText(prev => prev ? prev : todayMission.text + "\n\n")}
                        className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                      >
                        {t("gamification.mission_use")}
                      </button>
                    </div>

                    {/* ─── MOOD ─── */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t("diary.mood")}</p>
                      <div className="flex justify-between">
                        {moods.map((m) => (
                          <button
                            key={m.emoji}
                            onClick={() => { setSelectedMood(m.emoji); Sound.click(); }}
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

                    {/* ─── TEXTAREA + WORD COUNT ─── */}
                    <div className="relative">
                      <Textarea
                        value={diaryText}
                        onChange={(e) => setDiaryText(e.target.value)}
                        placeholder={t("diary.placeholder")}
                        className="min-h-[120px] rounded-3xl bg-secondary/30 border-none p-5 text-base font-medium placeholder:opacity-40 focus-visible:ring-primary/20"
                        autoFocus
                      />
                      {/* Word goal bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${Math.min(100, (wordCount / wordGoal) * 100)}%` }}
                            className={cn(
                              "h-full rounded-full transition-all",
                              wordCount >= wordGoal ? "bg-emerald-500" : "bg-primary/60"
                            )}
                          />
                        </div>
                        <span className={cn(
                          "text-[10px] font-black shrink-0",
                          wordCount >= wordGoal ? "text-emerald-500" : "text-muted-foreground/50"
                        )}>
                          {t("gamification.words_goal", { count: wordCount, goal: wordGoal })} {wordCount >= wordGoal ? "✓ +20 XP" : ""}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={saveDiaryEntry}
                      disabled={savingDiary || !diaryText.trim()}
                      className="w-full h-14 rounded-[24px] font-black italic text-lg uppercase tracking-tight gap-3"
                    >
                      {savingDiary ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <><Send className="h-5 w-5" />{t("diary.save")} — Gagner XP ⭐</>
                      )}
                    </Button>

                    <button
                      onClick={() => setDiaryOpen(false)}
                      className="w-full text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-primary transition-colors"
                    >
                      {t("common.back")}
                    </button>
                  </motion.div>
                );
              })()}

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
                        <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">{t("carnet.save_confirm_title")}</h3>
                        <p className="text-sm font-medium text-muted-foreground mb-8">{t("carnet.save_confirm_desc")}</p>

                        <div className="w-full space-y-3">
                          <Button
                            onClick={() => saveCarnetSession(true)}
                            className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest gap-2"
                          >
                            <CheckCircle className="h-5 w-5" /> {t("carnet.save_confirm_yes")}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => saveCarnetSession(false)}
                            className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground"
                          >
                            {t("carnet.save_confirm_no")}
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
                      <p className="text-sm font-black">{t("carnet.title_nav")}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">{t("carnet.companion")}</p>
                    </div>
                    <div className="ml-auto">
                      {chatMessages.length > 0 && (
                        <button
                          onClick={() => setShowSaveConfirm(true)}
                          className="h-8 px-3 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/20 transition-colors"
                        >
                          <XCircle className="h-3 w-3" /> {t("carnet.finish")}
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
                          {msg.text.split(/(\*\*[^*]+\*\*|\n)/g).map((part, j) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <span key={j} className="font-black text-primary">{part.slice(2, -2)}</span>;
                            }
                            if (part === "\n") return <br key={j} />;
                            return part;
                          })}
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

                    {/* Quick Add Contact Card */}
                    {quickAddContact !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start gap-2"
                      >
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center mr-2 mt-1 shrink-0">
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <div className="max-w-[85%] bg-primary/10 border border-primary/20 rounded-3xl rounded-bl-md px-4 py-3 space-y-2">
                          <p className="text-[11px] font-black text-primary uppercase tracking-widest">➕ {t("contacts.add_contact")}</p>
                          <input
                            type="text"
                            placeholder={t("contacts.name")}
                            value={quickAddContact.name}
                            onChange={e => setQuickAddContact(q => q ? { ...q, name: e.target.value } : null)}
                            className="w-full text-sm rounded-xl bg-secondary/50 border-none px-3 py-2 font-medium placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                          <input
                            type="email"
                            placeholder={t("contacts.email")}
                            value={quickAddContact.email}
                            onChange={e => setQuickAddContact(q => q ? { ...q, email: e.target.value } : null)}
                            className="w-full text-sm rounded-xl bg-secondary/50 border-none px-3 py-2 font-medium placeholder:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={async () => {
                                if (!quickAddContact.name || !quickAddContact.email || !user) return;
                                try {
                                  await addDoc(collection(db, "contacts"), {
                                    user_id: user.uid,
                                    name: quickAddContact.name,
                                    email: quickAddContact.email,
                                    phone: null,
                                    relationship: null,
                                    created_at: serverTimestamp()
                                  });
                                  toast.success(t("contacts.added"));
                                  setChatMessages(prev => [...prev, { role: "carnet" as const, text: `✅ ${quickAddContact.name} a bien été ajouté(e) comme proche !` }]);
                                  setQuickAddContact(null);
                                } catch {
                                  toast.error("Erreur lors de l'ajout.");
                                }
                              }}
                              className="flex-1 h-8 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                              {t("contacts.add")} ✓
                            </button>
                            <button
                              onClick={() => setQuickAddContact(null)}
                              className="h-8 px-3 rounded-xl bg-secondary/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest active:scale-95"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </motion.div>
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
