import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import {
    ArrowLeft, Scale, ShieldCheck, FileText, Trash2, Calendar,
    CheckCircle2, Lock, UserCheck, Globe, Zap, AlertCircle, Info, ShieldAlert, Fingerprint, Mail, HardDrive, ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function LegalPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const isPrivacy = location.pathname === "/privacy";
    const lastUpdate = "10 Mars 2026";

    const Section = ({ icon: Icon, title, content, highlight, idx }: { icon: any, title: string, content: string, highlight?: boolean, idx: number }) => (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className={cn(
                "group relative overflow-hidden rounded-[28px] border border-white/5 bg-card/40 backdrop-blur-xl p-6 transition-all duration-300 hover:shadow-2xl hover:bg-card/60",
                highlight && "border-primary/20 bg-primary/5 shadow-lg shadow-primary/5"
            )}
        >
            <div className="mb-4 flex items-center gap-4">
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/50 transition-all group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary",
                    highlight && "bg-primary/20 text-primary shadow-xl"
                )}>
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-black text-foreground text-sm tracking-tight uppercase">{title}</h3>
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground/80 font-bold">
                {content}
            </p>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-background px-6 pb-32 pt-16 relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-[-10%] w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px]" />
            </div>

            <div className="mx-auto max-w-sm sm:max-w-2xl lg:max-w-5xl relative z-10 space-y-10">
                {/* Back & Title */}
                <div className="space-y-6">
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("common.back")}
                    </motion.button>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between relative"
                    >
                        <div className="flex items-center gap-5 relative">
                            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-primary/10 text-primary shadow-2xl border border-white/5 backdrop-blur-md relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
                                {isPrivacy ? <ShieldCheck className="h-10 w-10 relative z-10" /> : <ScrollText className="h-10 w-10 relative z-10" />}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h1 className="text-3xl font-black text-foreground tracking-tighter leading-none">
                                    {isPrivacy ? t("legal.privacy_title") : t("legal.tos_title")}
                                </h1>
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {t("legal_page.updated_at")}{t("legal_page.last_update_date")}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Engagement Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="group relative rounded-[36px] bg-primary/10 border border-primary/20 p-8 text-foreground shadow-[0_30px_60px_-15px_rgba(0,255,150,0.1)] overflow-hidden active:scale-[0.98] transition-all duration-500"
                >
                    <div className="absolute -top-12 -right-12 h-48 w-48 bg-primary/20 rounded-full blur-[70px] group-hover:bg-primary/40 transition-colors" />
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldAlert className="h-24 w-24 text-primary" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 backdrop-blur-md border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">{t("legal_page.sovereignty")}</p>
                        </div>
                        <p className="text-lg font-black leading-[1.3] tracking-tight text-foreground">
                            {isPrivacy
                                ? t("legal_page.privacy_engagement")
                                : t("legal_page.tos_engagement")}
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="h-[2px] w-8 bg-primary/50" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">LIFE SWITCH PROTOCOL</p>
                        </div>
                    </div>
                </motion.div>

                {/* Dynamic Content Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!isPrivacy ? (
                        <>
                            <Section
                                idx={0}
                                icon={Globe}
                                title={t("legal_page.tos_section_1_title")}
                                content={t("legal_page.tos_section_1_content")}
                            />
                            <Section
                                idx={1}
                                icon={UserCheck}
                                title={t("legal_page.tos_section_2_title")}
                                content={t("legal_page.tos_section_2_content")}
                            />
                            <Section
                                idx={2}
                                icon={Fingerprint}
                                title={t("legal_page.tos_section_3_title")}
                                highlight
                                content={t("legal_page.tos_section_3_content")}
                            />
                            <Section
                                idx={3}
                                icon={AlertCircle}
                                title={t("legal_page.tos_section_4_title")}
                                content={t("legal_page.tos_section_4_content")}
                            />
                            <Section
                                idx={4}
                                icon={HardDrive}
                                title={t("legal_page.tos_section_5_title")}
                                content={t("legal_page.tos_section_5_content")}
                            />
                            <Section
                                idx={5}
                                icon={Trash2}
                                title={t("legal_page.tos_section_6_title")}
                                content={t("legal_page.tos_section_6_content")}
                            />
                            <Section
                                idx={6}
                                icon={Scale}
                                title={t("legal_page.tos_section_7_title")}
                                content={t("legal_page.tos_section_7_content")}
                            />
                        </>
                    ) : (
                        <>
                            <Section
                                idx={0}
                                icon={Lock}
                                title={t("legal_page.privacy_section_a_title")}
                                highlight
                                content={t("legal_page.privacy_section_a_content")}
                            />
                            <Section
                                idx={1}
                                icon={Info}
                                title={t("legal_page.privacy_section_b_title")}
                                content={t("legal_page.privacy_section_b_content")}
                            />
                            <Section
                                idx={2}
                                icon={ShieldCheck}
                                title={t("legal_page.privacy_section_c_title")}
                                content={t("legal_page.privacy_section_c_content")}
                            />
                            <Section
                                idx={3}
                                icon={Globe}
                                title={t("legal_page.privacy_section_d_title")}
                                content={t("legal_page.privacy_section_d_content")}
                            />
                            <Section
                                idx={4}
                                icon={Zap}
                                title={t("legal_page.privacy_section_e_title")}
                                content={t("legal_page.privacy_section_e_content")}
                            />
                            <Section
                                idx={5}
                                icon={Mail}
                                title={t("legal_page.privacy_section_f_title")}
                                content={t("legal_page.privacy_section_f_content")}
                            />
                            <Section
                                idx={6}
                                icon={ShieldAlert}
                                title={t("legal_page.privacy_section_g_title")}
                                content={t("legal_page.privacy_section_g_content")}
                            />
                        </>
                    )}
                </div>

                {/* Security Trust Badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center justify-center py-10 text-center space-y-5"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-2xl">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600">{t("legal_page.certified")}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-widest">Protocol Version 1.0.4 • AES-256-GCM</p>
                    </div>
                </motion.div>

                {/* Support Footer */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-[36px] bg-secondary/30 p-10 text-center space-y-6 border border-white/5 backdrop-blur-md"
                >
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("legal_page.legal_questions")}</p>
                        <a href="mailto:support@life-switch.app" className="group flex flex-col items-center gap-2">
                            <span className="text-lg font-black text-foreground group-hover:text-primary transition-colors tracking-tight">support@life-switch.app</span>
                            <span className="h-1 w-12 bg-primary/20 rounded-full group-hover:w-24 transition-all duration-500" />
                        </a>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                        <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-bold uppercase tracking-tighter">
                            {t("legal_page.apple_eula_note")}
                        </p>
                        <a
                            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-black text-primary underline decoration-primary/30"
                        >
                            {t("legal_page.apple_eula_link")}
                        </a>
                    </div>
                </motion.div>

                <div className="text-center text-[9px] font-black text-muted-foreground/20 pb-20 tracking-[0.5em] uppercase">
                    Life Switch App • Secure Legacy Protection
                </div>
            </div>
        </div>
    );
}
