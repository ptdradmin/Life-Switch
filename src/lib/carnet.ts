/**
 * 🤖 Carnet — AI companion via OpenRouter (modèles gratuits)
 * Connaissance complète de Life Switch + outils émotionnels
 */

// La clé est maintenant gérée via les variables d'environnement pour la sécurité.
const OPENROUTER_KEYS = (import.meta.env.VITE_OPENROUTER_API_KEYS || "")
  .split(/[,\s]+/)
  .map(k => k.trim())
  .filter(k => k.startsWith("sk-or-v1-"));

const GROQ_KEYS = (import.meta.env.VITE_GROQ_API_KEYS || "")
  .split(/[,\s]+/)
  .map(k => k.trim())
  .filter(k => k.startsWith("gsk_"));

const FREE_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "openrouter/auto",
];

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
];

// ─────────────── LIFE SWITCH APP KNOWLEDGE ───────────────
const LIFE_SWITCH_KNOWLEDGE = `
=== CONNAISSANCE COMPLÈTE DE L'APP LIFE SWITCH ===

**Qu'est-ce que Life Switch ?**
Life Switch est une application mobile de protection numérique et de transmission de données sensibles. Son concept central est le "Life's Switch" (minuteur de vie) : si l'utilisateur ne fait pas de "check-in" (signe de vie) dans le délai défini, ses secrets sont automatiquement transmis à ses proches désignés.

**Fonctionnalités principales :**
1. 📍 **Check-in / Pulse** : L'utilisateur confirme qu'il est en vie. Si le minuteur expire sans check-in, le protocole de transmission se déclenche.
2. ⏱️ **Minuteur personnalisable** : De 1 à 365 jours. L'utilisateur choisit sa fréquence de check-in.
3. 🔐 **Coffre-fort (Vault)** : Stockage chiffré AES de secrets (codes, messages, documents, médias). Chaque secret est chiffré avec l'UID de l'utilisateur.
4. 👥 **Contacts bénéficiaires** : Proches désignés qui recevront les secrets en cas de déclenchement du minuteur.
5. 📓 **Journal intime (Diary)** : Journal chiffré pour écrire pensées et souvenirs. Intégré avec Carnet IA.
6. 🤖 **Carnet IA** : Compagnon IA (moi !) pour le journal, le soutien émotionnel et la réflexion personnelle.
7. 🛡️ **Score de sécurité** : Score 0-100 basant sur : photo profil (20pts), contacts (30pts), secrets (30pts), minuteur (20pts).
8. 👤 **Profil utilisateur** : Nom, photo, langue, code postal, ville, pays, email, téléphone.
9. 🌍 **Multi-langue** : FR, EN, ES, DE, IT, PT, NL, AR, ZH, JA, RU.
10. 🔔 **Notifications FCM** : Rappels de check-in via Firebase Cloud Messaging.
11. 🎨 **Personnalisation** : Couleur d'accent, thème sombre.
12. 🔑 **Authentification** : Email/password, Google, téléphone (OTP).
13. 👁️ **Biométrie** : Déverrouillage par empreinte/Face ID pour la voûte.
14. 👑 **Premium** : Plan payant avec fonctionnalités étendues.

**Technologies :**
- Firebase (Auth, Firestore, Cloud Messaging)
- Supabase (Storage pour médias)
- Chiffrement AES côté client
- React + TypeScript + Vite
- OpenRouter (modèles IA gratuits) pour Carnet

**Public cible :** Personnes soucieuses de protéger leurs données et de s'assurer que leurs proches reçoivent l'information nécessaire en cas d'urgence, décès ou incapacité.
`;

// ─────────────── BASE PERSONA ───────────────
const BASE_PERSONA = `Tu es Carnet, un compagnon IA bienveillant, empathique et poétique intégré dans Life Switch.
${LIFE_SWITCH_KNOWLEDGE}
Tu connais parfaitement Life Switch et tu aides les utilisateurs à utiliser l'app, à écrire dans leur journal, à gérer leurs émotions.
Réponds TOUJOURS dans la langue de l'utilisateur. Sois chaleureux, personnel, concis (2-4 phrases). Pose une question ouverte.`;

// ─────────────── TYPES ───────────────
export interface CarnetMessage {
  role: "user" | "carnet";
  text: string;
}

