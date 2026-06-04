-- ============================================================
-- Feature gating côté serveur — sécurise les fonctionnalités payantes
-- Corrige les bypasses client-side identifiés lors de l'audit
-- ============================================================

-- ── Helper : récupère le plan actif d'un club ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.sl_get_club_plan(p_club_id TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT plan INTO v_plan
  FROM public.club_subscriptions
  WHERE club_id = p_club_id
    AND status IN ('active', 'trialing');
  RETURN COALESCE(v_plan, 'free');
END;
$$;

-- ── 1. FEATURED_EVENTS — Validation plan + quota au niveau DB ────────────────
-- Avant : RLS vérifie uniquement la propriété du club, pas le plan ni le quota.
-- Après : trigger BEFORE INSERT vérifie (1) plan suffisant (2) quota non dépassé.

CREATE OR REPLACE FUNCTION public.validate_featured_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan      TEXT;
  v_quota     INTEGER;
  v_count     INTEGER;
BEGIN
  -- Récupérer le plan du club
  v_plan := public.sl_get_club_plan(NEW.club_id::TEXT);

  -- Minimum requis selon le tier demandé
  IF NEW.plan = 'elite' THEN
    IF v_plan NOT IN ('elite') THEN
      RAISE EXCEPTION 'Plan Elite requis pour promouvoir en Elite (plan actuel : %)', v_plan;
    END IF;
    v_quota := 15;
  ELSIF NEW.plan = 'pro' THEN
    IF v_plan NOT IN ('pro', 'elite') THEN
      RAISE EXCEPTION 'Plan Pro ou Elite requis pour promouvoir en Pro (plan actuel : %)', v_plan;
    END IF;
    v_quota := 5;
  ELSIF NEW.plan = 'starter' THEN
    IF v_plan = 'free' THEN
      RAISE EXCEPTION 'Plan Starter minimum requis pour les événements promus (plan actuel : free)';
    END IF;
    v_quota := 1;
  ELSE
    RAISE EXCEPTION 'Plan featured_event inconnu : %', NEW.plan;
  END IF;

  -- Vérifier le quota mensuel (events actifs non expirés)
  SELECT COUNT(*) INTO v_count
  FROM public.featured_events
  WHERE club_id  = NEW.club_id
    AND plan     = NEW.plan
    AND ends_at  > NOW()
    AND id       <> COALESCE(NEW.id, gen_random_uuid()); -- exclure la ligne en cours d'UPDATE

  IF v_count >= v_quota THEN
    RAISE EXCEPTION 'Quota atteint : % événement(s) % déjà promu(s) ce mois (quota : %)',
      v_count, NEW.plan, v_quota;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_featured_event ON public.featured_events;
CREATE TRIGGER trg_validate_featured_event
  BEFORE INSERT ON public.featured_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_featured_event();

-- ── 2. RIDES (covoiturage) — Validation plan au niveau DB ────────────────────
-- Avant : RLS vérifie uniquement auth.uid() = driver_id, pas le plan.
-- Après : trigger BEFORE INSERT vérifie que le club du conducteur a CARPOOLING.

CREATE OR REPLACE FUNCTION public.validate_ride_plan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_club_id   UUID;
  v_plan      TEXT;
  v_event_dt  TIMESTAMPTZ;
BEGIN
  -- Récupérer le club et la date de l'événement
  SELECT club_id, date INTO v_club_id, v_event_dt
  FROM public.events
  WHERE id = NEW.event_id::UUID;

  -- Si l'événement n'a pas de club, laisser passer (évènement perso)
  IF v_club_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_plan := public.sl_get_club_plan(v_club_id::TEXT);

  -- Le covoiturage nécessite au minimum le plan Starter
  IF v_plan = 'free' THEN
    RAISE EXCEPTION 'Le covoiturage nécessite le plan Starter ou supérieur (plan actuel : free)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_ride_plan ON public.rides;
CREATE TRIGGER trg_validate_ride_plan
  BEFORE INSERT ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.validate_ride_plan();

-- ── 3. POSTER_EXPORTS — Quota mensuel FREE (3/mois) ─────────────────────────
-- Ajoute une validation du quota d'exports par mois pour les plans Free.

CREATE OR REPLACE FUNCTION public.validate_poster_export_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan    TEXT;
  v_quota   INTEGER;
  v_count   INTEGER;
  v_month   DATE;
BEGIN
  -- Pas de club → pas de restriction
  IF NEW.club_id IS NULL THEN RETURN NEW; END IF;

  v_plan  := public.sl_get_club_plan(NEW.club_id::TEXT);
  v_month := DATE_TRUNC('month', NOW())::DATE;

  -- Quota mensuel par plan
  v_quota := CASE v_plan
    WHEN 'free'    THEN 3
    WHEN 'starter' THEN 50
    ELSE NULL -- pro/elite : illimité
  END;

  -- Plan illimité → pas de vérification
  IF v_quota IS NULL THEN RETURN NEW; END IF;

  -- Compter les exports du mois en cours
  SELECT COUNT(*) INTO v_count
  FROM public.poster_exports
  WHERE club_id  = NEW.club_id
    AND DATE_TRUNC('month', created_at)::DATE = v_month;

  IF v_count >= v_quota THEN
    RAISE EXCEPTION 'Quota d''affiches atteint : %/% ce mois (plan : %)',
      v_count, v_quota, v_plan;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_poster_export ON public.poster_exports;
CREATE TRIGGER trg_validate_poster_export
  BEFORE INSERT ON public.poster_exports
  FOR EACH ROW EXECUTE FUNCTION public.validate_poster_export_quota();

-- ── Notes ─────────────────────────────────────────────────────────────────────
-- Le watermark poster reste côté client (difficulté technique de signer côté serveur).
-- L'export d'image lui-même est local (html-to-image) → non interceptable côté DB.
-- La protection du watermark passe par le logo + qualité réduite du preview FREE.
