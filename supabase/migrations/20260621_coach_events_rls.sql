-- Permet aux managers/coaches de créer des événements pour les clubs qu'ils gèrent.
-- club_managers utilise email (pas user_id), donc on passe par auth.email().

CREATE OR REPLACE FUNCTION public.is_club_manager_for_event(p_club_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_managers
    WHERE club_id = p_club_id
      AND email    = auth.email()
      AND status   = 'active'
      AND role    IN ('owner', 'manager', 'editor')
  );
$$;

-- Nouvelle policy INSERT permettant aux managers actifs de créer des événements pour leur club
DROP POLICY IF EXISTS "managers_can_insert_events" ON events;

CREATE POLICY "managers_can_insert_events" ON events
  FOR INSERT
  WITH CHECK (
    club_id IS NOT NULL
    AND public.is_club_manager_for_event(club_id::bigint)
  );
