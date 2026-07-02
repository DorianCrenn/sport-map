-- ============================================================
-- SportLink — Fix 2026-07-02
--
-- A. club_managers SELECT : managers ne voient pas leur propre ligne
--    (la policy 02_rls.sql ne donnait accès qu'aux propriétaires de club)
--    Fix : policy email-based via sl_email_is_current_user() + GRANT
--
-- B. Attendance profiles : le join profiles(name,avatar_url) retournait
--    null pour tous les joueurs (RLS profiles bloque les autres profils).
--    Fix : garantir que public_profiles VIEW est accessible + GRANT
-- ============================================================

-- ── A. club_managers SELECT ───────────────────────────────────────────────────

-- Fonction SECURITY DEFINER (safe, lit auth.users sans exposer la table)
CREATE OR REPLACE FUNCTION public.sl_email_is_current_user(check_email TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND lower(email) = lower(check_email)
  )
$$;

-- GRANT manquant — sans lui PostgREST renvoie 403 avant même d'évaluer la RLS
GRANT SELECT ON public.club_managers TO authenticated;

-- Supprimer les policies conflictuelles
DROP POLICY IF EXISTS "managers_select_owner_or_admin" ON public.club_managers;
DROP POLICY IF EXISTS "managers_select_own_or_owner"   ON public.club_managers;

-- Nouvelle policy : manager voit sa ligne OU propriétaire voit ses managers OU admin
CREATE POLICY "managers_select_own_or_owner"
  ON public.club_managers FOR SELECT
  USING (
    public.sl_email_is_current_user(email)
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
  );

-- ── B. public_profiles VIEW — GRANT pour le join attendance ──────────────────

-- La vue public_profiles expose uniquement les champs non-sensibles
-- (id, name, avatar_url, xp, badges, favorite_sports) et est utilisée
-- à la place du join direct sur profiles (RLS trop restrictif post-23/06).
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT
    id,
    name,
    avatar_url,
    xp,
    badges,
    favorite_sports
  FROM public.profiles;

-- Idempotent : GRANT OU REPLACE
GRANT SELECT ON public.public_profiles TO authenticated, anon;
