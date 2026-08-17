CREATE INDEX IF NOT EXISTS idx_pp_community ON public.professional_profiles(community_id) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_businesses_community ON public.businesses(community_id) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);

CREATE TYPE public.market_condition AS ENUM ('novo', 'seminovo', 'usado');
CREATE TYPE public.market_status AS ENUM ('active', 'reserved', 'sold', 'paused');

CREATE TABLE public.market_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  community_id uuid REFERENCES public.communities(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_cents integer,
  is_negotiable boolean NOT NULL DEFAULT true,
  condition public.market_condition NOT NULL DEFAULT 'usado',
  category text NOT NULL DEFAULT 'outros',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.market_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_items TO authenticated;
GRANT SELECT ON public.market_items TO anon;
GRANT ALL ON public.market_items TO service_role;
ALTER TABLE public.market_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market items public read" ON public.market_items FOR SELECT USING (status <> 'paused' OR auth.uid() = seller_id);
CREATE POLICY "sellers insert own items" ON public.market_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "sellers update own items" ON public.market_items FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "sellers delete own items" ON public.market_items FOR DELETE TO authenticated USING (auth.uid() = seller_id);
CREATE TRIGGER set_updated_at_market_items BEFORE UPDATE ON public.market_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX market_items_community_idx ON public.market_items (community_id, status, created_at DESC);
CREATE INDEX market_items_seller_idx ON public.market_items (seller_id);

CREATE TABLE public.market_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.market_items(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, buyer_id)
);
GRANT SELECT, INSERT, UPDATE ON public.market_conversations TO authenticated;
GRANT ALL ON public.market_conversations TO service_role;
ALTER TABLE public.market_conversations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.market_conversations c
    WHERE c.id = _conversation_id AND (c.buyer_id = _user_id OR c.seller_id = _user_id)
  );
$$;

CREATE POLICY "participants read conversations" ON public.market_conversations FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "buyers start conversations" ON public.market_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id AND buyer_id <> seller_id);
CREATE POLICY "participants update conversations" ON public.market_conversations FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id) WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TABLE public.market_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.market_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.market_messages TO authenticated;
GRANT ALL ON public.market_messages TO service_role;
ALTER TABLE public.market_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read messages" ON public.market_messages FOR SELECT TO authenticated USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "participants send messages" ON public.market_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "participants mark read" ON public.market_messages FOR UPDATE TO authenticated USING (public.is_conversation_participant(conversation_id, auth.uid()) AND sender_id <> auth.uid());
CREATE INDEX market_messages_conv_idx ON public.market_messages (conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.market_conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER touch_conversation_on_message AFTER INSERT ON public.market_messages FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();

CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TABLE public.market_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.market_items(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  message text,
  status public.offer_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.market_offers TO authenticated;
GRANT ALL ON public.market_offers TO service_role;
ALTER TABLE public.market_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties read offers" ON public.market_offers FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "buyers create offers" ON public.market_offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id AND buyer_id <> seller_id);
CREATE POLICY "sellers respond offers" ON public.market_offers FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);
CREATE TRIGGER set_updated_at_market_offers BEFORE UPDATE ON public.market_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.market_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_conversations;

REVOKE ALL ON FUNCTION public.touch_conversation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;

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

CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_published ON public.businesses(is_published);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business ON public.business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_promotions_business ON public.business_promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_business_favorites_user ON public.business_favorites(user_id);

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