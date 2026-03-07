import { Clock, Lock, Users, Settings, Book } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tabs = [
    { path: "/", label: t("nav.chronos"), icon: Clock },
    { path: "/library", label: t("library.title"), icon: Book },
    { path: "/vault", label: t("nav.vault"), icon: Lock },
    { path: "/contacts", label: t("nav.contacts"), icon: Users },
    { path: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="mx-auto flex w-full max-w-[440px] md:max-w-lg lg:max-w-xl h-18 bg-card/85 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-auto"
      >
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 transition-all active:scale-90"
            >
              {active && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-primary/5 transition-all"
                />
              )}
              <div className={cn(
                "relative z-10 p-1.5 rounded-xl transition-all",
                active ? "text-primary scale-110" : "text-muted-foreground"
              )}>
                <Icon className={cn("h-5 w-5", active ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className={cn(
                "relative z-10 text-[9px] font-black uppercase tracking-[0.05em] transition-all",
                active ? "text-primary opacity-100" : "text-muted-foreground/60 opacity-80"
              )}>
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </nav>
  );
}
