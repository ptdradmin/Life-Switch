# 🔐 Life Switch — Héritage Numérique & Life's Switch

**Life Switch** est une solution de succession numérique sécurisée permettant de transmettre vos secrets, mots de passe, et messages importants à vos proches si vous ne donnez plus signe de vie.

![Aperçu de Life Switch](https://img.shields.io/badge/Status-Version%201.0.4-emerald)
![Encryption](https://img.shields.io/badge/Security-AES--256-blue)
![Languages](https://img.shields.io/badge/Languages-11%20Supported-orange)

## ✨ Fonctionnalités Clés

- **🤖 Carnet AI**: Un compagnon intelligent capable d'analyser vos émotions, de vous donner des conseils de sécurité et de générer des rapports chiffrés.
- **🛡️ Sécurité de Niveau Militaire**: Chiffrement AES-256 de bout en bout. Vos données sont chiffrées sur votre appareil ; nous n'avons jamais accès à vos secrets.
- **⏱️ Protocole Life's Switch**: Un bouton "Pulse" à presser régulièrement. Si le compte à rebours expire, vos bénéficiaires reçoivent automatiquement un accès sécurisé.
- **📁 Coffre-fort Multimédia**: Stockez des messages textuels, mais aussi des photos et des vidéos.
- **🔔 Système de Notification**: Alertes push (Web & Mobile via Firebase) pour vous rappeler de confirmer votre présence.
- **🌍 Multilingue**: Support complet pour 11 langues (FR, EN, ES, DE, IT, PT, AR, ZH, JA, RU, NL).
- **🔒 Protection Biométrique**: Sécurisez l'accès à l'application via FaceID ou empreinte digitale (sur mobile).

## 🛠️ Stack Technique

- **Frontend**: Vite, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Framer Motion, Lucide React
- **Backend**: Firebase (Auth, Firestore, Cloud Messaging, App Check)
- **Stockage**: Supabase Storage
- **Cryptographie**: CryptoJS (AES-256)
- **Mobile**: Capacitor (Support Android/iOS natif)
- **AI**: OpenRouter API (Accessibilité aux modèles LLM avancés)

## 🧠 Comment ça marche (Technique)

Le projet repose sur une architecture **Zero-Knowledge** et un système de **Life's Switch** :

1.  **Chiffrement Local** : Quand vous créez un secret, il est chiffré dans le navigateur à l'aide de `CryptoJS` (AES-256) avec une clé dérivée de votre UID Firebase et d'un sel statique.
2.  **Stockage** : Seul le contenu *chiffré* est envoyé à Firestore. Même les administrateurs de la base de données ne peuvent pas lire vos messages.
3.  **Le Pulse** : Chaque pression sur le bouton "Vivant" met à jour le champ `last_check_in` dans votre profil Firestore.
4.  **Déclenchement Automatique** : Un service backend (Cloud Functions ou monitoring) surveille les timers. Si `maintenant - last_check_in > timer_choisi`, le système libère les clés d'accès (ou les documents chiffrés) aux emails des bénéficiaires désignés.
5.  **Carnet AI** : Utilise le contexte local (score de sécurité, humeur) pour fournir des conseils sans jamais stocker ces données en clair sur un serveur tiers.

## 🚀 Installation et Lancement

Le projet nécessite Node.js installé.

### Étapes :

```sh
# 1. Cloner le projet
git clone [URL_DU_REPO]
cd life-switch-mvp-main

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
# Créez un fichier .env à la racine avec vos clés Firebase, Supabase et OpenRouter
cp .env.example .env

# 4. Lancer le serveur de développement
npm run dev
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

## ⚖️ Licence

Ce projet est sous licence **GPLv3**. Voir le fichier [LICENSE](LICENSE) pour plus d'informations.

---
*Ce projet a été conçu avec une priorité absolue sur la confidentialité et la souveraineté numérique des utilisateurs.*
