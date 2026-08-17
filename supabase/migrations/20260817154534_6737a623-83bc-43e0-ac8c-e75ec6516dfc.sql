CREATE TYPE public.listing_category AS ENUM ('comercio', 'servico', 'imovel', 'freelance', 'vaga');
CREATE TYPE public.listing_status AS ENUM ('active', 'paused', 'archived');

CREATE TABLE public.states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (state_id, slug)
);
CREATE INDEX idx_cities_state ON public.cities(state_id);

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

GRANT SELECT ON public.states TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.states TO authenticated;
GRANT ALL ON public.states TO service_role;
GRANT SELECT ON public.cities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT ALL ON public.cities TO service_role;
GRANT SELECT ON public.communities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

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

ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "states are viewable by everyone"
  ON public.states FOR SELECT USING (true);
CREATE POLICY "cities are viewable by everyone"
  ON public.cities FOR SELECT USING (true);
CREATE POLICY "communities are viewable by everyone"
  ON public.communities FOR SELECT USING (true);

CREATE POLICY "active listings are viewable by everyone"
  ON public.listings FOR SELECT USING (status = 'active');
CREATE POLICY "owners can view their own listings"
  ON public.listings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "authenticated users can create listings"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owners can update their own listings"
  ON public.listings FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owners can delete their own listings"
  ON public.listings FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  is_professional boolean NOT NULL DEFAULT false,
  is_business boolean NOT NULL DEFAULT false,
  bio text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
  profession text NOT NULL,
  headline text,
  about text,
  years_experience int,
  service_area_km int,
  whatsapp text,
  phone text,
  instagram text,
  avatar_url text,
  cover_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.professional_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_profiles TO authenticated;
GRANT ALL ON public.professional_profiles TO service_role;

ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published professional profiles viewable by everyone"
  ON public.professional_profiles FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);
CREATE POLICY "users insert own professional profile"
  ON public.professional_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own professional profile"
  ON public.professional_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own professional profile"
  ON public.professional_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_professional_profiles
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_from_cents int,
  price_unit text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.professional_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_services TO authenticated;
GRANT ALL ON public.professional_services TO service_role;

ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "professional services viewable by everyone"
  ON public.professional_services FOR SELECT USING (true);
CREATE POLICY "owner manages own professional services insert"
  ON public.professional_services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.id = professional_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "owner manages own professional services update"
  ON public.professional_services FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.id = professional_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "owner manages own professional services delete"
  ON public.professional_services FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.id = professional_id AND p.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.portfolio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio items viewable by everyone"
  ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "owner manages own portfolio insert"
  ON public.portfolio_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.id = professional_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "owner manages own portfolio update"
  ON public.portfolio_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.id = professional_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "owner manages own portfolio delete"
  ON public.portfolio_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.professional_profiles p
    WHERE p.id = professional_id AND p.user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text,
  description text,
  logo_url text,
  cover_url text,
  address text,
  lat double precision,
  lng double precision,
  whatsapp text,
  phone text,
  instagram text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.businesses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published businesses viewable by everyone"
  ON public.businesses FOR SELECT
  USING (is_published = true OR auth.uid() = owner_id);
CREATE POLICY "users insert own businesses"
  ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users update own businesses"
  ON public.businesses FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users delete own businesses"
  ON public.businesses FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER set_updated_at_businesses
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens_at time,
  closes_at time,
  is_closed boolean NOT NULL DEFAULT false,
  UNIQUE (business_id, weekday)
);

GRANT SELECT ON public.business_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT ALL ON public.business_hours TO service_role;

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business hours viewable by everyone"
  ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "owner manages own business hours insert"
  ON public.business_hours FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "owner manages own business hours update"
  ON public.business_hours FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "owner manages own business hours delete"
  ON public.business_hours FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.business_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_cents int,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.business_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_services TO authenticated;
GRANT ALL ON public.business_services TO service_role;

ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business services viewable by everyone"
  ON public.business_services FOR SELECT USING (true);
CREATE POLICY "owner manages own business services insert"
  ON public.business_services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "owner manages own business services update"
  ON public.business_services FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "owner manages own business services delete"
  ON public.business_services FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.business_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.business_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_media TO authenticated;
GRANT ALL ON public.business_media TO service_role;

ALTER TABLE public.business_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business media viewable by everyone"
  ON public.business_media FOR SELECT USING (true);
CREATE POLICY "owner manages own business media insert"
  ON public.business_media FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "owner manages own business media update"
  ON public.business_media FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "owner manages own business media delete"
  ON public.business_media FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

CREATE POLICY "profiles-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles-media');
CREATE POLICY "profiles-media authenticated upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profiles-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "profiles-media owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profiles-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "profiles-media owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profiles-media' AND auth.uid()::text = (storage.foldername(name))[1]);