-- ANALYTICS-001a : table poster_exports
-- Tracks every export/share action from PosterStudio.
-- AI-COST-001a : SECURITY DEFINER RPC to increment club_ai_usage.generate_count

-- ── poster_exports ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.poster_exports (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id    uuid        REFERENCES public.clubs(id) ON DELETE SET NULL,
  event_id   text,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  format     text,
  channel    text        DEFAULT 'download',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS poster_exports_club_month
  ON public.poster_exports(club_id, created_at DESC);

ALTER TABLE public.poster_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poster_exports_insert" ON public.poster_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "poster_exports_select" ON public.poster_exports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── increment_ai_generate_count (SECURITY DEFINER) ────────────────────────────
-- Called by authenticated clients to track AI background/element generations.
-- Uses UPSERT on (club_id, month) so one row per club per month.

CREATE OR REPLACE FUNCTION public.increment_ai_generate_count(p_club_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_month date := date_trunc('month', now())::date;
BEGIN
  INSERT INTO public.club_ai_usage(club_id, month, generate_count)
  VALUES (p_club_id, v_month, 1)
  ON CONFLICT (club_id, month) DO UPDATE
    SET generate_count = club_ai_usage.generate_count + 1;
END;
$$;
