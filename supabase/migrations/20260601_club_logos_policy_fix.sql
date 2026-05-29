-- Permet à tout utilisateur authentifié d'uploader dans club-logos
-- (nécessaire pour la création de club où le rôle n'est pas encore club_admin)
DROP POLICY IF EXISTS "club_logos_upload" ON storage.objects;

CREATE POLICY "club_logos_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'club-logos');

-- Suppression : l'uploader peut supprimer ses propres fichiers
DROP POLICY IF EXISTS "club_logos_delete" ON storage.objects;

CREATE POLICY "club_logos_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'club-logos' AND owner = auth.uid());
