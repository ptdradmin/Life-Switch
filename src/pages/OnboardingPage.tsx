import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Users, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
    {
        icon: Shield,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        titleKey: "onboarding.s1_title",
        descKey: "onboarding.s1_desc",
    },
    {
        icon: Lock,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        titleKey: "onboarding.s2_title",
        descKey: "onboarding.s2_desc",
    },
    {
        icon: Users,
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        titleKey: "onboarding.s3_title",
        descKey: "onboarding.s3_desc",
    },
    {
        icon: CheckCircle,
        color: "text-primary",
        bg: "bg-primary/10",
        titleKey: "onboarding.s4_title",
        descKey: "onboarding.s4_desc",
    },
];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { markOnboardingComplete } = useAuth();
    const slide = slides[step];
    const Icon = slide.icon;
    const isLast = step === slides.length - 1;

    const finish = async () => {
        await markOnboardingComplete();
        navigate("/");
    };

    const next = () => {
        if (isLast) {
            finish();
        } else {
            setStep(s => s + 1);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-between bg-background px-8 py-20 text-center relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className={cn("absolute inset-x-0 top-0 h-96 blur-[120px] transition-colors duration-1000", slide.bg)} />
            </div>

            {/* Progress dots */}
            <div className="z-10 flex gap-2 pt-4">
                {slides.map((_, i) => (
                    <motion.div
                        key={i}
                        transition={{ duration: 0.5 }}
                        animate={{ width: i === step ? 32 : 6, backgroundColor: i === step ? "var(--primary)" : "rgba(var(--muted), 1)" }}
                        className="h-1.5 rounded-full bg-muted shadow-sm"
                    />
                ))}
            </div>

            {/* Content with Animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="z-10 flex flex-col items-center gap-8 max-w-sm"
                >
                    <div className={cn("flex h-32 w-32 items-center justify-center rounded-[40px] shadow-2xl transition-all duration-500", slide.bg)}>
                        <Icon className={cn("h-16 w-16 transition-colors duration-500", slide.color)} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black tracking-tighter leading-none uppercase italic">{t(slide.titleKey)}</h2>
                        <p className="text-lg font-bold leading-relaxed text-muted-foreground opacity-80">{t(slide.descKey)}</p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="z-10 w-full max-w-sm space-y-4">
                <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
                    <Button onClick={next} className="h-16 w-full rounded-[24px] text-lg font-black uppercase tracking-tighter shadow-glow">
                        {isLast ? t("onboarding.start") : t("onboarding.next")}
                        {!isLast && <ChevronRight className="ml-2 h-6 w-6" />}
                    </Button>
                </motion.div>
                {!isLast && (
                    <button
                        onClick={finish}
                        className="w-full py-2 text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 hover:text-primary transition-colors"
                    >
                        {t("onboarding.skip")}
                    </button>
                )}
            </div>
        </div>
    );
}
