import { useLocalStorage } from "./useLocalStorage";
import type { Secret } from "@/types/lifeswitch";

export function useSecrets() {
  const [secrets, setSecrets] = useLocalStorage<Secret[]>("ls_secrets", []);

  const addSecret = (title: string, content: string, beneficiary: string) => {
    const newSecret: Secret = {
      id: crypto.randomUUID(),
      title,
      content,
      beneficiary,
      createdAt: new Date().toISOString(),
    };
    setSecrets((prev) => [...prev, newSecret]);
  };

  const removeSecret = (id: string) => {
    setSecrets((prev) => prev.filter((s) => s.id !== id));
  };

  return { secrets, addSecret, removeSecret };
}