export interface UserContext {
  name?: string | null;
  email?: string | null;
  lang?: string;
  timerDays?: number;
  daysElapsed?: number;
  lastCheckIn?: string | null;
  secretsCount?: number;
  contactsCount?: number;
  securityScore?: number;
  hasPremium?: boolean;
  hasPhoto?: boolean;
  mood?: string | null;
}

export interface EmotionAnalysis {
  emotion: string;
  emoji: string;
  intensity: "low" | "medium" | "high";
  suggestion: string;
  color: string;
}

// ─────────────── SYSTEM PROMPT BUILDER ───────────────
function buildSystemPrompt(userCtx?: UserContext): string {
  if (!userCtx) return BASE_PERSONA;

  const { name, lang, timerDays, daysElapsed, lastCheckIn,
    secretsCount, contactsCount, securityScore, hasPremium, hasPhoto, mood } = userCtx;

  const firstName = name?.split(" ")[0] || "l'utilisateur";
  const daysRemaining = (timerDays ?? 30) - (daysElapsed ?? 0);
  const urgency = daysRemaining <= 3 ? "⚠️ URGENT — rappelle-lui de faire son check-in !"
    : daysRemaining <= 7 ? "⚡ Attention — bientôt l'expiration"
      : "✅ Normal";

  return `${BASE_PERSONA}

=== PROFIL ACTUEL DE ${firstName.toUpperCase()} ===
- Prénom : ${firstName}
- Langue : ${lang ?? "fr"}
- Score de sécurité : ${securityScore ?? 0}/100 ${(securityScore ?? 0) >= 80 ? "🟢 Excellent" : (securityScore ?? 0) >= 50 ? "🟡 Moyen" : "🔴 Faible"}
- Premium : ${hasPremium ? "✅" : "⭕ Plan gratuit"}
- Photo profil : ${hasPhoto ? "✅" : "⭕ Manquante (suggère-lui d'en ajouter une)"}
- Minuteur : ${timerDays ?? 30} jours | Écoulés : ${daysElapsed ?? 0}j | Restants : ${daysRemaining}j ${urgency}
- Dernier check-in : ${lastCheckIn ?? "Jamais"}
- Secrets chiffrés : ${secretsCount ?? 0}${(secretsCount ?? 0) === 0 ? " (encourage-le à protéger ses données !)" : ""}
- Contacts bénéficiaires : ${contactsCount ?? 0}${(contactsCount ?? 0) === 0 ? " (important d'en avoir au moins un !)" : ""}
- Humeur du moment : ${mood ?? "non sélectionnée"}

=== MISSION & RÈGLE D'OR ===
Tu es le protecteur de la mémoire de l'utilisateur. Tu respectes strictement sa vie privée.
1. **Consentement** : Si l'utilisateur exprime le besoin de sauvegarder son état, demande toujours confirmation : "Souhaites-tu que j'archive tes données actuelles (Secrets, Contacts, Timer) dans ton coffre-fort ?"
2. **Action** : Une fois d'accord, explique que tu génères le rapport.
3. **Connaissance de l'App** : Utilise les données ci-dessus pour donner des conseils pertinents sur l'utilisation de Life Switch (ex: "Ton minuteur est proche de l'expiration", "Tu devrais ajouter un contact pour ta sécurité").`;
}

// ─────────────── API CALLER ───────────────
let keyIndex = 0;
function getNextKey(): string {
  if (OPENROUTER_KEYS.length === 0) return "";
  const key = OPENROUTER_KEYS[keyIndex % OPENROUTER_KEYS.length];
  keyIndex++;
  return key || "";
}

