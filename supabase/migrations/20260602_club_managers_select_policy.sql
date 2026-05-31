-- ROLES-001d : GRANT + politique SELECT manquants sur club_managers
--
-- Deux problèmes distincts causaient le 403 PostgREST :
--   1. Pas de GRANT SELECT sur la table → PostgREST refuse sans même évaluer la RLS
--   2. Policy SELECT absente ou avec auth.email() non fonctionnel en RLS
--
-- Pattern correct pour le USING : JOIN auth.users sur uid (identique à sl_is_club_manager_for)

-- ── 1. Permission SQL niveau table ────────────────────────────────────────────
GRANT SELECT ON public.club_managers TO authenticated;

-- ── 2. Policy RLS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "managers_select_own_or_owner" ON public.club_managers;

CREATE POLICY "managers_select_own_or_owner"
  ON public.club_managers FOR SELECT
  USING (
    -- Le manager voit ses propres lignes (join auth.users sur uid)
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND lower(u.email) = lower(club_managers.email)
    )
    -- Le propriétaire du club voit ses gestionnaires
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    -- Les admins plateforme voient tout
    OR public.sl_is_admin()
  );
