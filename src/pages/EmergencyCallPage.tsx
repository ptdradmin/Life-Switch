import { useState, useEffect } from "react";
import { PhoneOff, Phone, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyCallProps {
    callerName: string;
    onDecline: () => void;
    onAccept: () => void;
}

export default function EmergencyCallPage({ callerName, onDecline, onAccept }: EmergencyCallProps) {
    const [vibrate, setVibrate] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setVibrate(v => !v);
            if (window.navigator.vibrate) {
                window.navigator.vibrate([500, 200, 500]);
            }
        }, 1000);

        // Play an alarm sound (simulated here)
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2539/2539-preview.mp3"); // High intensity siren
        audio.loop = true;
        audio.play().catch(() => console.log("Audio play blocked until interaction"));

        return () => {
            clearInterval(interval);
            audio.pause();
        };
    }, []);

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-destructive pb-20 pt-24 text-white transition-all duration-100 ${vibrate ? 'scale-105 brightness-125' : 'scale-100 brightness-100'}`}>
            <div className="flex flex-col items-center gap-6 px-8 text-center">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-white opacity-20"></div>
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                        <Shield className="h-16 w-16 text-white" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Appel d'Urgence</h1>
                    <p className="text-xl font-medium opacity-90">Sans nouvelles de :</p>
                    <p className="text-3xl font-bold underline decoration-white/50">{callerName}</p>
                </div>

                <div className="mt-8 flex items-center gap-2 rounded-full bg-black/20 px-6 py-3 backdrop-blur-sm">
                    <AlertTriangle className="h-5 w-5 animate-pulse text-yellow-300" />
                    <p className="text-sm font-semibold uppercase tracking-widest text-yellow-300">Action Requis Immédiate</p>
                </div>
            </div>

            <div className="flex w-full max-w-sm justify-around px-8">
                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={onDecline}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white shadow-2xl transition-all hover:scale-110 active:scale-90"
                    >
                        <PhoneOff className="h-8 w-8" />
                    </button>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Ignorer</span>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={onAccept}
                        className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-destructive shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-all hover:scale-110 active:scale-90"
                    >
                        <Phone className="h-8 w-8 animate-bounce" />
                    </button>
                    <span className="text-xs font-bold uppercase tracking-widest">Confirmer</span>
                </div>
            </div>

            <div className="px-12 text-center text-[10px] italic leading-tight text-white/60">
                Vous avez été désigné comme bénéficiaire. Cet appel est déclenché par le Life's Switch de {callerName}.
            </div>
        </div>
    );
}
