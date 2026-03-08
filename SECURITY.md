# Security Policy

## Supported Versions

We maintain and apply security updates for the recent versions of the Life Switch protocol:

| Version | Status |
| ------- | ------------------ |
| >= 1.2.x | :white_check_mark: Supported |
| < 1.1.x | :x: End of life |

## Reporting a Vulnerability (Bug Bounty / Private Disclosure)

Life Switch relies on a strict **Zero-Knowledge** architecture using asymmetric and symmetric encryption (AES-256-GCM). Any vulnerability allowing the compromise or bypass of this encryption is taken extremely seriously by our team.

**PLEASE DO NOT CREATE A PUBLIC GITHUB ISSUE TO REPORT CRITICAL ARCHITECTURE FLAWS.**

To protect our users before a security patch can be deployed, we kindly ask you to follow our responsible disclosure process:

1. Contact the security team directly by email (preferably encrypted) at: **security@life-switch.app**.
2. Provide a detailed description of the issue, steps to reproduce it (Proof of Concept), and information about your testing environment.
3. Do not disclose the details of the flaw online until the team has been able to deploy a fix.
4. We will acknowledge receipt of your report within **48 hours**.

### Bug Bounty and Financial Rewards

Although Life Switch has a participatory open-source base, discoveries of critical vulnerabilities affecting our remote infrastructures (Firestore Security Rules, Supabase RLS) or our implementations of cryptographic protocols (client-side secret encryption) may be eligible for compensation. Each disclosure is evaluated on a case-by-case basis by the project administration according to its severity level (CVSS).

### What is Out of Scope

* Denial of Service (DDoS) on our hosted database - Firebase and Supabase already ensure the security of their APIs.
* DNS domain configuration issues that do not lead to bypassing the Same-Origin Policy (SOP) or session hijacking.
* API key spamming generating quotas, or any attempt to actively destroy another user's account without going through an identified flaw.
