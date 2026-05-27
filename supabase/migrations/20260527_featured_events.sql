-- ────────────────────────────────────────────────────────────────────────────
-- featured_events — Événements "À la Une" promus par les clubs SportLink
--
-- Fonctionnement :
--   Un club (club_admin) peut mettre en avant un de ses événements pendant
--   une durée définie par son plan (starter/pro/elite).
--   Le feed lit les lignes actives (starts_at ≤ now ≤ ends_at) et les injecte
--   en tête de feed avec rotation déterministe côté client.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS featured_events (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  club_id     uuid         NOT NULL,
  plan        text         NOT NULL DEFAULT 'pro'
              CHECK (plan IN ('starter', 'pro', 'elite')),
  starts_at   timestamptz  NOT NULL DEFAULT now(),
  ends_at     timestamptz  NOT NULL,
  -- Priorité manuelle : valeur haute = affiché en premier dans la rotation
  priority    smallint     NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Index pour la requête du feed (filtre sur la fenêtre d'activation)
CREATE INDEX IF NOT EXISTS idx_featured_active
  ON featured_events (ends_at DESC, starts_at ASC);

-- Index pour récupérer les featured d'un club
CREATE INDEX IF NOT EXISTS idx_featured_club
  ON featured_events (club_id, ends_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE featured_events ENABLE ROW LEVEL SECURITY;

-- Lecture publique des événements actifs uniquement
CREATE POLICY "featured_public_read" ON featured_events
  FOR SELECT
  USING (now() BETWEEN starts_at AND ends_at);

-- Insertion par le propriétaire du club (clubs.user_id = auth.uid())
CREATE POLICY "featured_club_insert" ON featured_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = featured_events.club_id
        AND clubs.user_id = auth.uid()
    )
  );

-- Mise à jour par le propriétaire (ex : prolonger la durée)
CREATE POLICY "featured_club_update" ON featured_events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = featured_events.club_id
        AND clubs.user_id = auth.uid()
    )
  );

-- Suppression par le propriétaire
CREATE POLICY "featured_club_delete" ON featured_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = featured_events.club_id
        AND clubs.user_id = auth.uid()
    )
  );

-- ── Vue helper : limites par plan ────────────────────────────────────────────
-- Utilisée côté serveur pour valider qu'un club ne dépasse pas son quota.
CREATE OR REPLACE VIEW featured_plan_limits AS
SELECT plan, max_featured, duration_days FROM (VALUES
  ('starter'::text, 1::int, 7::int),
  ('pro'::text,     3::int, 30::int),
  ('elite'::text,   5::int, 60::int)
) AS t(plan, max_featured, duration_days);
