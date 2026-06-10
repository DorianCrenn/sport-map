-- Migration : système de feedback utilisateur intégré
-- Tables : app_feedback + app_feedback_votes

-- Types ENUM (compatibilité Postgres 15+)
DO $$ BEGIN
  CREATE TYPE public.feedback_type AS ENUM ('bug', 'idea', 'question');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_status AS ENUM (
    'new', 'analyzing', 'planned', 'in_dev', 'resolved', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Table principale
CREATE TABLE IF NOT EXISTS public.app_feedback (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id      uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  type         public.feedback_type NOT NULL,
  category     text,
  title        text NOT NULL,
  description  text,
  page_url     text,
  browser_info jsonb DEFAULT '{}',
  app_version  text,
  status       public.feedback_status NOT NULL DEFAULT 'new',
  priority     smallint DEFAULT 0,
  merged_into  uuid REFERENCES public.app_feedback(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_user_idx    ON public.app_feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_type_idx    ON public.app_feedback(type);
CREATE INDEX IF NOT EXISTS feedback_status_idx  ON public.app_feedback(status);
CREATE INDEX IF NOT EXISTS feedback_created_idx ON public.app_feedback(created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.trg_feedback_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_feedback_updated_at ON public.app_feedback;
CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.app_feedback
  FOR EACH ROW EXECUTE FUNCTION public.trg_feedback_updated_at();

-- Votes
CREATE TABLE IF NOT EXISTS public.app_feedback_votes (
  feedback_id  uuid NOT NULL REFERENCES public.app_feedback(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (feedback_id, user_id)
);

CREATE INDEX IF NOT EXISTS feedback_votes_idx ON public.app_feedback_votes(feedback_id);

-- RLS
ALTER TABLE public.app_feedback       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_feedback_votes ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les utilisateurs authentifiés (nécessaire pour recherche de similaires)
CREATE POLICY IF NOT EXISTS "feedback_select_auth" ON public.app_feedback
  FOR SELECT TO authenticated USING (true);

-- Insert : uniquement par l'utilisateur lui-même
CREATE POLICY IF NOT EXISTS "feedback_insert_own" ON public.app_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update : uniquement admins (gestion des statuts)
CREATE POLICY IF NOT EXISTS "feedback_update_admin" ON public.app_feedback
  FOR UPDATE USING (public.sl_is_admin())
  WITH CHECK (public.sl_is_admin());

-- Votes - lecture publique
CREATE POLICY IF NOT EXISTS "votes_select_auth" ON public.app_feedback_votes
  FOR SELECT TO authenticated USING (true);

-- Votes - insert par le propriétaire
CREATE POLICY IF NOT EXISTS "votes_insert_own" ON public.app_feedback_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Votes - delete par le propriétaire
CREATE POLICY IF NOT EXISTS "votes_delete_own" ON public.app_feedback_votes
  FOR DELETE USING (auth.uid() = user_id);
