REVOKE ALL ON FUNCTION public.touch_conversation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;