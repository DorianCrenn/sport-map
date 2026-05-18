-- ============================================================
-- SportLink — Vues et grants
-- Prérequis : 01_schema.sql + 02_rls.sql
-- ============================================================

-- ── Nombre de participants par événement ─────────────────────────────────────
-- security_invoker = false → la vue tourne avec les droits du propriétaire (postgres)
-- ce qui bypasse le RLS restrictif sur attendees et renvoie les counts complets.

DROP VIEW IF EXISTS public.event_attendee_counts;

CREATE VIEW public.event_attendee_counts
  WITH (security_invoker = false)
  AS
  SELECT event_id, COUNT(*)::int AS count
  FROM public.attendees
  GROUP BY event_id;

GRANT SELECT ON public.event_attendee_counts TO anon, authenticated;

-- ── Nombre de followers par club ─────────────────────────────────────────────

DROP VIEW IF EXISTS public.club_follower_counts;

CREATE VIEW public.club_follower_counts AS
  SELECT t.club_id, COUNT(*)::int AS follower_count
  FROM public.profiles
  CROSS JOIN LATERAL UNNEST(followed_clubs) AS t(club_id)
  GROUP BY t.club_id;

GRANT SELECT ON public.club_follower_counts TO anon, authenticated;

-- ── Grants divers ────────────────────────────────────────────────────────────

GRANT USAGE  ON SEQUENCE public.club_page_views_id_seq TO anon, authenticated;
GRANT INSERT, SELECT ON public.club_page_views         TO anon, authenticated;
