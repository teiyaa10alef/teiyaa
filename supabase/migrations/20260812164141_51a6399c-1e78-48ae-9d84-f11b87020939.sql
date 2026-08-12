-- ===== Reviews =====
CREATE TABLE public.business_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

GRANT SELECT ON public.business_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_reviews TO authenticated;
GRANT ALL ON public.business_reviews TO service_role;

ALTER TABLE public.business_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.business_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON public.business_reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON public.business_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.business_reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_business_reviews
  BEFORE UPDATE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Promotions =====
CREATE TABLE public.business_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_label text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.business_promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_promotions TO authenticated;
GRANT ALL ON public.business_promotions TO service_role;

ALTER TABLE public.business_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active promotions of published businesses are public"
  ON public.business_promotions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id
        AND (b.is_published = true OR b.owner_id = auth.uid())
    )
  );

CREATE POLICY "Owners manage their promotions"
  ON public.business_promotions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_promotion_dates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ends_at IS NOT NULL AND NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'A data final da promoção deve ser posterior à data inicial';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_business_promotion_dates
  BEFORE INSERT OR UPDATE ON public.business_promotions
  FOR EACH ROW EXECUTE FUNCTION public.validate_promotion_dates();

CREATE TRIGGER set_updated_at_business_promotions
  BEFORE UPDATE ON public.business_promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Favorites =====
CREATE TABLE public.business_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

GRANT SELECT, INSERT, DELETE ON public.business_favorites TO authenticated;
GRANT ALL ON public.business_favorites TO service_role;

ALTER TABLE public.business_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own favorites"
  ON public.business_favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users add their own favorites"
  ON public.business_favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove their own favorites"
  ON public.business_favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ===== Counters on businesses =====
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_click_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_business_view(_business_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.businesses SET view_count = view_count + 1 WHERE id = _business_id AND is_published = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_business_whatsapp_click(_business_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.businesses SET whatsapp_click_count = whatsapp_click_count + 1 WHERE id = _business_id AND is_published = true;
$$;

GRANT EXECUTE ON FUNCTION public.increment_business_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_business_whatsapp_click(uuid) TO anon, authenticated;

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_businesses_community ON public.businesses(community_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_published ON public.businesses(is_published);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business ON public.business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_promotions_business ON public.business_promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_favorites_user ON public.business_favorites(user_id);