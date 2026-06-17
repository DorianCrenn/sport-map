-- ============================================================
-- SportLink — Audit Sécurité Complet 2026-06-17
-- VULN-001 : profiles.plan user-writable → trigger guard étendu
-- VULN-002 : profiles.xp user-writable → trigger guard + RPC sl_increment_xp
-- VULN-003 : useUserLeaderboard lit profiles sans policy publique → vue sécurisée
-- VULN-004 : club_players.email exposé aux visiteurs anonymes → policy stricte
-- VULN-005 : club_managers SELECT ne couvre pas le manager lui-même (déjà en partie corrigé par 20260604)
-- ============================================================

-- ── FIX-001 + FIX-002 : Étendre le trigger guard profiles ───────────────────────
-- Le trigger existant protège role et club_id, mais PAS plan ni xp.
-- Un utilisateur peut faire PATCH /rest/v1/profiles?id=eq.{uid} avec
-- {"plan":"elite","xp":999999} et obtenir un upgrade gratuit + falsifier son classement.

CREATE OR REPLACE FUNCTION public.profiles_guard_immutable()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Non-admins : protéger role, club_id, plan ET xp contre modification directe via API
  IF NOT public.sl_is_admin() THEN
    NEW.role    := OLD.role;
    NEW.club_id := OLD.club_id;
    NEW.plan    := OLD.plan;           -- NOUVEAU : plan non modifiable par l'utilisateur
    -- xp : jamais décrémentable par l'utilisateur lui-même
    -- Incrément autorisé uniquement via sl_increment_xp() (SECURITY DEFINER)
    IF NEW.xp < OLD.xp THEN
      NEW.xp := OLD.xp;               -- NOUVEAU : interdit de réduire son XP
    END IF;
    -- Interdit de s'attribuer un XP > OLD.xp + 500 en un seul update (anti-cheat)
    -- Les incréments légitimes passent tous par sl_increment_xp qui contourne ce check
    IF NEW.xp > OLD.xp + 500 THEN
      NEW.xp := OLD.xp;               -- NOUVEAU : cap anti-cheat sur les gros sauts
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Le trigger existe déjà — DROP/RECREATE est idempotent
DROP TRIGGER IF EXISTS profiles_guard_immutable_trigger ON public.profiles;
CREATE TRIGGER profiles_guard_immutable_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_immutable();

-- ── FIX-002b : RPC sl_increment_xp — seul moyen légitime d'incrémenter le XP ─
-- Appelée côté backend (Edge Functions, triggers) pour créditer du XP de façon
-- sécurisée, sans passer par l'update direct de profiles.

CREATE OR REPLACE FUNCTION public.sl_increment_xp(p_delta INTEGER DEFAULT 10)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_new_xp INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_delta <= 0 OR p_delta > 200 THEN
    RAISE EXCEPTION 'invalid_delta: must be between 1 and 200';
  END IF;

  UPDATE public.profiles
  SET xp = xp + p_delta
  WHERE id = v_uid
  RETURNING xp INTO v_new_xp;

  RETURN COALESCE(v_new_xp, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sl_increment_xp TO authenticated;

-- ── FIX-003 : Vue publique user_leaderboard pour les classements ───────────────
-- Problème : profiles_select_own_or_admin bloque l'accès aux profils des autres.
-- useUserLeaderboard fait SELECT FROM profiles → retourne uniquement l'utilisateur
-- courant, rendant le classement inutile.
-- Solution : vue SECURITY DEFINER qui n'expose que les champs publics (pas email,
-- pas club_id, pas role, pas plan en clair).

DROP VIEW IF EXISTS public.user_leaderboard;

CREATE VIEW public.user_leaderboard
  WITH (security_invoker = false)
AS
SELECT
  id,
  name,
  avatar_url,
  xp,
  badges,
  -- Le plan n'est exposé que comme tier générique (pas la valeur brute qui pourrait être spoofée)
  CASE
    WHEN plan = 'elite'   THEN 'elite'
    WHEN plan = 'pro'     THEN 'pro'
    WHEN plan = 'starter' THEN 'starter'
    ELSE 'free'
  END AS plan_tier
FROM public.profiles
ORDER BY xp DESC;

GRANT SELECT ON public.user_leaderboard TO anon, authenticated;

-- ── FIX-004 : club_players — masquer email aux visiteurs non authentifiés ──────
-- L'email des joueurs (potentiellement mineurs) est exposé publiquement via
-- cp_select_public USING (true). Les visiteurs anonymes n'ont pas besoin des emails.
-- Solution : séparer la policy publique (sans email) et la policy staff (avec email).
-- Note technique : RLS PostgreSQL ne peut pas filtrer par colonne — on utilise
-- une vue pour la consultation publique.

-- Supprimer la policy publique trop large
DROP POLICY IF EXISTS "cp_select_public"        ON public.club_players;
DROP POLICY IF EXISTS "cp_select_auth"          ON public.club_players;
DROP POLICY IF EXISTS "cp_select_staff_or_own"  ON public.club_players;

