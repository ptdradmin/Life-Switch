import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { db, messaging } from "./firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getToken } from "firebase/messaging";

export async function requestNotificationPermission(userId: string) {
    if (!Capacitor.isNativePlatform()) {
        const msg = await messaging();
        if (msg) {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const token = await getToken(msg, {
                        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
                    });
                    if (token) {
                        console.log("Web Push Token:", token);
                        const userRef = doc(db, "profiles", userId);
                        await updateDoc(userRef, {
                            fcm_tokens: arrayUnion(token)
                        });
                    }
                }
            } catch (err) {
                console.error("Web Notification error:", err);
            }
        }
        return;
    }

    try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted") {
            throw new Error("User denied permissions!");
        }

        await PushNotifications.register();

        PushNotifications.addListener("registration", async (token) => {
            console.log("Push registration success, token: " + token.value);
            const userRef = doc(db, "profiles", userId);
            await updateDoc(userRef, {
                fcm_tokens: arrayUnion(token.value)
            });
        });

        PushNotifications.addListener("registrationError", (error) => {
            console.error("Error on registration: " + JSON.stringify(error));
        });

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("Push received: " + JSON.stringify(notification));
        });

    } catch (err) {
        console.error("FCM Permission error: ", err);
    }
}

export const setupFCMListener = async (onCallReceived: (callerName: string) => void) => {
    if (!Capacitor.isNativePlatform()) return;

    PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
        console.log("Push action performed: " + JSON.stringify(notification));
        const data = notification.notification.data;
        if (data?.type === "URGENT_CALL") {
            onCallReceived(data.callerName || "Un utilisateur");
        }
    });
};

/**
 * Simule l'envoi d'une notification locale pour le test
 */
export const testNotification = () => {
    if (Notification.permission === 'granted') {
        new Notification("Life Switch", {
            body: "Ceci est une notification de test de Carnet ! 🤖",
            icon: "/favicon.png"
        });
    } else {
        alert("Permission de notification non accordée. Veuillez l'activer dans votre navigateur.");
    }
};
