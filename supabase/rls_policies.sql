-- ============================================================
-- SportLink — RLS Policies (idempotent — safe to re-run)
-- Exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Activer RLS sur toutes les tables ──────────────────────

ALTER TABLE events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: events
-- ============================================================

DROP POLICY IF EXISTS "events_select_public"        ON events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON events;
DROP POLICY IF EXISTS "events_update_own_or_admin"  ON events;
DROP POLICY IF EXISTS "events_delete_own_or_admin"  ON events;

CREATE POLICY "events_select_public"
  ON events FOR SELECT USING (true);

CREATE POLICY "events_insert_authenticated"
  ON events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "events_update_own_or_admin"
  ON events FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "events_delete_own_or_admin"
  ON events FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- TABLE: favorites
-- ============================================================

DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;

CREATE POLICY "favorites_select_own"
  ON favorites FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
  ON favorites FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
  ON favorites FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TABLE: attendees
-- ============================================================

DROP POLICY IF EXISTS "attendees_select_public" ON attendees;
DROP POLICY IF EXISTS "attendees_insert_own"    ON attendees;
DROP POLICY IF EXISTS "attendees_delete_own"    ON attendees;

CREATE POLICY "attendees_select_public"
  ON attendees FOR SELECT USING (true);

CREATE POLICY "attendees_insert_own"
  ON attendees FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendees_delete_own"
  ON attendees FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- TABLE: clubs
-- ============================================================

DROP POLICY IF EXISTS "clubs_select_public"        ON clubs;
DROP POLICY IF EXISTS "clubs_insert_authenticated" ON clubs;
DROP POLICY IF EXISTS "clubs_update_own_or_admin"  ON clubs;
DROP POLICY IF EXISTS "clubs_delete_own_or_admin"  ON clubs;

CREATE POLICY "clubs_select_public"
  ON clubs FOR SELECT USING (true);

CREATE POLICY "clubs_insert_authenticated"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "clubs_update_own_or_admin"
  ON clubs FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "clubs_delete_own_or_admin"
  ON clubs FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- TABLE: profiles
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"          ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"          ON profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
        AND p2.role IN ('admin', 'superadmin')
    )
  );

-- Le rôle ne peut pas être auto-escaladé via l'app
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());
