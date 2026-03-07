import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft, HelpCircle, ChevronDown, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FAQPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    const questions = [
        { q: t("faq.q1"), a: t("faq.a1") },
        { q: t("faq.q2"), a: t("faq.a2") },
        { q: t("faq.q3"), a: t("faq.a3") },
        { q: t("faq.q4"), a: t("faq.a4") },
        { q: t("faq.q5"), a: t("faq.a5") },
        { q: t("faq.q6"), a: t("faq.a6") },
        { q: t("faq.q7"), a: t("faq.a7") },
    ];

    return (
        <div className="min-h-screen bg-background px-6 pb-32 pt-16 relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[-10%] w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[20%] right-[-10%] w-80 h-80 bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <div className="mx-auto max-w-sm sm:max-w-2xl lg:max-w-5xl relative z-10">
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("common.back")}
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 flex items-center gap-4"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary shadow-2xl shadow-primary/20">
                        <HelpCircle className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{t("faq.title")}</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("nav.faq")}</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questions.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "rounded-[28px] border transition-all duration-300 overflow-hidden",
                                openIdx === i
                                    ? "bg-card/60 border-primary/20 shadow-xl"
                                    : "bg-card/30 border-white/5 hover:bg-card/40"
                            )}
                        >
                            <button
                                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                                className="flex w-full items-center justify-between p-5 text-left"
                            >
                                <span className="font-bold text-base leading-tight pr-4">{item.q}</span>
                                <motion.div
                                    animate={{ rotate: openIdx === i ? 180 : 0 }}
                                    className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                                        openIdx === i ? "bg-primary/10 text-primary" : "bg-secondary/50 text-muted-foreground"
                                    )}
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {openIdx === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-5 pb-5 pt-1">
                                            <div className="h-[1px] w-full bg-border/40 mb-4" />
                                            <p className="text-sm leading-relaxed text-muted-foreground/90 font-medium">
                                                {item.a}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Help Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 rounded-[32px] bg-primary p-6 text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <MessageCircle className="h-20 w-20" />
                    </div>
                    <h3 className="text-xl font-black mb-2">{t("about.contact")}</h3>
                    <p className="text-sm opacity-90 mb-6 font-medium">
                        {t("faq.specific_q")}
                    </p>
                    <button
                        onClick={() => window.location.href = "mailto:support@life-switch.app"}
                        className="bg-white text-primary px-6 py-3 rounded-2xl text-sm font-black active:scale-95 transition-all shadow-lg"
                    >
                        {t("faq.contact_support")}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
