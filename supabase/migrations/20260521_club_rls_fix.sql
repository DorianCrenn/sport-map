-- ============================================================
-- Fix RLS : club_admin can manage their club
-- Problem: policies checked clubs.user_id = auth.uid() only,
--          blocking club_admin users (who have profiles.club_id set).
-- ============================================================

-- ── Helper : can the current user manage a given club? ────────────────────────
-- Returns true if the user is:
--   1. The club's owner (clubs.user_id = auth.uid())
--   2. A club_admin whose profiles.club_id = that club's id
--   3. A platform admin/superadmin
CREATE OR REPLACE FUNCTION public.sl_can_manage_club(p_club_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    -- Owner of the club
    SELECT 1 FROM public.clubs
    WHERE id::text = p_club_id
      AND user_id = auth.uid()
  )
  OR EXISTS (
    -- club_admin linked to this club via profiles.club_id
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'club_admin'
      AND club_id = p_club_id
  )
  OR public.sl_is_admin();
$$;

-- ── club_pages ────────────────────────────────────────────────────────────────

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

-- ── clubs (update / delete) ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "clubs_update_own_or_admin" ON public.clubs;
DROP POLICY IF EXISTS "clubs_delete_own_or_admin" ON public.clubs;

CREATE POLICY "clubs_update_own_or_admin"
  ON public.clubs FOR UPDATE
  USING (public.sl_can_manage_club(id::text));

CREATE POLICY "clubs_delete_own_or_admin"
  ON public.clubs FOR DELETE
  USING (public.sl_can_manage_club(id::text));

-- ── club_trainings ────────────────────────────────────────────────────────────

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

-- ── events ────────────────────────────────────────────────────────────────────
-- Allow club_admin to update/delete events for their club (not just the creator)

DROP POLICY IF EXISTS "events_update_own_or_admin" ON public.events;
DROP POLICY IF EXISTS "events_delete_own_or_admin" ON public.events;

CREATE POLICY "events_update_own_or_admin"
  ON public.events FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.sl_is_admin()
    OR (
      club_id IS NOT NULL
      AND public.sl_can_manage_club(club_id)
    )
  );

CREATE POLICY "events_delete_own_or_admin"
  ON public.events FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.sl_is_admin()
    OR (
      club_id IS NOT NULL
      AND public.sl_can_manage_club(club_id)
    )
  );
