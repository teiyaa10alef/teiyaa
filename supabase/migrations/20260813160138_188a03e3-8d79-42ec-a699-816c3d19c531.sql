CREATE TYPE public.property_purpose AS ENUM ('aluguel', 'venda');
CREATE TYPE public.property_kind AS ENUM ('casa', 'apartamento', 'kitnet', 'quarto', 'terreno', 'comercial');
CREATE TYPE public.property_status AS ENUM ('active', 'reserved', 'rented', 'sold', 'paused');

CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  community_id uuid REFERENCES public.communities(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  purpose public.property_purpose NOT NULL DEFAULT 'aluguel',
  kind public.property_kind NOT NULL DEFAULT 'casa',
  price_cents integer,
  condo_cents integer,
  iptu_cents integer,
  bedrooms smallint NOT NULL DEFAULT 0,
  bathrooms smallint NOT NULL DEFAULT 0,
  parking_spots smallint NOT NULL DEFAULT 0,
  area_m2 integer,
  is_furnished boolean NOT NULL DEFAULT false,
  accepts_pets boolean NOT NULL DEFAULT false,
  address_hint text,
  address text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  whatsapp text,
  phone text,
  status public.property_status NOT NULL DEFAULT 'active',
  is_published boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  whatsapp_click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published properties are public"
  ON public.properties FOR SELECT
  USING (is_published = true AND status <> 'paused');

CREATE POLICY "Owners read own properties"
  ON public.properties FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners insert own properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners update own properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners delete own properties"
  ON public.properties FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE INDEX idx_properties_community ON public.properties(community_id);
CREATE INDEX idx_properties_purpose ON public.properties(purpose);
CREATE INDEX idx_properties_published ON public.properties(is_published, status);

CREATE TRIGGER set_updated_at_properties
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

GRANT SELECT, INSERT, DELETE ON public.property_favorites TO authenticated;
GRANT ALL ON public.property_favorites TO service_role;

ALTER TABLE public.property_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own property favorites"
  ON public.property_favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users add own property favorites"
  ON public.property_favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own property favorites"
  ON public.property_favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_property_view(_property_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.properties SET view_count = view_count + 1 WHERE id = _property_id AND is_published = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_property_whatsapp_click(_property_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.properties SET whatsapp_click_count = whatsapp_click_count + 1 WHERE id = _property_id AND is_published = true;
$$;