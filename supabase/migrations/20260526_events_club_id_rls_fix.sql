-- STABLE-001b — Validation club_id dans la policy INSERT events
-- Problème : un club_admin pouvait mettre n'importe quel club_id lors de la création
-- Fix    : club_id doit être null, appartenir au user (clubs.user_id) ou à un club géré (club_managers)
-- Note   : events.club_id est TEXT, clubs.id est UUID → cast clubs.id::text pour la comparaison

DROP POLICY IF EXISTS "events_insert_admin_or_club" ON public.events;

CREATE POLICY "events_insert_admin_or_club"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'club_admin')
    )
    AND (
      club_id IS NULL
      OR public.sl_is_admin()
      OR EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id::text = club_id
          AND clubs.user_id = auth.uid()
      )
    )
  );
