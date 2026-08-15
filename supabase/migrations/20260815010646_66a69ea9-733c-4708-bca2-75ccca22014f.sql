-- Indexes for paginated feeds
CREATE INDEX IF NOT EXISTS idx_businesses_feed ON public.businesses (community_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_feed ON public.professional_profiles (community_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_feed ON public.properties (community_id, is_published, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_feed ON public.gigs (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_feed ON public.jobs (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_items_feed ON public.market_items (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_feed ON public.listings (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business ON public.business_reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_pro ON public.professional_reviews (professional_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_pro ON public.portfolio_items (professional_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_business_hours_business ON public.business_hours (business_id);
CREATE INDEX IF NOT EXISTS idx_business_promotions_business ON public.business_promotions (business_id, is_active);

-- Aggregated read views (RLS of underlying tables applies via security_invoker)
CREATE OR REPLACE VIEW public.business_cards
WITH (security_invoker = true) AS
SELECT
  b.*,
  r.rating_avg,
  COALESCE(r.rating_count, 0)::int AS rating_count,
  COALESCE(p.promo_count, 0)::int AS promo_count,
  COALESCE(h.is_open_now, false) AS is_open_now
FROM public.businesses b
LEFT JOIN LATERAL (
  SELECT AVG(br.rating)::numeric AS rating_avg, COUNT(*) AS rating_count
  FROM public.business_reviews br WHERE br.business_id = b.id
) r ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS promo_count
  FROM public.business_promotions bp
  WHERE bp.business_id = b.id AND bp.is_active
    AND (bp.ends_at IS NULL OR bp.ends_at > now())
) p ON true
LEFT JOIN LATERAL (
  SELECT bool_or(
    NOT bh.is_closed AND bh.opens_at IS NOT NULL AND bh.closes_at IS NOT NULL AND (
      CASE WHEN bh.closes_at <= bh.opens_at
        THEN (now() AT TIME ZONE 'America/Sao_Paulo')::time >= bh.opens_at
          OR (now() AT TIME ZONE 'America/Sao_Paulo')::time <= bh.closes_at
        ELSE (now() AT TIME ZONE 'America/Sao_Paulo')::time BETWEEN bh.opens_at AND bh.closes_at
      END
    )
  ) AS is_open_now
  FROM public.business_hours bh
  WHERE bh.business_id = b.id
    AND bh.weekday = EXTRACT(DOW FROM (now() AT TIME ZONE 'America/Sao_Paulo'))::smallint
) h ON true;

GRANT SELECT ON public.business_cards TO anon, authenticated;
GRANT ALL ON public.business_cards TO service_role;

CREATE OR REPLACE VIEW public.professional_cards
WITH (security_invoker = true) AS
SELECT
  pp.*,
  r.rating_avg,
  COALESCE(r.rating_count, 0)::int AS rating_count,
  COALESCE(pf.portfolio_count, 0)::int AS portfolio_count,
  s.price_from_cents,
  pr.display_name,
  pr.avatar_url AS owner_avatar_url
FROM public.professional_profiles pp
LEFT JOIN LATERAL (
  SELECT AVG(rv.rating)::numeric AS rating_avg, COUNT(*) AS rating_count
  FROM public.professional_reviews rv WHERE rv.professional_id = pp.id
) r ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS portfolio_count
  FROM public.portfolio_items pi WHERE pi.professional_id = pp.id
) pf ON true
LEFT JOIN LATERAL (
  SELECT MIN(ps.price_from_cents) AS price_from_cents
  FROM public.professional_services ps WHERE ps.professional_id = pp.id
) s ON true
LEFT JOIN public.profiles pr ON pr.user_id = pp.user_id;

GRANT SELECT ON public.professional_cards TO anon, authenticated;
GRANT ALL ON public.professional_cards TO service_role;

CREATE OR REPLACE VIEW public.job_cards
WITH (security_invoker = true) AS
SELECT
  j.*,
  COALESCE(j.salary_min_cents, j.salary_cents, j.salary_max_cents) AS salary_floor_cents
FROM public.jobs j;

GRANT SELECT ON public.job_cards TO anon, authenticated;
GRANT ALL ON public.job_cards TO service_role;