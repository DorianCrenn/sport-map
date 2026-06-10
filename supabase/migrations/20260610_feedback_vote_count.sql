-- Migration : colonne vote_count dénormalisée sur app_feedback
-- Maintenue automatiquement par triggers sur app_feedback_votes

ALTER TABLE public.app_feedback
  ADD COLUMN IF NOT EXISTS vote_count integer NOT NULL DEFAULT 0;

-- Recalcul initial (idempotent si la table est vide)
UPDATE public.app_feedback f
SET vote_count = (
  SELECT COUNT(*) FROM public.app_feedback_votes v
  WHERE v.feedback_id = f.id
);

-- Index pour tri par popularité
CREATE INDEX IF NOT EXISTS feedback_vote_count_idx
  ON public.app_feedback(vote_count DESC);

-- Fonction trigger
CREATE OR REPLACE FUNCTION public.trg_feedback_vote_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.app_feedback SET vote_count = vote_count + 1 WHERE id = NEW.feedback_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.app_feedback SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.feedback_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_feedback_vote_count ON public.app_feedback_votes;
CREATE TRIGGER trg_feedback_vote_count
  AFTER INSERT OR DELETE ON public.app_feedback_votes
  FOR EACH ROW EXECUTE FUNCTION public.trg_feedback_vote_count();
