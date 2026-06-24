-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : Affiches illimitées pour le plan Starter (2026-06-24)
--
-- Problème : validate_poster_export_quota() limitait Starter à 50 affiches/mois
-- alors que subscriptionFeatures.ts et SUBSCRIPTIONS_PLAN.md indiquent illimité.
-- Solution : passer Starter à NULL (illimité) dans le trigger, identique à Pro/Elite.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.validate_poster_export_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan  TEXT;
  v_quota INTEGER;
  v_count INTEGER;
  v_month DATE;
BEGIN
  IF NEW.club_id IS NULL THEN RETURN NEW; END IF;

  v_plan  := public.sl_get_club_plan(NEW.club_id::TEXT);
  v_month := DATE_TRUNC('month', NOW())::DATE;

  -- Free = 3/mois, Starter/Pro/Elite = illimité (NULL)
  v_quota := CASE v_plan
    WHEN 'free' THEN 3
    ELSE NULL
  END;

  IF v_quota IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.poster_exports
  WHERE club_id = NEW.club_id
    AND DATE_TRUNC('month', created_at)::DATE = v_month;

  IF v_count >= v_quota THEN
    RAISE EXCEPTION 'Quota d''affiches atteint : %/% ce mois (plan : %)',
      v_count, v_quota, v_plan;
  END IF;

  RETURN NEW;
END;
$$;
