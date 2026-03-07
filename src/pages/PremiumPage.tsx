import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { PurchaseService } from "@/lib/purchases";
import { Package, Offering } from "@capgo/capacitor-purchases";
import {
    Crown, Shield, Infinity, Users, Video,
    Headphones, Check, ArrowLeft, Gem, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";

export default function PremiumPage() {
    const { user, profile } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [offering, setOffering] = useState<Offering | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

    useEffect(() => {
        const loadOfferings = async () => {
            const currentOffering = await PurchaseService.getOfferings();
            setOffering(currentOffering);
            if (currentOffering?.availablePackages?.length) {
                setSelectedPackage(currentOffering.availablePackages[0]);
            }
        };
        loadOfferings();
    }, []);

    const handleSubscribe = async () => {
        // Fallback selection if none made
        const pkgToPurchase = selectedPackage || (offering?.availablePackages?.[0]) || { identifier: "web_premium" };

        if (!user) {
            toast.error(t("premium.login_required"));
            return;
        }

        setLoading(true);

        // Simuler un achat réussi sur le Web ou si c'est le package de test
        if (!Capacitor.isNativePlatform() || (pkgToPurchase as any).identifier === "web_premium") {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simuler délai
            toast.success(t("premium.test_success"));
            navigate("/settings");
            setLoading(false);
            return;
        }

        const success = await PurchaseService.purchasePackage(pkgToPurchase as Package, user.uid);
        setLoading(false);

        if (success) {
            toast.success(t("premium.welcome"));
            navigate("/settings");
        } else {
            toast.error(t("premium.payment_failed"));
        }
    };

    const features = [
        { icon: Infinity, label: t("premium.f1_title"), desc: t("premium.f1_desc") },
        { icon: Sparkles, label: t("premium.f2_title"), desc: t("premium.f2_desc") },
        { icon: Video, label: t("premium.f3_title"), desc: t("premium.f3_desc") },
        { icon: Shield, label: t("premium.f4_title"), desc: t("premium.f4_desc") },
        { icon: Headphones, label: t("premium.f5_title"), desc: t("premium.f5_desc") },
    ];

    if (profile?.is_premium) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                    <Crown className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-black mb-2">{t("premium.already_premium")}</h1>
                <p className="text-muted-foreground mb-8">{t("premium.already_premium_desc")}</p>
                <Button onClick={() => navigate("/profile")} className="rounded-2xl px-8 h-12 font-black">{t("premium.back_profile")}</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-32 pt-10 px-6 relative overflow-hidden">
            {/* Background decor */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-primary/5 blur-[100px] rounded-full" />
            </div>

            <div className="mx-auto max-w-md sm:max-w-3xl lg:max-w-5xl relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("common.back")}
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div className="space-y-8">
                        <div className="text-center md:text-left mb-10 space-y-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-emerald-600 shadow-2xl shadow-primary/20 mb-2"
                            >
                                <Crown className="h-8 w-8 text-white" />
                            </motion.div>
                            <h1 className="text-4xl font-black tracking-tighter italic">{t("premium.title")}</h1>
                            <p className="text-muted-foreground font-medium max-w-[280px] mx-auto md:mx-0 leading-tight">
                                {t("premium.subtitle")}
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-center md:text-left mb-6">{t("premium.exclusive_benefits")}</p>
                            <div className="space-y-6">
                                {features.map((f, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-4 items-start"
                                    >
                                        <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <f.icon className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black tracking-tight">{f.label}</p>
                                            <p className="text-[11px] font-medium text-muted-foreground leading-tight">{f.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Pricing Selection */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-center mb-4">{t("premium.choose_plan")}</p>

                            {offering?.availablePackages?.length ? (
                                offering.availablePackages.map((pkg) => (
                                    <button
                                        key={pkg.identifier}
                                        onClick={() => setSelectedPackage(pkg)}
                                        className={cn(
                                            "w-full p-5 rounded-[28px] border-2 transition-all flex items-center justify-between text-left relative overflow-hidden group",
                                            selectedPackage?.identifier === pkg.identifier
                                                ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                                                : "bg-card/40 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-black uppercase tracking-widest opacity-60">
                                                {pkg.product.title.split(' ')[0]}
                                            </p>
                                            <p className="text-xl font-black tracking-tight">{pkg.product.priceString}</p>
                                        </div>
                                        {selectedPackage?.identifier === pkg.identifier && (
                                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="h-3 w-3 text-white stroke-[4px]" />
                                            </div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                /* Skeleton/Fallback for non-native or no offerings */
                                <button
                                    onClick={() => setSelectedPackage({ identifier: "web_premium", product: { title: t("premium.monthly_test"), priceString: t("premium.price_monthly") } } as any)}
                                    className={cn(
                                        "w-full p-5 rounded-[28px] border-2 transition-all flex items-center justify-between text-left relative overflow-hidden group",
                                        selectedPackage?.identifier === "web_premium"
                                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                                            : "bg-card/40 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase tracking-widest opacity-60">{t("premium.monthly_test")}</p>
                                        <p className="text-xl font-black tracking-tight">{t("premium.price_monthly")}</p>
                                    </div>
                                    <div className={cn(
                                        "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                                        selectedPackage?.identifier === "web_premium" ? "bg-primary" : "bg-white/10"
                                    )}>
                                        <Check className={cn("h-3 w-3 text-white stroke-[4px]", selectedPackage?.identifier !== "web_premium" && "opacity-0")} />
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer and Button */}
                <div className="md:relative fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t md:bg-none from-background via-background/95 to-transparent pt-12 md:pt-0">
                    <div className="mx-auto max-w-sm md:max-w-none space-y-4">
                        <Button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full h-16 rounded-[24px] text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/30 group relative overflow-hidden"
                        >
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-3"
                                    >
                                        {t("premium.cta")} <Gem className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground/60 leading-tight">
                            {t("premium.footer")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
