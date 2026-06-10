-- Migration: Restreindre les types MIME autorisés sur les buckets d'images
-- Empêche l'upload de fichiers non-images (PDF, exécutables, etc.)

-- Bucket logos clubs
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/avif'
]
WHERE id = 'club-logos';

-- Bucket médias club (photos joueurs, galerie)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
]
WHERE id = 'club-media';

-- Bucket photos événements
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
]
WHERE id = 'event-photos';

-- Activer les policies de taille max si pas déjà fait
-- (50 Mo max par fichier — protection anti-abus)
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50 Mo
WHERE id IN ('club-logos', 'club-media', 'event-photos');
