import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Globe, Crown, HelpCircle, CalendarDays, Lock, ChevronRight, LogOut, Check, ShieldCheck, Trash2, Info, Pencil, Camera } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const timerOptions = [7, 14, 30, 60, 90];

const languages = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ru", label: "Русский" },
  { code: "nl", label: "Nederlands" },
  { code: "tr", label: "Türkçe" },
];

export default function ProfilePage() {
  const { user, profile, logout, updateTimer, updateLanguage, updateDisplayName, uploadProfilePhoto, deleteAccount, isEmailUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [secretsCount, setSecretsCount] = useState(0);

  // Inside ProfilePage...
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "secrets"), where("user_id", "==", user.uid));
    getCountFromServer(q).then((snapshot) => {
      setSecretsCount(snapshot.data().count);
    });
  }, [user]);

  const currentLang = languages.find((l) => l.code === (profile?.language ?? "fr")) ?? languages[0];

  const createdDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : user?.metadata.creationTime
      ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
      : "—";

  const handleTimerChange = (days: number) => {
    updateTimer(days);
    toast.success(t("profile.timer_updated", { days }));
  };

  const handleLangChange = (code: string) => {
    updateLanguage(code);
    setLangOpen(false);
    toast.success(t("profile.lang_updated"));
  };

  const handleEditName = () => {
    setNameInput(profile?.display_name ?? "");
    setEditNameOpen(true);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Format non supporté"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image trop grande (max 5MB)"); return; }
    toast.loading(t("profile.photo_uploading"));
    const result = await uploadProfilePhoto(file);
    toast.dismiss();
    if (result.error) toast.error(result.error);
    else toast.success(t("profile.photo_updated"));
    // Reset input to allow re-selecting same file
    e.target.value = "";
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    await updateDisplayName(nameInput.trim());
    setSavingName(false);
    setEditNameOpen(false);
    toast.success(t("profile.name_updated"));
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const result = await deleteAccount(isEmailUser ? deletePassword : undefined);
    setDeleting(false);
    if (result.error) {
      if (result.error === "auth/wrong-password" || result.error === "auth/invalid-credential") {
        toast.error(t("profile.delete_wrong_password"));
      } else if (result.error === "auth/requires-recent-login") {
        toast.error(t("profile.delete_relogin"));
      } else {
        toast.error(result.error);
      }
      return;
    }
    // Success — Firebase auth listener will clear user, redirect to presentation
    setDeleteOpen(false);
    navigate("/presentation");
  };

  const initial = (profile?.display_name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-10">
      <div className="mx-auto max-w-sm sm:max-w-2xl lg:max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("profile.title")}</h1>

        {/* User card */}
        <div className="flex items-center gap-4 rounded-2xl bg-card p-4">
          {/* Avatar */}
          <button
            onClick={() => photoInputRef.current?.click()}
            className="relative shrink-0 group"
            title={t("profile.change_photo")}
          >
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt="avatar"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/30"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />

          {/* Name + email */}
          <button
            onClick={handleEditName}
            className="flex min-w-0 flex-1 items-center gap-2 text-left group/name"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{profile?.display_name ?? t("profile.user")}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email ?? user?.phoneNumber}</p>
            </div>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Preferences */}
            <div className="space-y-1">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("profile.preferences")}</p>
              <div className="rounded-2xl bg-card divide-y divide-border">
                <button onClick={() => setLangOpen(true)} className="flex w-full items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{t("profile.language")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{currentLang.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                <button
                  onClick={() => navigate("/premium")}
                  className="flex w-full items-center justify-between px-4 py-3.5 group"
                >
                  <div className="flex items-center gap-3">
                    <Crown className={cn("h-4 w-4", profile?.is_premium ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-medium text-foreground">{t("profile.premium")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile?.is_premium && (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        Actif
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("profile.timer_settings")}</p>
              <div className="flex gap-2">
                {timerOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleTimerChange(d)}
                    className={cn(
                      "flex-1 rounded-full py-2 text-sm font-semibold transition-colors",
                      (profile?.timer_days ?? 30) === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d} {t("profile.days_suffix")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Account info */}
            <div className="space-y-1">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("profile.account")}</p>
              <div className="rounded-2xl bg-card divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>{t("profile.member_since")}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{createdDate}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>{t("profile.secrets_count")}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{secretsCount}</span>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-1">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("profile.support")}</p>
              <div className="rounded-2xl bg-card divide-y divide-border">
                <button
                  onClick={() => navigate("/faq")}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{t("profile.faq")}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate("/legal")}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span>{t("profile.legal")}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => navigate("/about")}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span>{t("about.title")}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account */}
        <div className="pt-8">
          <button
            onClick={() => { setDeletePassword(""); setDeleteOpen(true); }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 py-4 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            {t("profile.delete_account")}
          </button>
        </div>

        {/* Logout */}
        <Button variant="outline" onClick={logout} className="w-full rounded-2xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4" />
          {t("profile.logout")}
        </Button>
      </div>

      {/* Language picker */}
      <Dialog open={langOpen} onOpenChange={setLangOpen}>
        <DialogContent className="max-w-[85vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("profile.choose_lang")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 pt-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLangChange(l.code)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  l.code === (profile?.language ?? "fr") ? "bg-primary/10 text-primary" : "text-foreground hover:bg-card"
                )}
              >
                {l.label}
                {l.code === (profile?.language ?? "fr") && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="max-w-[85vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("profile.edit_name")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t("profile.name_placeholder")}
              className="h-12 rounded-xl"
              maxLength={50}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <Button
              onClick={handleSaveName}
              disabled={savingName || !nameInput.trim()}
              className="w-full h-12 rounded-xl font-bold"
            >
              {savingName ? "..." : t("profile.save_name")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-[85vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">{t("profile.delete_account")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("profile.delete_confirm")}
            </p>
            {isEmailUser && (
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t("profile.delete_password_hint")}
                className="h-12 rounded-xl"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleDeleteAccount()}
              />
            )}
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || (isEmailUser && !deletePassword)}
              className="w-full h-12 rounded-xl font-bold"
            >
              {deleting ? "..." : t("profile.delete_confirm_btn")}
            </Button>
            <button
              onClick={() => setDeleteOpen(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
