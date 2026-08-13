CREATE OR REPLACE FUNCTION public.can_gig_applicant_chat(_gig_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gig_applications a
    WHERE a.gig_id = _gig_id
      AND a.applicant_id = _user_id
      AND a.status IN ('shortlisted','accepted')
  );
$$;

DROP POLICY IF EXISTS gig_conv_participants_insert ON public.gig_conversations;
CREATE POLICY gig_conv_participants_insert ON public.gig_conversations
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = owner_id AND public.is_gig_owner(gig_id, auth.uid()))
  OR (auth.uid() = applicant_id AND public.can_gig_applicant_chat(gig_id, auth.uid()))
);

DROP POLICY IF EXISTS gig_messages_participants_insert ON public.gig_messages;
DROP POLICY IF EXISTS gig_msg_participants_insert ON public.gig_messages;
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