/**
 * 📁 Supabase Storage Service
 * Replaces Firebase Storage (requires Blaze plan).
 * Supabase free plan: 1 GB storage, no credit card needed.
 *
 * Bucket "life-switch-files" must already exist in Supabase Dashboard.
 */

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "life-switch-files";

/**
 * Upload a file to Supabase Storage and return its public URL
 */
export async function uploadFile(
    file: File,
    folder: string,
    userId: string,
    onProgress?: (pct: number) => void
): Promise<string> {
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${folder}/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    if (onProgress) onProgress(10);

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
    });

    if (error) throw new Error(error.message);

    if (onProgress) onProgress(100);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL
 */
export async function deleteFile(publicUrl: string): Promise<void> {
    try {
        const url = new URL(publicUrl);
        const parts = url.pathname.split(`/object/public/${BUCKET}/`);
        if (parts.length > 1) {
            await supabase.storage.from(BUCKET).remove([parts[1]]);
        }
    } catch {
        // Ignore delete errors
    }
}
