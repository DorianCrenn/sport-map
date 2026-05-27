-- MANAGER-001 — Status + invited_at sur club_managers pour le flow d'activation
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE public.club_managers
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active')),
  ADD COLUMN IF NOT EXISTS invited_at timestamptz DEFAULT now();

-- Les managers existants sont déjà actifs
UPDATE public.club_managers SET status = 'active' WHERE status IS NULL OR status = 'pending';

-- Index pour lookup rapide au login
CREATE INDEX IF NOT EXISTS cm_email_status ON public.club_managers(email, status);
