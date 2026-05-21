-- ============================================================
-- Fix club_pages RLS — align with frontend canEdit logic
-- canEdit = isOwner || isManager(email)
-- isOwner = isAdmin || (isClubAdmin && profile.club_id = club.id)
--
-- Allows writes to club_pages for:
--   1. Club creator  (clubs.user_id = auth.uid())
--   2. club_admin    (profiles.role = 'club_admin' AND profiles.club_id = club_id)
--   3. Club manager  (club_managers.email = auth user email)
--   4. Platform admin / superadmin
-- ============================================================

-- Update sl_can_manage_club to include club_managers (by email)
CREATE OR REPLACE FUNCTION public.sl_can_manage_club(p_club_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    -- 1. Club creator
    SELECT 1 FROM public.clubs
    WHERE id::text = p_club_id
      AND user_id = auth.uid()
  )
  OR EXISTS (
    -- 2. club_admin linked to this club via profiles.club_id
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'club_admin'
      AND club_id = p_club_id
  )
  OR EXISTS (
    -- 3. Club manager (matched by email in auth.users)
    SELECT 1 FROM public.club_managers cm
    JOIN auth.users u ON u.email = cm.email
    WHERE cm.club_id = p_club_id
      AND u.id = auth.uid()
  )
  OR public.sl_is_admin();
$$;

-- ── club_pages policies ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "pages_select_public" ON public.club_pages;
DROP POLICY IF EXISTS "pages_insert_owner"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_update_owner"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_delete_owner"  ON public.club_pages;

CREATE POLICY "pages_select_public"
  ON public.club_pages FOR SELECT USING (true);

CREATE POLICY "pages_insert_owner"
  ON public.club_pages FOR INSERT
  WITH CHECK (public.sl_can_manage_club(club_pages.club_id));

CREATE POLICY "pages_update_owner"
  ON public.club_pages FOR UPDATE
  USING (public.sl_can_manage_club(club_pages.club_id));

CREATE POLICY "pages_delete_owner"
  ON public.club_pages FOR DELETE
  USING (public.sl_can_manage_club(club_pages.club_id));

-- ── club_trainings — same fix ─────────────────────────────────────────────────

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
