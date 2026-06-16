-- Migration : système analytics + consentement RGPD

-- 1. Consentement analytics sur les profils (null = pas encore décidé)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS analytics_consent boolean DEFAULT null;

-- 2. Table analytics_events — événements utilisateurs instrumentés
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ae_event_type_idx ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS ae_user_idx       ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ae_created_idx    ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS ae_session_idx    ON public.analytics_events(session_id, created_at DESC);

-- 3. RLS analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Seul l'utilisateur lui-même peut insérer ses événements
DROP POLICY IF EXISTS "ae_insert_own"   ON public.analytics_events;
DROP POLICY IF EXISTS "ae_select_admin" ON public.analytics_events;

CREATE POLICY "ae_insert_own" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seuls les admins peuvent lire tous les événements
CREATE POLICY "ae_select_admin" ON public.analytics_events
  FOR SELECT USING (public.sl_is_admin());

-- 4. Activer la mise à jour du consentement (analytics_consent dans profiles)
-- La politique profiles UPDATE existante couvre déjà l'update du profil utilisateur.
-- On s'assure juste que analytics_consent peut être mis à jour via updateProfile.

-- 5. Index perf pour les requêtes dashboard admin (profiles + clubs)
CREATE INDEX IF NOT EXISTS profiles_created_idx ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS clubs_created_idx    ON public.clubs(created_at DESC);
CREATE INDEX IF NOT EXISTS events_created_idx   ON public.events(created_at DESC);
