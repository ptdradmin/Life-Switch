<div align="center">
  <img src="https://raw.githubusercontent.com/ptdradmin/Life-Switch/main/public/favicon.png" alt="Life Switch Logo" width="120" />
  
  # 🔐 Life Switch
  ### *Your Digital Legacy, Reimagined & Secured.*
  
  [![Build Status](https://img.shields.io/github/actions/workflow/status/ptdradmin/Life-Switch/main.yml?branch=main&style=for-the-badge&logo=github)](https://github.com/ptdradmin/Life-Switch/actions)
  [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)
  [![Languages](https://img.shields.io/badge/Languages-12--Supported-orange?style=for-the-badge)](https://github.com/ptdradmin/Life-Switch)
  [![Help Wanted](https://img.shields.io/badge/Help%20Wanted-Welcome-8A2BE2?style=for-the-badge)](CONTRIBUTING.md)

  ---

  **Life Switch** est une plateforme commerciale de succession numérique garantissant la transmission sécurisée de vos secrets, identifiants et documents à vos proches en cas d'impossibilité de répondre.

  [Découvrir l'App](https://life-switch-mvp-2026.web.app) • [Contribuer (Help Wanted)](CONTRIBUTING.md) • [Sécurité & Bug Bounty](SECURITY.md)
</div>

## 💎 Fonctionnalités Elite

| Fonctionnalité | Description |
| :--- | :--- |
| **🛡️ Zero-Knowledge** | Chiffrement AES-256 local. Vos données sont illisibles même pour nous. |
| **🌍 World Ready** | Interface localisée en **12 langues** (FR, EN, ES, DE, IT, PT, AR, ZH, JA, RU, NL, TR). |
| **⏱️ Smart Pulse** | Protocole d'inactivité intelligent avec déclenchement automatique vers vos bénéficiaires. |
| **🤖 Carnet AI** | Assistant prédictif analysant vos émotions et votre score de sécurité en temps réel. |
| **📂 Coffre Hybride** | Stockage haute fidélité pour textes, codes, photos et vidéos 4K. |
| **🔒 Biométrie** | Accès sécurisé par FaceID/TouchID nativement intégré via Capacitor. |

## 🛠️ Infrastructure Multi-Cloud

L'architecture de Life Switch repose sur une synergie technologique de pointe pour une fiabilité absolue :

- **Cœur Applicatif** : `React 18` + `TypeScript` + `Vite`
- **Design Premium** : `Tailwind CSS` + `Framer Motion` + `Shadcn/ui`
- **Identity & Realtime** : `Firebase Auth` & `Cloud Firestore`
- **Cloud Storage** : `Supabase Storage` (Buckets isolés et chiffrés)
- **Calcul IA** : `OpenRouter` & `Groq` (Inférence ultra-rapide)
- **Native Bridge** : `Capacitor JS` for iOS & Android
- **Localisation** : `i18next` avec injection dynamique

## 🧠 Architecture Zero-Knowledge

> "Your privacy is our code."

1. **Encryption at Edge** : Les secrets sont chiffrés via `CryptoJS` avant de quitter l'appareil.
2. **Key Derivation** : Utilisation de sels dynamiques et de l'UID Firebase pour une entropie maximale.
3. **Decentralized Storage** : Séparation stricte entre les métadonnées (Firestore) et les assets lourds (Supabase).

## 🚀 Guide de Démarrage Rapide

```bash
# 1. Clonez l'excellence
git clone https://github.com/ptdradmin/Life-Switch.git

# 2. Installez le moteur
npm install

# 3. Configurez vos clés et secrets d'API
cp .env.example .env.local

# 4. Allumez les propulseurs
npm run dev
```

### 🔐 Gestion des Secrets (Variables d'Environnement)

Pour faire tourner le projet **Life Switch** en local, vous avez besoin de configurer Firebase, Supabase et les clés des modèles d'intelligence artificielle utilisés par "Carnet". 
Ouvrez votre fichier `.env.local` et ajoutez-y vos jetons de développement :

| Clé | Fournisseur | Rôle dans l'application |
| :--- | :--- | :--- |
| `VITE_FIREBASE_*` | **Firebase** | Identifiants pour Firebase Auth et Cloud Firestore. |
| `VITE_SUPABASE_URL` | **Supabase** | Stockage haute-fidélité pour les images et vidéos 4K du coffre. |
| `VITE_SUPABASE_ANON_KEY` | **Supabase** | Clé pour l'API publique (restreinte par nos règles RLS). |
| `VITE_AES_SALT` | **Sécurité** | Un sel arbitraire utilisé localement pour renforcer la dérivation cryptographique. |
| `VITE_OPENROUTER_API_KEYS`| **OpenRouter** | Clés API pour solliciter les modèles IA (Gemini, Llama) du journal intime sans lier vos cartes bleues. |
| `VITE_GROQ_API_KEYS` | **Groq** | Utilisé comme "fallback" d'inférence ultra-rapide si OpenRouter est indisponible. |

**Bonus Open-Source :** Il n'y a pas besoin de payer pour contribuer au projet : inscrivez-vous sur [Firebase (Spark Plan)](https://firebase.google.com/), [Supabase (Plan Gratuit)](https://supabase.com/), [OpenRouter (Filtre Gratuit)](https://openrouter.ai/) et [Groq](https://console.groq.com/).

## ⚖️ Licence & Commercialisation

Propulsé sous licence **GPLv3**. Solution prête pour un déploiement commercial à grande échelle. Pour en savoir plus sur la manière de participer au projet, consultez notre fichier [CONTRIBUTING.md](CONTRIBUTING.md).

---

<div align="center">
  <sub>© 2026 Life Switch. Tous droits réservés. <br> 
  <i>Parce que votre héritage mérite une forteresse numérique.</i></sub>
</div>