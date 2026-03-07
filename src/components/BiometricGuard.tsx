import { useState, useEffect } from "react";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { Lock, Fingerprint, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface BiometricGuardProps {
    children: React.ReactNode;
}

export default function BiometricGuard({ children }: BiometricGuardProps) {
    const { user, profile } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if biometric is enabled for this device/user
    const isBiometricEnabled = profile?.biometric_enabled || localStorage.getItem(`biometric_${user?.uid}`) === "true";

    useEffect(() => {
        if (!isBiometricEnabled) {
            setIsAuthenticated(true);
            return;
        }

        const checkSupport = async () => {
            if (!Capacitor.isNativePlatform()) {
                setIsSupported(false);
                setIsAuthenticated(true); // Default to true on web if enabled by mistake
                return;
            }

            try {
                const result = await NativeBiometric.isAvailable();
                setIsSupported(result.isAvailable);
                if (result.isAvailable) {
                    authenticate();
                } else {
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.error("Biometric support check failed", e);
                setIsAuthenticated(true);
            }
        };

        checkSupport();
    }, [isBiometricEnabled]);

    const authenticate = async () => {
        setError(null);
        try {
            await NativeBiometric.verifyIdentity({
                reason: "Accès au Coffre-fort",
                title: "Authentification requise",
                subtitle: "Veuillez confirmer votre identité",
                description: "Utilisez votre empreinte ou FaceID pour déverrouiller vos secrets.",
            });
            setIsAuthenticated(true);
        } catch (e: any) {
            console.error("Biometric auth failed", e);
            if (e.code === "USER_CANCELED") {
                setError("Authentification annulée.");
            } else {
                setError("Échec de l'authentification.");
            }
        }
    };

    if (!isAuthenticated && isBiometricEnabled) {
        return (
            <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Lock className="h-10 w-10" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-primary text-primary">
                        <Fingerprint className="h-5 w-5" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-black">Coffre Verrouillé</h2>
                    <p className="text-sm text-muted-foreground max-w-[250px]">
                        L'accès à votre coffre est protégé par votre sécurité biométrique.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-xs font-bold text-destructive bg-destructive/10 px-4 py-2 rounded-full">
                        <ShieldAlert className="h-3 w-3" />
                        {error}
                    </div>
                )}

                <Button onClick={authenticate} className="rounded-2xl px-8 font-bold">
                    Déverrouiller
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}
