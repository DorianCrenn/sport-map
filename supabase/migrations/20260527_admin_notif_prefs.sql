-- VIRAL-002d : Préférences notifications pour les club admins
-- Stockées dans club_brand_kits (upsert existant via useClubBrandKit.save())

ALTER TABLE public.club_brand_kits
  ADD COLUMN IF NOT EXISTS admin_notif_prefs JSONB
  NOT NULL
  DEFAULT '{"match_j1": true, "match_today": true, "post_match_score": true}'::jsonb;