async function callOpenRouter(
  model: string,
  apiKey: string,
  messages: { role: string; content: string }[],
  maxTokens = 400
): Promise<string> {
  if (!apiKey) {
    throw new Error("Missing OpenRouter API Key. Please check your .env file.");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://life-switch.app",
      "X-Title": "Life Switch - Carnet",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.8 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response");
  return text;
}

async function callGroq(
  model: string,
  apiKey: string,
  messages: { role: string; content: string }[],
  maxTokens = 400
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty Groq response");
  return text;
}

async function callGeminiDirect(apiKey: string, messages: { role: string; content: string }[]): Promise<string> {
  const systemMsg = messages.find(m => m.role === "system")?.content || "";
  const otherMsgs = messages.filter(m => m.role !== "system");
  const contents = otherMsgs.map(m => ({
    role: m.role === "carnet" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  // Gemini model names for the API
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];

  for (const model of models) {
    try {
      // Using v1 endpoint which is more stable
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          system_instruction: { parts: [{ text: systemMsg }] }
        })
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn(`Carnet: Direct Gemini (${model}) failed:`, err.substring(0, 100));
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (err) {
      console.warn(`Carnet: Direct Gemini (${model}) fetch error`);
    }
  }

  throw new Error("Empty or failed Gemini response");
}

let groqKeyIndex = 0;
function getNextGroqKey(): string {
  if (GROQ_KEYS.length === 0) return "";
  const key = GROQ_KEYS[groqKeyIndex % GROQ_KEYS.length];
  groqKeyIndex++;
  return key || "";
}

async function tryModels(messages: { role: string; content: string }[], maxTokens = 400): Promise<string> {
  let lastError = "Unknown error";

  // 1. TRY OPENROUTER FREE MODELS
  for (const model of FREE_MODELS) {
    const key = getNextKey();
    if (!key) continue;
    try {
      const text = await callOpenRouter(model, key, messages, maxTokens);
      console.log(`Carnet (OpenRouter): ✅ ${model}`);
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`Carnet (OpenRouter): ❌ ${model}:`, lastError.substring(0, 50));
    }
  }

  // 2. FALLBACK TO GROQ
  if (GROQ_KEYS.length > 0) {
    for (const model of GROQ_MODELS) {
      const key = getNextGroqKey();
      if (!key) continue;
      try {
        console.log(`Carnet (Groq): Attempting ${model}...`);
        const text = await callGroq(model, key, messages, maxTokens);
        console.log(`Carnet (Groq): ✅ ${model}`);
        return text;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(`Carnet (Groq): ❌ ${model}:`, lastError.substring(0, 50));
      }
    }
  }

  // 3. FINAL FALLBACK: DIRECT GEMINI SDK (Google API)
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      console.log("Carnet: 🔄 Using Gemini direct fallback...");
      const text = await callGeminiDirect(geminiKey, messages);
      console.log("Carnet: ✅ Gemini Direct");
      return text;
    } catch (err) {
      console.error("Carnet: ❌ Gemini Fallback failed:", err);
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`);
}

// ─────────────── MAIN CHAT ───────────────
export async function askCarnet(
  userMessage: string,
  mood?: string | null,
  conversationHistory?: CarnetMessage[],
  userCtx?: UserContext
): Promise<string> {
  const moodCtx = mood ? `(humeur: ${mood}) ` : "";
  const messages = [
    { role: "system", content: buildSystemPrompt(userCtx) },
    ...(conversationHistory ?? []).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: moodCtx + userMessage },
  ];
  return tryModels(messages);
}

// ─────────────── EMOTION ANALYSIS ───────────────
export async function analyzeEmotion(text: string, lang = "fr"): Promise<EmotionAnalysis> {
  const langNames: Record<string, string> = {
    fr: "français", en: "English", es: "español", de: "Deutsch", nl: "Nederlands"
  };
  try {
    const result = await tryModels([
      { role: "system", content: "Tu es un expert en psychologie émotionnelle." },
      {
        role: "user",
        content: `Analyse l'émotion dans ce texte en ${langNames[lang] ?? "français"}: "${text}"
Réponds UNIQUEMENT en JSON valide:
{"emotion":"[nom de l'émotion]","emoji":"[1 emoji]","intensity":"low|medium|high","suggestion":"[conseil court 1 phrase]","color":"[couleur hex]"}`,
      },
    ], 150);
    const json = result.match(/\{[\s\S]*\}/)?.[0];
    if (json) return JSON.parse(json) as EmotionAnalysis;
  } catch { /* use fallback */ }
  return { emotion: "Neutre", emoji: "😐", intensity: "low", suggestion: "Prends un moment pour toi.", color: "#6B7280" };
}

// ─────────────── AFFIRMATION ───────────────
export async function getAffirmation(lang = "fr", userName?: string): Promise<string> {
  const name = userName?.split(" ")[0] || "";
  try {
    return await tryModels([
      { role: "system", content: BASE_PERSONA },
      { role: "user", content: `Génère une affirmation positive puissante et personnalisée${name ? ` pour ${name}` : ""} en ${lang}. Max 2 phrases. Commence par "Tu" ou le prénom. Sans guillemets.` },
    ], 100);
  } catch {
    const fallbacks: Record<string, string> = {
      fr: `${name ? name + ", tu" : "Tu"} es capable de surmonter tous les défis. Ta force intérieure est inépuisable. ✨`,
      en: `${name ? name + ", you" : "You"} have the strength to overcome anything. You are enough. ✨`,
    };
    return fallbacks[lang] ?? fallbacks.fr;
  }
}

// ─────────────── GRATITUDE PROMPT ───────────────
export async function getGratitudePrompt(lang = "fr"): Promise<string> {
  try {
    return await tryModels([
      { role: "system", content: BASE_PERSONA },
      { role: "user", content: `Génère 3 questions de gratitude profondes et poetiques numérotées 1. 2. 3. en ${lang}. Max 40 mots total.` },
    ], 150);
  } catch {
    const fallbacks: Record<string, string> = {
      fr: "1. Pour quoi es-tu reconnaissant aujourd'hui ?\n2. Qui t'a apporté de la joie cette semaine ?\n3. Quel moment simple t'a rendu heureux ?",
      en: "1. What are you grateful for today?\n2. Who brought you joy this week?\n3. What simple moment made you happy?",
    };
    return fallbacks[lang] ?? fallbacks.fr;
  }
}

// ─────────────── JOURNAL PROMPT ───────────────
export async function getCarnetPrompt(lang = "fr"): Promise<string> {
  try {
    return await tryModels([
      { role: "system", content: BASE_PERSONA },
      { role: "user", content: `Génère UNE seule question de réflexion poétique pour journal intime en ${lang}. Max 15 mots. Sans ponctuation finale.` },
    ], 80);
  } catch {
    const fallbacks: Record<string, string> = {
      fr: "Qu'est-ce qui t'a rendu heureux aujourd'hui?",
      en: "What made you smile today?",
      es: "¿Qué te hizo sonreír hoy?",
      de: "Was hat dich heute glücklich gemacht?",
      nl: "Wat maakte je vandaag gelukkig?",
    };
    return fallbacks[lang] ?? fallbacks.fr;
  }
}

// ─────────────── BREATHING EXERCISES (no API needed) ───────────────
export interface BreathingExercise {
  name: string;
  description: string;
  steps: { label: string; duration: number; color: string }[];
  totalCycles: number;
}

export const BREATHING_EXERCISES: Record<string, BreathingExercise> = {
  "4-7-8": {
    name: "Respiration 4-7-8",
    description: "Technique anti-stress Dr. Andrew Weil. Réduit l'anxiété en 60 secondes.",
    steps: [
      { label: "Inspirez", duration: 4, color: "#10b981" },
      { label: "Retenez", duration: 7, color: "#6366f1" },
      { label: "Expirez", duration: 8, color: "#f59e0b" },
    ],
    totalCycles: 4,
  },
  "box": {
    name: "Respiration en carré",
    description: "Technique utilisée par les Navy SEALs. Parfait pour la concentration.",
    steps: [
      { label: "Inspirez", duration: 4, color: "#10b981" },
      { label: "Retenez", duration: 4, color: "#6366f1" },
      { label: "Expirez", duration: 4, color: "#f59e0b" },
      { label: "Retenez", duration: 4, color: "#ec4899" },
    ],
    totalCycles: 4,
  },
  "coherence": {
    name: "Cohérence cardiaque",
    description: "5-5 : équilibre système nerveux. 5 minutes = effet 6 heures.",
    steps: [
      { label: "Inspirez", duration: 5, color: "#10b981" },
      { label: "Expirez", duration: 5, color: "#f59e0b" },
    ],
    totalCycles: 6,
  },
};

// ─────────────── QUOTE (quotable.io open source) ───────────────
export async function getInspirationalQuote(lang = "fr"): Promise<{ quote: string; author: string }> {
  try {
    const res = await fetch("https://api.quotable.io/random?tags=inspirational,wisdom&maxLength=150");
    if (res.ok) {
      const data = await res.json();
      if (lang !== "en" && data.content) {
        // Translate with AI
        try {
          const translated = await tryModels([
            { role: "system", content: "Tu es un traducteur expert. Traduis fidèlement sans ajouter de texte." },
            { role: "user", content: `Traduis en ${lang}: "${data.content}"` },
          ], 100);
          return { quote: translated, author: data.author };
        } catch { /* return English */ }
      }
      return { quote: data.content, author: data.author };
    }
  } catch { /* use fallback */ }
  const fallbacks: Record<string, { quote: string; author: string }> = {
    fr: { quote: "La vie, c'est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre.", author: "Albert Einstein" },
    en: { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  };
  return fallbacks[lang] ?? fallbacks.fr;
}
