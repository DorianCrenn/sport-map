-- PS-INF-002 / PS-INF-003 — Club media asset library (joueurs détourés)
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS club_media_assets (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id       text,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text CHECK (type IN ('player','logo','sponsor','bg')) DEFAULT 'player',
  name          text NOT NULL DEFAULT 'Joueur',
  tags          text[] DEFAULT '{}',
  is_favorite   boolean DEFAULT false,

  original_url  text,   -- URL Storage: club-media/{club_id}/originals/
  processed_url text,   -- URL Storage: club-media/{club_id}/cutouts/ (PNG transparent)
  thumbnail_url text,   -- URL Storage: club-media/{club_id}/thumbs/  (WebP 200×200)

  metadata      jsonb DEFAULT '{}',  -- { width, height, fileSize, processingMs, mockMode }

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS club_media_assets_club_type
  ON club_media_assets(club_id, type, is_favorite);

CREATE INDEX IF NOT EXISTS club_media_assets_user
  ON club_media_assets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS club_media_assets_tags
  ON club_media_assets USING GIN(tags);

-- RLS
ALTER TABLE club_media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cma_select_own"
  ON club_media_assets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "cma_insert_own"
  ON club_media_assets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cma_update_own"
  ON club_media_assets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "cma_delete_own"
  ON club_media_assets FOR DELETE
  USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_club_media_assets_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_cma_updated_at ON club_media_assets;
CREATE TRIGGER trg_cma_updated_at
  BEFORE UPDATE ON club_media_assets
  FOR EACH ROW EXECUTE FUNCTION update_club_media_assets_updated_at();
