import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { uploadFile } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Plus, Trash2, CheckCircle, Image as ImageIcon, FileVideo, Pencil, X, PlayCircle, Shield, ArrowRight, Camera, Video, MoreVertical, Users, Heart, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { VaultSkeleton } from "@/components/LoadingSkeletons";
import CryptoJS from "crypto-js";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import BiometricGuard from "@/components/BiometricGuard";

// SEL DE SÉCURITÉ STATIQUE (Identique à HomePage)
const AES_SALT = import.meta.env.VITE_AES_SALT || "LS_PROT_9X_!v2_Zq78";

interface VaultSecret {
  id: string;
  title: string;
  content: string;
  category: "code" | "message" | "doc" | "media";
  beneficiary_id: string | null;
  media_urls: string[] | null;
  created_at: any;
}

interface Contact {
  id: string;
  name: string;
  email: string;
}

const VaultMediaItem = ({ url, isVideo, isLast, remaining, onClick }: { url: string; isVideo: boolean; isLast: boolean; remaining: number; onClick: () => void }) => {
  const [loaded, setLoaded] = useState(isVideo);
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative aspect-square rounded-2xl bg-secondary/50 overflow-hidden border border-border/40 group/media"
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {isVideo ? (
        <div className="flex h-full w-full items-center justify-center bg-black/20">
          <div className="flex flex-col items-center gap-1">
            <PlayCircle className="h-8 w-8 text-primary group-hover/media:scale-110 transition-transform" />
            <span className="text-[9px] text-primary/70 font-bold uppercase tracking-widest">Vidéo</span>
          </div>
        </div>
      ) : (
        <img
          src={url}
          className={cn("h-full w-full object-cover transition-transform duration-500 group-hover/media:scale-110", !loaded && "opacity-0")}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
      {isLast && remaining > 0 && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-xs font-black">+{remaining}</span>
        </div>
      )}
    </motion.button>
  );
};

