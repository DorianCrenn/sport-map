-- ============================================================
-- SportLink — Audit sécurité 2026-06-30
-- DB-CRITIQUE-01 : SET search_path = public sur toutes les
--                  fonctions SECURITY DEFINER (prévention
--                  search_path hijacking via pg_catalog poisoning)
-- DB-IMPORTANT-06 : DELETE policy manquante sur club_challenges
-- DB-IMPORTANT-09 : validate_ride_plan — cast UUID robuste
-- DB-IMPORTANT-11 : UNIQUE(event_id, driver_id) sur rides
--                   pour ON CONFLICT idempotent
-- DB-IMPORTANT-13 : Policies d'écriture sur match_lineups
--                   et live_match_events (tables sans write RLS)
-- DB-MINEUR-14    : chk_profiles_role — étendre les valeurs
--                   valides pour aligner avec les usages réels
-- ============================================================

-- ── DB-CRITIQUE-01 : SET search_path = public ────────────────────────────────

-- 1. sl_is_admin (fonction helper centrale)
CREATE OR REPLACE FUNCTION public.sl_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  );
$$;

-- 2. sl_can_manage_club
CREATE OR REPLACE FUNCTION public.sl_can_manage_club(p_club_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clubs
    WHERE id::text = p_club_id AND user_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'club_admin'
      AND club_id = p_club_id
    UNION ALL
    SELECT 1 FROM public.club_managers cm
    WHERE cm.club_id = p_club_id
      AND (
        cm.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM auth.users u
          WHERE lower(u.email) = lower(cm.email) AND u.id = auth.uid()
        )
      )
  )
  OR public.sl_is_admin();
$$;

