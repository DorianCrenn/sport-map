-- Permettre aux parents/tuteurs de répondre aux entraînements pour leur enfant

-- Colonne pour tracer qui a répondu (joueur lui-même ou parent/tuteur)
ALTER TABLE public.training_attendance
  ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES auth.users(id);

-- Backfill : pour les réponses existantes, le répondant = l'utilisateur
UPDATE public.training_attendance
  SET responded_by = user_id
  WHERE responded_by IS NULL AND user_id IS NOT NULL;

-- Index unique sur (session_id, player_id) pour que la réponse parent/joueur
-- soit fusionnée en une seule ligne par joueur par séance
CREATE UNIQUE INDEX IF NOT EXISTS training_attendance_session_player_uniq
  ON public.training_attendance (session_id, player_id)
  WHERE player_id IS NOT NULL;

COMMENT ON COLUMN public.training_attendance.responded_by IS
  'Utilisateur ayant répondu (peut être le joueur ou son parent/tuteur via player_guardians)';
