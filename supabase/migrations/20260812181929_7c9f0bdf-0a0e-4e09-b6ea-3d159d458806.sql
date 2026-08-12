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

-- Market offers
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

-- Market conversation started
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

-- Market message
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

-- Gig applications
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

-- Gig message
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

-- Business review
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

-- Professional review
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

-- Professional lead
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