-- ROLES-001 : Sous-rôles gestionnaires de club
-- Trois niveaux : manager (tout), editor (events + affiches), communicant (annonces)

ALTER TABLE public.club_managers
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'manager';

-- Contrainte de domaine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'club_managers' AND constraint_name = 'club_managers_role_check'
  ) THEN
    ALTER TABLE public.club_managers
      ADD CONSTRAINT club_managers_role_check
      CHECK (role IN ('manager', 'editor', 'communicant'));
  END IF;
END $$;

-- Tous les gestionnaires existants reçoivent le rôle manager (accès complet)
UPDATE public.club_managers SET role = 'manager' WHERE role IS NULL OR role = '';

-- Index pour les lookups par rôle
CREATE INDEX IF NOT EXISTS idx_club_managers_club_role
  ON public.club_managers (club_id, role);
