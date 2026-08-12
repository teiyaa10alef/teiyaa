ALTER TABLE public.professional_profiles
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_click_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS is_cover boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_pro_profiles_community ON public.professional_profiles (community_id);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_published ON public.professional_profiles (is_published);
CREATE INDEX IF NOT EXISTS idx_pro_profiles_profession ON public.professional_profiles (profession);

CREATE TABLE public.professional_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, user_id)
);

GRANT SELECT ON public.professional_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_reviews TO authenticated;
GRANT ALL ON public.professional_reviews TO service_role;

ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews of published professionals"
ON public.professional_reviews FOR SELECT
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.is_published = true));

CREATE POLICY "Users can create their own review"
ON public.professional_reviews FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid())
);

CREATE POLICY "Users can update their own review"
ON public.professional_reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review"
ON public.professional_reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_professional_reviews
BEFORE UPDATE ON public.professional_reviews
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.professional_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  description text NOT NULL,
  budget_cents integer,
  contact_whatsapp text,
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','respondido','fechado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_leads TO authenticated;
GRANT ALL ON public.professional_leads TO service_role;

ALTER TABLE public.professional_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read leads"
ON public.professional_leads FOR SELECT TO authenticated
USING (
  auth.uid() = requester_id
  OR EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid())
);

CREATE POLICY "Users can create leads"
ON public.professional_leads FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Professional can update lead status"
ON public.professional_leads FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = professional_id AND p.user_id = auth.uid()));

CREATE TRIGGER set_updated_at_professional_leads
BEFORE UPDATE ON public.professional_leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.increment_professional_view(_professional_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.professional_profiles SET view_count = view_count + 1 WHERE id = _professional_id AND is_published = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_professional_whatsapp_click(_professional_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.professional_profiles SET whatsapp_click_count = whatsapp_click_count + 1 WHERE id = _professional_id AND is_published = true;
$$;