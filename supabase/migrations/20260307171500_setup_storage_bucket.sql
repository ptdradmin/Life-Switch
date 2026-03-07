
-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Public Read life-switch-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert life-switch-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Update life-switch-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete life-switch-files" ON storage.objects;

-- S'assurer que le bucket existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('life-switch-files', 'life-switch-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Recréer les policies proprement
CREATE POLICY "Public Read life-switch-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'life-switch-files');

CREATE POLICY "Public Insert life-switch-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'life-switch-files');

CREATE POLICY "Public Update life-switch-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'life-switch-files');

CREATE POLICY "Public Delete life-switch-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'life-switch-files');

-- Rendre le bucket public (déjà fait au-dessus mais par précaution)
UPDATE storage.buckets SET public = true WHERE id = 'life-switch-files';
