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

            <div className="mx-auto max-w-sm relative z-10 space-y-10">
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
                                    Mise à jour • {lastUpdate}
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
                    className="group relative rounded-[36px] bg-foreground p-8 text-background shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden active:scale-[0.98] transition-all duration-500"
                >
                    <div className="absolute -top-12 -right-12 h-48 w-48 bg-primary/30 rounded-full blur-[70px] group-hover:bg-primary/50 transition-colors" />
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldAlert className="h-24 w-24" />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 backdrop-blur-md border border-white/10">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">SOUVERAINETÉ NUMÉRIQUE</p>
                        </div>
                        <p className="text-lg font-black leading-[1.3] tracking-tight text-white">
                            {isPrivacy
                                ? "Votre vie privée est le fondement de notre architecture. Nous ne voyons rien. Nous ne savons rien."
                                : "En utilisant Life Switch, vous placez votre héritage numérique sous protection cryptographique de haut niveau."}
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="h-[2px] w-8 bg-primary/50" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">LIFE SWITCH PROTOCOL</p>
                        </div>
                    </div>
                </motion.div>

                {/* Dynamic Content Sections */}
                <div className="space-y-6">
                    {!isPrivacy ? (
                        <>
                            <Section
                                idx={0}
                                icon={Globe}
                                title="1. Étendue du Service"
                                content="Life Switch est une plateforme de transmission post-mortem automatisée. Le service garantit la délivrance sécurisée de vos données archivées à vos bénéficiaires après la confirmation irréfutable de votre absence prolongée via notre protocole de Pulse."
                            />
                            <Section
                                idx={1}
                                icon={UserCheck}
                                title="2. Utilisation Responsable"
                                content="Vous détenez la pleine propriété et responsabilité des contenus stockés. L'utilisation du service pour le stockage de données illicites, haineuses ou violant les droits de propriété intellectuelle de tiers est strictement prohibée et entraîne la clôture immédiate du compte."
                            />
                            <Section
                                idx={2}
                                icon={Fingerprint}
                                title="3. Propriété & Chiffrement"
                                highlight
                                content="Zéro Connaissance : Toutes les données sont chiffrées localement (AES-256) avant synchronisation. Life Switch ne possède jamais vos clés de chiffrement. En cas de perte de votre mot de passe maître sans phrase de récupération, vos données seront techniquement irrécupérables."
                            />
                            <Section
                                idx={3}
                                icon={AlertCircle}
                                title="4. Limites de Garantie"
                                content="L'efficacité de la transmission dépend de l'exactitude des informations fournies pour vos bénéficiaires. Life Switch ne peut être tenu responsable d'une non-délivrance due à des coordonnées obsolètes (emails invalides, numéros de téléphone supprimés)."
                            />
                            <Section
                                idx={4}
                                icon={HardDrive}
                                title="5. Capacité & Stockage"
                                content="Les comptes gratuits possèdent une limite de stockage définie. Le dépassement de ces quotas peut bloquer la création de nouveaux secrets. Les abonnements Premium permettent d'étendre ces limites et d'augmenter le nombre de bénéficiaires actifs."
                            />
                            <Section
                                idx={5}
                                icon={Trash2}
                                title="6. Inactivité & Suppression"
                                content="Un compte sans 'Pulse' valide pendant plus d'un an après la transmission réussie de son héritage peut être archivé ou supprimé pour libérer des ressources d'infrastructure, après notifications répétées aux bénéficiaires et à l'utilisateur."
                            />
                            <Section
                                idx={6}
                                icon={Scale}
                                title="7. Juridiction & Litiges"
                                content="Les présentes conditions sont soumises au droit international. Tout litige relatif à l'interprétation ou l'exécution du service sera porté devant les tribunaux compétents de la juridiction de l'éditeur de l'application."
                            />
                        </>
                    ) : (
                        <>
                            <Section
                                idx={0}
                                icon={Lock}
                                title="A. Architecture d'Encapsulation"
                                highlight
                                content="Vos secrets sont scellés dans un coffre-fort cryptographique. L'architecture est conçue pour que les données en clair ne quittent jamais votre appareil sans être préalablement transformées par vos clés privées uniques."
                            />
                            <Section
                                idx={1}
                                icon={Info}
                                title="B. Collecte Minimale"
                                content="Nous appliquons le principe de minimisation des données. Nous collectons uniquement les métadonnées essentielles : email de connexion, identifiants de bénéficiaires et logs de connexion anonymisés pour la sécurité du compte."
                            />
                            <Section
                                idx={2}
                                icon={ShieldCheck}
                                title="C. Droit à l'Oubli Intégral"
                                content="Conformément au RGPD, la suppression de votre compte depuis les paramètres déclenche un processus de 'Wipe' immédiat. Toutes les occurrences de vos données sur nos serveurs et sauvegardes froides sont définitivement effacées sous 30 jours."
                            />
                            <Section
                                idx={3}
                                icon={Globe}
                                title="D. Localisation des Serveurs"
                                content="Vos données sont hébergées sur des infrastructures hautement redondantes situées exclusivement au sein de l'Union Européenne (Zone RGPD), bénéficiant des protections juridiques les plus strictes au monde."
                            />
                            <Section
                                idx={4}
                                icon={Zap}
                                title="E. Absence de Profilage"
                                content="Life Switch est un service d'utilité publique numérique. Nous ne vendons pas vos données, n'utilisons pas de cookies publicitaires et n'effectuons aucun profilage algorithmique à des fins commerciales."
                            />
                            <Section
                                idx={5}
                                icon={Mail}
                                title="F. Sécurité des Communications"
                                content="Les messages envoyés à vos bénéficiaires sont transmis via des tunnels TLS sécurisés. Nous recommandons à vos proches de configurer une double authentification sur leurs propres services de messagerie pour une sécurité optimale."
                            />
                            <Section
                                idx={6}
                                icon={ShieldAlert}
                                title="G. Audit & Transparence"
                                content="Notre infrastructure subit des tests de pénétration réguliers. Toute faille de sécurité majeure détectée sera notifiée aux utilisateurs concernés dans les 72 heures, conformément aux directives européennes."
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
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600">CERTIFIÉ SÉCURISÉ</p>
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
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Questions Juridiques ?</p>
                        <a href="mailto:support@life-switch.app" className="group flex flex-col items-center gap-2">
                            <span className="text-lg font-black text-foreground group-hover:text-primary transition-colors tracking-tight">support@life-switch.app</span>
                            <span className="h-1 w-12 bg-primary/20 rounded-full group-hover:w-24 transition-all duration-500" />
                        </a>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                        <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-bold uppercase tracking-tighter">
                            Pour les utilisateurs iOS, les conditions standard d'Apple (EULA) s'appliquent en complément de nos CGU.
                        </p>
                        <a
                            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-black text-primary underline decoration-primary/30"
                        >
                            Consulter l'EULA Apple
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
