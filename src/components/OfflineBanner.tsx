import { useEffect, useState } from "react";
import { WifiOff, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export default function OfflineBanner() {
    const [offline, setOffline] = useState(!navigator.onLine);
    const { t } = useTranslation();

    useEffect(() => {
        const on = () => setOffline(false);
        const off = () => setOffline(true);
        window.addEventListener("online", on);
        window.addEventListener("offline", off);
        return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
    }, []);

    if (!offline) return null;

    return (
        <div className="fixed top-4 inset-x-0 z-[100] flex justify-center animate-in slide-in-from-top-10 duration-500">
            <div className="mx-4 flex items-center gap-3 rounded-full border border-orange-500/30 bg-orange-500/10 px-6 py-2.5 backdrop-blur-xl shadow-lg ring-1 ring-orange-500/20">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-inner">
                    <WifiOff className="h-4 w-4" />
                    <div className="absolute inset-0 animate-ping rounded-full bg-orange-500/30" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 leading-none mb-0.5">Mode Hors-Ligne</span>
                    <span className="text-[11px] font-medium text-orange-400 leading-tight pr-4">
                        Consultation uniquement • Sync auto active
                    </span>
                </div>
            </div>
        </div>
    );
}
