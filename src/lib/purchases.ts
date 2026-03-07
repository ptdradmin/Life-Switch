import { CapacitorPurchases, Package, Offering } from '@capgo/capacitor-purchases';
import { Capacitor } from '@capacitor/core';
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * Service to handle In-App Purchases using Capacitor Purchases (Capgo)
 */
export class PurchaseService {
    private static isInitialized = false;

    /**
     * Initialize the purchase service.
     * Note: You need to set your API keys if using a proxy, 
     * but @capgo/capacitor-purchases can also work directly with stores.
     */
    static async initialize() {
        if (!Capacitor.isNativePlatform() || this.isInitialized) return;

        try {
            // Configuration is usually handled automatically on native side
            // but we can call configure if needed.
            // await CapacitorPurchases.configure({ apiKey: 'YOUR_PUBLIC_API_KEY' });
            this.isInitialized = true;
            console.log("Purchase Service Initialized");
        } catch (e) {
            console.error("Purchase Init Error:", e);
        }
    }

    /**
     * Get available products/offerings from the store
     */
    static async getOfferings(): Promise<Offering | null> {
        if (!Capacitor.isNativePlatform()) return null;
        try {
            const result = await CapacitorPurchases.getOfferings();
            return result.offerings.current || null;
        } catch (e) {
            console.error("Get Offerings Error:", e);
            return null;
        }
    }

    /**
     * Execute a purchase
     */
    static async purchasePackage(pkg: Package, userId: string): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            console.warn("Purchase only available on native platforms.");
            return false;
        }

        try {
            const result = await CapacitorPurchases.purchasePackage({
                identifier: pkg.identifier,
                offeringIdentifier: pkg.offeringIdentifier
            });

            // If successful, update the user profile in Firestore
            if (result.customerInfo) {
                const profileRef = doc(db, "profiles", userId);
                await updateDoc(profileRef, {
                    is_premium: true,
                    premium_since: new Date().toISOString(),
                    subscription_id: pkg.identifier
                });
                return true;
            }
            return false;
        } catch (e: any) {
            if (e.userCancelled) {
                console.log("User cancelled purchase");
            } else {
                console.error("Purchase Error:", e);
            }
            return false;
        }
    }

    /**
     * Restore previous purchases
     */
    static async restorePurchases(userId: string): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return false;
        try {
            const result = await CapacitorPurchases.restorePurchases();
            // Check if any active entitlements exist
            const hasActivePremium = Object.keys(result.customerInfo.entitlements.active).length > 0;

            if (hasActivePremium) {
                const profileRef = doc(db, "profiles", userId);
                await updateDoc(profileRef, { is_premium: true });
                return true;
            }
            return false;
        } catch (e) {
            console.error("Restore Error:", e);
            return false;
        }
    }
}
