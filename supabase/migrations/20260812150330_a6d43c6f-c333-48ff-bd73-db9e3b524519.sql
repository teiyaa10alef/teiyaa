-- MARKETPLACE ITEMS
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

-- CONVERSATIONS
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

-- MESSAGES
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

-- OFFERS
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