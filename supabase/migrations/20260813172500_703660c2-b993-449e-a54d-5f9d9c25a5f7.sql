-- Cleanup: self conversations (gigs)
DELETE FROM public.gig_messages m
USING public.gig_conversations c
WHERE m.conversation_id = c.id AND c.owner_id = c.applicant_id;
DELETE FROM public.gig_conversations WHERE owner_id = applicant_id;

-- Cleanup: self conversations (market)
DELETE FROM public.market_messages m
USING public.market_conversations c
WHERE m.conversation_id = c.id AND c.buyer_id = c.seller_id;
DELETE FROM public.market_conversations WHERE buyer_id = seller_id;

-- Cleanup: self applications / offers / leads
DELETE FROM public.gig_applications a
USING public.gigs g
WHERE a.gig_id = g.id AND a.applicant_id = g.owner_id;

DELETE FROM public.market_offers o
USING public.market_items i
WHERE o.item_id = i.id AND o.buyer_id = i.seller_id;

DELETE FROM public.professional_leads l
USING public.professional_profiles p
WHERE l.professional_id = p.id AND l.requester_id = p.user_id;

-- Hard constraints
ALTER TABLE public.gig_conversations
  ADD CONSTRAINT gig_conversations_no_self CHECK (owner_id <> applicant_id);
ALTER TABLE public.market_conversations
  ADD CONSTRAINT market_conversations_no_self CHECK (buyer_id <> seller_id);
ALTER TABLE public.market_offers
  ADD CONSTRAINT market_offers_no_self CHECK (buyer_id <> seller_id);

-- Trigger guards where comparison needs another table
CREATE OR REPLACE FUNCTION public.prevent_self_gig_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.gigs g WHERE g.id = NEW.gig_id AND g.owner_id = NEW.applicant_id) THEN
    RAISE EXCEPTION 'Você não pode se candidatar ao seu próprio bico';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_gig_application_ins ON public.gig_applications;
CREATE TRIGGER prevent_self_gig_application_ins
BEFORE INSERT ON public.gig_applications
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_gig_application();

CREATE OR REPLACE FUNCTION public.prevent_self_market_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.market_items i WHERE i.id = NEW.item_id AND i.seller_id = NEW.buyer_id) THEN
    RAISE EXCEPTION 'Você não pode fazer proposta no seu próprio anúncio';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_market_offer_ins ON public.market_offers;
CREATE TRIGGER prevent_self_market_offer_ins
BEFORE INSERT ON public.market_offers
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_market_offer();

CREATE OR REPLACE FUNCTION public.prevent_self_market_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.market_items i WHERE i.id = NEW.item_id AND i.seller_id = NEW.buyer_id) THEN
    RAISE EXCEPTION 'Você não pode conversar com você mesmo';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_market_conversation_ins ON public.market_conversations;
CREATE TRIGGER prevent_self_market_conversation_ins
BEFORE INSERT ON public.market_conversations
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_market_conversation();

CREATE OR REPLACE FUNCTION public.prevent_self_professional_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.professional_profiles p WHERE p.id = NEW.professional_id AND p.user_id = NEW.requester_id) THEN
    RAISE EXCEPTION 'Você não pode pedir orçamento para você mesmo';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_professional_lead_ins ON public.professional_leads;
CREATE TRIGGER prevent_self_professional_lead_ins
BEFORE INSERT ON public.professional_leads
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_professional_lead();