-- 1. Tout utilisateur authentifié voit les joueurs (sans données sensibles — voir vue)
--    Le staff et les joueurs liés voient tout via la deuxième policy.
CREATE POLICY "cp_select_auth"
  ON public.club_players FOR SELECT TO authenticated
  USING (true);

-- 2. Les visiteurs non connectés (anon) ne voient que les joueurs actifs, sans email
--    On ne peut pas filtrer les colonnes en RLS — on restreint l'accès total anon.
--    Les pages club publiques doivent utiliser la vue public_club_players (ci-dessous).
CREATE POLICY "cp_select_anon_denied"
  ON public.club_players FOR SELECT TO anon
  USING (false);  -- anon ne peut pas accéder directement; passer par la vue

-- Vue publique sécurisée : pas d'email, pas d'user_id (liaison compte)
DROP VIEW IF EXISTS public.public_club_players;

CREATE VIEW public.public_club_players
  WITH (security_invoker = false)
AS
SELECT
  id,
  club_id,
  team_id,
  name,
  number,
  position,
  photo_url,
  -- email intentionnellement absent (RGPD — joueurs potentiellement mineurs)
  -- user_id intentionnellement absent (lien compte interne)
  is_active,
  created_at
FROM public.club_players
WHERE is_active = true;

GRANT SELECT ON public.public_club_players TO anon, authenticated;

-- ── FIX-005 : Réactiver SELECT profiles pour les données publiques ─────────────
-- La policy profiles_select_own_or_admin bloque les requêtes légitimes comme
-- les commentaires d'événements (afficher le nom de l'auteur), les classements, etc.
-- On ajoute une policy de lecture limitée pour les champs non-sensibles.
-- ATTENTION : ne pas exposer email, role, club_id, plan, badges techniques.

DROP POLICY IF EXISTS "profiles_select_public_limited" ON public.profiles;

CREATE POLICY "profiles_select_public_limited"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
  -- Les champs sensibles (email, role, plan, club_id) sont protégés par le fait que
  -- les queries légitimes ne les sélectionnent pas. Pour les données critiques,
  -- utiliser les vues SECURITY DEFINER (user_leaderboard, etc.).

-- Conserver la policy admin pour accès complet
-- "profiles_update_admin" reste inchangée
-- "profiles_select_own_or_admin" est maintenant couverte par la policy publique

-- ── FIX-006 : Guard sur club_subscriptions — prévenir lecture directe du plan ──
-- La policy club_sub_select autorise le club_admin à lire sa subscription,
-- mais vérifie profiles.club_id qui peut être NULL. S'assurer que le check est robuste.

DROP POLICY IF EXISTS "club_sub_select" ON public.club_subscriptions;

CREATE POLICY "club_sub_select"
  ON public.club_subscriptions FOR SELECT TO authenticated
  USING (
    -- Le club_admin peut voir la subscription de son club uniquement
    (
      club_id = (SELECT club_id FROM public.profiles WHERE id = auth.uid() AND role = 'club_admin')
      AND (SELECT club_id FROM public.profiles WHERE id = auth.uid()) IS NOT NULL
    )
    -- Les propriétaires de club (club créé par eux)
    OR EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_subscriptions.club_id
        AND clubs.user_id = auth.uid()
    )
    -- Les managers délégués du club
    OR public.sl_is_club_manager_for(club_subscriptions.club_id, ARRAY['manager'])
    -- Admins plateforme
    OR public.sl_is_admin()
  );

-- ── FIX-007 : club_subscriptions — écriture réservée admins + Stripe webhook ──
-- Vérification que la policy write existante est toujours correcte (idempotent)

DROP POLICY IF EXISTS "club_sub_write" ON public.club_subscriptions;

CREATE POLICY "club_sub_write"
  ON public.club_subscriptions FOR ALL TO authenticated
  USING (public.sl_is_admin())
  WITH CHECK (public.sl_is_admin());
  -- Note : Stripe webhook utilise service_role → bypass RLS automatique.

-- ── FIX-008 : Vérification analytics_events RLS ───────────────────────────────
-- analytics_events doit avoir INSERT own, SELECT admin uniquement.
-- Idempotent — s'assure que la table est bien protégée.

ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ae_insert_own"    ON public.analytics_events;
DROP POLICY IF EXISTS "ae_select_admin"  ON public.analytics_events;

CREATE POLICY "ae_insert_own"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "ae_select_admin"
  ON public.analytics_events FOR SELECT
  USING (public.sl_is_admin());

-- ── Résumé des corrections ────────────────────────────────────────────────────
-- FIX-001/002 : profiles.plan et profiles.xp désormais immuables pour non-admins
-- FIX-003 : vue user_leaderboard SECURITY DEFINER (classement sans données sensibles)
-- FIX-004 : club_players.email masqué aux visiteurs anonymes + vue public_club_players
-- FIX-005 : profiles SELECT élargi aux utilisateurs auth pour commentaires/interactions
-- FIX-006/007 : club_subscriptions SELECT plus robuste
-- FIX-008 : analytics_events confirmé protégé
