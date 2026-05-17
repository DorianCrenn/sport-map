-- ============================================================
-- SportLink — Dashboard views + club_page_views table
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ── Event attendee counts (bypasses attendees RLS via view owner = postgres) ──
CREATE OR REPLACE VIEW public.event_attendee_counts AS
  SELECT event_id, COUNT(*)::int AS count
  FROM public.attendees
  GROUP BY event_id;

GRANT SELECT ON public.event_attendee_counts TO anon, authenticated;

-- ── Club follower counts (from profiles.followed_clubs text array) ─────────────
CREATE OR REPLACE VIEW public.club_follower_counts AS
  SELECT t.club_id, COUNT(*)::int AS follower_count
  FROM public.profiles
  CROSS JOIN LATERAL UNNEST(followed_clubs) AS t(club_id)
  GROUP BY t.club_id;

GRANT SELECT ON public.club_follower_counts TO anon, authenticated;

-- ── Club page views table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_page_views (
  id         BIGSERIAL PRIMARY KEY,
  club_id    TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cpv_club_idx ON public.club_page_views (club_id, viewed_at DESC);

ALTER TABLE public.club_page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cpv_insert_anyone" ON public.club_page_views;
DROP POLICY IF EXISTS "cpv_select_all"    ON public.club_page_views;

CREATE POLICY "cpv_insert_anyone" ON public.club_page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cpv_select_all" ON public.club_page_views
  FOR SELECT USING (true);

GRANT USAGE ON SEQUENCE public.club_page_views_id_seq TO anon, authenticated;
GRANT INSERT, SELECT ON public.club_page_views TO anon, authenticated;
