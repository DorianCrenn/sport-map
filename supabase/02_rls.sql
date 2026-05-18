-- ============================================================
-- SportLink — Politiques RLS (source unique de vérité)
-- Idempotent : safe to re-run à tout moment.
-- Prérequis : 01_schema.sql (crée sl_is_admin() et toutes les tables)
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────────────────────
-- sl_is_admin() utilise SECURITY DEFINER → pas de récursion infinie.

DROP POLICY IF EXISTS "profiles_select_public"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"        ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.sl_is_admin());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Mise à jour : chacun son propre profil. Admins via la policy admin.
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.sl_is_admin());

-- Trigger SECURITY DEFINER : protège role/club_id contre escalade même en appel API direct.
-- S'exécute AVANT UPDATE, hors RLS → pas de récursion infinie.
CREATE OR REPLACE FUNCTION public.profiles_guard_immutable()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Non-admins ne peuvent pas changer role ou club_id (même via API Supabase directe)
  IF NOT public.sl_is_admin() THEN
    NEW.role    := OLD.role;
    NEW.club_id := OLD.club_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_immutable_trigger ON public.profiles;
CREATE TRIGGER profiles_guard_immutable_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_immutable();

-- ── events ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "events_select_public"        ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_insert_admin_or_club" ON public.events;
DROP POLICY IF EXISTS "events_update_own_or_admin"  ON public.events;
DROP POLICY IF EXISTS "events_delete_own_or_admin"  ON public.events;

-- Lecture publique (carte accessible sans compte)
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
  USING (user_id = auth.uid() OR public.sl_is_admin());

-- Suppression : propriétaire ou admin
CREATE POLICY "events_delete_own_or_admin"
  ON public.events FOR DELETE
  USING (user_id = auth.uid() OR public.sl_is_admin());

-- ── favorites ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE USING (user_id = auth.uid());

-- ── attendees ────────────────────────────────────────────────────────────────
-- Lecture restreinte à soi-même (RGPD : on n'expose pas qui assiste à quoi)

DROP POLICY IF EXISTS "attendees_select_public" ON public.attendees;
DROP POLICY IF EXISTS "attendees_select_own"    ON public.attendees;
DROP POLICY IF EXISTS "attendees_insert_own"    ON public.attendees;
DROP POLICY IF EXISTS "attendees_delete_own"    ON public.attendees;

CREATE POLICY "attendees_select_own"
  ON public.attendees FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "attendees_insert_own"
  ON public.attendees FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendees_delete_own"
  ON public.attendees FOR DELETE USING (user_id = auth.uid());

-- ── clubs ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "clubs_select_public"         ON public.clubs;
DROP POLICY IF EXISTS "clubs_select_all"            ON public.clubs;
DROP POLICY IF EXISTS "clubs_insert_authenticated"  ON public.clubs;
DROP POLICY IF EXISTS "clubs_insert_auth"           ON public.clubs;
DROP POLICY IF EXISTS "clubs_insert_own"            ON public.clubs;
DROP POLICY IF EXISTS "clubs_update_own_or_admin"   ON public.clubs;
DROP POLICY IF EXISTS "clubs_delete_own_or_admin"   ON public.clubs;
DROP POLICY IF EXISTS "clubs_update_own"            ON public.clubs;
DROP POLICY IF EXISTS "clubs_delete_own"            ON public.clubs;

CREATE POLICY "clubs_select_public"
  ON public.clubs FOR SELECT USING (true);

CREATE POLICY "clubs_insert_own"
  ON public.clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "clubs_update_own_or_admin"
  ON public.clubs FOR UPDATE
  USING (user_id = auth.uid() OR public.sl_is_admin());

CREATE POLICY "clubs_delete_own_or_admin"
  ON public.clubs FOR DELETE
  USING (user_id = auth.uid() OR public.sl_is_admin());

-- ── club_pages ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "club_pages_select" ON public.club_pages;
DROP POLICY IF EXISTS "club_pages_upsert" ON public.club_pages;
DROP POLICY IF EXISTS "pages_select_public" ON public.club_pages;
DROP POLICY IF EXISTS "pages_insert_owner"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_update_owner"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_delete_owner"  ON public.club_pages;

CREATE POLICY "pages_select_public"
  ON public.club_pages FOR SELECT USING (true);

CREATE POLICY "pages_insert_owner"
  ON public.club_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "pages_update_owner"
  ON public.club_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "pages_delete_owner"
  ON public.club_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

-- ── club_managers ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "managers_select_owner_or_admin" ON public.club_managers;
DROP POLICY IF EXISTS "managers_insert_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_update_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_delete_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "club_managers_select"           ON public.club_managers;
DROP POLICY IF EXISTS "club_managers_insert"           ON public.club_managers;
DROP POLICY IF EXISTS "club_managers_delete"           ON public.club_managers;

CREATE POLICY "managers_select_owner_or_admin"
  ON public.club_managers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
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
    ) OR public.sl_is_admin()
  );

-- ── club_trainings ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "club_trainings_select" ON public.club_trainings;
DROP POLICY IF EXISTS "club_trainings_upsert" ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_select_public" ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_insert_owner"  ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_update_owner"  ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_delete_owner"  ON public.club_trainings;

CREATE POLICY "trainings_select_public"
  ON public.club_trainings FOR SELECT USING (true);

CREATE POLICY "trainings_insert_owner"
  ON public.club_trainings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "trainings_update_owner"
  ON public.club_trainings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "trainings_delete_owner"
  ON public.club_trainings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

-- ── club_page_views ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cpv_insert_anyone" ON public.club_page_views;
DROP POLICY IF EXISTS "cpv_select_all"    ON public.club_page_views;

CREATE POLICY "cpv_insert_anyone"
  ON public.club_page_views FOR INSERT WITH CHECK (true);

CREATE POLICY "cpv_select_all"
  ON public.club_page_views FOR SELECT USING (true);
