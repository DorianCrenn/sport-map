-- ============================================================
-- Replace club_follower_counts view
-- Old: CROSS JOIN LATERAL UNNEST(profiles.followed_clubs) — O(n_users) full scan
-- New: COUNT from club_follows table — uses index on club_follows.club_id
-- ============================================================

DROP VIEW IF EXISTS public.club_follower_counts;

CREATE VIEW public.club_follower_counts
  WITH (security_invoker = false)
  AS
  SELECT club_id, COUNT(*)::int AS follower_count
  FROM public.club_follows
  GROUP BY club_id;

GRANT SELECT ON public.club_follower_counts TO anon, authenticated;
