-- ============================================================
-- SportLink — RBAC + Grants + Audit System
-- Tables : plan_features_config, plan_quotas_config,
--          permission_matrix, admin_grants, admin_audit_log
-- Fonctions : sl_get_effective_plan(), sl_write_audit_log()
-- Seeds : données initiales depuis subscriptionFeatures.ts
-- ============================================================

-- ── 1. plan_features_config — Source de vérité DB pour FEATURE_GATES ──────────
-- Remplace la configuration statique de subscriptionFeatures.ts.
-- L'admin peut modifier les feature gates sans déploiement.

CREATE TABLE IF NOT EXISTS public.plan_features_config (
  feature_key   TEXT PRIMARY KEY,
  feature_label TEXT NOT NULL,
  feature_group TEXT NOT NULL DEFAULT 'other',
  min_plan      TEXT NOT NULL DEFAULT 'elite'
    CHECK (min_plan IN ('free','starter','pro','elite')),
  description   TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.plan_features_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pfc_select_all"    ON public.plan_features_config FOR SELECT USING (true);
CREATE POLICY "pfc_write_admin"   ON public.plan_features_config FOR ALL
  USING (public.sl_is_admin()) WITH CHECK (public.sl_is_admin());

-- ── 2. plan_quotas_config — Source de vérité DB pour PLAN_QUOTAS ─────────────

CREATE TABLE IF NOT EXISTS public.plan_quotas_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan        TEXT NOT NULL CHECK (plan IN ('free','starter','pro','elite')),
  quota_key   TEXT NOT NULL,
  quota_label TEXT NOT NULL,
  value       INTEGER,  -- null = illimité, 0 = bloqué
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (plan, quota_key)
);

ALTER TABLE public.plan_quotas_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pqc_select_all"    ON public.plan_quotas_config FOR SELECT USING (true);
CREATE POLICY "pqc_write_admin"   ON public.plan_quotas_config FOR ALL
  USING (public.sl_is_admin()) WITH CHECK (public.sl_is_admin());

-- ── 3. permission_matrix — Rôles × Ressources × Actions ─────────────────────

CREATE TABLE IF NOT EXISTS public.permission_matrix (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role        TEXT NOT NULL,
  resource    TEXT NOT NULL,
  action      TEXT NOT NULL,
  allowed     BOOLEAN NOT NULL DEFAULT FALSE,
  conditions  JSONB DEFAULT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (role, resource, action)
);

ALTER TABLE public.permission_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_select_all"     ON public.permission_matrix FOR SELECT USING (true);
CREATE POLICY "pm_write_admin"    ON public.permission_matrix FOR ALL
  USING (public.sl_is_admin()) WITH CHECK (public.sl_is_admin());

