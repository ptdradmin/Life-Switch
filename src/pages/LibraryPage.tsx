import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Shield, Lock, Users, FileText, ChevronRight, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LibrarySkeleton } from "@/components/LoadingSkeletons";
import { cn } from "@/lib/utils";

export default function LibraryPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        secrets: 0,
        contacts: 0,
        files: 0
    });

    useEffect(() => {
        if (!user) return;

        const qSecrets = query(collection(db, "secrets"), where("user_id", "==", user.uid));
        const qContacts = query(collection(db, "contacts"), where("user_id", "==", user.uid));

        const unsubSecrets = onSnapshot(qSecrets, (snap) => {
            setStats(prev => ({ ...prev, secrets: snap.size }));
            setLoading(false);
        });

        const unsubContacts = onSnapshot(qContacts, (snap) => {
            setStats(prev => ({ ...prev, contacts: snap.size }));
            setLoading(false);
        });

        return () => {
            unsubSecrets();
            unsubContacts();
        };
    }, [user]);

    const items = [
        {
            id: "secrets",
            title: t("nav.vault"),
            count: stats.secrets,
            sub: t("library.total_secrets"),
            icon: Lock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            path: "/vault"
        },
        {
            id: "contacts",
            title: t("nav.contacts"),
            count: stats.contacts,
            sub: t("library.total_contacts"),
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            path: "/contacts"
        },
        {
            id: "files",
            title: t("library.photos"),
            count: stats.files,
            sub: t("library.total_files"),
            icon: FileText,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            path: "/vault"
        }
    ];

    if (loading) return <LibrarySkeleton />;

    return (
        <div className="min-h-screen bg-background pb-32 pt-16 relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-[20%] -right-[10%] h-[350px] w-[350px] rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <div className="mx-auto max-w-sm px-6 relative z-10 space-y-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary shadow-[0_10px_25px_rgba(var(--primary),0.2)]">
                        <Bookmark className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{t("library.title")}</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("library.all_contents")}</p>
                    </div>
                </motion.div>

                <div className="space-y-4">
                    {items.map((item, idx) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => navigate(item.path)}
                            className="group relative flex w-full items-center gap-4 rounded-[32px] bg-card/40 backdrop-blur-xl p-5 shadow-xl border border-white/10 hover:border-primary/30 transition-all active:scale-[0.97]"
                        >
                            <div className={cn(
                                "flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] shadow-inner transition-transform group-hover:scale-110",
                                item.bg, item.color
                            )}>
                                <item.icon className="h-7 w-7" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-black text-xl tracking-tight text-foreground">{item.title}</p>
                                <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                                    <span className="text-primary font-black uppercase text-xs">{item.count}</span> {item.sub}
                                </p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/30 group-hover:bg-primary/20 transition-colors">
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        </motion.button>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative rounded-[32px] bg-primary/5 p-6 border border-primary/10 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Shield className="h-16 w-16" />
                    </div>
                    <p className="relative z-10 text-[11px] leading-relaxed text-muted-foreground/80 font-black italic uppercase tracking-wider text-center">
                        "{t("library.encryption_notice")}"
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
