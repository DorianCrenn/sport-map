-- Table de présence joueur aux matchs (équivalent training_attendance pour les events)
CREATE TABLE IF NOT EXISTS public.match_player_attendance (
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL CHECK (status IN ('present', 'absent', 'unsure')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE public.match_player_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mpa_select" ON public.match_player_attendance
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "mpa_insert" ON public.match_player_attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mpa_update" ON public.match_player_attendance
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "mpa_delete" ON public.match_player_attendance
  FOR DELETE USING (auth.uid() = user_id);
