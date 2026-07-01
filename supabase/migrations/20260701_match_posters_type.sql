-- POSTER-PUB-002 : types d'affiches multiples par match
-- Avant : UNIQUE(event_id) → un seul slot par match
-- Après : UNIQUE(event_id, poster_type) → 3 slots indépendants
--   • announce    — affiche J-3 / jour de match
--   • convocation — affiche convocation J-1 avec liste joueurs
--   • result      — affiche résultat post-match

ALTER TABLE public.match_posters
  ADD COLUMN IF NOT EXISTS poster_type text NOT NULL DEFAULT 'announce'
    CHECK (poster_type IN ('announce', 'convocation', 'result'));

-- Supprimer l'ancienne contrainte UNIQUE(event_id) si elle existe
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_name = 'match_posters'
    AND table_schema = 'public'
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%event_id%'
    AND constraint_name NOT LIKE '%poster_type%'
  LIMIT 1;

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.match_posters DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

-- Nouvelle contrainte : un poster par (match, type)
ALTER TABLE public.match_posters
  ADD CONSTRAINT match_posters_event_type_unique UNIQUE (event_id, poster_type);

-- Index pour batch-fetch par event_ids (useSeasonPlanning)
CREATE INDEX IF NOT EXISTS match_posters_event_type_idx
  ON public.match_posters(event_id, poster_type);
