-- ============================================================
-- club_monthly_leaderboard view
-- Replaces the two-round-trip JS logic in useClubLeaderboard:
--   1) fetch events group-by club_id for this month
--   2) fetch club details for top N
-- Now a single SELECT with JOIN, avoids N+1 and reduces JS complexity.
--
-- Note: events.club_id is TEXT, clubs.id is UUID — join via cast.
-- Rows where club_id is not a valid UUID (static clubs like "usc-29") are excluded.
-- ============================================================

DROP VIEW IF EXISTS public.club_monthly_leaderboard;

CREATE VIEW public.club_monthly_leaderboard
  WITH (security_invoker = false)
  AS
  SELECT
    c.id          AS club_id,
    c.name,
    c.sport,
    c.city,
    c.logo_url,
    COUNT(e.id)::int AS event_count,
    ROW_NUMBER() OVER (ORDER BY COUNT(e.id) DESC)::int AS rank
  FROM public.clubs c
  JOIN public.events e
    ON e.club_id = c.id::text
  WHERE e.date >= date_trunc('month', NOW())
  GROUP BY c.id, c.name, c.sport, c.city, c.logo_url;

GRANT SELECT ON public.club_monthly_leaderboard TO anon, authenticated;
