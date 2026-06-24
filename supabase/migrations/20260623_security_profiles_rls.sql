-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : Restreindre l'accès à profiles (C-02 audit 2026-06-23)
--
-- Problème : "profiles_select_public_limited" avec USING(true) expose
-- role, club_id, plan, xp, badges, analytics_consent de TOUS les users
-- à TOUS les utilisateurs authentifiés → fuite de données massive.
--
-- Solution : Vue publique restreinte aux champs non-sensibles + policy stricte
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Supprimer la policy trop permissive
DROP POLICY IF EXISTS "profiles_select_public_limited" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

-- 2. La policy "own" existante permet de lire son propre profil complet
--    (profiles_select_own_or_admin doit déjà exister depuis les migrations précédentes)
--    Si elle n'existe pas, la créer :
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
    AND policyname = 'profiles_select_own_or_admin'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY profiles_select_own_or_admin
        ON public.profiles FOR SELECT TO authenticated
        USING (
          auth.uid() = id
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
          )
        )
    $pol$;
  END IF;
END;
$$;

-- 3. Vue publique sécurisée pour les cas d'usage légitimes
--    (commentaires, leaderboards, profils publics)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT
    id,
    name,
    avatar_url,
    xp,
    badges,
    favorite_sports
  FROM public.profiles;

-- Accès en lecture pour les utilisateurs authentifiés
GRANT SELECT ON public.public_profiles TO authenticated;

-- Note : les requêtes de commentaires/leaderboards/mentions doivent utiliser
-- public_profiles et non profiles directement pour les données d'autres users.
-- Les champs sensibles (role, club_id, plan, analytics_consent, email) ne sont
-- accessibles qu'en lisant son propre profil via auth.uid() = id.

-- 4. Corriger sl_is_club_manager_for : accepter uniquement status='active' (I-03)
--    Même signature (TEXT, TEXT[]) que la version originale dans 20260527_club_manager_rls.sql.
--    club_managers.club_id est de type TEXT dans cette base — ne pas passer UUID.
CREATE OR REPLACE FUNCTION public.sl_is_club_manager_for(
  p_club_id TEXT,
  p_roles   TEXT[]
)
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.club_managers cm
    JOIN auth.users u ON lower(u.email) = lower(cm.email)
    WHERE cm.club_id = p_club_id
      AND u.id       = auth.uid()
      AND cm.role    = ANY(p_roles)
      AND cm.status  = 'active'    -- uniquement les managers confirmés (I-03)
  );
END;
$$;
