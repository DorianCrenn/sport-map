-- ============================================================
-- Migration 2026-06-20 : Sécurité + Persistance
-- 1. Restreindre la policy profiles SELECT (fuite email/role)
-- 2. Ajouter colonne home_city dans profiles (persistance multi-appareils)
-- 3. Recharger votes feedback depuis DB (table app_feedback_votes)
-- ============================================================

-- ── 1. Vue publique profiles (sans email, role, plan) ────────────────────────
-- Remplace la policy trop permissive "profiles_select_public_limited"
-- qui exposait email, role, plan à tous les users authentifiés.

DROP POLICY IF EXISTS profiles_select_public_limited ON profiles;
DROP POLICY IF EXISTS profiles_select_own ON profiles;

-- Chaque user peut lire son propre profil complet
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Les admins peuvent tout lire
CREATE POLICY profiles_select_admin ON profiles
  FOR SELECT TO authenticated
  USING (sl_is_admin());

-- Vue publique restreinte (sans email, role, plan, club_id)
DROP VIEW IF EXISTS profiles_public;
CREATE VIEW profiles_public
  WITH (security_invoker = false)
AS
  SELECT
    id,
    name,
    avatar_url,
    xp,
    badges,
    favorite_sports,
    onboarding_done,
    created_at
  FROM profiles;

-- RLS sur la vue (SECURITY DEFINER équivalent via security_invoker=false)
-- Tout user authentifié peut lire les données publiques
GRANT SELECT ON profiles_public TO authenticated;

-- ── 2. Colonne home_city dans profiles ───────────────────────────────────────
-- Stocke la ville préférée de l'utilisateur (centre carte)
-- Structure : { lat, lng, name, postalCode }
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS home_city JSONB DEFAULT NULL;

-- ── 3. Index pour les votes feedback par user ────────────────────────────────
-- Accélère la query de rechargement des votes au montage de HelpPage
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id
  ON app_feedback_votes (user_id);

-- ── 4. Commentaires ──────────────────────────────────────────────────────────
COMMENT ON COLUMN profiles.home_city IS 'Ville préférée utilisateur pour le centre de carte. Structure: {lat, lng, name, postalCode}';
COMMENT ON VIEW profiles_public IS 'Vue publique des profils sans données sensibles (email, role, plan, club_id)';
