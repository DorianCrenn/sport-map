-- analytics_events — Politique de rétention CNIL (13 mois max)
-- Supprime automatiquement les événements analytics de plus de 13 mois.
-- Recommandation CNIL pour les statistiques d'audience anonymisées.

CREATE OR REPLACE FUNCTION public.purge_old_analytics()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '13 months';
$$;

-- Cron quotidien à 03h00 UTC (heure creuse)
SELECT cron.schedule(
  'purge-analytics-13m',
  '0 3 * * *',
  $$SELECT public.purge_old_analytics()$$
);
