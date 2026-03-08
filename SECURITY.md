# Politique de Sécurité (Security Policy)

## Versions Supportées

Nous maintenons et appliquons des mises à jour de sécurité pour les versions récentes du protocole Life Switch :

| Version | Statut |
| ------- | ------------------ |
| >= 1.2.x | :white_check_mark: Supporté |
| < 1.1.x | :x: Fin de vie |

## Signalement d'une vulnérabilité (Bug Bounty / Divulgation Privée)

Life Switch repose sur une architecture stricte de **Zero-Knowledge** via un chiffrement asymétrique et symétrique (AES-256-GCM). Toute vulnérabilité permettant de compromettre ou de contourner ce chiffrement est prise extrêmement au sérieux par notre équipe.

**SVP, NE CRÉEZ PAS DE TICKET GITHUB PUBLIC POUR RAPPORTER DES FAILLES CRITIQUES SUR L'ARCHITECTRE.**

Afin de protéger nos utilisateurs avant qu'un correctif de sécurité (patch) ne soit déployé, nous vous prions de suivre notre processus de divulgation responsable :

1. Contactez l'équipe de sécurité directement par email (chiffré de préférence) à : **security@life-switch.app**.
2. Fournissez une description détaillée du problème, des étapes pour le reproduire (Proof of Concept), et des informations sur votre environnement de test.
3. Ne divulguez pas les détails de la faille en ligne avant que l'équipe n'ait pu déployer un correctif.
4. Nous accuserons réception de votre rapport dans un délai de **48 heures**.

### Bug Bounty et Récompenses Pécuniaires

Bien que Life Switch ait une base open-source participative, les découvertes de vulnérabilités critiques affectant nos infrastructures distantes (Règles de sécurité Firestore, RLS Supabase) ou nos implémentations de protocoles cryptographiques (chiffrement des secrets sur le client) peuvent être éligibles à des compensations. Chaque divulgation est évaluée au cas par cas par l'administration du projet selon son niveau de sévérité (CVSS).

### Ce Qui est Hors de Portée

* Déni de Service (DDoS) sur notre base de données hébergée - Firebase et Supabase assurent déjà la sécurité de leurs API.
* Problèmes de configuration de domaines DNS ne menant pas au contournement de la Politique de Même Origine (SOP) ou au détournement de sessions.
* Spam de clés API générant des quotas, ou toute tentative de détruire activement le compte d'un autre utilisateur sans passer par une faille identifiée.
