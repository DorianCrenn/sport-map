-- CONTENT-001a : Photos d'événements
-- Table de stockage des photos post-event

CREATE TABLE IF NOT EXISTS public.event_photos (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  club_id    TEXT        NOT NULL,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url        TEXT        NOT NULL,
  caption    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_photos_event ON public.event_photos (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_photos_club  ON public.event_photos (club_id, created_at DESC);

ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde (photos publiées)
CREATE POLICY "ep_select_public"
  ON public.event_photos FOR SELECT USING (true);

-- Upload : propriétaire du club ou admin
CREATE POLICY "ep_insert_club_owner"
  ON public.event_photos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id::text = event_photos.club_id
          AND clubs.user_id = auth.uid()
      )
      OR public.sl_is_admin()
      OR public.sl_is_club_manager_for(event_photos.club_id, ARRAY['manager', 'editor'])
    )
  );

-- Suppression : uploader ou admin
CREATE POLICY "ep_delete_own"
  ON public.event_photos FOR DELETE
  USING (user_id = auth.uid() OR public.sl_is_admin());

-- Storage bucket event-photos (run in Dashboard or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true)
-- ON CONFLICT (id) DO NOTHING;
