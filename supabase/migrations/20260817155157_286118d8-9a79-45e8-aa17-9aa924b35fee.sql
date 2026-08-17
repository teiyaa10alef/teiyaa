CREATE TYPE public.job_contract_type AS ENUM ('clt','pj','temporario','meio_periodo','estagio','autonomo');
CREATE TYPE public.job_work_mode AS ENUM ('presencial','hibrido','remoto');
CREATE TYPE public.job_status AS ENUM ('open','paused','closed');
CREATE TYPE public.job_application_status AS ENUM ('sent','seen','shortlisted','accepted','rejected','withdrawn');

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  community_id uuid REFERENCES public.communities(id),
  title text NOT NULL,
  description text NOT NULL,
  area text NOT NULL DEFAULT 'outros',
  company_name text,
  contract_type public.job_contract_type NOT NULL DEFAULT 'clt',
  work_mode public.job_work_mode NOT NULL DEFAULT 'presencial',
  salary_cents integer,
  salary_period text NOT NULL DEFAULT 'month',
  is_salary_negotiable boolean NOT NULL DEFAULT false,
  requirements text[] NOT NULL DEFAULT '{}',
  benefits text[] NOT NULL DEFAULT '{}',
  address_hint text,
  contact_whatsapp text,
  contact_phone text,
  status public.job_status NOT NULL DEFAULT 'open',
  applications_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  company_logo_url text,
  company_size text,
  company_site text,
  company_about text,
  experience_level text NOT NULL DEFAULT 'sem_experiencia',
  education_level text NOT NULL DEFAULT 'indiferente',
  openings smallint NOT NULL DEFAULT 1,
  is_pcd boolean NOT NULL DEFAULT false,
  weekly_hours smallint,
  schedule text,
  shift_start time,
  shift_end time,
  starts_on date,
  salary_min_cents integer,
  salary_max_cents integer,
  has_commission boolean NOT NULL DEFAULT false,
  expires_on date,
  requires_cv boolean NOT NULL DEFAULT false,
  requires_cover_letter boolean NOT NULL DEFAULT false,
  screening_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  closed_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vagas visíveis publicamente" ON public.jobs FOR SELECT USING (status <> 'closed');
CREATE POLICY "Dono vê suas vagas" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Dono cria vaga" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Dono edita vaga" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Dono apaga vaga" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX idx_jobs_community ON public.jobs(community_id);
CREATE INDEX idx_jobs_status_created ON public.jobs(status, created_at DESC);
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_job_owner(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = _job_id AND j.owner_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.increment_job_view(_job_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.jobs SET view_count = view_count + 1 WHERE id = _job_id
$$;

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  message text,
  status public.job_application_status NOT NULL DEFAULT 'sent',
  cv_path text,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_letter text,
  owner_notes text,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidato vê sua candidatura" ON public.job_applications FOR SELECT TO authenticated
  USING (auth.uid() = applicant_id OR public.is_job_owner(job_id, auth.uid()));
CREATE POLICY "Candidato se candidata" ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Candidato ou dono atualiza" ON public.job_applications FOR UPDATE TO authenticated
  USING (auth.uid() = applicant_id OR public.is_job_owner(job_id, auth.uid()))
  WITH CHECK (auth.uid() = applicant_id OR public.is_job_owner(job_id, auth.uid()));
CREATE POLICY "Candidato remove candidatura" ON public.job_applications FOR DELETE TO authenticated
  USING (auth.uid() = applicant_id);
CREATE INDEX idx_job_applications_job ON public.job_applications(job_id);
CREATE TRIGGER job_applications_set_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_self_job_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = NEW.job_id AND j.owner_id = NEW.applicant_id) THEN
    RAISE EXCEPTION 'Você não pode se candidatar à sua própria vaga';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER job_applications_prevent_self BEFORE INSERT ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_job_application();

CREATE OR REPLACE FUNCTION public.bump_job_applications_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs SET applications_count = GREATEST(applications_count - 1, 0) WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER job_applications_count AFTER INSERT OR DELETE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.bump_job_applications_count();

CREATE OR REPLACE FUNCTION public.notify_job_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_title text;
BEGIN
  SELECT owner_id, title INTO v_owner, v_title FROM public.jobs WHERE id = NEW.job_id;
  IF v_owner IS NOT NULL THEN
    PERFORM public.push_notification(v_owner, 'job_application', 'Nova candidatura',
      'Alguém se candidatou à vaga ' || COALESCE(v_title,''), '/conta/vagas/' || NEW.job_id::text, NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER job_applications_notify AFTER INSERT ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_job_application();

CREATE OR REPLACE FUNCTION public.can_job_applicant_chat(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_applications a
    WHERE a.job_id = _job_id AND a.applicant_id = _user_id
      AND a.status IN ('shortlisted','accepted')
  )
$$;

CREATE TABLE public.job_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.job_applications(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE ON public.job_conversations TO authenticated;
GRANT ALL ON public.job_conversations TO service_role;
ALTER TABLE public.job_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participantes veem conversa" ON public.job_conversations FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = applicant_id);
CREATE POLICY "Criar conversa de vaga" ON public.job_conversations FOR INSERT TO authenticated
  WITH CHECK (
    owner_id <> applicant_id AND (
      (auth.uid() = owner_id AND public.is_job_owner(job_id, auth.uid()))
      OR (auth.uid() = applicant_id AND public.can_job_applicant_chat(job_id, auth.uid()))
    )
  );
CREATE POLICY "Participantes atualizam conversa" ON public.job_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = applicant_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = applicant_id);
CREATE INDEX idx_job_conversations_owner ON public.job_conversations(owner_id);
CREATE INDEX idx_job_conversations_applicant ON public.job_conversations(applicant_id);

CREATE OR REPLACE FUNCTION public.is_job_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_conversations c
    WHERE c.id = _conversation_id AND (c.owner_id = _user_id OR c.applicant_id = _user_id)
  )
$$;

CREATE TABLE public.job_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.job_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.job_messages TO authenticated;
GRANT ALL ON public.job_messages TO service_role;
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participantes leem mensagens" ON public.job_messages FOR SELECT TO authenticated
  USING (public.is_job_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Participantes enviam mensagens" ON public.job_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_job_conversation_participant(conversation_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.job_conversations c
      WHERE c.id = conversation_id
        AND (c.owner_id = auth.uid() OR public.can_job_applicant_chat(c.job_id, auth.uid()))
    )
  );
