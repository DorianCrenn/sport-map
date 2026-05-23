-- PS-INF-001 — Supabase Storage bucket for club media assets (player cutouts, logos)
-- Apply via: supabase db push  OR  Supabase Dashboard > SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-media',
  'club-media',
  false,
  10485760,  -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies — users can manage their own club's files
CREATE POLICY "club_media_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'club-media' AND auth.role() = 'authenticated');

CREATE POLICY "club_media_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'club-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "club_media_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'club-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "club_media_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'club-media' AND auth.uid()::text = (storage.foldername(name))[1]);
