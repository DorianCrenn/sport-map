-- ============================================================
-- SportLink — RLS Policies
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

-- Lecture publique (tous les events visibles par tout le monde)
CREATE POLICY "events_select_public"
  ON events FOR SELECT
  USING (true);

-- Insertion : utilisateurs connectés seulement
CREATE POLICY "events_insert_authenticated"
  ON events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Modification : créateur ou admin
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

-- Suppression : créateur ou admin
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

-- Lecture : ses propres favoris uniquement
CREATE POLICY "favorites_select_own"
  ON favorites FOR SELECT
  USING (user_id = auth.uid());

-- Insertion : ses propres favoris uniquement
CREATE POLICY "favorites_insert_own"
  ON favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Suppression : ses propres favoris uniquement
CREATE POLICY "favorites_delete_own"
  ON favorites FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- TABLE: attendees
-- ============================================================

-- Lecture : tout le monde peut voir qui participe (pour compter)
CREATE POLICY "attendees_select_public"
  ON attendees FOR SELECT
  USING (true);

-- Insertion/Suppression : ses propres participations uniquement
CREATE POLICY "attendees_insert_own"
  ON attendees FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendees_delete_own"
  ON attendees FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- TABLE: clubs
-- ============================================================

-- Lecture publique
CREATE POLICY "clubs_select_public"
  ON clubs FOR SELECT
  USING (true);

-- Insertion : utilisateurs connectés
CREATE POLICY "clubs_insert_authenticated"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Modification : créateur ou admin
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

-- Suppression : créateur ou admin
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

-- Lecture : son propre profil + admins voient tout
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

-- Modification : son propre profil uniquement
-- (les rôles ne peuvent être modifiés que via Supabase dashboard ou service_role)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Empêche l'auto-escalade de rôle : le rôle ne peut pas être changé via l'app
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Insertion : uniquement lors du signup (trigger ou service_role)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());
