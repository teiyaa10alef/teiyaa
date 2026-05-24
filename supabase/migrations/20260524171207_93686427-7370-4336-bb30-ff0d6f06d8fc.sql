
-- Enum de categorias
CREATE TYPE public.listing_category AS ENUM ('comercio', 'servico', 'imovel', 'freelance', 'vaga');
CREATE TYPE public.listing_status AS ENUM ('active', 'paused', 'archived');

-- Estados
CREATE TABLE public.states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cidades
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (state_id, slug)
);
CREATE INDEX idx_cities_state ON public.cities(state_id);

-- Comunidades
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (city_id, slug)
);
CREATE INDEX idx_communities_city ON public.communities(city_id);
CREATE INDEX idx_communities_active ON public.communities(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_communities_slug_unique ON public.communities(slug);

-- Anúncios
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  category public.listing_category NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER,
  contact_whatsapp TEXT,
  contact_phone TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_listings_feed ON public.listings(community_id, category, status, created_at DESC);
CREATE INDEX idx_listings_owner ON public.listings(owner_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Leitura pública de geografia
CREATE POLICY "states are viewable by everyone"
  ON public.states FOR SELECT USING (true);
CREATE POLICY "cities are viewable by everyone"
  ON public.cities FOR SELECT USING (true);
CREATE POLICY "communities are viewable by everyone"
  ON public.communities FOR SELECT USING (true);

-- Listings: leitura pública só de ativos; dono vê tudo dele
CREATE POLICY "active listings are viewable by everyone"
  ON public.listings FOR SELECT USING (status = 'active');
CREATE POLICY "owners can view their own listings"
  ON public.listings FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "authenticated users can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owners can update their own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owners can delete their own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);
