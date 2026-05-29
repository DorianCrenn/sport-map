-- Migration : Système de scores adaptatifs par sport
-- Date: 2026-05-31

-- ════════════════════════════════════════════════════════════════
-- TABLE : match_scores — Score structuré par événement
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.match_scores (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid        REFERENCES public.events(id) ON DELETE CASCADE,
  sport        TEXT        NOT NULL DEFAULT 'Football',

  score_home   INTEGER,
  score_away   INTEGER,

  -- Données sport-spécifique (sets, périodes, actions rugby...)
  score_detail JSONB       NOT NULL DEFAULT '{}',

  -- Champ libre texte man of the match (migré depuis events)
  man_of_match TEXT,

  status       TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','final','cancelled','postponed')),

  validated_by uuid        REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_match_scores_event  ON public.match_scores(event_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_sport  ON public.match_scores(sport, status);
CREATE INDEX IF NOT EXISTS idx_match_scores_detail ON public.match_scores USING GIN(score_detail);

-- ════════════════════════════════════════════════════════════════
-- TABLE : match_encounters — Rencontres individuelles (Tennis)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.match_encounters (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid  REFERENCES public.events(id) ON DELETE CASCADE,
  encounter_type  TEXT  NOT NULL,  -- 'single_1'|'single_2'|'single_3'|'double_1'
  encounter_order INTEGER NOT NULL DEFAULT 0,

  winner_side     TEXT  CHECK (winner_side IN ('home','away','walkover_home','walkover_away')),

  -- Score détaillé (sets tennis)
  score_detail    JSONB NOT NULL DEFAULT '{}',

  -- Joueurs côté domicile (1 pour simple, 2 pour double)
  home_player1_id   uuid REFERENCES public.profiles(id),
  home_player1_data JSONB NOT NULL DEFAULT '{}',
  home_player2_id   uuid REFERENCES public.profiles(id),
  home_player2_data JSONB NOT NULL DEFAULT '{}',

  -- Joueurs côté extérieur
  away_player1_id   uuid REFERENCES public.profiles(id),
  away_player1_data JSONB NOT NULL DEFAULT '{}',
  away_player2_id   uuid REFERENCES public.profiles(id),
  away_player2_data JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_encounters_event ON public.match_encounters(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_encounters_type ON public.match_encounters(event_id, encounter_type);

-- ════════════════════════════════════════════════════════════════
-- TABLE : match_lineups — Compositions d'équipes (futur)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.match_lineups (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid  REFERENCES public.events(id) ON DELETE CASCADE,
  side         TEXT  NOT NULL CHECK (side IN ('home','away')),
  formation    TEXT,
  lineup_data  JSONB NOT NULL DEFAULT '[]',
  locked       BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (event_id, side)
);

-- ════════════════════════════════════════════════════════════════
-- TABLE : live_match_events — Événements temps réel (futur)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.live_match_events (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid  REFERENCES public.events(id) ON DELETE CASCADE,
  minute     INTEGER,
  event_type TEXT  NOT NULL,
  side       TEXT  CHECK (side IN ('home','away')),
  player_id  uuid  REFERENCES public.profiles(id),
  player_name TEXT,
  meta       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_events_event    ON public.live_match_events(event_id, minute);
CREATE INDEX IF NOT EXISTS idx_live_events_realtime ON public.live_match_events(event_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.match_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_lineups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_match_events ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "match_scores_select_all"
  ON public.match_scores FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "match_encounters_select_all"
  ON public.match_encounters FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "match_lineups_select_all"
  ON public.match_lineups FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "live_match_events_select_all"
  ON public.live_match_events FOR SELECT TO authenticated, anon USING (true);

-- Écriture : admins et club_admin uniquement
CREATE POLICY "match_scores_write"
  ON public.match_scores FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
    IN ('admin','superadmin','club_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
    IN ('admin','superadmin','club_admin')
  );

CREATE POLICY "match_encounters_write"
  ON public.match_encounters FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
    IN ('admin','superadmin','club_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
    IN ('admin','superadmin','club_admin')
  );

-- ════════════════════════════════════════════════════════════════
-- TRIGGER : sync match_scores → events.score (rétrocompatibilité)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION sync_event_score_from_match()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.events
  SET
    score        = CASE
      WHEN NEW.score_home IS NOT NULL AND NEW.score_away IS NOT NULL
      THEN jsonb_build_object('home', NEW.score_home, 'away', NEW.score_away)
      ELSE score
    END,
    man_of_match = COALESCE(NEW.man_of_match, man_of_match)
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_event_score
  AFTER INSERT OR UPDATE OF score_home, score_away, man_of_match
  ON public.match_scores
  FOR EACH ROW EXECUTE FUNCTION sync_event_score_from_match();

-- ════════════════════════════════════════════════════════════════
-- MIGRATION des scores existants (events.score → match_scores)
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.match_scores (event_id, sport, score_home, score_away, man_of_match, status)
SELECT
  id,
  COALESCE(sport, 'Football'),
  (score->>'home')::INTEGER,
  (score->>'away')::INTEGER,
  man_of_match,
  'final'
FROM public.events
WHERE score IS NOT NULL
  AND (score->>'home') IS NOT NULL
ON CONFLICT (event_id) DO NOTHING;
