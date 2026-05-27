-- STATS-001 — Vue statistiques clubs calculée depuis events.score
-- Run in Supabase Dashboard → SQL Editor

CREATE OR REPLACE VIEW club_stats AS
SELECT
  club_id,
  team_name,
  home_or_away,
  COUNT(*)                                                                                       AS played,
  COUNT(*) FILTER (WHERE
    (home_or_away = 'home' AND (score->>'home')::int > (score->>'away')::int)
    OR (home_or_away = 'away' AND (score->>'away')::int > (score->>'home')::int)
  )                                                                                              AS wins,
  COUNT(*) FILTER (WHERE (score->>'home')::int = (score->>'away')::int)                         AS draws,
  COUNT(*) FILTER (WHERE
    (home_or_away = 'home' AND (score->>'home')::int < (score->>'away')::int)
    OR (home_or_away = 'away' AND (score->>'away')::int < (score->>'home')::int)
  )                                                                                              AS losses,
  COALESCE(SUM(
    CASE WHEN home_or_away = 'home' THEN (score->>'home')::int
         ELSE (score->>'away')::int END
  ), 0)                                                                                         AS goals_for,
  COALESCE(SUM(
    CASE WHEN home_or_away = 'home' THEN (score->>'away')::int
         ELSE (score->>'home')::int END
  ), 0)                                                                                         AS goals_against
FROM public.events
WHERE score IS NOT NULL
  AND club_id IS NOT NULL
  AND (score->>'home') IS NOT NULL
  AND (score->>'away') IS NOT NULL
GROUP BY club_id, team_name, home_or_away;
