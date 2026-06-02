-- VIRAL-003 : Système de défis inter-clubs
-- Un club peut lancer un défi (match amical, tournoi, entraînement) à un autre.

CREATE TABLE IF NOT EXISTS club_challenges (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id   UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  challenged_id   UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL DEFAULT 'match'
                  CHECK (type IN ('match', 'tournament', 'training')),
  message         TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at    TIMESTAMPTZ,
  CONSTRAINT no_self_challenge CHECK (challenger_id <> challenged_id)
);

-- Index pour les requêtes fréquentes (challenges d'un club)
CREATE INDEX club_challenges_challenger ON club_challenges(challenger_id);
CREATE INDEX club_challenges_challenged ON club_challenges(challenged_id);

-- RLS
ALTER TABLE club_challenges ENABLE ROW LEVEL SECURITY;

-- Les membres des deux clubs peuvent voir leurs défis
CREATE POLICY "challenges_select" ON club_challenges
  FOR SELECT USING (
    challenger_id IN (SELECT id FROM clubs WHERE user_id = auth.uid())
    OR
    challenged_id IN (SELECT id FROM clubs WHERE user_id = auth.uid())
  );

-- Seul le challenger peut créer un défi
CREATE POLICY "challenges_insert" ON club_challenges
  FOR INSERT WITH CHECK (
    challenger_id IN (SELECT id FROM clubs WHERE user_id = auth.uid())
  );

-- Les deux clubs peuvent mettre à jour (accept/decline/cancel)
CREATE POLICY "challenges_update" ON club_challenges
  FOR UPDATE USING (
    challenger_id IN (SELECT id FROM clubs WHERE user_id = auth.uid())
    OR
    challenged_id IN (SELECT id FROM clubs WHERE user_id = auth.uid())
  );
