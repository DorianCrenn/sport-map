-- POSTER-PUB-001 : affiches publiées par club
-- Quand le staff (coach/communicant/président) publie une affiche depuis PosterStudio,
-- l'image est uploadée dans Storage et une ligne match_posters est créée/mise à jour.
-- Les non-staff (supporter/joueur/famille) peuvent alors la consulter en lecture seule,
-- sans jamais accéder à PosterStudio (outil de création réservé au staff).

CREATE TABLE IF NOT EXISTS public.match_posters (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  club_id     uuid        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  image_url   text        NOT NULL,
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(event_id)
);

CREATE INDEX IF NOT EXISTS match_posters_club_idx
  ON public.match_posters(club_id, created_at DESC);

ALTER TABLE public.match_posters ENABLE ROW LEVEL SECURITY;

-- Lecture ouverte à tout utilisateur authentifié (affiche = contenu promotionnel du club)
CREATE POLICY "match_posters_select" ON public.match_posters
  FOR SELECT TO authenticated
  USING (true);

-- Publication réservée au staff du club (owner/manager/editor/communicant) + admins
CREATE POLICY "match_posters_insert" ON public.match_posters
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(club_id::text, ARRAY['owner', 'manager', 'editor', 'communicant'])
  );

CREATE POLICY "match_posters_update" ON public.match_posters
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(club_id::text, ARRAY['owner', 'manager', 'editor', 'communicant'])
  );

CREATE POLICY "match_posters_delete" ON public.match_posters
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'superadmin', 'club_admin')
    OR public.sl_is_club_manager_for(club_id::text, ARRAY['owner', 'manager', 'editor', 'communicant'])
  );

-- ── Storage bucket match-posters (public — image promotionnelle déjà destinée au partage) ──

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'match-posters',
  'match-posters',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "match_posters_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'match-posters');

CREATE POLICY "match_posters_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'match-posters'
    AND auth.uid() IS NOT NULL
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid())
        IN ('admin', 'superadmin', 'club_admin')
      OR public.sl_is_club_manager_for((storage.foldername(name))[1], ARRAY['owner', 'manager', 'editor', 'communicant'])
    )
  );

CREATE POLICY "match_posters_storage_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'match-posters'
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid())
        IN ('admin', 'superadmin', 'club_admin')
      OR public.sl_is_club_manager_for((storage.foldername(name))[1], ARRAY['owner', 'manager', 'editor', 'communicant'])
    )
  );

CREATE POLICY "match_posters_storage_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'match-posters'
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid())
        IN ('admin', 'superadmin', 'club_admin')
      OR public.sl_is_club_manager_for((storage.foldername(name))[1], ARRAY['owner', 'manager', 'editor', 'communicant'])
    )
  );
