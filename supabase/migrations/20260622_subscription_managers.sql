-- ============================================================
-- Migration 20260622 : cancel_at_period_end + auto-link trigger
-- ============================================================

-- 1. Colonne cancel_at_period_end sur club_subscriptions
-- -------------------------------------------------------
ALTER TABLE public.club_subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Colonne status sur club_managers (gestion invitation en attente)
-- -------------------------------------------------------------------
ALTER TABLE public.club_managers
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'suspended'));

-- 3. Fonction SECURITY DEFINER pour lire l'email d'un user auth
-- -------------------------------------------------------------------
-- Expose un moyen sécurisé de résoudre email → user_id (utilisé par relinkByEmail
-- dans le hook useClubManagers et par le trigger ci-dessous).
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email TEXT)
  RETURNS TABLE (id UUID)
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
AS $$
  SELECT id
  FROM   auth.users
  WHERE  lower(email) = lower(p_email)
  LIMIT  1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM anon;

-- 4. Trigger : auto-link club_managers.user_id à la création du compte
-- -------------------------------------------------------------------
-- Quand un user s'inscrit (INSERT INTO auth.users), on vérifie si son email
-- correspond à des lignes de club_managers sans user_id et on les lie.
CREATE OR REPLACE FUNCTION public.auto_link_club_managers()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.club_managers
  SET    user_id    = NEW.id,
         updated_at = now()
  WHERE  lower(email) = lower(NEW.email)
    AND  user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Attacher sur auth.users (si le trigger n'existe pas déjà)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE  tgname = 'trg_auto_link_club_managers'
      AND  tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER trg_auto_link_club_managers
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.auto_link_club_managers();
  END IF;
END;
$$;

-- 5. Backfill : lier les comptes déjà existants
-- -------------------------------------------------------------------
UPDATE public.club_managers cm
SET    user_id    = au.id,
       updated_at = now()
FROM   auth.users au
WHERE  lower(cm.email) = lower(au.email)
  AND  cm.user_id IS NULL;

-- 6. Index pour accélérer les lookups par user_id
-- -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_club_managers_user_id
  ON public.club_managers (user_id)
  WHERE user_id IS NOT NULL;

-- 7. Mise à jour RLS : permettre aux managers d'accéder via user_id
-- -------------------------------------------------------------------
-- La fonction sl_is_club_manager_for() a déjà été mise à jour dans
-- migration 20260603 pour lire user_id ET email. Pas de changement nécessaire.

COMMENT ON COLUMN public.club_subscriptions.cancel_at_period_end IS
  'Vrai si l''abonnement Stripe sera annulé en fin de période (cancel_at_period_end=true dans Stripe).';

COMMENT ON COLUMN public.club_managers.status IS
  'Statut du manager : active (accès complet), pending (invitation en attente), suspended (accès retiré).';
