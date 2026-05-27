-- ROLES-001c : RLS sub-rôles gestionnaires
-- manager  → events + affiches + annonces + page
-- editor   → events + affiches uniquement
-- communicant → annonces uniquement

-- ── Helper function ───────────────────────────────────────────────────────────
-- Vérifie si l'utilisateur courant est dans club_managers pour ce club
-- avec l'un des rôles demandés. Join via auth.users.email car club_managers
-- identifie par email, pas par user_id.

CREATE OR REPLACE FUNCTION public.sl_is_club_manager_for(
  p_club_id TEXT,
  p_roles   TEXT[]
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.club_managers cm
    JOIN auth.users u ON lower(u.email) = lower(cm.email)
    WHERE cm.club_id = p_club_id
      AND u.id = auth.uid()
      AND cm.role = ANY(p_roles)
  );
END;
$$;

-- ── events ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "events_insert_admin_or_club"    ON public.events;
DROP POLICY IF EXISTS "events_insert_or_manager"       ON public.events;
DROP POLICY IF EXISTS "events_update_own_or_admin"     ON public.events;
DROP POLICY IF EXISTS "events_update_own_admin_mgr"    ON public.events;
DROP POLICY IF EXISTS "events_delete_own_or_admin"     ON public.events;
DROP POLICY IF EXISTS "events_delete_own_admin_mgr"    ON public.events;

-- INSERT : propriétaire du club, club_admin du profil, manager/editor délégué, ou admin
CREATE POLICY "events_insert_or_manager"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin', 'club_admin')
      )
      OR (
        club_id IS NOT NULL
        AND public.sl_is_club_manager_for(club_id::text, ARRAY['manager', 'editor'])
      )
    )
  );

-- UPDATE : propriétaire de l'événement, manager/editor du club concerné, ou admin
CREATE POLICY "events_update_own_admin_mgr"
  ON public.events FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.sl_is_admin()
    OR (
      club_id IS NOT NULL
      AND public.sl_is_club_manager_for(club_id::text, ARRAY['manager', 'editor'])
    )
  );

-- DELETE : propriétaire de l'événement, manager du club (pas editor), ou admin
CREATE POLICY "events_delete_own_admin_mgr"
  ON public.events FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.sl_is_admin()
    OR (
      club_id IS NOT NULL
      AND public.sl_is_club_manager_for(club_id::text, ARRAY['manager'])
    )
  );

-- ── club_announcements ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ca_insert"  ON public.club_announcements;
DROP POLICY IF EXISTS "ca_delete"  ON public.club_announcements;
DROP POLICY IF EXISTS "ca_insert_or_manager"  ON public.club_announcements;
DROP POLICY IF EXISTS "ca_delete_or_manager"  ON public.club_announcements;

CREATE POLICY "ca_insert_or_manager"
  ON public.club_announcements FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id::text = club_announcements.club_id
          AND clubs.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'club_admin'
          AND club_id = club_announcements.club_id
      )
      OR public.sl_is_admin()
      OR public.sl_is_club_manager_for(club_announcements.club_id, ARRAY['manager', 'communicant'])
    )
  );

CREATE POLICY "ca_delete_or_manager"
  ON public.club_announcements FOR DELETE
  USING (
    auth.uid() = author_id
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_id, ARRAY['manager', 'communicant'])
  );

-- ── club_pages ────────────────────────────────────────────────────────────────
-- Seuls les managers (accès complet) peuvent modifier la page du club.

DROP POLICY IF EXISTS "pages_insert_owner"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_update_owner"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_delete_owner"  ON public.club_pages;

CREATE POLICY "pages_insert_owner"
  ON public.club_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_pages.club_id, ARRAY['manager'])
  );

CREATE POLICY "pages_update_owner"
  ON public.club_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_pages.club_id, ARRAY['manager'])
  );

CREATE POLICY "pages_delete_owner"
  ON public.club_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
    OR public.sl_is_club_manager_for(club_pages.club_id, ARRAY['manager'])
  );
