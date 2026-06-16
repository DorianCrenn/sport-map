-- Migration : ajout template_id dans poster_exports
-- Permet de tracker quels templates sont les plus utilisés

ALTER TABLE public.poster_exports
  ADD COLUMN IF NOT EXISTS template_id text;

CREATE INDEX IF NOT EXISTS poster_exports_template_idx
  ON public.poster_exports(template_id, created_at DESC)
  WHERE template_id IS NOT NULL;
