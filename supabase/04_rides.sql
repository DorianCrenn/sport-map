-- ============================================================
-- SportLink — Covoiturage
-- Prérequis : 01_schema.sql + 02_rls.sql
-- ============================================================

-- ── rides : un trajet par conducteur par événement ───────────────────────────

CREATE TABLE IF NOT EXISTS public.rides (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id           TEXT        NOT NULL,
  driver_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_name        TEXT        NOT NULL DEFAULT '',
  departure_location TEXT        NOT NULL,
  departure_lat      DOUBLE PRECISION,
  departure_lng      DOUBLE PRECISION,
  departure_time     TIMESTAMPTZ,
  available_seats    INT         NOT NULL DEFAULT 3,
  accepted_equipment TEXT[]      NOT NULL DEFAULT '{}',
  detour_flexibility TEXT        NOT NULL DEFAULT 'none',
  notes              TEXT,
  status             TEXT        NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rides_seats_range  CHECK (available_seats BETWEEN 1 AND 8),
  CONSTRAINT rides_status_check CHECK (status IN ('active','full','cancelled','completed')),
  CONSTRAINT rides_detour_check CHECK (detour_flexibility IN ('none','small','flexible'))
);

CREATE INDEX IF NOT EXISTS rides_event_idx  ON public.rides (event_id);
CREATE INDEX IF NOT EXISTS rides_driver_idx ON public.rides (driver_id);
CREATE INDEX IF NOT EXISTS rides_status_idx ON public.rides (status);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- ── ride_requests : demande passager → conducteur ────────────────────────────

CREATE TABLE IF NOT EXISTS public.ride_requests (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id        UUID    NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id   UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passenger_name TEXT    NOT NULL DEFAULT '',
  message        TEXT,
  status         TEXT    NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ride_id, passenger_id),
  CONSTRAINT rr_status_check CHECK (status IN ('pending','accepted','refused','cancelled'))
);

CREATE INDEX IF NOT EXISTS rr_ride_idx      ON public.ride_requests (ride_id);
CREATE INDEX IF NOT EXISTS rr_passenger_idx ON public.ride_requests (passenger_id);

ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- ── ride_notifications : notifications temps réel ────────────────────────────

CREATE TABLE IF NOT EXISTS public.ride_notifications (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT    NOT NULL,
  ride_id    UUID    REFERENCES public.rides(id) ON DELETE SET NULL,
  request_id UUID    REFERENCES public.ride_requests(id) ON DELETE SET NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  data       JSONB   NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rn_type_check CHECK (type IN (
    'new_request','request_accepted','request_refused',
    'ride_cancelled','ride_full','passenger_cancelled'
  ))
);

CREATE INDEX IF NOT EXISTS rn_user_unread_idx ON public.ride_notifications (user_id, read, created_at DESC);

ALTER TABLE public.ride_notifications ENABLE ROW LEVEL SECURITY;

-- ── RLS : rides ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rides_select_public"  ON public.rides;
DROP POLICY IF EXISTS "rides_insert_auth"    ON public.rides;
DROP POLICY IF EXISTS "rides_update_driver"  ON public.rides;
DROP POLICY IF EXISTS "rides_delete_driver"  ON public.rides;

-- Lecture publique : la liste des covoiturages est visible par tous
CREATE POLICY "rides_select_public"
  ON public.rides FOR SELECT USING (true);

-- Création : authentifié + driver = soi-même
CREATE POLICY "rides_insert_auth"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = driver_id);

-- Modification : conducteur seulement
CREATE POLICY "rides_update_driver"
  ON public.rides FOR UPDATE
  USING (auth.uid() = driver_id);

-- Suppression : conducteur seulement
CREATE POLICY "rides_delete_driver"
  ON public.rides FOR DELETE
  USING (auth.uid() = driver_id);

-- ── RLS : ride_requests ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rr_select_involved"   ON public.ride_requests;
DROP POLICY IF EXISTS "rr_insert_passenger"  ON public.ride_requests;
DROP POLICY IF EXISTS "rr_update_involved"   ON public.ride_requests;

-- Lecture : passager concerné OU conducteur du trajet
CREATE POLICY "rr_select_involved"
  ON public.ride_requests FOR SELECT
  USING (
    auth.uid() = passenger_id
    OR EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_id AND rides.driver_id = auth.uid()
    )
  );

-- Insertion : passager = soi-même
CREATE POLICY "rr_insert_passenger"
  ON public.ride_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = passenger_id);

-- Modification : passager (annuler) OU conducteur (accepter/refuser)
CREATE POLICY "rr_update_involved"
  ON public.ride_requests FOR UPDATE
  USING (
    auth.uid() = passenger_id
    OR EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_id AND rides.driver_id = auth.uid()
    )
  );

-- ── RLS : ride_notifications ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "rn_select_own"  ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_insert_auth" ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_update_own"  ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_delete_own"  ON public.ride_notifications;

-- Lecture : ses propres notifs seulement
CREATE POLICY "rn_select_own"
  ON public.ride_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Insertion : tout utilisateur authentifié (pour notifier un autre utilisateur)
CREATE POLICY "rn_insert_auth"
  ON public.ride_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Mise à jour (marquer comme lu) : ses propres notifs
CREATE POLICY "rn_update_own"
  ON public.ride_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Suppression : ses propres notifs
CREATE POLICY "rn_delete_own"
  ON public.ride_notifications FOR DELETE
  USING (auth.uid() = user_id);
