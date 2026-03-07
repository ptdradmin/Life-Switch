# 🤝 Contribuer à Life Switch

Merci de votre intérêt pour **Life Switch**. En tant que projet commercial à source ouverte, nous accueillons les contributions qui renforcent la sécurité, améliorent l'expérience utilisateur et étendent notre portée internationale.

---

## 🚀 Comment Participer ?

### 1. Signaler des Problèmes (Issues)
Si vous trouvez un bug ou si vous avez une idée d'amélioration, [ouvrez une issue](https://github.com/ptdradmin/Life-Switch/issues). Soyez précis dans vos descriptions pour nous aider à reproduire le problème.

### 2. Soumissions de Code (Pull Requests)
1. **Fork** le dépôt.
2. Créez une branche descriptive : `git checkout -b feature/nom-de-votre-feature` ou `git checkout -b fix/nom-du-bug`.
3. Assurez-vous que votre code suit nos standards :
   - **TypeScript** : Typage strict requis.
   - **Tailwind CSS** : Respectez le design system existant.
   - **i18n** : Toute nouvelle chaîne de caractères doit être localisée.
4. **Testez** vos changements localement avec `npm run dev`.
5. Soumettez votre **Pull Request** avec une explication détaillée de vos modifications.

---

## 🌍 Internationalisation (i18n)

Life Switch supporte actuellement **12 langues**. Pour contribuer aux traductions :
- Les fichiers de langues se trouvent dans `src/i18n/locales/*.json`.
- Ne modifiez pas directement le fichier `src/i18n/translations.ts` pour les textes longs ; utilisez les fichiers JSON.
- Utilisez le script `sync_locales.js` pour maintenir la cohérence entre les langues.
- **Règle d'or** : Aucun symbole visuel (comme les cadenas 🔒) ne doit être inclus dans les chaînes de traduction.

---

## 🛡️ Sécurité & Confidentialité

La sécurité est notre priorité absolue (**Zero-Knowledge**).
- **Vulnérabilités** : Si vous découvrez une faille de sécurité critique, **ne l'ouvrez pas en public**. Contactez-nous directement par email ou via le support de l'application pour une divulgation responsable.
- **Crypto** : Toute modification touchant au module `CryptoJS` ou à la logique de chiffrement AES-256 fera l'objet d'un audit très strict.

---

## 🛠️ Stack de Développement

Assurez-vous d'avoir les outils suivants pour un environnement de travail optimal :
- **Node.js 18+**
- **Firebase CLI** (pour l'hébergement et les fonctions)
- **Supabase CLI** (pour le stockage et la base de données)

---

## ⚖️ Licence & Code de Conduite

- En contribuant, vous acceptez que votre code soit publié sous licence **GPLv3**.
- Restez professionnel, respectueux et constructif dans tous vos échanges.

---
*Life Switch — Construisons ensemble la forteresse numérique de demain.*
