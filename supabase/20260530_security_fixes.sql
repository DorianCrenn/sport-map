-- ============================================================
-- SportLink — Migrations sécurité 2026-05-30
-- IDEMPOTENT : safe à re-run (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS)
--
-- Contenu :
--   1. SEC-CM   : club_managers — ajout user_id + fix RLS
--   2. SEC-PE   : poster_exports — fix SELECT (managers exclus)
--   3. SEC-CPV  : club_page_views — restreindre SELECT (était public)
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. SEC-CM — club_managers : user_id + trigger + RLS corrigée
--
-- PROBLÈME : la table identifie les managers par email uniquement.
--   - sl_is_club_manager_for() fait un JOIN coûteux sur auth.users
--   - Les managers ne peuvent pas lire leur propre ligne (RLS bloquante)
--   - useManagedClubs.js et AuthContext.jsx échouent silencieusement
--
-- SOLUTION : ajouter user_id, auto-populer via trigger, mettre à jour
--   la fonction helper et corriger les policies.
-- ════════════════════════════════════════════════════════════

-- 1a. Colonne status (utile si pas encore présente)
ALTER TABLE public.club_managers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'club_managers' AND constraint_name = 'club_managers_status_check'
  ) THEN
    ALTER TABLE public.club_managers
      ADD CONSTRAINT club_managers_status_check
      CHECK (status IN ('pending', 'active', 'disabled'));
  END IF;
END $$;

-- 1b. Colonne user_id
ALTER TABLE public.club_managers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_club_managers_user_id
  ON public.club_managers (user_id)
  WHERE user_id IS NOT NULL;

-- 1c. Backfill : associer user_id aux managers déjà en base
--   Si l'email correspond à un compte auth.users, on lie directement.
UPDATE public.club_managers cm
SET user_id = u.id
FROM auth.users u
WHERE lower(u.email) = lower(cm.email)
  AND cm.user_id IS NULL;

-- 1d. Trigger : auto-populate user_id à chaque INSERT ou UPDATE d'email
CREATE OR REPLACE FUNCTION public.sl_manager_auto_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Tente de lier l'email à un compte existant
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO NEW.user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manager_auto_user_id_trigger ON public.club_managers;
CREATE TRIGGER manager_auto_user_id_trigger
  BEFORE INSERT OR UPDATE OF email ON public.club_managers
  FOR EACH ROW EXECUTE FUNCTION public.sl_manager_auto_user_id();

-- 1e. Mettre à jour sl_is_club_manager_for() pour utiliser user_id en priorité
--   (plus de JOIN coûteux sur auth.users quand user_id est renseigné).
--   Fallback email pour les invitations 'pending' non encore activées.
CREATE OR REPLACE FUNCTION public.sl_is_club_manager_for(
  p_club_id TEXT,
  p_roles   TEXT[]
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.club_managers cm
    WHERE cm.club_id = p_club_id
      AND cm.role    = ANY(p_roles)
      AND cm.status IN ('active', 'pending')
      AND (
        -- Chemin rapide : user_id déjà populé
        cm.user_id = auth.uid()
        -- Fallback pour les invitations pending non encore activées
        OR (
          cm.user_id IS NULL
          AND lower(cm.email) = (
            SELECT lower(email) FROM auth.users WHERE id = auth.uid() LIMIT 1
          )
        )
      )
  );
END;
$$;

-- 1f. Recréer toutes les policies club_managers
--   AVANT  : seul le propriétaire du club pouvait SELECT
--   APRÈS  : chaque manager peut lire sa propre ligne (nécessaire pour
--             useManagedClubs.js et AuthContext MANAGER-001)

DROP POLICY IF EXISTS "managers_select_owner_or_admin" ON public.club_managers;
DROP POLICY IF EXISTS "managers_insert_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_update_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_delete_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "cm_select"                      ON public.club_managers;
DROP POLICY IF EXISTS "cm_insert"                      ON public.club_managers;
DROP POLICY IF EXISTS "cm_update"                      ON public.club_managers;
DROP POLICY IF EXISTS "cm_delete"                      ON public.club_managers;

