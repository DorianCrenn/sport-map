-- ─────────────────────────────────────────────────────────────────────────────
-- plan_pricing_config — Métadonnées des plans éditables par l'admin
-- Prix, nom, couleur, badge, tagline, CTA, plan populaire
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.plan_pricing_config (
  plan_id         TEXT        PRIMARY KEY CHECK (plan_id IN ('free', 'starter', 'pro', 'elite')),
  name            TEXT        NOT NULL DEFAULT '',
  price_monthly   INTEGER     NOT NULL DEFAULT 0,   -- en euros
  color           TEXT        NOT NULL DEFAULT '#64748b',
  badge           TEXT        NOT NULL DEFAULT '⚪',
  tagline         TEXT        NOT NULL DEFAULT '',
  cta_label       TEXT        NOT NULL DEFAULT 'Choisir',
  is_popular      BOOLEAN     NOT NULL DEFAULT false,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_plan_pricing_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plan_pricing_updated_at ON public.plan_pricing_config;
CREATE TRIGGER trg_plan_pricing_updated_at
  BEFORE UPDATE ON public.plan_pricing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_plan_pricing_updated_at();

-- Un seul plan peut être "populaire" à la fois
-- On gère ça applicativement (reset des autres lors du toggle)

-- RLS
ALTER TABLE public.plan_pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ppric_select_all"    ON public.plan_pricing_config;
DROP POLICY IF EXISTS "ppric_update_admin"  ON public.plan_pricing_config;

-- Lecture publique — nécessaire pour PlansSection (page d'accueil sans auth)
CREATE POLICY "ppric_select_all" ON public.plan_pricing_config
  FOR SELECT USING (true);

-- Modification réservée aux admins via RPC (SECURITY DEFINER)
CREATE POLICY "ppric_update_admin" ON public.plan_pricing_config
  FOR UPDATE USING (public.sl_is_admin());

-- ── Seed — valeurs initiales ──────────────────────────────────────────────────

INSERT INTO public.plan_pricing_config
  (plan_id, name, price_monthly, color, badge, tagline, cta_label, is_popular, sort_order, is_active)
VALUES
  ('free',    'Gratuit',   0,  '#64748b', '⚪', 'Découvrir SportLink',  'Commencer gratuitement', false, 0, true),
  ('starter', 'Starter',   9,  '#3b82f6', '🔵', 'Communication club',   'Essayer Starter',        false, 1, true),
  ('pro',     'Club Pro',  29, '#8b5cf6', '🟣', 'Gestion complète',     'Choisir Club Pro',       true,  2, true),
  ('elite',   'Elite',     59, '#f59e0b', '👑', 'Automatisation & IA',  'Choisir Elite',          false, 3, true)
ON CONFLICT (plan_id) DO NOTHING;

-- ── RPC admin : mise à jour d'un plan (contourne RLS pour les non-admins) ─────

CREATE OR REPLACE FUNCTION public.sl_update_plan_pricing(
  p_plan_id     TEXT,
  p_name        TEXT        DEFAULT NULL,
  p_price       INTEGER     DEFAULT NULL,
  p_color       TEXT        DEFAULT NULL,
  p_badge       TEXT        DEFAULT NULL,
  p_tagline     TEXT        DEFAULT NULL,
  p_cta_label   TEXT        DEFAULT NULL,
  p_is_popular  BOOLEAN     DEFAULT NULL,
  p_is_active   BOOLEAN     DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Seuls les admins peuvent appeler cette fonction
  IF NOT public.sl_is_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  -- Si on rend ce plan populaire, on retire le badge aux autres
  IF p_is_popular IS TRUE THEN
    UPDATE public.plan_pricing_config SET is_popular = false WHERE plan_id <> p_plan_id;
  END IF;

  UPDATE public.plan_pricing_config SET
    name        = COALESCE(p_name,       name),
    price_monthly = COALESCE(p_price,    price_monthly),
    color       = COALESCE(p_color,      color),
    badge       = COALESCE(p_badge,      badge),
    tagline     = COALESCE(p_tagline,    tagline),
    cta_label   = COALESCE(p_cta_label,  cta_label),
    is_popular  = COALESCE(p_is_popular, is_popular),
    is_active   = COALESCE(p_is_active,  is_active)
  WHERE plan_id = p_plan_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sl_update_plan_pricing TO authenticated;
