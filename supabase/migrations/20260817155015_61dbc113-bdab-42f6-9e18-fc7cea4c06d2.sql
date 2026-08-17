CREATE TYPE public.gig_status AS ENUM ('open','in_progress','completed','cancelled');
CREATE TYPE public.gig_budget_type AS ENUM ('fixed','hourly','negotiable');
CREATE TYPE public.gig_application_status AS ENUM ('sent','seen','shortlisted','accepted','rejected','withdrawn');

CREATE TABLE public.gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  community_id uuid REFERENCES public.communities(id),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget_cents integer,
  budget_type public.gig_budget_type NOT NULL DEFAULT 'fixed',
  is_negotiable boolean NOT NULL DEFAULT true,
  scheduled_date date,
  scheduled_time time,
  duration_hours numeric(5,1),
  address_hint text,
  is_urgent boolean NOT NULL DEFAULT false,
  requirements text[] NOT NULL DEFAULT '{}',
  status public.gig_status NOT NULL DEFAULT 'open',
  assigned_user_id uuid,
  applications_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gigs TO authenticated;
GRANT SELECT ON public.gigs TO anon;
GRANT ALL ON public.gigs TO service_role;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gigs_public_read" ON public.gigs FOR SELECT USING (true);
CREATE POLICY "gigs_owner_insert" ON public.gigs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "gigs_owner_update" ON public.gigs FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "gigs_owner_delete" ON public.gigs FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX idx_gigs_community ON public.gigs(community_id);
CREATE INDEX idx_gigs_status ON public.gigs(status);
CREATE TRIGGER set_updated_at_gigs BEFORE UPDATE ON public.gigs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gig_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  message text,
  proposed_cents integer,
  available_at text,
  status public.gig_application_status NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gig_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gig_applications TO authenticated;
GRANT ALL ON public.gig_applications TO service_role;
ALTER TABLE public.gig_applications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_gig_owner(_gig_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.gigs g WHERE g.id = _gig_id AND g.owner_id = _user_id);
$$;

CREATE POLICY "gig_apps_participants_read" ON public.gig_applications FOR SELECT TO authenticated
  USING (auth.uid() = applicant_id OR public.is_gig_owner(gig_id, auth.uid()));
CREATE POLICY "gig_apps_applicant_insert" ON public.gig_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_id AND NOT public.is_gig_owner(gig_id, auth.uid()));
CREATE POLICY "gig_apps_participants_update" ON public.gig_applications FOR UPDATE TO authenticated
  USING (auth.uid() = applicant_id OR public.is_gig_owner(gig_id, auth.uid()))
  WITH CHECK (auth.uid() = applicant_id OR public.is_gig_owner(gig_id, auth.uid()));
CREATE POLICY "gig_apps_applicant_delete" ON public.gig_applications FOR DELETE TO authenticated
  USING (auth.uid() = applicant_id);
CREATE INDEX idx_gig_apps_gig ON public.gig_applications(gig_id);
CREATE INDEX idx_gig_apps_applicant ON public.gig_applications(applicant_id);
CREATE TRIGGER set_updated_at_gig_applications BEFORE UPDATE ON public.gig_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.bump_gig_applications_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.gigs SET applications_count = applications_count + 1 WHERE id = NEW.gig_id;
    RETURN NEW;
  ELSE
    UPDATE public.gigs SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = OLD.gig_id;
    RETURN OLD;
  END IF;
END;
$$;
CREATE TRIGGER trg_gig_apps_count_ins AFTER INSERT ON public.gig_applications FOR EACH ROW EXECUTE FUNCTION public.bump_gig_applications_count();
CREATE TRIGGER trg_gig_apps_count_del AFTER DELETE ON public.gig_applications FOR EACH ROW EXECUTE FUNCTION public.bump_gig_applications_count();

CREATE OR REPLACE FUNCTION public.increment_gig_view(_gig_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.gigs SET view_count = view_count + 1 WHERE id = _gig_id;
$$;

CREATE TABLE public.gig_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.gig_applications(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gig_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE ON public.gig_conversations TO authenticated;
GRANT ALL ON public.gig_conversations TO service_role;
ALTER TABLE public.gig_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gig_conv_participants_read" ON public.gig_conversations FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = applicant_id);
CREATE POLICY "gig_conv_participants_update" ON public.gig_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = applicant_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = applicant_id);

CREATE OR REPLACE FUNCTION public.is_gig_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gig_conversations c
    WHERE c.id = _conversation_id AND (c.owner_id = _user_id OR c.applicant_id = _user_id)
  );
$$;

