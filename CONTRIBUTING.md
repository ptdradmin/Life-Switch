# 🤝 Contributing to Life Switch

Thank you for your interest in **Life Switch**. As a commercial open-source project, we welcome contributions that enhance security, improve user experience, and expand our international reach.

---

## 🚀 How to Participate?

### 1. Reporting Issues
If you find a bug or have an idea for an improvement, please [open an issue](https://github.com/ptdradmin/Life-Switch/issues). Be as specific as possible in your descriptions to help us reproduce the problem.

### 2. Submitting Code (Pull Requests)
1. **Fork** the repository.
2. Create a descriptive branch: `git checkout -b feature/your-feature-name` or `git checkout -b fix/bug-name`.
3. Ensure your code follows our standards:
   - **TypeScript**: Strict typing is required.
   - **Tailwind CSS**: Respect the existing design system.
   - **i18n**: Any new text string must be localized.
4. **Test** your changes locally using `npm run dev`.
5. Submit your **Pull Request** with a detailed explanation of your modifications.

---

## 🌍 Internationalization (i18n)

Life Switch currently supports **12 languages**. To contribute to translations:
- Language files are located in `src/i18n/locales/*.json`.
- Do not directly modify the `src/i18n/translations.ts` file for long texts; use the JSON files instead.
- Use the `sync_locales.js` script to maintain consistency across languages.
- **Golden Rule**: No visual symbols (like padlocks 🔒) should be included within the translation strings.

---

## 🛡️ Security & Privacy

Security is our top priority (**Zero-Knowledge**).
- **Vulnerabilities**: If you discover a critical security flaw, **do not disclose it publicly**. Please contact us directly via email or the app's support for responsible disclosure.
- **Cryptography**: Any modification affecting the `CryptoJS` module or the AES-256 encryption logic will undergo a very strict audit.

---

## 🛠️ Development Stack

Ensure you have the following tools for an optimal development environment:
- **Node.js 18+**
- **Firebase CLI** (for hosting and functions)
- **Supabase CLI** (for storage and database)

---

## ⚖️ License & Code of Conduct

- By contributing, you agree that your code will be published under the **GPLv3** license.
- Remain professional, respectful, and constructive in all your interactions.

---
*Life Switch — Let's build tomorrow's digital fortress together.*
