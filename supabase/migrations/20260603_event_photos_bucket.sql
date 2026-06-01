-- ────────────────────────────────────────────────────────────────────────────
-- Migration : Bucket Supabase Storage pour les photos d'événements
-- Date      : 2026-06-03
--
-- La table event_photos existe déjà (20260527_event_photos.sql).
-- Ce fichier crée uniquement le bucket Storage public.
-- ────────────────────────────────────────────────────────────────────────────

-- Bucket public event-photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true,
  5242880,  -- 5 Mo max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Politique SELECT : lecture publique
CREATE POLICY "event_photos_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos');

-- Politique INSERT : utilisateurs authentifiés uniquement
CREATE POLICY "event_photos_insert_auth"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-photos');

-- Politique DELETE : l'uploader ou un admin peut supprimer
CREATE POLICY "event_photos_delete_owner"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'event-photos'
    AND (
      owner = auth.uid()
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
    )
  );
