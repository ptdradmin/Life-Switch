import { useState } from "react";
import { Shield, Lock, Users, Clock, Heart, Eye, ChevronDown, Globe, Check, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
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
  { code: "nl", label: "Nederlands" },
  { code: "tr", label: "Türkçe" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function PresentationPage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { updateLanguage } = useAuth();
  const [langOpen, setLangOpen] = useState(false);

  const features = [
    { icon: Clock, title: t("pres.f1_title"), description: t("pres.f1_desc"), color: "emerald" },
    { icon: Lock, title: t("pres.f2_title"), description: t("pres.f2_desc"), color: "indigo" },
    { icon: Users, title: t("pres.f3_title"), description: t("pres.f3_desc"), color: "amber" },
    { icon: Eye, title: t("pres.f4_title"), description: t("pres.f4_desc"), color: "blue" },
  ];

  const steps = [
    { step: "1", title: t("pres.s1_title"), description: t("pres.s1_desc") },
    { step: "2", title: t("pres.s2_title"), description: t("pres.s2_desc") },
    { step: "3", title: t("pres.s3_title"), description: t("pres.s3_desc") },
    { step: "4", title: t("pres.s4_title"), description: t("pres.s4_desc") },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[15%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]"
        />
      </div>

      {/* Floating Language Switcher */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-6 right-6 z-50"
      >
        <button
          onClick={() => setLangOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card/60 backdrop-blur-xl shadow-xl border border-white/10 hover:border-primary/50 transition-all hover:scale-105 active:scale-95"
        >
          <Globe className="h-5 w-5 text-primary" />
        </button>
      </motion.div>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          <motion.div variants={itemVariants} className="relative inline-block">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] bg-primary shadow-[0_0_40px_rgba(var(--primary),0.3)] outline outline-8 outline-primary/5">
              <Shield className="h-12 w-12 text-primary-foreground" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 -m-3 border border-dashed border-primary/20 rounded-full"
            />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <span className="rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary border border-primary/20 backdrop-blur-md">
                {t("pres.protocol")} • {t("pres.blockchain")}
              </span>
              <h1 className="text-6xl font-black tracking-tight sm:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/40">
                Life Switch
              </h1>
            </div>
            <p className="mx-auto max-w-lg text-xl text-muted-foreground leading-relaxed font-medium">
              {t("pres.subtitle")}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="rounded-3xl h-16 px-12 text-xl font-black shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:shadow-[0_25px_60px_rgba(var(--primary),0.4)] transition-all active:scale-[0.98] w-full sm:w-auto"
            >
              {t("pres.cta")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-3xl h-16 px-12 text-lg font-bold bg-card/40 backdrop-blur-md border border-white/10 hover:bg-secondary w-full sm:w-auto"
            >
              {t("pres.discover")}
            </Button>
          </motion.div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-10 animate-bounce text-muted-foreground/50 hover:text-primary transition-colors focus:outline-none"
        >
          <ChevronDown className="h-8 w-8 text-primary" />
        </motion.button>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-32 z-10 relative">
        <div className="mx-auto max-w-xl sm:max-w-4xl lg:max-w-6xl space-y-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <p className="text-sm font-black uppercase tracking-[0.25em] text-primary drop-shadow-sm">{t("pres.features")}</p>
            <h2 className="text-4xl font-black text-foreground sm:text-5xl leading-tight italic">{t("pres.features_title")}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group flex flex-col sm:flex-row gap-6 rounded-[32px] bg-card/40 backdrop-blur-md p-8 shadow-xl border border-white/10 transition-all hover:bg-card/60 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <f.icon className="h-24 w-24" />
                </div>
                <div className={cn(
                  "flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] shadow-inner relative z-10",
                  f.color === "emerald" ? "bg-emerald-500/10 text-emerald-500" :
                    f.color === "indigo" ? "bg-indigo-500/10 text-indigo-500" :
                      f.color === "amber" ? "bg-amber-500/10 text-amber-500" :
                        "bg-blue-500/10 text-blue-500"
                )}>
                  <f.icon className="h-10 w-10 transition-transform group-hover:scale-110" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-foreground tracking-tight">{f.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground/80 font-medium">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-foreground text-background px-6 py-32 rounded-t-[64px] z-10 relative shadow-[0_-20px_100px_rgba(0,0,0,0.2)]">
        <div className="mx-auto max-w-xl sm:max-w-4xl lg:max-w-6xl space-y-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <p className="text-sm font-black uppercase tracking-[0.25em] text-primary/80">{t("pres.how")}</p>
            <h2 className="text-4xl font-black sm:text-6xl">{t("pres.how_title")}</h2>
          </motion.div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-x-24 md:gap-y-16">
            <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-background/10 sm:left-6 md:hidden" />

            {steps.map((s, idx) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-8 relative"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-black text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] z-10">
                  {s.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-2xl font-black tracking-tight">{s.title}</h3>
                  <p className="text-background/60 mt-1 font-medium text-lg leading-relaxed">{s.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Final CTA */}
      <section className="px-6 py-40 z-10 relative bg-background overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]">
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(var(--primary),0.15),transparent)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl space-y-12 text-center relative z-10"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
          >
            <Heart className="h-12 w-12 text-primary fill-primary/10" />
          </motion.div>

          <div className="space-y-6">
            <h2 className="text-4xl font-black text-foreground sm:text-6xl leading-[1.1] tracking-tighter">
              {t("pres.trust_title").split("\n").map((line, i) => <span key={i} className="block">{line}</span>)}
            </h2>
            <p className="text-xl text-muted-foreground/80 leading-relaxed font-medium mx-auto max-w-md">
              {t("pres.trust_desc")}
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="group rounded-[32px] h-20 px-16 text-2xl font-black shadow-2xl shadow-primary/40 bg-primary relative overflow-hidden active:scale-95 transition-all w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center gap-3">
                {t("pres.protect")}
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
              </span>
              <motion.div
                initial={false}
                animate={{ x: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 inset-y-0 w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-150%]"
              />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/10 px-6 py-16 text-center space-y-8 z-10 relative backdrop-blur-md">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm font-black uppercase tracking-widest text-muted-foreground/60">
          <button onClick={() => navigate("/legal")} className="hover:text-primary transition-colors">{t("legal.tos_title")}</button>
          <button onClick={() => navigate("/privacy")} className="hover:text-primary transition-colors">{t("legal.privacy_title")}</button>
          <button onClick={() => navigate("/about")} className="hover:text-primary transition-colors">{t("about.title")}</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-8 bg-border" />
            <Shield className="h-5 w-5 text-muted-foreground/30" />
            <div className="h-[1px] w-8 bg-border" />
          </div>
          <p className="text-xs font-bold text-muted-foreground/40 tracking-wider">
            {t("pres.footer", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>

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
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
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
