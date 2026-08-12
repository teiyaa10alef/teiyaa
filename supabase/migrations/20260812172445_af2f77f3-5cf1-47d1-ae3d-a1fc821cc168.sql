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
CREATE POLICY "gig_conv_participants_insert" ON public.gig_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = applicant_id);
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
CREATE POLICY "gig_msg_participants_insert" ON public.gig_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_gig_conversation_participant(conversation_id, auth.uid()));
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