-- ────────────────────────────────────────────────────────────────────────────
-- Migration : Alignement des tiers d'abonnement SportLink v2
-- Date      : 2026-06-03
--
-- Avant (divergents) :
--   club_subscriptions.plan  IN ('free','premium','elite')
--   profiles.plan            IN ('free','starter','pro','federation')
--
-- Après (unifiés) :
--   les deux tables           IN ('free','starter','pro','elite')
--
-- Mappings :
--   premium    → starter   (club_subscriptions)
--   federation → elite     (profiles)
--   elite      → elite     (inchangé)
-- ────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. club_subscriptions ─────────────────────────────────────────────────────

ALTER TABLE public.club_subscriptions
  DROP CONSTRAINT IF EXISTS club_subscriptions_plan_check;

-- premium → starter (mapping le plus proche fonctionnellement)
UPDATE public.club_subscriptions SET plan = 'starter' WHERE plan = 'premium';

ALTER TABLE public.club_subscriptions
  ADD CONSTRAINT club_subscriptions_plan_check
    CHECK (plan IN ('free', 'starter', 'pro', 'elite'));

-- Colonne pour la restriction covoiturage plan Starter (1 équipe max)
ALTER TABLE public.club_subscriptions
  ADD COLUMN IF NOT EXISTS carpool_allowed_team_id TEXT DEFAULT NULL;

COMMENT ON COLUMN public.club_subscriptions.carpool_allowed_team_id IS
  'Plan Starter uniquement — ID de l''équipe autorisée pour le covoiturage. NULL = aucune équipe configurée (accès bloqué pour Starter).';

-- ── 2. profiles ───────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- federation → elite (remplacé par le nouveau tier Elite)
UPDATE public.profiles SET plan = 'elite' WHERE plan = 'federation';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
    CHECK (plan IN ('free', 'starter', 'pro', 'elite'));

-- ── 3. featured_events — vue utilitaire mise à jour ───────────────────────────
-- La table featured_events.plan CHECK ('starter','pro','elite') reste valide.
-- Seuls les nouveaux quotas changent : 5/30j (pro) et 15/60j (elite).
-- Les featured_events Starter existants expirent naturellement.

CREATE OR REPLACE VIEW public.featured_plan_limits AS
SELECT plan, max_featured, duration_days FROM (VALUES
  ('pro'::text,   5::int,  30::int),
  ('elite'::text, 15::int, 60::int)
) AS t(plan, max_featured, duration_days);

-- ── 4. club_ai_usage — monthly_limit déprécié ────────────────────────────────
-- La limite IA est désormais dérivée du plan club via PLAN_QUOTAS (côté client).
-- La colonne est conservée pour l'historique des stats uniquement.

COMMENT ON COLUMN public.club_ai_usage.monthly_limit IS
  'DEPRECATED (2026-06-03) — Limite désormais dérivée du plan via PLAN_QUOTAS (subscriptionFeatures.ts). Conserver pour stats historiques.';

COMMIT;
