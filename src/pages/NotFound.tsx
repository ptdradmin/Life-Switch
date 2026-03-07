import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 space-y-8"
      >
        <div className="relative inline-block">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-primary/10 text-primary border border-primary/20 shadow-2xl"
          >
            <Ghost className="h-12 w-12" />
          </motion.div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-background rounded-full flex items-center justify-center border-2 border-primary/10 font-black text-xs text-primary">
            404
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">Écran Introuvable</h1>
          <p className="text-muted-foreground font-medium max-w-[280px] mx-auto leading-tight italic">
            Il semblerait que vous ayez exploré une zone non protégée par le protocole.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => navigate("/")}
            className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest flex gap-3 shadow-xl shadow-primary/20"
          >
            <Home className="h-4 w-4" />
            Retour à l'accueil
          </Button>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all p-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Page précédente
          </button>
        </div>
      </motion.div>

      <div className="absolute bottom-10 text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground/20">
        LIFE SWITCH • ERROR_CODE_404
      </div>
    </div>
  );
};

export default NotFound;