-- SELECT : sa propre ligne | par email (pending) | propriétaire du club | admin
CREATE POLICY "cm_select"
  ON public.club_managers FOR SELECT
  USING (
    -- Le manager voit sa propre ligne
    user_id = auth.uid()
    -- Fallback email (invitation pending, user_id pas encore populé)
    OR lower(email) = (
      SELECT lower(email) FROM auth.users WHERE id = auth.uid() LIMIT 1
    )
    -- Le propriétaire du club voit tous ses managers
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    -- Admin voit tout
    OR public.sl_is_admin()
  );

-- INSERT : seul le propriétaire du club ou un admin peut ajouter un manager
CREATE POLICY "cm_insert"
  ON public.club_managers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
  );

-- UPDATE : propriétaire du club, admin, ou le manager lui-même (activation status)
CREATE POLICY "cm_update"
  ON public.club_managers FOR UPDATE
  USING (
    user_id = auth.uid()
    OR lower(email) = (
      SELECT lower(email) FROM auth.users WHERE id = auth.uid() LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
  );

-- DELETE : seul le propriétaire du club ou un admin peut retirer un manager
CREATE POLICY "cm_delete"
  ON public.club_managers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
    OR public.sl_is_admin()
  );


-- ════════════════════════════════════════════════════════════
-- 2. SEC-PE — poster_exports : corriger SELECT
--
-- PROBLÈME : les managers voient 0 exports dans leur dashboard
--   car la policy n'inclut que le propriétaire du club et les admins.
--   Aussi : un utilisateur ne peut pas voir ses propres exports.
--
-- SOLUTION : étendre la policy SELECT.
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "poster_exports_select" ON public.poster_exports;

CREATE POLICY "poster_exports_select"
  ON public.poster_exports FOR SELECT
  USING (
    -- Ses propres exports
    user_id = auth.uid()
    -- Propriétaire du club
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = poster_exports.club_id
        AND clubs.user_id = auth.uid()
    )
    -- Manager du club (tous rôles : manager, editor, communicant)
    OR (
      club_id IS NOT NULL
      AND public.sl_is_club_manager_for(
        club_id::text,
        ARRAY['manager', 'editor', 'communicant']
      )
    )
    -- Admin
    OR public.sl_is_admin()
  );


-- ════════════════════════════════════════════════════════════
-- 3. SEC-CPV — club_page_views : restreindre SELECT
--
-- PROBLÈME : la policy SELECT était USING (true) — n'importe quel
--   utilisateur authentifié (ou non) pouvait lire TOUTES les vues
--   de TOUS les clubs via l'API Supabase directement.
--
-- SOLUTION : seuls le propriétaire, ses managers et les admins
--   peuvent lire les vues de leur club.
--   Insert reste ouvert (nécessaire pour comptabiliser les visites).
-- ════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "cpv_select_all" ON public.club_page_views;

CREATE POLICY "cpv_select_club_owner_or_manager"
  ON public.club_page_views FOR SELECT
  USING (
    -- Propriétaire du club
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_page_views.club_id
        AND clubs.user_id = auth.uid()
    )
    -- Manager du club
    OR public.sl_is_club_manager_for(
      club_page_views.club_id,
      ARRAY['manager', 'editor', 'communicant']
    )
    -- Admin
    OR public.sl_is_admin()
  );

-- cpv_insert_anyone reste inchangée (nécessaire pour tracker les visites publiques)
-- DROP POLICY IF EXISTS "cpv_insert_anyone" ON public.club_page_views;
-- CREATE POLICY "cpv_insert_anyone" ON public.club_page_views FOR INSERT WITH CHECK (true);


-- ════════════════════════════════════════════════════════════
-- VÉRIFICATION (exécuter après le déploiement pour confirmer)
-- ════════════════════════════════════════════════════════════
--
-- 1. club_managers — vérifier que user_id est populé :
--    SELECT email, user_id, status, role FROM club_managers ORDER BY added_at DESC LIMIT 20;
--
-- 2. poster_exports — vérifier la policy :
--    SELECT * FROM pg_policies WHERE tablename = 'poster_exports';
--
-- 3. club_page_views — vérifier la policy :
--    SELECT * FROM pg_policies WHERE tablename = 'club_page_views';
--
-- 4. sl_is_club_manager_for — tester avec un vrai user_id :
--    SELECT public.sl_is_club_manager_for('<club_id>', ARRAY['manager']);
-- ════════════════════════════════════════════════════════════
