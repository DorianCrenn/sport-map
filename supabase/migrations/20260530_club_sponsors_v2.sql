-- Migration : club_sponsors v2 — colonnes enrichies + ENUM tier + Storage bucket
-- Date: 2026-05-30

-- 1. Créer le type ENUM sponsor_tier (si inexistant)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sponsor_tier') THEN
    CREATE TYPE public.sponsor_tier AS ENUM ('gold', 'silver', 'bronze', 'partner');
  END IF;
END$$;

-- 2. Ajouter les colonnes manquantes
ALTER TABLE public.club_sponsors
  ADD COLUMN IF NOT EXISTS logo_white_url   TEXT,
  ADD COLUMN IF NOT EXISTS valid_from       DATE,
  ADD COLUMN IF NOT EXISTS valid_until      DATE,
  ADD COLUMN IF NOT EXISTS season_id        TEXT,
  ADD COLUMN IF NOT EXISTS contract_value   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS contract_notes   TEXT,
  ADD COLUMN IF NOT EXISTS display_order    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_in_poster   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_tier_labels BOOLEAN NOT NULL DEFAULT true;

-- 3. Contrainte de cohérence temporelle
ALTER TABLE public.club_sponsors
  DROP CONSTRAINT IF EXISTS chk_valid_dates;

ALTER TABLE public.club_sponsors
  ADD CONSTRAINT chk_valid_dates
    CHECK (valid_from IS NULL OR valid_until IS NULL OR valid_from <= valid_until);

-- 4. Index de performance
CREATE INDEX IF NOT EXISTS idx_sponsors_club_active
  ON public.club_sponsors(club_id, active, valid_until);

CREATE INDEX IF NOT EXISTS idx_sponsors_club_page
  ON public.club_sponsors(club_id, page_visible, valid_until);

-- 5. Vue publique (masque les données financières)
CREATE OR REPLACE VIEW public.club_sponsors_public AS
SELECT
  id, club_id, sponsor_name, tier,
  logo_url, logo_white_url, website_url,
  bg_color, tagline, cta_label, cta_url,
  active, page_visible, show_in_poster, show_tier_labels,
  display_order, valid_from, valid_until, season_id,
  created_at
FROM public.club_sponsors
WHERE
  (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  AND (valid_from  IS NULL OR valid_from  <= CURRENT_DATE);

-- 6. Bucket club-logos (Storage) — à appliquer via Supabase Studio si la migration SQL ne crée pas les buckets
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('club-logos', 'club-logos', true, 2097152, ARRAY['image/png','image/jpeg','image/svg+xml','image/webp'])
-- ON CONFLICT (id) DO NOTHING;
