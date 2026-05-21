-- ============================================================
-- SportLink — FIX CRITIQUE PRODUCTION (à coller dans Supabase SQL Editor)
-- Ce fichier est IDEMPOTENT — safe à re-run autant de fois que nécessaire.
-- Ordre : colonnes → index → RLS → fonctions → schema cache
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. COLONNES MANQUANTES — events
-- Cause : CREATE TABLE IF NOT EXISTS ne rajoute pas les colonnes
--         sur une table déjà existante.
-- Symptôme : POST /events → 400 "Could not find the 'adversaire' column"
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type   TEXT DEFAULT 'friendly';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS team_name    TEXT DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS level        TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cup_type     TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS home_or_away TEXT DEFAULT 'home';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS adversaire   TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS standings    JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS score        JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS club_id      TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'user';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS series_id    TEXT;


-- ════════════════════════════════════════════════════════════
-- 2. COLONNES MANQUANTES — profiles
-- Stripe-ready plan + XP gamification
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'starter', 'pro', 'federation'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles (xp DESC);


-- ════════════════════════════════════════════════════════════
-- 3. RLS FIX — club_admin peut gérer son club
-- Cause : policies vérifiaient clubs.user_id = auth.uid() seulement,
--         bloquant les club_admin (qui ont profiles.club_id défini).
-- Symptôme : 403 sur upsert club_pages + impossible de créer équipes
-- ════════════════════════════════════════════════════════════

-- Fonction helper : peut-on gérer ce club ?
CREATE OR REPLACE FUNCTION public.sl_can_manage_club(p_club_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id::text = p_club_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'club_admin'
      AND club_id = p_club_id
  )
  OR public.sl_is_admin();
$$;

-- club_pages
DROP POLICY IF EXISTS "pages_insert_owner" ON public.club_pages;
DROP POLICY IF EXISTS "pages_update_owner" ON public.club_pages;
DROP POLICY IF EXISTS "pages_delete_owner" ON public.club_pages;

CREATE POLICY "pages_insert_owner"
  ON public.club_pages FOR INSERT
  WITH CHECK (public.sl_can_manage_club(club_pages.club_id));

CREATE POLICY "pages_update_owner"
  ON public.club_pages FOR UPDATE
  USING (public.sl_can_manage_club(club_pages.club_id));

CREATE POLICY "pages_delete_owner"
  ON public.club_pages FOR DELETE
  USING (public.sl_can_manage_club(club_pages.club_id));

-- clubs
DROP POLICY IF EXISTS "clubs_update_own_or_admin" ON public.clubs;
DROP POLICY IF EXISTS "clubs_delete_own_or_admin" ON public.clubs;

CREATE POLICY "clubs_update_own_or_admin"
  ON public.clubs FOR UPDATE
  USING (public.sl_can_manage_club(id::text));

CREATE POLICY "clubs_delete_own_or_admin"
  ON public.clubs FOR DELETE
  USING (public.sl_can_manage_club(id::text));

-- club_trainings
DROP POLICY IF EXISTS "trainings_insert_owner" ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_update_owner" ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_delete_owner" ON public.club_trainings;

CREATE POLICY "trainings_insert_owner"
  ON public.club_trainings FOR INSERT
  WITH CHECK (public.sl_can_manage_club(club_trainings.club_id));

CREATE POLICY "trainings_update_owner"
  ON public.club_trainings FOR UPDATE
  USING (public.sl_can_manage_club(club_trainings.club_id));

CREATE POLICY "trainings_delete_owner"
  ON public.club_trainings FOR DELETE
  USING (public.sl_can_manage_club(club_trainings.club_id));

-- events update/delete (club_admin peut gérer les events de son club)
DROP POLICY IF EXISTS "events_update_own_or_admin" ON public.events;
DROP POLICY IF EXISTS "events_delete_own_or_admin" ON public.events;

CREATE POLICY "events_update_own_or_admin"
  ON public.events FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.sl_is_admin()
    OR (club_id IS NOT NULL AND public.sl_can_manage_club(club_id))
  );

CREATE POLICY "events_delete_own_or_admin"
  ON public.events FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.sl_is_admin()
    OR (club_id IS NOT NULL AND public.sl_can_manage_club(club_id))
  );


-- ════════════════════════════════════════════════════════════
-- 4. RELOAD POSTGREST SCHEMA CACHE
-- Obligatoire après ajout de colonnes pour que PostgREST les reconnaisse.
-- ════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';