export default function VaultPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [editSecret, setEditSecret] = useState<VaultSecret | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"code" | "message" | "doc" | "media">("code");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  // Clé renforcée avec SEL
  const encryptionKey = (user?.uid || "fallback-key") + AES_SALT;

  const encryptContent = (text: string) => {
    return CryptoJS.AES.encrypt(text, encryptionKey).toString();
  };

  const decryptContent = (ciphertext: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalText) throw new Error("Decrypt failed");
      return originalText;
    } catch (e) {
      // Si le déchiffrement échoue avec le sel, on peut essayer sans (pour compatibilité temporaire)
      // mais ici on marque l'erreur pour inciter à la migration.
      return t("vault.decrypt_error_long");
    }
  };

  useEffect(() => {
    if (!user) return;

    const qSecrets = query(
      collection(db, "secrets"),
      where("user_id", "==", user.uid),
      orderBy("created_at", "desc")
    );

    const unsubSecrets = onSnapshot(qSecrets, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VaultSecret[];

      const decryptedData = data.map(s => ({
        ...s,
        content: decryptContent(s.content)
      }));
      setSecrets(decryptedData);
      setLoading(false);
    });

    const qContacts = query(collection(db, "contacts"), where("user_id", "==", user.uid));
    const unsubContacts = onSnapshot(qContacts, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      setContacts(data);
    });

    return () => {
      unsubSecrets();
      unsubContacts();
    };
  }, [user]);

  const handleAdd = async () => {
    if (!title || !content) {
      toast.error(t("vault.fill_all"));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    let mediaUrls: string[] = [];

    const compressImage = async (file: File): Promise<File> => {
      if (!file.type.startsWith("image/")) return file;
      return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));
            else resolve(file);
          }, "image/jpeg", 0.75);
        };
        img.onerror = () => resolve(file);
      });
    };

    try {
      if (mediaFiles.length > 0) {
        setUploadStatus("compression");
        const totalFiles = mediaFiles.length;
        for (let i = 0; i < totalFiles; i++) {
          let file = mediaFiles[i];
          if (file.type.startsWith("image/")) file = await compressImage(file);
          setUploadStatus("uploading");
          const url = await uploadFile(
            file,
            "secrets",
            user!.uid,
            (pct) => setUploadProgress(((i / totalFiles) * 100) + (pct / totalFiles))
          );
          mediaUrls.push(url);
        }
      }

      const encryptedContent = encryptContent(content);

      await addDoc(collection(db, "secrets"), {
        user_id: user!.uid,
        title,
        content: encryptedContent,
        category,
        beneficiary_id: beneficiaryId || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        created_at: serverTimestamp(),
      });

      toast.success(t("vault.saved"));
      setTitle(""); setContent(""); setBeneficiaryId(""); setMediaFiles([]);
      setOpen(false);
    } catch (error: any) {
      toast.error(`❌ ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "secrets", id));
      toast(t("vault.deleted"));
    } catch (error: any) { toast.error(error.message); }
  };

  const openEdit = (s: VaultSecret) => {
    setEditSecret(s);
    setTitle(s.title);
    setContent(s.content);
    setBeneficiaryId(s.beneficiary_id || "");
  };

  const handleEdit = async () => {
    if (!editSecret || !title || !content) return;
    const encryptedContent = encryptContent(content);
    try {
      await updateDoc(doc(db, "secrets", editSecret.id), {
        title,
        content: encryptedContent,
        beneficiary_id: beneficiaryId || null,
      });
      toast.success(t("vault.updated"));
      setEditSecret(null); setTitle(""); setContent(""); setBeneficiaryId("");
    } catch (err: any) { toast.error(err.message); }
  };

  const getBeneficiaryName = (id: string | null) => {
    if (!id) return null;
    return contacts.find((c) => c.id === id)?.name ?? null;
  };

  if (loading) return <VaultSkeleton />;

  return (
    <BiometricGuard>
      <div className="min-h-screen bg-background pb-32 pt-16 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[20%] right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] left-0 w-72 h-72 bg-primary/5 rounded-full blur-[80px]" />
        </div>

        <div className="mx-auto max-w-sm px-6 relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary shadow-2xl shadow-primary/20">
                <Lock className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{t("vault.title")}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("nav.vault")}</p>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{secrets.length} {t("library.total_secrets").toUpperCase()}</p>
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 shadow-lg backdrop-blur-md"
            >
              <Plus className="h-6 w-6" />
            </motion.button>
          </motion.div>

          <AnimatePresence mode="popLayout">
            {secrets.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 border border-dashed border-border/50">
                  <Shield className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/60">{t("vault.empty")}</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {secrets.map((s, idx) => (
                  <motion.div
                    layout
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative rounded-[32px] bg-card/40 backdrop-blur-xl p-5 shadow-xl border border-white/10 overflow-hidden"
                  >
                    <div onClick={() => openEdit(s)} className="flex items-center gap-4 cursor-pointer active:opacity-70 transition-opacity">
                      <div className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner",
                        s.category === "code" ? "bg-amber-500/10 text-amber-500" :
                          s.category === "message" ? "bg-pink-500/10 text-pink-500" :
                            s.category === "doc" ? "bg-blue-500/10 text-blue-500" :
                              "bg-primary/10 text-primary"
                      )}>
                        {s.category === "code" ? <Lock className="h-6 w-6" /> :
                          s.category === "message" ? <Heart className="h-6 w-6" /> :
                            s.category === "doc" ? <FileText className="h-6 w-6" /> :
                              <ImageIcon className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xl tracking-tight truncate">{s.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Users className="h-3 w-3 text-primary/60" />
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                            {getBeneficiaryName(s.beneficiary_id) || t("vault.no_beneficiary")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEdit(s)} className="p-2 text-muted-foreground hover:text-primary rounded-full transition-all">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-muted-foreground hover:text-destructive rounded-full transition-all">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* New Secret Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[90vw] w-full rounded-[40px] px-6 py-8 border-white/10 bg-card/90 backdrop-blur-2xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-black text-center">{t("vault.new_secret")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <Input placeholder={t("vault.title_placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-none" />
              <div className="grid grid-cols-4 gap-2">
                {(["code", "message", "doc", "media"] as const).map((cat) => (
                  <button key={cat} onClick={() => setCategory(cat)} className={cn("flex flex-col items-center justify-center gap-2 h-16 rounded-2xl border transition-all", category === cat ? "bg-primary text-primary-foreground" : "bg-secondary/40 border-none text-muted-foreground")}>
                    {cat === "code" ? <Lock className="h-4 w-4" /> : cat === "message" ? <Heart className="h-4 w-4" /> : cat === "doc" ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                    <span className="text-[8px] font-black uppercase tracking-widest">{cat}</span>
                  </button>
                ))}
              </div>
              <Textarea placeholder={t("vault.content_placeholder")} value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[140px] rounded-[24px] bg-secondary/40 border-none p-5" />
              <Button onClick={handleAdd} disabled={uploading} className="w-full h-15 rounded-[22px] text-lg font-black shadow-2xl">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("vault.encrypt_save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BiometricGuard>
  );
}
