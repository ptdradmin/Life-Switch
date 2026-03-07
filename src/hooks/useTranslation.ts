import { useAuth } from "@/contexts/AuthContext";
import { translations, type LangCode } from "@/i18n/translations";

export function useTranslation() {
  const { currentLanguage: lang } = useAuth() as { currentLanguage: LangCode };
  const dict = translations[lang] ?? translations.fr;

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = dict[key] ?? translations.fr[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const isRTL = lang === "ar";

  return { t, lang, isRTL };
}
