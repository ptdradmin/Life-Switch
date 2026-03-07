
-- -----------------------------------------------------------------------------
-- 1. CONFIGURATION DU BUCKET DE STOCKAGE
-- -----------------------------------------------------------------------------

-- S'assurer que le bucket 'life-switch-files' existe et est public
INSERT INTO storage.buckets (id, name, public)
VALUES ('life-switch-files', 'life-switch-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Supprimer les anciennes policies de storage pour éviter les doublons lors des runs successifs
DROP POLICY IF EXISTS "Public Read life-switch-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert life-switch-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Update life-switch-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete life-switch-files" ON storage.objects;

-- Recréer les policies pour un accès public total au bucket
CREATE POLICY "Public Read life-switch-files" ON storage.objects FOR SELECT USING (bucket_id = 'life-switch-files');
CREATE POLICY "Public Insert life-switch-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'life-switch-files');
CREATE POLICY "Public Update life-switch-files" ON storage.objects FOR UPDATE USING (bucket_id = 'life-switch-files');
CREATE POLICY "Public Delete life-switch-files" ON storage.objects FOR DELETE USING (bucket_id = 'life-switch-files');

-- -----------------------------------------------------------------------------
-- 2. SCHÉMA DE LA BASE DE DONNÉES (IF NOT EXISTS)
-- -----------------------------------------------------------------------------

-- Profiles (Vérification existence table avant création)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        CREATE TABLE public.profiles (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          display_name TEXT,
          language TEXT NOT NULL DEFAULT 'fr',
          timer_days INTEGER NOT NULL DEFAULT 30,
          last_check_in TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE(user_id)
        );

        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Contacts (Vérification existence table avant création)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        CREATE TABLE public.contacts (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          relationship TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own contacts" ON public.contacts FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Secrets (Vérification existence table avant création)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'secrets') THEN
        CREATE TABLE public.secrets (
          id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          beneficiary_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
          media_urls TEXT[] DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own secrets" ON public.secrets FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own secrets" ON public.secrets FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own secrets" ON public.secrets FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own secrets" ON public.secrets FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. FONCTIONS ET TRIGGERS
-- -----------------------------------------------------------------------------

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_secrets_updated_at ON public.secrets;
CREATE TRIGGER update_secrets_updated_at BEFORE UPDATE ON public.secrets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