CREATE TABLE public.gig_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.gig_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.gig_messages TO authenticated;
GRANT ALL ON public.gig_messages TO service_role;
ALTER TABLE public.gig_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gig_msg_participants_read" ON public.gig_messages FOR SELECT TO authenticated
  USING (public.is_gig_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "gig_msg_participants_update" ON public.gig_messages FOR UPDATE TO authenticated
  USING (public.is_gig_conversation_participant(conversation_id, auth.uid()))
  WITH CHECK (public.is_gig_conversation_participant(conversation_id, auth.uid()));
CREATE INDEX idx_gig_messages_conv ON public.gig_messages(conversation_id);

CREATE OR REPLACE FUNCTION public.touch_gig_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.gig_conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER touch_gig_conversation_on_message AFTER INSERT ON public.gig_messages FOR EACH ROW EXECUTE FUNCTION public.touch_gig_conversation();

CREATE TABLE public.gig_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'freelancer',
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gig_id, reviewer_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gig_reviews TO authenticated;
GRANT SELECT ON public.gig_reviews TO anon;
GRANT ALL ON public.gig_reviews TO service_role;
ALTER TABLE public.gig_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gig_reviews_public_read" ON public.gig_reviews FOR SELECT USING (true);
CREATE POLICY "gig_reviews_author_insert" ON public.gig_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND EXISTS (
    SELECT 1 FROM public.gigs g WHERE g.id = gig_id AND g.status = 'completed'
      AND (g.owner_id = auth.uid() OR g.assigned_user_id = auth.uid())
  ));
CREATE POLICY "gig_reviews_author_update" ON public.gig_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "gig_reviews_author_delete" ON public.gig_reviews FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_id);
CREATE INDEX idx_gig_reviews_reviewee ON public.gig_reviews(reviewee_id);
CREATE TRIGGER set_updated_at_gig_reviews BEFORE UPDATE ON public.gig_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text not null,
  body text,
  link_path text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notifications select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id) WHERE read_at IS NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE OR REPLACE FUNCTION public.push_notification(
  _user_id uuid, _type text, _title text, _body text, _link_path text, _entity_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link_path, entity_id)
  VALUES (_user_id, _type, _title, _body, _link_path, _entity_id);