CREATE POLICY "Participantes marcam lidas" ON public.job_messages FOR UPDATE TO authenticated
  USING (public.is_job_conversation_participant(conversation_id, auth.uid()))
  WITH CHECK (public.is_job_conversation_participant(conversation_id, auth.uid()));
CREATE INDEX idx_job_messages_conversation ON public.job_messages(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_job_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.job_conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NULL;
END $$;
CREATE TRIGGER job_messages_touch AFTER INSERT ON public.job_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_job_conversation();

CREATE OR REPLACE FUNCTION public.notify_job_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_applicant uuid; v_target uuid;
BEGIN
  SELECT owner_id, applicant_id INTO v_owner, v_applicant FROM public.job_conversations WHERE id = NEW.conversation_id;
  v_target := CASE WHEN NEW.sender_id = v_owner THEN v_applicant ELSE v_owner END;
  IF v_target IS NOT NULL THEN
    PERFORM public.push_notification(v_target, 'message', 'Nova mensagem', left(NEW.body, 120),
      '/mensagens/vaga/' || NEW.conversation_id::text, NEW.conversation_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER job_messages_notify AFTER INSERT ON public.job_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_job_message();

CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  headline text,
  bio text,
  availability text NOT NULL DEFAULT 'imediata',
  shifts text[] NOT NULL DEFAULT '{}',
  has_cnh boolean NOT NULL DEFAULT false,
  has_vehicle boolean NOT NULL DEFAULT false,
  skills text[] NOT NULL DEFAULT '{}',
  experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  whatsapp text,
  phone text,
  cv_path text,
  cv_name text,
  cv_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_profiles TO authenticated;
GRANT ALL ON public.candidate_profiles TO service_role;

ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_applied_to_my_job(_candidate_id uuid, _owner_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.applicant_id = _candidate_id
      AND j.owner_id = _owner_id
  );
$$;

CREATE POLICY "candidate_profiles_select_own"
  ON public.candidate_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "candidate_profiles_select_job_owner"
  ON public.candidate_profiles FOR SELECT TO authenticated
  USING (public.has_applied_to_my_job(user_id, auth.uid()));

CREATE POLICY "candidate_profiles_insert_own"
  ON public.candidate_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "candidate_profiles_update_own"
  ON public.candidate_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "candidate_profiles_delete_own"
  ON public.candidate_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER candidate_profiles_set_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "resumes_read_own" ON storage.objects;
CREATE POLICY "resumes_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "resumes_insert_own" ON storage.objects;
CREATE POLICY "resumes_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "resumes_update_own" ON storage.objects;
CREATE POLICY "resumes_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "resumes_delete_own" ON storage.objects;
CREATE POLICY "resumes_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_businesses_feed ON public.businesses (community_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_feed ON public.professional_profiles (community_id, is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_feed ON public.properties (community_id, is_published, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_feed ON public.gigs (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_feed ON public.jobs (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_items_feed ON public.market_items (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_feed ON public.listings (community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_pro ON public.professional_reviews (professional_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_pro ON public.portfolio_items (professional_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_business_hours_business ON public.business_hours (business_id);

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

REVOKE ALL ON FUNCTION public.is_job_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_job_applicant_chat(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_job_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_applied_to_my_job(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_job_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_job_applicant_chat(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_job_conversation_participant(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_applied_to_my_job(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_job_view(uuid) TO anon, authenticated;

GRANT SELECT ON public.states TO anon;
GRANT SELECT ON public.cities TO anon;
GRANT SELECT ON public.communities TO anon;
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.profiles TO anon;