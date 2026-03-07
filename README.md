# 🔐 Life Switch — Heritage & Digital Legacy

**Life Switch** est une plateforme commerciale de succession numérique sécurisée permettant de transmettre vos secrets, mots de passe, documents et messages importants à vos proches en cas d'absence prolongée ou de décès. 

![Version](https://img.shields.io/badge/Status-Version%201.2.0-emerald)
![Encryption](https://img.shields.io/badge/Security-AES--256-blue)
![Languages](https://img.shields.io/badge/Languages-12%20Supported-orange)
![License](https://img.shields.io/badge/License-GPLv3-lightgrey)

## ✨ Fonctionnalités Professionnelles

- **🛡️ Sécurité de Niveau Militaire**: Chiffrement **AES-256** de bout en bout (Zero-Knowledge). Vos données sont chiffrées localement sur votre appareil avant toute transmission. Même nos administrateurs ne peuvent pas lire vos messages.
- **🌍 Internationalisation Native**: Interface 100% traduite et localisée dans **12 langues** (FR, EN, ES, DE, IT, PT, AR, ZH, JA, RU, NL, TR) pour une portée mondiale.
- **⏱️ Protocole Smart Pulse**: Un système de "Pulse" (bouton de confirmation de présence) personnalisable. En cas d'expiration du timer, vos bénéficiaires désignés reçoivent automatiquement un accès sécurisé à vos secrets.
- **🤖 Carnet AI**: Un assistant intelligent analysant votre score de sécurité et votre héritage numérique pour vous conseiller en temps réel, tout en respectant votre vie privée.
- **📂 Coffre-fort Hybride**: Stockage haute performance pour messages, codes, documents, photos et vidéos.
- **🔔 Système de Notification Cross-Platform**: Alertes intelligentes (Web & Mobile) via Firebase Cloud Messaging pour garantir que vous ne manquiez jamais un "Pulse".
- **🔒 Authentification Biométrique**: Support natif de FaceID et TouchID sur mobile via Capacitor.

## 🛠️ Stack Technique (Multi-Cloud)

L'architecture de Life Switch repose sur une pile technologique hybride garantissant vitesse, sécurité et fiabilité :

- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS
- **Design System**: Shadcn/ui & Framer Motion (Animations Premium)
- **Hébergement & Auth**: Firebase Hosting & Firebase Auth
- **Base de données**: Firebase Firestore (Temps réel & Off-line)
- **Stockage Cloud**: Supabase Storage (Bucket hautement sécurisé)
- **IA**: OpenRouter & Groq (Modèles LLM avancés via API sécurisée)
- **Mobile SDK**: Capacitor JS (Android & iOS)
- **Localisation**: i18next avec synchronisation automatisée des locales

## 🧠 Architecture Zero-Knowledge

La confidentialité n'est pas une option, c'est notre fondation :

1.  **Chiffrement Client-Side** : Vos secrets sont chiffrés par `CryptoJS` avant de quitter votre navigateur/téléphone.
2.  **Clés Uniques** : Chaque utilisateur génère ses propres clés de chiffrement basées sur son identité et des sels de sécurité dynamiques.
3.  **Libération Automatisée** : Le protocole de transmission aux bénéficiaires est sécurisé par des règles de sécurité Firestore strictes et des fonctions cloud surveillant le timer d'inactivité.

## 🚀 Installation et Lancement (Développement)

Le projet nécessite Node.js 18+.

```sh
# 1. Cloner le dépôt
git clone https://github.com/ptdradmin/Life-Switch.git
cd Life-Switch

# 2. Installation
npm install

# 3. Environnement
# Configurez vos clés Firebase (API_KEY, AUTH_DOMAIN, etc.) et Supabase dans le fichier .env
cp .env.example .env

# 4. Exécution
npm run dev
```

## ⚖️ Licence et Commercialisation

Ce projet est sous licence **GPLv3**. Pour toute demande concernant une utilisation commerciale spécifique ou des services de support Entreprise, veuillez nous contacter.

---
*Life Switch — Parce que votre héritage numérique mérite la plus haute protection.*