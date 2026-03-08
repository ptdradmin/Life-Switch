import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function SplashScreen() {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[9999]">
            {/* Background blur effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center gap-8"
            >
                {/* Logo with glow */}
                <div className="relative">
                    <motion.div
                        animate={{
                            boxShadow: [
                                "0 0 20px rgba(16, 185, 129, 0)",
                                "0 0 40px rgba(16, 185, 129, 0.3)",
                                "0 0 20px rgba(16, 185, 129, 0)"
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-primary text-primary-foreground shadow-2xl relative z-10"
                    >
                        <Shield className="h-12 w-12" />
                    </motion.div>

                    {/* Spinning ring around logo */}
                    <div className="absolute inset-[-12px] border-2 border-dashed border-primary/20 rounded-full animate-[spin_8s_linear_infinite]" />
                </div>

                <div className="space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-black tracking-tighter italic text-foreground"
                    >
                        LIFE SWITCH
                    </motion.h1>

                    <div className="flex flex-col items-center gap-2">
                        <div className="h-[2px] w-12 bg-primary/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="h-full w-1/2 bg-primary"
                            />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                            Initialisation du protocole
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Version tag */}
            <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
                Secure Legacy Protection • v1.2.2
            </p>
        </div>
    );
}
