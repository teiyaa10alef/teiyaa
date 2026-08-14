-- 1. Novos campos de vaga
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS company_logo_url text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS company_site text,
  ADD COLUMN IF NOT EXISTS company_about text,
  ADD COLUMN IF NOT EXISTS experience_level text NOT NULL DEFAULT 'sem_experiencia',
  ADD COLUMN IF NOT EXISTS education_level text NOT NULL DEFAULT 'indiferente',
  ADD COLUMN IF NOT EXISTS openings smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_pcd boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS weekly_hours smallint,
  ADD COLUMN IF NOT EXISTS schedule text,
  ADD COLUMN IF NOT EXISTS shift_start time,
  ADD COLUMN IF NOT EXISTS shift_end time,
  ADD COLUMN IF NOT EXISTS starts_on date,
  ADD COLUMN IF NOT EXISTS salary_min_cents integer,
  ADD COLUMN IF NOT EXISTS salary_max_cents integer,
  ADD COLUMN IF NOT EXISTS has_commission boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_on date,
  ADD COLUMN IF NOT EXISTS requires_cv boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_cover_letter boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS screening_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS closed_reason text;

-- 2. Novos campos de candidatura
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS cv_path text,
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cover_letter text,
  ADD COLUMN IF NOT EXISTS owner_notes text,
  ADD COLUMN IF NOT EXISTS seen_at timestamptz;

-- 3. Perfil de candidato
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  headline text,
  bio text,
  availability text NOT NULL DEFAULT 'imediata',
  shifts text[] NOT NULL DEFAULT '{}',
  has_cnh boolean NOT NULL DEFAULT false,
  has_vehicle boolean NOT NULL DEFAULT false,
  skills text[] NOT NULL DEFAULT '{}',
  experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  whatsapp text,
  phone text,
  cv_path text,
  cv_name text,
  cv_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_profiles TO authenticated;
GRANT ALL ON public.candidate_profiles TO service_role;

ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_applied_to_my_job(_candidate_id uuid, _owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.applicant_id = _candidate_id
      AND j.owner_id = _owner_id
  );
$$;

DROP POLICY IF EXISTS "candidate_profiles_select_own" ON public.candidate_profiles;
CREATE POLICY "candidate_profiles_select_own"
  ON public.candidate_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "candidate_profiles_select_job_owner" ON public.candidate_profiles;
CREATE POLICY "candidate_profiles_select_job_owner"
  ON public.candidate_profiles FOR SELECT TO authenticated
  USING (public.has_applied_to_my_job(user_id, auth.uid()));

DROP POLICY IF EXISTS "candidate_profiles_insert_own" ON public.candidate_profiles;
CREATE POLICY "candidate_profiles_insert_own"
  ON public.candidate_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "candidate_profiles_update_own" ON public.candidate_profiles;
CREATE POLICY "candidate_profiles_update_own"
  ON public.candidate_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "candidate_profiles_delete_own" ON public.candidate_profiles;
CREATE POLICY "candidate_profiles_delete_own"
  ON public.candidate_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS candidate_profiles_set_updated_at ON public.candidate_profiles;
CREATE TRIGGER candidate_profiles_set_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Políticas do bucket privado de currículos
DROP POLICY IF EXISTS "resumes_read_own" ON storage.objects;
CREATE POLICY "resumes_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "resumes_insert_own" ON storage.objects;
CREATE POLICY "resumes_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "resumes_update_own" ON storage.objects;
CREATE POLICY "resumes_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "resumes_delete_own" ON storage.objects;
CREATE POLICY "resumes_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);