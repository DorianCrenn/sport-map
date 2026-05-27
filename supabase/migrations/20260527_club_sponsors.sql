-- ────────────────────────────────────────────────────────────────────────────
-- club_sponsors — Sponsors locaux associés à un club SportLink
--
-- Fonctionnement :
--   Chaque club peut déclarer ses sponsors locaux.
--   Le feed lit les sponsors actifs des clubs suivis et les injecte
--   de façon native toutes les N cartes (format "Partenaire du club").
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS club_sponsors (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      uuid         NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  sponsor_name text         NOT NULL,
  tagline      text,
  logo_url     text,
  bg_color     text         NOT NULL DEFAULT '#111827',
  cta_label    text,
  cta_url      text,
  active       boolean      NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now()
);

-- Index pour récupérer les sponsors actifs d'un ensemble de clubs
CREATE INDEX IF NOT EXISTS idx_club_sponsors_active
  ON club_sponsors (club_id, active)
  WHERE active = true;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE club_sponsors ENABLE ROW LEVEL SECURITY;

-- Lecture publique des sponsors actifs
CREATE POLICY "sponsors_public_read" ON club_sponsors
  FOR SELECT
  USING (active = true);

-- Gestion par le propriétaire du club
CREATE POLICY "sponsors_club_insert" ON club_sponsors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_sponsors.club_id
        AND clubs.user_id = auth.uid()
    )
  );

CREATE POLICY "sponsors_club_update" ON club_sponsors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_sponsors.club_id
        AND clubs.user_id = auth.uid()
    )
  );

CREATE POLICY "sponsors_club_delete" ON club_sponsors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_sponsors.club_id
        AND clubs.user_id = auth.uid()
    )
  );
