-- ============================================================
-- SportLink — Correctifs sécurité P0
-- Exécuter dans : Supabase Dashboard → SQL Editor → New Query
-- Idempotent (safe to re-run)
-- ============================================================

-- ============================================================
-- SEC-002 — RLS sur club_managers (table sans aucune policy)
-- ============================================================

ALTER TABLE IF EXISTS public.club_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "managers_select_owner_or_admin" ON public.club_managers;
DROP POLICY IF EXISTS "managers_insert_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_update_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_delete_owner"          ON public.club_managers;

-- Lecture : owner du club ou admin plateforme
CREATE POLICY "managers_select_owner_or_admin"
  ON public.club_managers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- Ajout de manager : uniquement l'owner du club
CREATE POLICY "managers_insert_owner"
  ON public.club_managers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
  );

-- Modification : uniquement l'owner du club
CREATE POLICY "managers_update_owner"
  ON public.club_managers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
  );

-- Suppression : owner du club ou admin
CREATE POLICY "managers_delete_owner"
  ON public.club_managers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- SEC-003 — events_insert restreint aux admins et club_admins
-- ============================================================

DROP POLICY IF EXISTS "events_insert_authenticated"   ON public.events;
DROP POLICY IF EXISTS "events_insert_admin_or_club"   ON public.events;

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
  );

-- ============================================================
-- SEC-005 — attendees_select : ne plus exposer les user_id publiquement
-- ============================================================

DROP POLICY IF EXISTS "attendees_select_public" ON public.attendees;

-- Les utilisateurs ne voient que leur propre présence
CREATE POLICY "attendees_select_own"
  ON public.attendees FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- PERF-002 — event_attendee_counts view sans SECURITY INVOKER
-- (bypasse le RLS pour que les counts reflètent tous les participants)
-- ============================================================

DROP VIEW IF EXISTS public.event_attendee_counts;

CREATE VIEW public.event_attendee_counts
  WITH (security_invoker = false)
  AS
  SELECT event_id, COUNT(*)::int AS count
  FROM public.attendees
  GROUP BY event_id;

GRANT SELECT ON public.event_attendee_counts TO anon, authenticated;

-- ============================================================
-- Vérification finale
-- ============================================================

-- Lister les policies actives sur les tables concernées
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('club_managers', 'events', 'attendees')
ORDER BY tablename, cmd;
