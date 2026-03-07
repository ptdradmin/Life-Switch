export type LangCode = "fr" | "en" | "es" | "de" | "it" | "pt" | "ar" | "zh" | "ja" | "ru" | "nl" | "tr";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import ar from "./locales/ar.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ru from "./locales/ru.json";
import nl from "./locales/nl.json";
import tr from "./locales/tr.json";

export const translations: Record<LangCode, Record<string, string>> = {
  fr,
  en,
  es,
  de,
  it,
  pt,
  ar,
  zh,
  ja,
  ru,
  nl,
  tr
};
