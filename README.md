<div align="center">
  <img src="https://raw.githubusercontent.com/ptdradmin/Life-Switch/main/public/favicon.png" alt="Life Switch Logo" width="120" />
  
  # 🔐 Life Switch
  ### *Your Digital Legacy, Reimagined & Secured.*
  
  [![Build Status](https://img.shields.io/github/actions/workflow/status/ptdradmin/Life-Switch/main.yml?branch=main&style=for-the-badge&logo=github)](https://github.com/ptdradmin/Life-Switch/actions)
  [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)
  [![Languages](https://img.shields.io/badge/Languages-12--Supported-orange?style=for-the-badge)](https://github.com/ptdradmin/Life-Switch)
  [![Help Wanted](https://img.shields.io/badge/Help%20Wanted-Welcome-8A2BE2?style=for-the-badge)](CONTRIBUTING.md)

  ---

  **Life Switch** is a commercial digital legacy platform ensuring the secure transmission of your secrets, credentials, and documents to your loved ones in the event you are unable to respond.

  [Discover the App](https://life-switch-mvp-2026.web.app) • [Contribute (Help Wanted)](CONTRIBUTING.md) • [Security & Bug Bounty](SECURITY.md)
</div>

## 💎 Elite Features

| Feature | Description |
| :--- | :--- |
| **🛡️ Zero-Knowledge** | Local AES-256 encryption. Your data is unreadable, even to us. |
| **🌍 World Ready** | Localized interface in **12 languages** (EN, FR, ES, DE, IT, PT, AR, ZH, JA, RU, NL, TR). |
| **⏱️ Smart Pulse** | Intelligent inactivity protocol with automatic triggering to your beneficiaries. |
| **🤖 Carnet AI** | Predictive assistant analyzing your emotions and security score in real-time. |
| **📂 Hybrid Vault** | High-fidelity storage for texts, codes, photos, and 4K videos. |
| **🔒 Biometrics** | Secure access via natively integrated FaceID/TouchID through Capacitor. |

## 🛠️ Multi-Cloud Infrastructure

Life Switch's architecture relies on bleeding-edge technological synergy for absolute reliability:

- **Application Core**: `React 18` + `TypeScript` + `Vite`
- **Premium Design**: `Tailwind CSS` + `Framer Motion` + `Shadcn/ui`
- **Identity & Realtime**: `Firebase Auth` & `Cloud Firestore`
- **Cloud Storage**: `Supabase Storage` (Isolated & encrypted buckets)
- **AI Compute**: `OpenRouter` & `Groq` (Ultra-fast inference)
- **Native Bridge**: `Capacitor JS` for iOS & Android
- **Localization**: `i18next` with dynamic injection

## 🧠 Zero-Knowledge Architecture

> "Your privacy is our code."

1. **Encryption at Edge**: Secrets are encrypted via `CryptoJS` before they ever leave the device.
2. **Key Derivation**: Utilizing dynamic salts and the Firebase UID for maximum entropy.
3. **Decentralized Storage**: Strict separation between metadata (Firestore) and heavy assets (Supabase).

## 🚀 Quick Start Guide

```bash
# 1. Clone excellence
git clone https://github.com/ptdradmin/Life-Switch.git

# 2. Install the engine
npm install

# 3. Configure your API keys and secrets
cp .env.example .env.local

# 4. Ignite thrusters
npm run dev
```

### 🔐 Secrets Management (Environment Variables)

To run the **Life Switch** project locally, you need to configure Firebase, Supabase, and the artificial intelligence model keys used by the "Carnet" journal. 
Open your `.env.local` file and add your development tokens:

| Key | Provider | Role in the application |
| :--- | :--- | :--- |
| `VITE_FIREBASE_*` | **Firebase** | Credentials for Firebase Auth and Cloud Firestore. |
| `VITE_SUPABASE_URL` | **Supabase** | High-fidelity storage for vault images and 4K videos. |
| `VITE_SUPABASE_ANON_KEY` | **Supabase** | Key for the public API (restricted by our RLS rules). |
| `VITE_AES_SALT` | **Security** | An arbitrary salt used locally to strengthen cryptographic derivation. |
| `VITE_OPENROUTER_API_KEYS`| **OpenRouter** | API keys to query the AI models (Gemini, Llama) without linking your credit card. |
| `VITE_GROQ_API_KEYS` | **Groq** | Used as an ultra-fast inference "fallback" if OpenRouter is unavailable. |

**Open-Source Bonus:** There is no need to pay to contribute to the project: sign up for [Firebase (Spark Plan)](https://firebase.google.com/), [Supabase (Free Plan)](https://supabase.com/), [OpenRouter (Free Filter)](https://openrouter.ai/) and [Groq](https://console.groq.com/).

## ⚖️ License & Commercialization

Powered under the **GPLv3** license. A ready-to-deploy solution for large-scale commercial networks. To learn more about how to participate in the project, please consult our [CONTRIBUTING.md](CONTRIBUTING.md) file.

---

<div align="center">
  <sub>© 2026 Life Switch. All rights reserved. <br> 
  <i>Because your legacy deserves a digital fortress.</i></sub>
</div>