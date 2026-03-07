import admin from "firebase-admin";
import nodemailer from "nodemailer";
import fs from "fs";

// 1. Initialisation Admin Firebase
const serviceAccount = JSON.parse(fs.readFileSync("./firebase-service-account.json", "utf8"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "life-switch-mvp-2026.firebasestorage.app"
});

const db = admin.firestore();

// 2. Configuration Email (À remplir par l'utilisateur pour activer l'envoi réel)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Votre email
        pass: process.env.EMAIL_PASS  // Mot de passe d'application Google
    }
});

const GRACE_PERIOD_DAYS = 2; // Délai entre l'alerte urgente et l'envoi des secrets

async function checkDeadManSwitch() {
    console.log("🚀 Lancement de la vérification quotidienne...");

    const now = admin.firestore.Timestamp.now();
    const profilesSnap = await db.collection("profiles").get();

    for (const profileDoc of profilesSnap.docs) {
        const profile = profileDoc.data();
        const userId = profileDoc.id;

        if (!profile.last_check_in) continue;

        const lastCheckIn = profile.last_check_in.toDate();
        const diffTime = Math.abs(now.toDate() - lastCheckIn);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log(`👤 Utilisateur ${userId} : dernier pulse il y a ${diffDays} jours (Seuil: ${profile.timer_days}j)`);

        // Cas 1 : Seuil de timer dépassé -> Envoyer une alerte urgente
        if (diffDays > profile.timer_days && !profile.alert_sent_at) {
            console.log(`⚠️ ALERTE URGENTE : Le compte ${userId} a expiré. Envoi de l'alerte aux proches...`);
            await sendUrgentAlert(userId, profile.display_name || "Un utilisateur");

            // Enregistrer que l'alerte a été envoyée
            await profileDoc.ref.update({
                alert_sent_at: admin.firestore.Timestamp.now(),
                status: "URGENT_ALERT_ACTIVE"
            });
            continue;
        }

        // Cas 2 : Alerte déjà envoyée -> Vérifier si le délai de grâce est dépassé
        if (profile.alert_sent_at) {
            const alertSentAt = profile.alert_sent_at.toDate();
            const graceDiffTime = Math.abs(now.toDate() - alertSentAt);
            const graceDiffDays = Math.ceil(graceDiffTime / (1000 * 60 * 60 * 24));

            if (graceDiffDays > GRACE_PERIOD_DAYS) {
                console.log(`📡 TRANSMISSION FINALE : Délai de grâce expiré pour ${userId} (${graceDiffDays} jours). Envoi des secrets...`);
                await transmitSecrets(userId, profile.display_name || "Un utilisateur");

                // Marquer comme transmis au niveau du profil
                await profileDoc.ref.update({
                    status: "TRANSMITTED",
                    transmitted_at: admin.firestore.Timestamp.now()
                });
            } else {
                console.log(`⏳ Période de grâce en cours pour ${userId} (${graceDiffDays}/${GRACE_PERIOD_DAYS} jours restants)`);
            }
        }
    }
}

async function sendUrgentAlert(userId, userName) {
    const contactsSnap = await db.collection("contacts").where("user_id", "==", userId).get();

    for (const contactDoc of contactsSnap.docs) {
        const contact = contactDoc.data();

        // 1. Envoyer l'Email d'alerte urgente
        console.log(`📢 Envoi alerte email à ${contact.email}`);
        await sendEmailAlert(contact, userName);

        // 2. Déclencher l'APPEL dans l'application (FCM)
        // On cherche un utilisateur inscrit avec cet email pour obtenir son token
        const beneficiaryProfileSnap = await db.collection("profiles").where("email", "==", contact.email).get();

        if (!beneficiaryProfileSnap.empty) {
            const beneficiaryProfile = beneficiaryProfileSnap.docs[0].data();
            const tokens = beneficiaryProfile.fcm_tokens || [];

            for (const token of tokens) {
                console.log(`📡 Envoi d'un signal "APPEL" vers l'appareil de ${contact.name}...`);
                await sendFCMCall(token, userName);
            }
        } else {
            console.log(`ℹ️ ${contact.email} n'est pas encore inscrit sur Life Switch.`);
        }

        // 3. Déclencher l'appel téléphonique classique (IFTTT/Webhook) en secours
        if (contact.phone) {
            console.log(`📞 Appel d'urgence vers ${contact.phone}...`);
            await makeUrgentCall(contact, userName);
        }
    }
}

