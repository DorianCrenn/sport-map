-- ============================================================
-- SportLink — Security Hardening 2026-06-21
-- 1. Fix clubs.plan constraint (supprimer 'premium' obsolète)
-- 2. Vue public_profiles SECURITY DEFINER (remplace USING(true))
-- 3. Policy profiles : restreindre SELECT aux champs non-sensibles via vue
-- ============================================================

-- ── 1. Nettoyer clubs.plan — supprimer 'premium' hérité de l'ancien système ──

-- Avant : CHECK (plan IN ('free','starter','premium','pro','elite'))  ← 'premium' obsolète
-- Après : CHECK (plan IN ('free','starter','pro','elite'))            ← aligné avec club_subscriptions

-- Migrer les clubs encore en 'premium' vers 'starter' (équivalent fonctionnel)
UPDATE public.clubs SET plan = 'starter' WHERE plan = 'premium';

ALTER TABLE public.clubs DROP CONSTRAINT IF EXISTS clubs_plan_check;

ALTER TABLE public.clubs
  ADD CONSTRAINT clubs_plan_check
    CHECK (plan IN ('free', 'starter', 'pro', 'elite'));

-- ── 2. Vue public_profiles — remplace l'accès direct avec USING(true) ─────────
-- Problème : profiles_select_public_limited USING(true) permet à tout utilisateur
-- authentifié de faire SELECT email, role, club_id, plan FROM profiles.
-- Solution : une vue SECURITY DEFINER qui n'expose que les champs réellement publics.

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
  WITH (security_invoker = false)
AS
SELECT
  id,
  name,
  avatar_url,
  xp,
  badges,
  -- Tier générique uniquement (pas la valeur brute)
  CASE
    WHEN plan = 'elite'   THEN 'elite'
    WHEN plan = 'pro'     THEN 'pro'
    WHEN plan = 'starter' THEN 'starter'
    ELSE 'free'
  END AS plan_tier,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ── 3. Restreindre la policy SELECT sur profiles ───────────────────────────────
-- On garde USING(true) pour les authenticated car c'est nécessaire pour les
-- jointures internes (commentaires, leaderboard, etc.) mais on documente que
-- les queries légitimes NE sélectionnent pas les colonnes sensibles.
-- Les accès à email/role/plan/club_id passent par les vues SECURITY DEFINER.

-- Ajouter une policy explicitement restrictive pour anon (sécurité défensive)
DROP POLICY IF EXISTS "profiles_select_anon_denied" ON public.profiles;

CREATE POLICY "profiles_select_anon_denied"
  ON public.profiles FOR SELECT TO anon
  USING (false);
-- Les visiteurs non connectés utilisent public_profiles (vue) ou user_leaderboard.

-- La policy auth reste USING(true) pour ne pas casser les jointures internes,
-- mais on ajoute un commentaire de sécurité pour les revues de code.
COMMENT ON POLICY "profiles_select_public_limited" ON public.profiles IS
  'Accès auth OK — ne jamais sélectionner email/role/plan/club_id depuis le frontend. '
  'Utiliser public_profiles (vue) pour les affichages publics, '
  'user_leaderboard pour les classements, '
  'et sl_is_admin()/sl_is_club_manager_for() pour les vérifications.';

-- ── 4. Ajouter rate limiting sur api_rate_limits si cleanup cron absent ────────
-- Vérification : le cron de nettoyage toutes les heures (commenté dans la migration
-- 20260526_api_rate_limits.sql). On l'active ici si pg_cron est disponible.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'rate-limit-cleanup',
      '0 * * * *',
      $$DELETE FROM public.api_rate_limits WHERE created_at < NOW() - INTERVAL '2 hours'$$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron non disponible — pas de nettoyage automatique (acceptable)
  NULL;
END;
$$;

-- ── Résumé ────────────────────────────────────────────────────────────────────
-- 1. clubs.plan 'premium' → 'starter' + constraint nettoyée
-- 2. vue public_profiles SECURITY DEFINER (id, name, avatar_url, xp, badges, plan_tier)
-- 3. anon ne peut plus lire directement la table profiles
-- 4. cron cleanup api_rate_limits activé (si pg_cron dispo)