-- 3. sl_get_club_plan / sl_get_effective_plan
CREATE OR REPLACE FUNCTION public.sl_get_effective_plan(p_club_id TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public AS $$
DECLARE
  v_base_plan  TEXT;
  v_grant_plan TEXT;
  v_rank_base  INT;
  v_rank_grant INT;
BEGIN
  SELECT plan INTO v_base_plan
  FROM public.club_subscriptions
  WHERE club_id = p_club_id
    AND status IN ('active', 'trialing');
  v_base_plan := COALESCE(v_base_plan, 'free');

  SELECT plan INTO v_grant_plan
  FROM public.admin_grants
  WHERE club_id = p_club_id
    AND revoked_at IS NULL
    AND starts_at <= NOW()
    AND (ends_at IS NULL OR ends_at > NOW())
  ORDER BY
    CASE plan WHEN 'elite' THEN 3 WHEN 'pro' THEN 2 WHEN 'starter' THEN 1 ELSE 0 END DESC
  LIMIT 1;

  IF v_grant_plan IS NULL THEN RETURN v_base_plan; END IF;

  v_rank_base  := CASE v_base_plan  WHEN 'elite' THEN 3 WHEN 'pro' THEN 2 WHEN 'starter' THEN 1 ELSE 0 END;
  v_rank_grant := CASE v_grant_plan WHEN 'elite' THEN 3 WHEN 'pro' THEN 2 WHEN 'starter' THEN 1 ELSE 0 END;

  RETURN CASE WHEN v_rank_grant > v_rank_base THEN v_grant_plan ELSE v_base_plan END;
END;
$$;

CREATE OR REPLACE FUNCTION public.sl_get_club_plan(p_club_id TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT public.sl_get_effective_plan(p_club_id);
$$;

-- 4. increment_ai_import_count
CREATE OR REPLACE FUNCTION public.increment_ai_import_count(p_club_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO public.club_ai_usage(club_id, month, import_count)
  VALUES (p_club_id, v_month, 1)
  ON CONFLICT (club_id, month) DO UPDATE
    SET import_count = club_ai_usage.import_count + 1;
END;
$$;

-- 5. increment_ai_generate_count
CREATE OR REPLACE FUNCTION public.increment_ai_generate_count(p_club_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO public.club_ai_usage(club_id, month, generate_count)
  VALUES (p_club_id, v_month, 1)
  ON CONFLICT (club_id, month) DO UPDATE
    SET generate_count = club_ai_usage.generate_count + 1;
END;
$$;

-- 6. handle_claim_approval (trigger)
CREATE OR REPLACE FUNCTION public.handle_claim_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    IF NEW.type = 'player' THEN
      UPDATE public.club_players
        SET user_id = NEW.user_id
        WHERE id = NEW.player_id AND user_id IS NULL;
      IF NEW.birth_year IS NOT NULL THEN
        UPDATE public.profiles
          SET birth_year = NEW.birth_year
          WHERE id = NEW.user_id AND birth_year IS NULL;
      END IF;
    ELSIF NEW.type = 'guardian' THEN
      INSERT INTO public.player_guardians(player_id, user_id, relation)
        VALUES (NEW.player_id, NEW.user_id, NEW.relation)
        ON CONFLICT (player_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 7. sl_club_managers_set_user_id (trigger)
CREATE OR REPLACE FUNCTION public.sl_club_managers_set_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT id INTO NEW.user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

-- 8. on_club_created (trigger)
CREATE OR REPLACE FUNCTION public.on_club_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET
    role    = 'club_admin',
    club_id = NEW.id
  WHERE id   = NEW.user_id
    AND role = 'user';
  RETURN NEW;
END;
$$;

-- 9. validate_featured_event (trigger) — DB-IMPORTANT-09 : comparaison UUID sûre
CREATE OR REPLACE FUNCTION public.validate_featured_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_plan  TEXT;
  v_quota INTEGER;
  v_count INTEGER;
BEGIN
  v_plan := public.sl_get_club_plan(NEW.club_id::TEXT);

  IF NEW.plan = 'elite' THEN
    IF v_plan NOT IN ('elite') THEN
      RAISE EXCEPTION 'Plan Elite requis (plan actuel : %)', v_plan;
    END IF;
    v_quota := 15;
  ELSIF NEW.plan = 'pro' THEN
    IF v_plan NOT IN ('pro', 'elite') THEN
      RAISE EXCEPTION 'Plan Pro ou Elite requis (plan actuel : %)', v_plan;
    END IF;
    v_quota := 5;
  ELSIF NEW.plan = 'starter' THEN
    IF v_plan = 'free' THEN
      RAISE EXCEPTION 'Plan Starter minimum requis (plan actuel : free)';
    END IF;
    v_quota := 1;
  ELSE
    RAISE EXCEPTION 'Plan featured_event inconnu : %', NEW.plan;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.featured_events
  WHERE club_id  = NEW.club_id
    AND plan     = NEW.plan
    AND ends_at  > NOW()
    AND id       <> COALESCE(NEW.id, gen_random_uuid());

  IF v_count >= v_quota THEN
    RAISE EXCEPTION 'Quota atteint : % événement(s) % déjà promu(s) (quota : %)',
      v_count, NEW.plan, v_quota;
  END IF;

  RETURN NEW;
END;
$$;

-- 10. validate_ride_plan (trigger) — DB-IMPORTANT-09 : UUID cast sécurisé
CREATE OR REPLACE FUNCTION public.validate_ride_plan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_club_id  UUID;
  v_plan     TEXT;
BEGIN
  IF NEW.event_id IS NULL THEN RETURN NEW; END IF;

  -- Comparaison TEXT↔TEXT pour éviter l'exception de cast UUID
  SELECT e.club_id INTO v_club_id
  FROM public.events e
  WHERE e.id::TEXT = NEW.event_id::TEXT;

  IF v_club_id IS NULL THEN RETURN NEW; END IF;

  v_plan := public.sl_get_club_plan(v_club_id::TEXT);

  IF v_plan = 'free' THEN
    RAISE EXCEPTION 'Le covoiturage nécessite le plan Starter ou supérieur (plan actuel : free)';
  END IF;

  RETURN NEW;
END;
$$;

-- 11. validate_poster_export_quota (trigger) — version Starter illimité (2026-06-24)
CREATE OR REPLACE FUNCTION public.validate_poster_export_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_plan  TEXT;
  v_quota INTEGER;
  v_count INTEGER;
  v_month DATE;
BEGIN
  IF NEW.club_id IS NULL THEN RETURN NEW; END IF;

  v_plan  := public.sl_get_club_plan(NEW.club_id::TEXT);
  v_month := DATE_TRUNC('month', NOW())::DATE;

  v_quota := CASE v_plan WHEN 'free' THEN 3 ELSE NULL END;

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

-- 12. delete_own_account
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

-- 13. clubs_guard_status (trigger)
CREATE OR REPLACE FUNCTION public.clubs_guard_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT public.sl_is_admin() THEN
    NEW.status            := OLD.status;
    NEW.verified_at       := OLD.verified_at;
    NEW.verified_by       := OLD.verified_by;
    NEW.verification_note := OLD.verification_note;
  END IF;
  RETURN NEW;
END;
$$;

-- 14. trg_feedback_status_notify (trigger)
CREATE OR REPLACE FUNCTION public.trg_feedback_status_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.feedback_notifications (
      user_id, feedback_id, feedback_title, feedback_type, old_status, new_status
    ) VALUES (
      NEW.user_id, NEW.id, NEW.title, NEW.type, OLD.status, NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 15. club_page_views_set_user_id (trigger)
CREATE OR REPLACE FUNCTION public.club_page_views_set_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

-- 16. cleanup_orphan_poster_drafts
CREATE OR REPLACE FUNCTION public.cleanup_orphan_poster_drafts()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM public.posters
  WHERE status = 'draft'
    AND updated_at < NOW() - INTERVAL '30 days'
    AND event_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.events WHERE id::text = posters.event_id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 17. profiles_guard_immutable (trigger)
CREATE OR REPLACE FUNCTION public.profiles_guard_immutable()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NOT public.sl_is_admin() THEN
    NEW.role    := OLD.role;
    NEW.club_id := OLD.club_id;
    NEW.plan    := OLD.plan;
    IF NEW.xp < OLD.xp THEN
      NEW.xp := OLD.xp;
    END IF;
    IF NEW.xp > OLD.xp + 500 THEN
      NEW.xp := OLD.xp;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 18. sl_increment_xp
CREATE OR REPLACE FUNCTION public.sl_increment_xp(p_delta INTEGER DEFAULT 10)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_uid    UUID    := auth.uid();
  v_new_xp INTEGER;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
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

-- 19. sl_write_audit_log
CREATE OR REPLACE FUNCTION public.sl_write_audit_log(
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   TEXT  DEFAULT NULL,
  p_old_value   JSONB DEFAULT NULL,
  p_new_value   JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_email TEXT;
  v_id    UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT public.sl_is_admin() THEN RAISE EXCEPTION 'admin_required'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  INSERT INTO public.admin_audit_log
    (admin_id, admin_email, action, entity_type, entity_id, old_value, new_value)
  VALUES
    (v_uid, v_email, p_action, p_entity_type, p_entity_id, p_old_value, p_new_value)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 20. trg_audit_admin_grants (trigger)
CREATE OR REPLACE FUNCTION public.trg_audit_admin_grants()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.sl_write_audit_log(
      'grant_created', 'admin_grants', NEW.id::TEXT, NULL,
      jsonb_build_object('club_id', NEW.club_id, 'plan', NEW.plan,
                         'reason', NEW.reason, 'ends_at', NEW.ends_at,
                         'grant_type', NEW.grant_type)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
    PERFORM public.sl_write_audit_log(
      'grant_revoked', 'admin_grants', NEW.id::TEXT,
      jsonb_build_object('plan', OLD.plan, 'reason', OLD.reason),
      jsonb_build_object('revoke_reason', NEW.revoke_reason)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 21. trg_audit_plan_features (trigger)
CREATE OR REPLACE FUNCTION public.trg_audit_plan_features()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.min_plan IS DISTINCT FROM NEW.min_plan THEN
    PERFORM public.sl_write_audit_log(
      'plan_feature_changed', 'plan_features_config', NEW.feature_key,
      jsonb_build_object('min_plan', OLD.min_plan),
      jsonb_build_object('min_plan', NEW.min_plan)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── DB-IMPORTANT-06 : DELETE policy manquante sur club_challenges ─────────────
-- Avant : seuls INSERT et UPDATE étaient couverts.
-- Après : le challenger OU un admin peut annuler/supprimer un défi.

DROP POLICY IF EXISTS "challenges_delete" ON public.club_challenges;

CREATE POLICY "challenges_delete"
  ON public.club_challenges FOR DELETE
  USING (
    challenger_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid())
    OR public.sl_is_admin()
  );

-- ── DB-IMPORTANT-11 : UNIQUE(event_id, driver_id) sur rides ──────────────────
-- Permet l'idempotence de l'INSERT ON CONFLICT (event_id, driver_id) dans useRides.

ALTER TABLE IF EXISTS public.rides
  ADD CONSTRAINT rides_event_driver_unique UNIQUE (event_id, driver_id)
  DEFERRABLE INITIALLY DEFERRED;

-- ── DB-IMPORTANT-13 : Policies d'écriture sur match_lineups ──────────────────
-- Ces tables n'avaient que des policies SELECT (lecture publique).
-- Les compositions (lineups) et événements live sont écrits par les managers
-- et coaches du club qui organise l'événement.

DROP POLICY IF EXISTS "match_lineups_write" ON public.match_lineups;

CREATE POLICY "match_lineups_write"
  ON public.match_lineups FOR ALL TO authenticated
  USING (
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(
      (SELECT e.club_id FROM public.events e WHERE e.id = match_lineups.event_id),
      ARRAY['manager', 'editor']
    )
  )
  WITH CHECK (
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(
      (SELECT e.club_id FROM public.events e WHERE e.id = match_lineups.event_id),
      ARRAY['manager', 'editor']
    )
  );

-- ── DB-IMPORTANT-13 : Policies d'écriture sur live_match_events ──────────────

DROP POLICY IF EXISTS "live_match_events_write" ON public.live_match_events;

CREATE POLICY "live_match_events_write"
  ON public.live_match_events FOR ALL TO authenticated
  USING (
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(
      (SELECT e.club_id FROM public.events e WHERE e.id = live_match_events.event_id),
      ARRAY['manager', 'editor']
    )
  )
  WITH CHECK (
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(
      (SELECT e.club_id FROM public.events e WHERE e.id = live_match_events.event_id),
      ARRAY['manager', 'editor']
    )
  );

-- ── DB-MINEUR-14 : Étendre chk_profiles_role ─────────────────────────────────
-- La contrainte originale ('user','admin','superadmin','club_admin') est trop
-- restrictive : on_club_created peut stocker 'club_admin', mais d'autres
-- migrations ont ajouté un rôle 'coach' dans club_managers sans l'avoir dans
-- profiles. On garde la contrainte stricte car profiles.role est un rôle système,
-- distinct de club_managers.role (manager/editor/communicant) et profiles.job_role
-- (joueur/coach/parent...). Seule extension utile : documenter les valeurs valides.
COMMENT ON COLUMN public.profiles.role IS
  'Rôle plateforme : user | club_admin | admin | superadmin. '
  'Distinct de job_role (rôle métier auto-déclaré) et club_managers.role (délégation).';

-- ── Résumé ────────────────────────────────────────────────────────────────────
-- CRITIQUE-01 : 21 fonctions SECURITY DEFINER sécurisées avec SET search_path
-- IMPORTANT-06 : DELETE policy ajoutée sur club_challenges
-- IMPORTANT-09 : validate_ride_plan — UUID cast via ::TEXT (robuste NULL-safe)
-- IMPORTANT-11 : UNIQUE(event_id, driver_id) sur rides
-- IMPORTANT-13 : write policies sur match_lineups + live_match_events
-- MINEUR-14    : comment explicatif sur profiles.role (pas de modification contrainte)
