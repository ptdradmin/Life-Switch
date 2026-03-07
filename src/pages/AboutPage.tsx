import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft, Mail, Globe, Shield, Info, ExternalLink, Heart, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AboutPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background px-6 pb-32 pt-16 relative overflow-hidden text-foreground">
            {/* Dynamic Background decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[5%] right-[-10%] h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[10%] left-[-5%] h-[250px] w-[250px] rounded-full bg-primary/5 blur-[80px]" />
            </div>

            <div className="mx-auto max-w-sm relative z-10">
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
                        <Info className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{t("about.title")}</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Version 1.0.4</p>
                    </div>
                </motion.div>

                <div className="space-y-8">
                    {/* App Hero Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-[32px] bg-card/40 backdrop-blur-xl p-8 border border-white/10 shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Shield className="h-32 w-32" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-white font-black text-2xl shadow-xl shadow-primary/30">
                                    LS
                                </div>
                                <div>
                                    <p className="font-black text-2xl tracking-tighter">Life Switch</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Protocol v1.0.4</p>
                                </div>
                            </div>
                            <p className="text-base leading-relaxed text-muted-foreground font-medium">
                                {t("about.desc")}
                            </p>
                        </div>
                    </motion.div>

                    {/* Security Excellence */}
                    <div className="space-y-4">
                        <h2 className="px-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("about.security")}</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { icon: Lock, label: t("about.encryption_label"), color: "text-emerald-500" },
                                { icon: CheckCircle2, label: t("about.gdpr_label"), color: "text-blue-500" },
                                { icon: Shield, label: t("about.zero_knowledge_label"), color: "text-primary" },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-card/30 border border-white/5 hover:bg-card/50 transition-colors"
                                >
                                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-background/50 backdrop-blur-md border border-white/5 shadow-inner", item.color)}>
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Channels */}
                    <div className="space-y-4">
                        <h2 className="px-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("about.contact")}</h2>
                        <div className="space-y-3">
                            <motion.a
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                href="mailto:support@life-switch.app"
                                className="flex items-center justify-between p-5 rounded-[24px] bg-card/40 border border-white/10 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black tracking-tight">{t("about.support_email")}</p>
                                        <p className="text-xs text-muted-foreground font-medium">support@life-switch.app</p>
                                    </div>
                                </div>
                                <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground group-hover:text-primary transition-colors" />
                            </motion.a>

                            <motion.a
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                href="https://life-switch.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-5 rounded-[24px] bg-card/40 border border-white/10 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black tracking-tight">{t("about.website")}</p>
                                        <p className="text-xs text-muted-foreground font-medium">life-switch.app</p>
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </motion.a>
                        </div>
                    </div>

                    {/* Quick Support Links */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => navigate("/legal")} className="p-4 rounded-2xl bg-card/20 border border-white/5 text-center hover:bg-card/40 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("legal.tos_title")}</span>
                        </button>
                        <button onClick={() => navigate("/faq")} className="p-4 rounded-2xl bg-card/20 border border-white/5 text-center hover:bg-card/40 transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("profile.faq")}</span>
                        </button>
                    </div>

                    {/* Heart Banner */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="py-10 text-center space-y-4"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-[1px] w-8 bg-border/40" />
                            <Heart className="h-6 w-6 text-primary fill-primary/20 animate-pulse" />
                            <div className="h-[1px] w-8 bg-border/40" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 leading-relaxed">
                            {t("about.secure_legacy", { year: new Date().getFullYear().toString() })}
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
