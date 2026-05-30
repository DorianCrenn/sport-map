-- event_predictions : pronostics avant-match
-- Chaque utilisateur peut voter home / draw / away avant le coup d'envoi.
-- La vue event_prediction_counts agrège les totaux par choix.

CREATE TABLE IF NOT EXISTS public.event_predictions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction  TEXT        NOT NULL CHECK (prediction IN ('home', 'draw', 'away')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "predictions_select_all"
  ON public.event_predictions FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "predictions_insert_own"
  ON public.event_predictions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "predictions_update_own"
  ON public.event_predictions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "predictions_delete_own"
  ON public.event_predictions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Vue agrégée en lecture seule
CREATE OR REPLACE VIEW public.event_prediction_counts AS
SELECT
  event_id,
  prediction,
  COUNT(*)::int AS count
FROM public.event_predictions
GROUP BY event_id, prediction;
