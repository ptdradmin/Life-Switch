import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Phone, Pencil, Mail, Heart, UserPlus, ArrowRight, ShieldCheck, Search, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ContactSkeleton } from "@/components/LoadingSkeletons";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  relationship: string | null;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "contacts"),
      where("user_id", "==", user.uid),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      setContacts(data);
      setLoading(false);
    }, (error) => {
      console.error("Contacts fetch error:", error);
      toast.error(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <ContactSkeleton />;

  const handleAdd = async () => {
    if (!name || !email) {
      toast.error(t("contacts.name_email_required"));
      return;
    }

    try {
      await addDoc(collection(db, "contacts"), {
        user_id: user!.uid,
        name,
        email,
        phone: phone || null,
        relationship: relationship || null,
        created_at: serverTimestamp()
      });

      toast.success(t("contacts.added"));
      setName(""); setEmail(""); setPhone(""); setRelationship(""); setOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "contacts", id));
      toast(t("contacts.deleted"));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEdit = (c: Contact) => {
    setEditContact(c);
    setName(c.name); setEmail(c.email);
    setPhone(c.phone || ""); setRelationship(c.relationship || "");
  };

  const handleEdit = async () => {
    if (!editContact || !name || !email) { toast.error(t("contacts.name_email_required")); return; }
    try {
      await updateDoc(doc(db, "contacts", editContact.id), { name, email, phone: phone || null, relationship: relationship || null });
      toast.success(t("contacts.updated"));
      setEditContact(null); setName(""); setEmail(""); setPhone(""); setRelationship("");
    } catch (error: any) { toast.error(error.message); }
  };

  return (
    <div className="min-h-screen bg-background pb-32 pt-16 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] -right-[10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[25%] -left-[10%] h-[350px] w-[350px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-sm sm:max-w-2xl lg:max-w-6xl px-6 relative z-10 space-y-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary shadow-2xl shadow-primary/20">
              <Users className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{t("contacts.title")}</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t("nav.contacts")}</p>
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
          {contacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-24 text-center space-y-6"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-secondary/50 border border-dashed border-border/50">
                <UserPlus className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-muted-foreground">{t("contacts.empty")}</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40">{t("contacts.empty_sub")}</p>
              </div>
              <Button onClick={() => setOpen(true)} variant="outline" className="rounded-2xl border-primary/20 hover:bg-primary/5 font-black text-xs uppercase tracking-widest">
                {t("contacts.add")}
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contacts.map((c, idx) => (
                <motion.div
                  layout
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative flex items-center gap-4 rounded-[32px] bg-card/40 backdrop-blur-xl p-5 shadow-xl border border-white/10 overflow-hidden active:scale-[0.98] transition-all"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-primary/10 text-xl font-black text-primary shadow-inner border border-primary/5">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-xl tracking-tight text-foreground truncate">{c.name}</p>
                      {c.relationship && (
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/10 shrink-0">
                          <Heart className="h-2.5 w-2.5 text-primary" fill="currentColor" />
                          <span className="text-[8px] font-black uppercase text-primary tracking-tighter">{c.relationship}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 mt-1">
                      <p className="text-[11px] font-bold text-muted-foreground/80 flex items-center gap-1.5 transition-colors group-hover:text-primary/70">
                        <Mail className="h-3 w-3" /> {c.email}
                      </p>
                      {c.phone && (
                        <p className="text-[11px] font-bold text-muted-foreground/80 flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => openEdit(c)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-[450px] w-full rounded-[40px] px-6 py-8 border-white/10 shadow-3xl backdrop-blur-2xl bg-card/90">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-black tracking-tight text-center">{t("contacts.add_contact")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="relative group">
                <Input placeholder={t("contacts.name")} value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-border/60 focus:bg-card transition-all px-5" />
              </div>
              <Input placeholder={t("contacts.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-border/60 focus:bg-card transition-all px-5" />
              <Input placeholder={t("auth.phone")} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-border/60 focus:bg-card transition-all px-5" />
              <Input placeholder={t("contacts.relationship")} value={relationship} onChange={(e) => setRelationship(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-border/60 focus:bg-card transition-all px-5" />

              <div className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 py-2">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> {t("contacts.encryption_note")}
              </div>

              <Button
                onClick={handleAdd}
                className="w-full h-15 rounded-[22px] text-lg font-black shadow-2xl shadow-primary/30 active:scale-95 transition-all gap-2 mt-4"
              >
                {t("contacts.add")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit contact dialog */}
        <Dialog open={!!editContact} onOpenChange={(v) => { if (!v) { setEditContact(null); setName(""); setEmail(""); setPhone(""); setRelationship(""); } }}>
          <DialogContent className="max-w-[90vw] sm:max-w-[450px] w-full rounded-[40px] px-6 py-8 border-white/10 shadow-3xl backdrop-blur-2xl bg-card/90">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-black tracking-tight text-center">{t("contacts.edit_contact")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder={t("contacts.name")} value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-border/60" autoFocus />
              <Input placeholder={t("contacts.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-border/60" />
              <Input placeholder={t("auth.phone")} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-border/60" />
              <Input placeholder={t("contacts.relationship")} value={relationship} onChange={(e) => setRelationship(e.target.value)} className="h-14 rounded-2xl bg-secondary/40 border-border/60" />
              <Button onClick={handleEdit} className="w-full h-14 rounded-[20px] text-lg font-black shadow-xl shadow-primary/20 mt-4 active:scale-95 transition-all">
                {t("profile.save_name")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
