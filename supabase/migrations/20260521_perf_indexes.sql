-- ============================================================
-- SportLink — PERFORMANCE INDEXES + REALTIME FIX
-- Idempotent — safe à re-run.
-- ============================================================

-- ── 1. INDEX MANQUANTS ────────────────────────────────────────────────────────

-- events.club_id  — filtrage events par club (UpcomingEventsBlock, MatchesBlock, ClubPageView)
CREATE INDEX IF NOT EXISTS events_club_id_idx ON public.events (club_id)
  WHERE club_id IS NOT NULL;

-- events.user_id  — filtrage events par utilisateur
CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events (user_id);

-- events.date     — tri chronologique (ORDER BY date)
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events (date);

-- events.club_id + date — compound pour la query la plus fréquente
CREATE INDEX IF NOT EXISTS events_club_date_idx ON public.events (club_id, date)
  WHERE club_id IS NOT NULL;

-- clubs.user_id  — ownership check (isOwnClub, myClub banner)
CREATE INDEX IF NOT EXISTS clubs_user_id_idx ON public.clubs (user_id);

-- favorites.user_id  — chargement favoris utilisateur
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites (user_id);

-- attendees.user_id  — chargement attendance utilisateur
CREATE INDEX IF NOT EXISTS attendees_user_id_idx ON public.attendees (user_id);

-- attendees.event_id — comptage participants par event
CREATE INDEX IF NOT EXISTS attendees_event_id_idx ON public.attendees (event_id);

-- club_follows.user_id — chargement follows utilisateur (seul club_id existait)
CREATE INDEX IF NOT EXISTS club_follows_user_id_idx ON public.club_follows (user_id);

-- profiles.club_id — lookup club admin par club
CREATE INDEX IF NOT EXISTS profiles_club_id_idx ON public.profiles (club_id)
  WHERE club_id IS NOT NULL;

-- profiles.role   — policies RLS qui vérifient le rôle
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role)
  WHERE role IN ('admin', 'superadmin', 'club_admin');

-- ── 2. REALTIME — ACTIVER SUR profiles ────────────────────────────────────────
-- Nécessaire pour que la subscription AuthContext `profile-{userId}` fonctionne.
-- Si la table n'est pas dans la publication, les updates ne sont pas broadcastés.

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ── 3. CONTRAINTE UNIQUE club_follows — requis pour UPSERT ────────────────────
-- La nouvelle logique _saveFollows utilise upsert({ onConflict: 'user_id,club_id' }).
-- Si la contrainte n'existe pas, upsert agit comme INSERT et crée des doublons.

ALTER TABLE public.club_follows
  ADD CONSTRAINT IF NOT EXISTS club_follows_user_club_unique UNIQUE (user_id, club_id);

-- ── 4. RELOAD SCHEMA ──────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