async function sendFCMCall(token, userName) {
    const message = {
        token: token,
        data: {
            type: "URGENT_CALL",
            callerName: userName,
            message: "URGENT : Contactez la personne immédiatement !",
        },
        android: {
            priority: "high",
            notification: {
                channelId: "urgent_alerts",
                priority: "max",
                title: "APPEL D'URGENCE LIFE SWITCH",
                body: `Appel de ${userName} qui ne répond plus au Pulse.`,
                sound: "alarm_loud.mp3",
            }
        },
        apns: {
            payload: {
                aps: {
                    contentAvailable: true,
                    critical: true,
                    sound: "alarm_loud.caf",
                }
            }
        }
    };

    try {
        await admin.messaging().send(message);
        console.log(`✅ Signal envoyé à l'appareil.`);
    } catch (e) {
        // Si le token n'est plus valide, on l'ignore (dans une prod réelle on devrait le supprimer)
        console.error("❌ Erreur d'envoi FCM (token invalide ?) :", e.message);
    }
}

async function sendEmailAlert(contact, userName) {
    const mailOptions = {
        from: '"Life Switch Alert" <noreply@life-switch.com>',
        to: contact.email,
        subject: `⚠️ URGENCE : Sans nouvelles de ${userName} via Life Switch`,
        html: `
      <div style="font-family: sans-serif; border: 2px solid red; padding: 20px;">
        <h1 style="color: red;">ALERTE D'URGENCE</h1>
        <p>Bonjour ${contact.name},</p>
        <p><strong>${userName}</strong> n'a pas donné de signe de vie sur Life Switch.</p>
        <p>Un appel téléphonique automatique a été tenté vers votre numéro.</p>
        <p>Veuillez vérifier l'état de santé de cette personne immédiatement.</p>
      </div>
    `
    };

    try {
        if (process.env.EMAIL_USER) await transporter.sendMail(mailOptions);
    } catch (e) {
        console.error("❌ Erreur email:", e);
    }
}

async function makeUrgentCall(contact, userName) {
    // Option GRATUITE : Utilisation d'un Webhook IFTTT
    // IFTTT permet de transformer un appel HTTP en un appel téléphonique réel.
    if (process.env.IFTTT_WEBHOOK_URL) {
        try {
            await fetch(process.env.IFTTT_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    value1: contact.phone,
                    value2: userName,
                    value3: contact.name
                })
            });
            console.log("✅ Requête d'appel envoyée au Webhook.");
        } catch (e) {
            console.error("❌ Erreur Webhook Appel:", e);
        }
    } else {
        console.log("ℹ️ Appel simulé (Configurez IFTTT_WEBHOOK_URL dans .env pour l'activation réelle)");
    }
}

async function transmitSecrets(userId, userName) {
    const contactsSnap = await db.collection("contacts").where("user_id", "==", userId).get();
    const contacts = {};
    contactsSnap.forEach(doc => {
        contacts[doc.id] = doc.data();
    });

    const secretsSnap = await db.collection("secrets").where("user_id", "==", userId).get();

    for (const secretDoc of secretsSnap.docs) {
        const secret = secretDoc.data();
        const beneficiary = contacts[secret.beneficiary_id];

        if (beneficiary && !secret.transmitted) {
            console.log(`📧 Envoi final du secret "${secret.title}" à ${beneficiary.email}`);

            const mailOptions = {
                from: '"Life Switch Vault" <noreply@life-switch.com>',
                to: beneficiary.email,
                subject: `[FINAL] Message confidentiel de ${userName} (Héritage Numérique)`,
                html: `
          <h1>Héritage Numérique de ${userName}</h1>
          <p>Bonjour ${beneficiary.name},</p>
          <p>Le délai de sécurité étant expiré, voici le secret que <strong>${userName}</strong> a souhaité vous transmettre :</p>
          <hr>
          <h3>Objet : ${secret.title}</h3>
          <p><strong>Contenu (Chiffré) :</strong></p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; font-family: monospace; border: 1px solid #ccc;">
            ${secret.content}
          </div>
          <p><i>Note : Ce contenu est chiffré. Utilisez la clé de déchiffrement convenue avec ${userName}.</i></p>
          <hr>
        `
            };

            try {
                if (process.env.EMAIL_USER) {
                    await transporter.sendMail(mailOptions);
                    await secretDoc.ref.update({ transmitted: true, transmitted_at: admin.firestore.Timestamp.now() });
                }
            } catch (e) {
                console.error("❌ Erreur envoi secret final:", e);
            }
        }
    }
}

checkDeadManSwitch().then(() => {
    console.log("✅ Vérification terminée.");
    process.exit(0);
}).catch(err => {
    console.error("🔥 Erreur critique:", err);
    process.exit(1);
});