-- ── 4. admin_grants — Licences et avantages manuels ────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_grants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       TEXT NOT NULL,
  plan          TEXT NOT NULL CHECK (plan IN ('starter','pro','elite')),
  reason        TEXT NOT NULL,
  grant_type    TEXT NOT NULL DEFAULT 'manual'
    CHECK (grant_type IN ('manual','partner','trial_extension','lifetime','promo')),
  granted_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  granted_at    TIMESTAMPTZ DEFAULT NOW(),
  starts_at     TIMESTAMPTZ DEFAULT NOW(),
  ends_at       TIMESTAMPTZ,  -- null = permanent / à vie
  revoked_at    TIMESTAMPTZ,
  revoked_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_grants_club
  ON public.admin_grants(club_id, revoked_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_grants_active
  ON public.admin_grants(club_id, plan, ends_at)
  WHERE revoked_at IS NULL;

ALTER TABLE public.admin_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_select_admin"  ON public.admin_grants FOR SELECT USING (public.sl_is_admin());
CREATE POLICY "ag_write_admin"   ON public.admin_grants FOR ALL
  USING (public.sl_is_admin()) WITH CHECK (public.sl_is_admin());

-- ── 5. admin_audit_log — Journal d'audit complet ────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  admin_email  TEXT,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    TEXT,
  old_value    JSONB,
  new_value    JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON public.admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON public.admin_audit_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin
  ON public.admin_audit_log(admin_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aal_select_admin" ON public.admin_audit_log FOR SELECT USING (public.sl_is_admin());
CREATE POLICY "aal_insert_admin" ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.sl_is_admin() AND admin_id = auth.uid());

-- ── 6. sl_write_audit_log() — RPC SECURITY DEFINER pour l'audit ─────────────

CREATE OR REPLACE FUNCTION public.sl_write_audit_log(
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   TEXT DEFAULT NULL,
  p_old_value   JSONB DEFAULT NULL,
  p_new_value   JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
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

GRANT EXECUTE ON FUNCTION public.sl_write_audit_log TO authenticated;

-- ── 7. sl_get_effective_plan() — Plan effectif = max(base, grants) ────────────
-- Remplace sl_get_club_plan() en intégrant les grants manuels de l'admin.

CREATE OR REPLACE FUNCTION public.sl_get_effective_plan(p_club_id TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_base_plan  TEXT;
  v_grant_plan TEXT;
  v_rank_base  INT;
  v_rank_grant INT;
BEGIN
  -- Plan de base depuis club_subscriptions
  SELECT plan INTO v_base_plan
  FROM public.club_subscriptions
  WHERE club_id = p_club_id
    AND status IN ('active', 'trialing');
  v_base_plan := COALESCE(v_base_plan, 'free');

  -- Plan le plus élevé parmi les grants actifs non révoqués
  SELECT plan INTO v_grant_plan
  FROM public.admin_grants
  WHERE club_id = p_club_id
    AND revoked_at IS NULL
    AND starts_at <= NOW()
    AND (ends_at IS NULL OR ends_at > NOW())
  ORDER BY
    CASE plan WHEN 'elite' THEN 3 WHEN 'pro' THEN 2 WHEN 'starter' THEN 1 ELSE 0 END DESC
  LIMIT 1;

  -- Si aucun grant, retourner le plan de base
  IF v_grant_plan IS NULL THEN RETURN v_base_plan; END IF;

  -- Comparer et retourner le plus élevé
  v_rank_base  := CASE v_base_plan  WHEN 'elite' THEN 3 WHEN 'pro' THEN 2 WHEN 'starter' THEN 1 ELSE 0 END;
  v_rank_grant := CASE v_grant_plan WHEN 'elite' THEN 3 WHEN 'pro' THEN 2 WHEN 'starter' THEN 1 ELSE 0 END;

  RETURN CASE WHEN v_rank_grant > v_rank_base THEN v_grant_plan ELSE v_base_plan END;
END;
$$;

-- Garder sl_get_club_plan() comme alias pour compatibilité ascendante
CREATE OR REPLACE FUNCTION public.sl_get_club_plan(p_club_id TEXT)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT public.sl_get_effective_plan(p_club_id);
$$;

-- ── 8. Trigger audit automatique sur admin_grants ────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_audit_admin_grants()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.sl_write_audit_log(
      'grant_created', 'admin_grants', NEW.id::TEXT,
      NULL,
      jsonb_build_object('club_id', NEW.club_id, 'plan', NEW.plan, 'reason', NEW.reason,
                         'ends_at', NEW.ends_at, 'grant_type', NEW.grant_type)
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

DROP TRIGGER IF EXISTS trg_audit_admin_grants ON public.admin_grants;
CREATE TRIGGER trg_audit_admin_grants
  AFTER INSERT OR UPDATE ON public.admin_grants
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_admin_grants();

-- ── 9. Trigger audit sur plan_features_config ────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_audit_plan_features()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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

DROP TRIGGER IF EXISTS trg_audit_plan_features ON public.plan_features_config;
CREATE TRIGGER trg_audit_plan_features
  AFTER UPDATE ON public.plan_features_config
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_plan_features();

-- ── 10. Trigger audit sur plan_quotas_config ─────────────────────────────────

CREATE OR REPLACE FUNCTION public.trg_audit_plan_quotas()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.value IS DISTINCT FROM NEW.value THEN
    PERFORM public.sl_write_audit_log(
      'plan_quota_changed', 'plan_quotas_config',
      NEW.plan || ':' || NEW.quota_key,
      jsonb_build_object('value', OLD.value),
      jsonb_build_object('value', NEW.value)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_plan_quotas ON public.plan_quotas_config;
CREATE TRIGGER trg_audit_plan_quotas
  AFTER UPDATE ON public.plan_quotas_config
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_plan_quotas();

-- ── 11. Trigger updated_at automatique ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sl_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS pfc_updated_at ON public.plan_features_config;
CREATE TRIGGER pfc_updated_at BEFORE UPDATE ON public.plan_features_config
  FOR EACH ROW EXECUTE FUNCTION public.sl_set_updated_at();

DROP TRIGGER IF EXISTS pqc_updated_at ON public.plan_quotas_config;
CREATE TRIGGER pqc_updated_at BEFORE UPDATE ON public.plan_quotas_config
  FOR EACH ROW EXECUTE FUNCTION public.sl_set_updated_at();

DROP TRIGGER IF EXISTS pm_updated_at ON public.permission_matrix;
CREATE TRIGGER pm_updated_at BEFORE UPDATE ON public.permission_matrix
  FOR EACH ROW EXECUTE FUNCTION public.sl_set_updated_at();

-- ── 12. SEED : plan_features_config — Miroir de subscriptionFeatures.ts ──────

INSERT INTO public.plan_features_config (feature_key, feature_label, feature_group, min_plan, description) VALUES
  -- PosterStudio
  ('POSTER_SIMPLE',             'Affiches basiques',            'poster',    'free',    'Templates basiques sans watermark obligatoire'),
  ('POSTER_EXPERT',             'Mode Expert PosterStudio',     'poster',    'starter', 'Accès à tous les outils d''édition avancés'),
  ('POSTER_WATERMARK_REMOVE',   'Supprimer le watermark',       'poster',    'starter', 'Exporter sans le logo SportLink'),
  ('POSTER_TEMPLATES_ADVANCED', 'Templates avancés',            'poster',    'starter', 'Accès aux templates premium (impact, luxe, etc.)'),
  ('POSTER_AI_BACKGROUND',      'Fonds IA (Pollinations)',       'poster',    'elite',   'Générer des fonds avec l''IA'),
  ('POSTER_AI_ELEMENTS',        'Éléments décoratifs IA',       'poster',    'elite',   'Ajouter des éléments générés par IA'),
  ('POSTER_AI_BRANDING',        'Analyse ADN visuel IA',        'poster',    'elite',   'Claude Vision analyse l''identité du club'),
  ('POSTER_SPONSORS_LOGOS',     'Logos sponsors sur affiches',  'poster',    'pro',     'Afficher les sponsors partenaires'),
  -- Covoiturage
  ('CARPOOLING',                'Covoiturage (1 équipe)',        'carpooling','starter', 'Activer le covoiturage pour une équipe'),
  ('CARPOOLING_ALL_TEAMS',      'Covoiturage toutes équipes',   'carpooling','pro',     'Covoiturage illimité toutes équipes'),
  ('CARPOOLING_AUTO_REMINDERS', 'Relances automatiques',        'carpooling','elite',   'Rappels automatiques aux participants'),
  -- Compositions
  ('TEAM_LINEUPS',              'Compositions d''équipe',       'lineups',   'pro',     'Gérer les compositions tactiques'),
  ('ADVANCED_LINEUPS',          'Compositions avancées',        'lineups',   'pro',     'Schémas tactiques avancés'),
  ('LINEUP_GENERATOR',          'Générateur de composition IA', 'lineups',   'pro',     'IA suggère la composition optimale'),
  -- Statistiques
  ('PLAYER_STATS',              'Statistiques joueurs',         'stats',     'pro',     'Stats individuelles par joueur'),
  ('TEAM_STATS',                'Statistiques équipe',          'stats',     'pro',     'Stats collectives par équipe'),
  ('ADVANCED_STATS',            'Statistiques avancées',        'stats',     'elite',   'Analyses avancées et comparaisons'),
  -- Communication
  ('FEATURED_EVENTS',           'Événements À la Une',          'comms',     'pro',     '5/mois Pro, 15/mois Elite'),
  ('SPONSORS_FEED_CARDS',       'Cartes sponsors dans le feed', 'comms',     'pro',     'Afficher les sponsors dans l''actualité'),
  ('SPONSORS_ON_POSTERS',       'Sponsors sur affiches',        'comms',     'pro',     'Intégrer les sponsors dans les affiches'),
  ('PUSH_NOTIFICATIONS',        'Notifications push',           'comms',     'free',    'Envoyer des notifications aux abonnés'),
  -- Avancé
  ('TOURNAMENTS',               'Module tournois',              'advanced',  'pro',     'Créer et gérer des tournois'),
  ('CO2_REPORTS',               'Rapports CO₂ covoiturage',     'advanced',  'pro',     'Impact environnemental du covoiturage'),
  ('AUTOMATIONS',               'Automations',                  'advanced',  'elite',   'Workflows automatisés'),
  ('ADVANCED_ANALYTICS',        'Analytics avancés',            'advanced',  'elite',   'Données d''usage approfondies'),
  ('AI_BRANDING',               'Branding IA',                  'advanced',  'elite',   'Identité visuelle générée par IA'),
  ('ADVANCED_AI',               'IA avancée',                   'advanced',  'elite',   'Toutes les fonctionnalités IA'),
  ('CLUB_DASHBOARD',            'Dashboard club',               'advanced',  'free',    'Accès au tableau de bord de base')
ON CONFLICT (feature_key) DO NOTHING;

-- ── 13. SEED : plan_quotas_config — Miroir de PLAN_QUOTAS ────────────────────

INSERT INTO public.plan_quotas_config (plan, quota_key, quota_label, value) VALUES
  -- Free
  ('free',    'postersPerMonth',    'Affiches / mois',             3),
  ('free',    'featuredEventsMax',  'Événements À la Une max',     0),
  ('free',    'featuredEventsDays', 'Durée mise en avant (jours)', 0),
  ('free',    'aiGeneratesPerMonth','Générations IA / mois',       0),
  ('free',    'aiImportsPerMonth',  'Imports IA / mois',           0),
  ('free',    'carpoolingTeamsMax', 'Équipes covoiturage max',     0),
  -- Starter
  ('starter', 'postersPerMonth',    'Affiches / mois',             NULL),
  ('starter', 'featuredEventsMax',  'Événements À la Une max',     0),
  ('starter', 'featuredEventsDays', 'Durée mise en avant (jours)', 0),
  ('starter', 'aiGeneratesPerMonth','Générations IA / mois',       10),
  ('starter', 'aiImportsPerMonth',  'Imports IA / mois',           10),
  ('starter', 'carpoolingTeamsMax', 'Équipes covoiturage max',     1),
  -- Pro
  ('pro',     'postersPerMonth',    'Affiches / mois',             NULL),
  ('pro',     'featuredEventsMax',  'Événements À la Une max',     5),
  ('pro',     'featuredEventsDays', 'Durée mise en avant (jours)', 30),
  ('pro',     'aiGeneratesPerMonth','Générations IA / mois',       0),
  ('pro',     'aiImportsPerMonth',  'Imports IA / mois',           0),
  ('pro',     'carpoolingTeamsMax', 'Équipes covoiturage max',     NULL),
  -- Elite
  ('elite',   'postersPerMonth',    'Affiches / mois',             NULL),
  ('elite',   'featuredEventsMax',  'Événements À la Une max',     15),
  ('elite',   'featuredEventsDays', 'Durée mise en avant (jours)', 60),
  ('elite',   'aiGeneratesPerMonth','Générations IA / mois',       NULL),
  ('elite',   'aiImportsPerMonth',  'Imports IA / mois',           NULL),
  ('elite',   'carpoolingTeamsMax', 'Équipes covoiturage max',     NULL)
ON CONFLICT (plan, quota_key) DO NOTHING;

-- ── 14. SEED : permission_matrix ─────────────────────────────────────────────
-- Matrice initiale basée sur le comportement actuel de l'application.
-- L'admin peut modifier ces valeurs via l'interface sans redéploiement.

DO $$
DECLARE
  roles TEXT[]     := ARRAY['visitor','supporter','parent','player','coach','club_manager','club_admin','admin'];
  resources TEXT[] := ARRAY['clubs','teams','matches','trainings','convocations','carpooling','messaging','announcements','payments','settings'];
  actions TEXT[]   := ARRAY['view','create','edit','delete','export','invite','admin'];
  r TEXT; res TEXT; act TEXT;
BEGIN
  FOREACH r IN ARRAY roles LOOP
    FOREACH res IN ARRAY resources LOOP
      FOREACH act IN ARRAY actions LOOP
        INSERT INTO public.permission_matrix (role, resource, action, allowed)
        VALUES (r, res, act, false)
        ON CONFLICT (role, resource, action) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

-- Définir les valeurs true pour le comportement métier actuel
UPDATE public.permission_matrix SET allowed = true WHERE
  (role = 'visitor'      AND resource IN ('clubs','matches') AND action = 'view') OR
  (role = 'supporter'    AND resource IN ('clubs','matches','carpooling') AND action = 'view') OR
  (role = 'supporter'    AND resource = 'announcements' AND action = 'view') OR
  (role = 'parent'       AND resource IN ('clubs','matches','trainings','convocations','carpooling') AND action = 'view') OR
  (role = 'parent'       AND resource = 'convocations' AND action = 'edit') OR
  (role = 'player'       AND resource IN ('clubs','matches','trainings','convocations','carpooling') AND action = 'view') OR
  (role = 'player'       AND resource = 'convocations' AND action = 'edit') OR
  (role = 'player'       AND resource = 'carpooling' AND action = 'create') OR
  (role = 'coach'        AND resource IN ('clubs','teams','matches','trainings','convocations','carpooling','announcements') AND action IN ('view','create','edit')) OR
  (role = 'coach'        AND resource = 'convocations' AND action IN ('create','delete')) OR
  (role = 'club_manager' AND resource IN ('clubs','teams','matches','trainings','convocations','carpooling','announcements') AND action IN ('view','create','edit','delete')) OR
  (role = 'club_manager' AND resource IN ('clubs','teams') AND action = 'invite') OR
  (role = 'club_admin'   AND resource IN ('clubs','teams','matches','trainings','convocations','carpooling','announcements','settings') AND action IN ('view','create','edit','delete','export','invite')) OR
  (role = 'club_admin'   AND resource = 'payments' AND action = 'view') OR
  (role = 'admin'        AND action IN ('view','create','edit','delete','export','invite','admin'));
