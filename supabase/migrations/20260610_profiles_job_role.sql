-- Migration : ajout du champ job_role dans profiles
-- Permet de personnaliser l'onboarding et l'expérience par rôle métier

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_role TEXT
  CHECK (job_role IN ('joueur','coach','parent','supporter','communicant','president'))
  DEFAULT NULL;

COMMENT ON COLUMN public.profiles.job_role IS 'Rôle métier auto-déclaré lors de l''onboarding (distinct du rôle plateforme)';

CREATE INDEX IF NOT EXISTS profiles_job_role_idx ON public.profiles(job_role)
  WHERE job_role IS NOT NULL;
