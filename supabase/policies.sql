-- ============================================================
-- SportLink — Policies RLS consolidées (source unique)
-- Couvre : BUG-002 (consolidation) + SEC-006 (club_trainings, club_pages)
-- Idempotent — safe to re-run à tout moment
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Activer RLS sur toutes les tables
-- ────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clubs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_managers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.club_pages     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE : events
-- ============================================================

DROP POLICY IF EXISTS "events_select_public"        ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_insert_admin_or_club" ON public.events;
DROP POLICY IF EXISTS "events_update_own_or_admin"  ON public.events;
DROP POLICY IF EXISTS "events_delete_own_or_admin"  ON public.events;

-- Lecture publique (la carte est accessible à tous)
CREATE POLICY "events_select_public"
  ON public.events FOR SELECT USING (true);

-- Création réservée aux admins et club_admins
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

-- Modification : propriétaire ou admin
CREATE POLICY "events_update_own_or_admin"
  ON public.events FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- Suppression : propriétaire ou admin
CREATE POLICY "events_delete_own_or_admin"
  ON public.events FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- TABLE : favorites
-- ============================================================

DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TABLE : attendees
-- ============================================================

DROP POLICY IF EXISTS "attendees_select_public" ON public.attendees;
DROP POLICY IF EXISTS "attendees_select_own"    ON public.attendees;
DROP POLICY IF EXISTS "attendees_insert_own"    ON public.attendees;
DROP POLICY IF EXISTS "attendees_delete_own"    ON public.attendees;

-- Lecture : uniquement sa propre présence (RGPD)
CREATE POLICY "attendees_select_own"
  ON public.attendees FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "attendees_insert_own"
  ON public.attendees FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendees_delete_own"
  ON public.attendees FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TABLE : clubs
-- ============================================================

DROP POLICY IF EXISTS "clubs_select_public"      ON public.clubs;
DROP POLICY IF EXISTS "clubs_insert_own"         ON public.clubs;
DROP POLICY IF EXISTS "clubs_update_own_or_admin" ON public.clubs;
DROP POLICY IF EXISTS "clubs_delete_own_or_admin" ON public.clubs;

CREATE POLICY "clubs_select_public"
  ON public.clubs FOR SELECT USING (true);

CREATE POLICY "clubs_insert_own"
  ON public.clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "clubs_update_own_or_admin"
  ON public.clubs FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "clubs_delete_own_or_admin"
  ON public.clubs FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- TABLE : profiles
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_public"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"           ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"           ON public.profiles;

-- Lecture : uniquement son propre profil ou admin (RGPD — pas de select * public)
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid() AND p2.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================================
-- TABLE : club_managers
-- ============================================================

DROP POLICY IF EXISTS "managers_select_owner_or_admin" ON public.club_managers;
DROP POLICY IF EXISTS "managers_insert_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_update_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_delete_owner"          ON public.club_managers;

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
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "managers_insert_owner"
  ON public.club_managers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
  );

CREATE POLICY "managers_update_owner"
  ON public.club_managers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
  );

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
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- TABLE : club_trainings  (SEC-006)
-- ============================================================

DROP POLICY IF EXISTS "trainings_select_public"       ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_insert_owner"        ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_update_owner"        ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_delete_owner"        ON public.club_trainings;

-- Calendrier d'entraînement lisible par tous
CREATE POLICY "trainings_select_public"
  ON public.club_trainings FOR SELECT USING (true);

-- Écriture réservée à l'owner du club ou admin
CREATE POLICY "trainings_insert_owner"
  ON public.club_trainings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id::text
        AND clubs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "trainings_update_owner"
  ON public.club_trainings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id::text
        AND clubs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "trainings_delete_owner"
  ON public.club_trainings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id::text
        AND clubs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- TABLE : club_pages  (SEC-006)
-- ============================================================

DROP POLICY IF EXISTS "pages_select_public"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_insert_owner"   ON public.club_pages;
DROP POLICY IF EXISTS "pages_update_owner"   ON public.club_pages;
DROP POLICY IF EXISTS "pages_delete_owner"   ON public.club_pages;

-- Page de club lisible par tous
CREATE POLICY "pages_select_public"
  ON public.club_pages FOR SELECT USING (true);

CREATE POLICY "pages_insert_owner"
  ON public.club_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id::text
        AND clubs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "pages_update_owner"
  ON public.club_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id::text
        AND clubs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "pages_delete_owner"
  ON public.club_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id::text
        AND clubs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- VIEW : event_attendee_counts  (PERF-002 — bypass RLS)
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

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN (
  'events', 'favorites', 'attendees', 'clubs', 'profiles',
  'club_managers', 'club_trainings', 'club_pages'
)
ORDER BY tablename, cmd;