END; $$;
REVOKE ALL ON FUNCTION public.push_notification(uuid, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_market_offer() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  SELECT title INTO t FROM public.market_items WHERE id = NEW.item_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.push_notification(NEW.seller_id, 'market_offer', 'Nova proposta recebida',
      'Proposta de R$ ' || to_char(NEW.amount_cents/100.0,'FM999999990.00') || ' em "' || coalesce(t,'seu item') || '"',
      '/mercado/' || NEW.item_id, NEW.item_id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected') THEN
    PERFORM public.push_notification(NEW.buyer_id, 'market_offer_status',
      CASE WHEN NEW.status = 'accepted' THEN 'Proposta aceita' ELSE 'Proposta recusada' END,
      'Item: ' || coalesce(t,'—'), '/mercado/' || NEW.item_id, NEW.item_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_market_offer_ins AFTER INSERT ON public.market_offers
  FOR EACH ROW EXECUTE FUNCTION public.notify_market_offer();
CREATE TRIGGER notify_market_offer_upd AFTER UPDATE ON public.market_offers
  FOR EACH ROW EXECUTE FUNCTION public.notify_market_offer();

CREATE OR REPLACE FUNCTION public.notify_market_conversation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  SELECT title INTO t FROM public.market_items WHERE id = NEW.item_id;
  PERFORM public.push_notification(NEW.seller_id, 'market_conversation', 'Novo interessado',
    'Alguém quer falar sobre "' || coalesce(t,'seu item') || '"',
    '/mensagens/' || NEW.id, NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_market_conversation_ins AFTER INSERT ON public.market_conversations
  FOR EACH ROW EXECUTE FUNCTION public.notify_market_conversation();

CREATE OR REPLACE FUNCTION public.notify_market_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; target uuid;
BEGIN
  SELECT * INTO c FROM public.market_conversations WHERE id = NEW.conversation_id;
  target := CASE WHEN NEW.sender_id = c.buyer_id THEN c.seller_id ELSE c.buyer_id END;
  PERFORM public.push_notification(target, 'market_message', 'Nova mensagem',
    left(NEW.body, 120), '/mensagens/' || NEW.conversation_id, NEW.conversation_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_market_message_ins AFTER INSERT ON public.market_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_market_message();

CREATE OR REPLACE FUNCTION public.notify_gig_application() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g record;
BEGIN
  SELECT id, title, owner_id INTO g FROM public.gigs WHERE id = NEW.gig_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.push_notification(g.owner_id, 'gig_application', 'Nova candidatura',
      'Alguém se candidatou ao bico "' || coalesce(g.title,'—') || '"',
      '/conta/freelances/' || NEW.gig_id, NEW.gig_id);
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected','shortlisted') THEN
    PERFORM public.push_notification(NEW.applicant_id, 'gig_application_status',
      CASE NEW.status WHEN 'accepted' THEN 'Candidatura aceita'
                      WHEN 'rejected' THEN 'Candidatura recusada'
                      ELSE 'Você está na lista' END,
      'Bico: ' || coalesce(g.title,'—'), '/conta/candidaturas', NEW.gig_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_gig_application_ins AFTER INSERT ON public.gig_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_gig_application();
CREATE TRIGGER notify_gig_application_upd AFTER UPDATE ON public.gig_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_gig_application();

CREATE OR REPLACE FUNCTION public.notify_gig_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; target uuid;
BEGIN
  SELECT * INTO c FROM public.gig_conversations WHERE id = NEW.conversation_id;
  target := CASE WHEN NEW.sender_id = c.owner_id THEN c.applicant_id ELSE c.owner_id END;
  PERFORM public.push_notification(target, 'gig_message', 'Nova mensagem de bico',
    left(NEW.body, 120), '/mensagens/bico/' || NEW.conversation_id, NEW.conversation_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_gig_message_ins AFTER INSERT ON public.gig_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_gig_message();

CREATE OR REPLACE FUNCTION public.notify_business_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b record;
BEGIN
  SELECT owner_id, name, slug INTO b FROM public.businesses WHERE id = NEW.business_id;
  PERFORM public.push_notification(b.owner_id, 'business_review', 'Nova avaliação no seu negócio',
    NEW.rating || ' estrelas em "' || coalesce(b.name,'—') || '"',
    '/negocios/' || b.slug, NEW.business_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_business_review_ins AFTER INSERT ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_business_review();

CREATE OR REPLACE FUNCTION public.notify_professional_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record;
BEGIN
  SELECT user_id INTO p FROM public.professional_profiles WHERE id = NEW.professional_id;
  PERFORM public.push_notification(p.user_id, 'professional_review', 'Nova avaliação no seu perfil',
    NEW.rating || ' estrelas', '/conta/profissional', NEW.professional_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_professional_review_ins AFTER INSERT ON public.professional_reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_professional_review();

CREATE OR REPLACE FUNCTION public.notify_professional_lead() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p record;
BEGIN
  SELECT user_id INTO p FROM public.professional_profiles WHERE id = NEW.professional_id;
  PERFORM public.push_notification(p.user_id, 'professional_lead', 'Novo pedido de orçamento',
    left(NEW.description, 120), '/conta/profissional', NEW.professional_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER notify_professional_lead_ins AFTER INSERT ON public.professional_leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_professional_lead();

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

ALTER TABLE public.gig_conversations
  ADD CONSTRAINT gig_conversations_no_self CHECK (owner_id <> applicant_id);
ALTER TABLE public.market_conversations
  ADD CONSTRAINT market_conversations_no_self CHECK (buyer_id <> seller_id);
ALTER TABLE public.market_offers
  ADD CONSTRAINT market_offers_no_self CHECK (buyer_id <> seller_id);

CREATE OR REPLACE FUNCTION public.prevent_self_gig_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.gigs g WHERE g.id = NEW.gig_id AND g.owner_id = NEW.applicant_id) THEN
    RAISE EXCEPTION 'Você não pode se candidatar ao seu próprio bico';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_self_gig_application_ins
BEFORE INSERT ON public.gig_applications
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_gig_application();

CREATE OR REPLACE FUNCTION public.prevent_self_market_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.market_items i WHERE i.id = NEW.item_id AND i.seller_id = NEW.buyer_id) THEN
    RAISE EXCEPTION 'Você não pode fazer proposta no seu próprio anúncio';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_self_market_offer_ins
BEFORE INSERT ON public.market_offers
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_market_offer();

CREATE OR REPLACE FUNCTION public.prevent_self_market_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.market_items i WHERE i.id = NEW.item_id AND i.seller_id = NEW.buyer_id) THEN
    RAISE EXCEPTION 'Você não pode conversar com você mesmo';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_self_market_conversation_ins
BEFORE INSERT ON public.market_conversations
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_market_conversation();

CREATE OR REPLACE FUNCTION public.prevent_self_professional_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = NEW.professional_id AND p.user_id = NEW.requester_id) THEN
    RAISE EXCEPTION 'Você não pode pedir orçamento para você mesmo';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_self_professional_lead_ins
BEFORE INSERT ON public.professional_leads
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_professional_lead();

CREATE OR REPLACE FUNCTION public.can_gig_applicant_chat(_gig_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gig_applications a
    WHERE a.gig_id = _gig_id
      AND a.applicant_id = _user_id
      AND a.status IN ('shortlisted','accepted')
  );
$$;

CREATE POLICY gig_conv_participants_insert ON public.gig_conversations
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = owner_id AND public.is_gig_owner(gig_id, auth.uid()))
  OR (auth.uid() = applicant_id AND public.can_gig_applicant_chat(gig_id, auth.uid()))
);

CREATE POLICY gig_msg_participants_insert ON public.gig_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_gig_conversation_participant(conversation_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.gig_conversations c
    WHERE c.id = conversation_id
      AND (
        c.owner_id = auth.uid()
        OR public.can_gig_applicant_chat(c.gig_id, auth.uid())
      )
  )
);

REVOKE ALL ON FUNCTION public.is_gig_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_gig_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_gig_applicant_chat(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_gig_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_gig_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_gig_applicant_chat(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_gig_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_property_whatsapp_click(uuid) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.gig_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gig_conversations;