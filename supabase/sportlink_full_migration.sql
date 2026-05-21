-- ============================================================
-- SportLink — Migration complète idempotente (P0 + P1)
-- Safe to run sur base vierge OU base existante.
-- Ne touche PAS aux données existantes.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. FONCTIONS HELPER
-- ════════════════════════════════════════════════════════════

-- sl_is_admin() : SECURITY DEFINER évite la récursion RLS infinie
CREATE OR REPLACE FUNCTION public.sl_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  );
$$;

-- handle_new_user() : crée automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, auth_provider)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'authProvider'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- profiles_guard_immutable() : empêche l'escalade de rôle via API directe
CREATE OR REPLACE FUNCTION public.profiles_guard_immutable()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.sl_is_admin() THEN
    NEW.role    := OLD.role;
    NEW.club_id := OLD.club_id;
  END IF;
  RETURN NEW;
END;
$$;


-- ════════════════════════════════════════════════════════════
-- 2. TABLES (CREATE IF NOT EXISTS — ne casse rien si déjà là)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name             TEXT,
  role             TEXT        NOT NULL DEFAULT 'user',
  avatar_url       TEXT,
  favorite_sports  TEXT[]      DEFAULT '{}',
  followed_clubs   TEXT[]      DEFAULT '{}',
  club_id          TEXT,
  onboarding_done  BOOLEAN     DEFAULT FALSE,
  auth_provider    TEXT,
  badges           TEXT[]      DEFAULT '{}',
  digest_opt_in    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  sport        TEXT        NOT NULL,
  date         TIMESTAMPTZ NOT NULL,
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  city         TEXT,
  venue        TEXT,
  description  TEXT,
  event_type   TEXT        DEFAULT 'friendly',
  team_name    TEXT        DEFAULT '',
  category     TEXT        DEFAULT '',
  level        TEXT,
  cup_type     TEXT,
  home_or_away TEXT        DEFAULT 'home',
  adversaire   TEXT,
  standings    JSONB,
  score        JSONB,
  club_id      TEXT,
  source       TEXT        DEFAULT 'user',
  series_id    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id   TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.attendees (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id   TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.clubs (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  sport       TEXT    NOT NULL,
  city        TEXT,
  description TEXT,
  logo_url    TEXT,
  website     TEXT,
  phone       TEXT,
  email       TEXT,
  categories  JSONB   NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_pages (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id    TEXT    NOT NULL UNIQUE,
  blocks     JSONB   NOT NULL DEFAULT '[]',
  typography JSONB   NOT NULL DEFAULT '{"titleFont":"Oswald","bodyFont":"Inter"}',
  theme      JSONB   NOT NULL DEFAULT '{"primary":"#0F1E3A","accent":null}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_managers (
  id       UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id  TEXT    NOT NULL,
  email    TEXT    NOT NULL,
  name     TEXT    NOT NULL DEFAULT '',
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, email)
);

CREATE TABLE IF NOT EXISTS public.club_trainings (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id    TEXT    NOT NULL,
  team_id    TEXT    NOT NULL,
  sessions   JSONB   NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.club_page_views (
  id         BIGSERIAL PRIMARY KEY,
  club_id    TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.club_announcements (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id      TEXT        NOT NULL,
  club_name    TEXT        NOT NULL DEFAULT '',
  author_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name  TEXT        NOT NULL DEFAULT '',
  type         TEXT        NOT NULL DEFAULT 'info',
  title        TEXT,
  message      TEXT        NOT NULL,
  target_teams TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ca_type_check CHECK (type IN ('info','urgent','result','event'))
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  announcement_id UUID NOT NULL REFERENCES public.club_announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

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


-- ════════════════════════════════════════════════════════════
-- 3. MIGRATIONS (colonnes ajoutées après coup)
-- ════════════════════════════════════════════════════════════

-- ── events : colonnes ajoutées après la création initiale ──────────────────────
-- CRITIQUE : CREATE TABLE IF NOT EXISTS ne rajoute pas les colonnes si la table
-- existe déjà. Ces ALTER TABLE garantissent que toutes les colonnes sont présentes.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type   TEXT DEFAULT 'friendly';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS team_name    TEXT DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT '';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS level        TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cup_type     TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS home_or_away TEXT DEFAULT 'home';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS adversaire   TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS standings    JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS score        JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS club_id      TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'user';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS series_id    TEXT;

-- ── profiles : plan Stripe-ready + XP gamification ────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'starter', 'pro', 'federation'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles (xp DESC);

-- Colonne theme sur club_pages (ajoutée en P1)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='club_pages' AND column_name='theme'
  ) THEN
    ALTER TABLE public.club_pages
      ADD COLUMN theme JSONB NOT NULL DEFAULT '{"primary":"#0F1E3A","accent":null}';
  END IF;
END $$;

-- Templates favoris affiche dans profiles (sync PosterStudio)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='poster_fav_templates'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN poster_fav_templates JSONB DEFAULT '[]';
  END IF;
END $$;

-- Template par défaut dans club_brand_kits (sync PosterStudio)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='club_brand_kits' AND column_name='default_template_id'
  ) THEN
    ALTER TABLE public.club_brand_kits ADD COLUMN default_template_id TEXT;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════
-- 4. INDEX
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS cpv_club_idx     ON public.club_page_views (club_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS ca_club_created_idx ON public.club_announcements (club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rides_event_idx  ON public.rides (event_id);
CREATE INDEX IF NOT EXISTS rides_driver_idx ON public.rides (driver_id);
CREATE INDEX IF NOT EXISTS rides_status_idx ON public.rides (status);
CREATE INDEX IF NOT EXISTS rr_ride_idx      ON public.ride_requests (ride_id);
CREATE INDEX IF NOT EXISTS rr_passenger_idx ON public.ride_requests (passenger_id);
CREATE INDEX IF NOT EXISTS rn_user_unread_idx ON public.ride_notifications (user_id, read, created_at DESC);


-- ════════════════════════════════════════════════════════════
-- 5. RLS ENABLE
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_pages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_managers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_trainings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_page_views    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_notifications ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════
-- 6. TRIGGERS
-- ════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_guard_immutable_trigger ON public.profiles;
CREATE TRIGGER profiles_guard_immutable_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_immutable();


-- ════════════════════════════════════════════════════════════
-- 7. POLICIES RLS (DROP + CREATE — 100% idempotent)
-- ════════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_public"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"        ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.sl_is_admin());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.sl_is_admin());

-- ── events ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "events_select_public"        ON public.events;
DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;
DROP POLICY IF EXISTS "events_insert_admin_or_club" ON public.events;
DROP POLICY IF EXISTS "events_update_own_or_admin"  ON public.events;
DROP POLICY IF EXISTS "events_delete_own_or_admin"  ON public.events;

CREATE POLICY "events_select_public"
  ON public.events FOR SELECT USING (true);

CREATE POLICY "events_insert_admin_or_club"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin', 'club_admin')
    )
  );

CREATE POLICY "events_update_own_or_admin"
  ON public.events FOR UPDATE
  USING (user_id = auth.uid() OR public.sl_is_admin());

CREATE POLICY "events_delete_own_or_admin"
  ON public.events FOR DELETE
  USING (user_id = auth.uid() OR public.sl_is_admin());

-- ── favorites ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;

CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE USING (user_id = auth.uid());

-- ── attendees (RGPD : lecture restreinte à soi-même) ─────────────────────────

DROP POLICY IF EXISTS "attendees_select_public" ON public.attendees;
DROP POLICY IF EXISTS "attendees_select_own"    ON public.attendees;
DROP POLICY IF EXISTS "attendees_insert_own"    ON public.attendees;
DROP POLICY IF EXISTS "attendees_delete_own"    ON public.attendees;

CREATE POLICY "attendees_select_own"
  ON public.attendees FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "attendees_insert_own"
  ON public.attendees FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendees_delete_own"
  ON public.attendees FOR DELETE USING (user_id = auth.uid());

-- ── clubs ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "clubs_select_public"         ON public.clubs;
DROP POLICY IF EXISTS "clubs_select_all"            ON public.clubs;
DROP POLICY IF EXISTS "clubs_insert_authenticated"  ON public.clubs;
DROP POLICY IF EXISTS "clubs_insert_auth"           ON public.clubs;
DROP POLICY IF EXISTS "clubs_insert_own"            ON public.clubs;
DROP POLICY IF EXISTS "clubs_update_own_or_admin"   ON public.clubs;
DROP POLICY IF EXISTS "clubs_delete_own_or_admin"   ON public.clubs;
DROP POLICY IF EXISTS "clubs_update_own"            ON public.clubs;
DROP POLICY IF EXISTS "clubs_delete_own"            ON public.clubs;

CREATE POLICY "clubs_select_public"
  ON public.clubs FOR SELECT USING (true);

CREATE POLICY "clubs_insert_own"
  ON public.clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "clubs_update_own_or_admin"
  ON public.clubs FOR UPDATE
  USING (user_id = auth.uid() OR public.sl_is_admin());

CREATE POLICY "clubs_delete_own_or_admin"
  ON public.clubs FOR DELETE
  USING (user_id = auth.uid() OR public.sl_is_admin());

-- ── club_pages ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "club_pages_select" ON public.club_pages;
DROP POLICY IF EXISTS "club_pages_upsert" ON public.club_pages;
DROP POLICY IF EXISTS "pages_select_public" ON public.club_pages;
DROP POLICY IF EXISTS "pages_insert_owner"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_update_owner"  ON public.club_pages;
DROP POLICY IF EXISTS "pages_delete_owner"  ON public.club_pages;

CREATE POLICY "pages_select_public"
  ON public.club_pages FOR SELECT USING (true);

CREATE POLICY "pages_insert_owner"
  ON public.club_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "pages_update_owner"
  ON public.club_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "pages_delete_owner"
  ON public.club_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_pages.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

-- ── club_managers ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "managers_select_owner_or_admin" ON public.club_managers;
DROP POLICY IF EXISTS "managers_insert_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_update_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "managers_delete_owner"          ON public.club_managers;
DROP POLICY IF EXISTS "club_managers_select"           ON public.club_managers;
DROP POLICY IF EXISTS "club_managers_insert"           ON public.club_managers;
DROP POLICY IF EXISTS "club_managers_delete"           ON public.club_managers;

CREATE POLICY "managers_select_owner_or_admin"
  ON public.club_managers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "managers_insert_owner"
  ON public.club_managers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
  );

CREATE POLICY "managers_update_owner"
  ON public.club_managers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    )
  );

CREATE POLICY "managers_delete_owner"
  ON public.club_managers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_managers.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

-- ── club_trainings ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "club_trainings_select" ON public.club_trainings;
DROP POLICY IF EXISTS "club_trainings_upsert" ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_select_public" ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_insert_owner"  ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_update_owner"  ON public.club_trainings;
DROP POLICY IF EXISTS "trainings_delete_owner"  ON public.club_trainings;

CREATE POLICY "trainings_select_public"
  ON public.club_trainings FOR SELECT USING (true);

CREATE POLICY "trainings_insert_owner"
  ON public.club_trainings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "trainings_update_owner"
  ON public.club_trainings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

CREATE POLICY "trainings_delete_owner"
  ON public.club_trainings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id::text = club_trainings.club_id
        AND clubs.user_id = auth.uid()
    ) OR public.sl_is_admin()
  );

-- ── club_page_views ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "cpv_insert_anyone" ON public.club_page_views;
DROP POLICY IF EXISTS "cpv_select_all"    ON public.club_page_views;

CREATE POLICY "cpv_insert_anyone"
  ON public.club_page_views FOR INSERT WITH CHECK (true);

CREATE POLICY "cpv_select_all"
  ON public.club_page_views FOR SELECT USING (true);

-- ── club_announcements ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ca_select" ON public.club_announcements;
DROP POLICY IF EXISTS "ca_insert" ON public.club_announcements;
DROP POLICY IF EXISTS "ca_delete" ON public.club_announcements;

CREATE POLICY "ca_select"
  ON public.club_announcements FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ca_insert"
  ON public.club_announcements FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id::text = club_announcements.club_id
          AND clubs.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'club_admin'
          AND club_id = club_announcements.club_id
      )
      OR public.sl_is_admin()
    )
  );

CREATE POLICY "ca_delete"
  ON public.club_announcements FOR DELETE
  USING (auth.uid() = author_id OR public.sl_is_admin());

-- ── announcement_reads ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ar_select_own" ON public.announcement_reads;
DROP POLICY IF EXISTS "ar_insert_own" ON public.announcement_reads;
DROP POLICY IF EXISTS "ar_delete_own" ON public.announcement_reads;

CREATE POLICY "ar_select_own" ON public.announcement_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ar_insert_own" ON public.announcement_reads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ar_delete_own" ON public.announcement_reads FOR DELETE USING (auth.uid() = user_id);

-- ── rides ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rides_select_public" ON public.rides;
DROP POLICY IF EXISTS "rides_insert_auth"   ON public.rides;
DROP POLICY IF EXISTS "rides_update_driver" ON public.rides;
DROP POLICY IF EXISTS "rides_delete_driver" ON public.rides;

CREATE POLICY "rides_select_public"
  ON public.rides FOR SELECT USING (true);

CREATE POLICY "rides_insert_auth"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = driver_id);

CREATE POLICY "rides_update_driver"
  ON public.rides FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "rides_delete_driver"
  ON public.rides FOR DELETE USING (auth.uid() = driver_id);

-- ── ride_requests ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rr_select_involved"  ON public.ride_requests;
DROP POLICY IF EXISTS "rr_insert_passenger" ON public.ride_requests;
DROP POLICY IF EXISTS "rr_update_involved"  ON public.ride_requests;

CREATE POLICY "rr_select_involved"
  ON public.ride_requests FOR SELECT
  USING (
    auth.uid() = passenger_id
    OR EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_id AND rides.driver_id = auth.uid()
    )
  );

CREATE POLICY "rr_insert_passenger"
  ON public.ride_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = passenger_id);

CREATE POLICY "rr_update_involved"
  ON public.ride_requests FOR UPDATE
  USING (
    auth.uid() = passenger_id
    OR EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_id AND rides.driver_id = auth.uid()
    )
  );

-- ── ride_notifications ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "rn_select_own"  ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_insert_auth" ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_update_own"  ON public.ride_notifications;
DROP POLICY IF EXISTS "rn_delete_own"  ON public.ride_notifications;

CREATE POLICY "rn_select_own"
  ON public.ride_notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "rn_insert_auth"
  ON public.ride_notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "rn_update_own"
  ON public.ride_notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "rn_delete_own"
  ON public.ride_notifications FOR DELETE USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════
-- 8. VUES + GRANTS
-- ════════════════════════════════════════════════════════════

-- Counts participants (security_invoker=false → bypass RLS attendees → counts corrects)
DROP VIEW IF EXISTS public.event_attendee_counts;
CREATE VIEW public.event_attendee_counts
  WITH (security_invoker = false)
  AS
  SELECT event_id, COUNT(*)::int AS count
  FROM public.attendees
  GROUP BY event_id;

GRANT SELECT ON public.event_attendee_counts TO anon, authenticated;

-- ── PERF-006 : table dédiée club_follows ─────────────────────────────────────
-- club_id is TEXT (like club_pages, club_managers, etc.) for compatibility with
-- profiles.followed_clubs TEXT[] which may contain non-UUID legacy values.
CREATE TABLE IF NOT EXISTS public.club_follows (
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id    TEXT        NOT NULL,
  teams      jsonb        DEFAULT '"all"'::jsonb,
  notif      jsonb        DEFAULT '{"match":true,"news":true}'::jsonb,
  created_at timestamptz  DEFAULT now(),
  PRIMARY KEY (user_id, club_id)
);

CREATE INDEX IF NOT EXISTS club_follows_club_id_idx ON public.club_follows(club_id);

ALTER TABLE public.club_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_public" ON public.club_follows;
DROP POLICY IF EXISTS "follows_insert_own"    ON public.club_follows;
DROP POLICY IF EXISTS "follows_update_own"    ON public.club_follows;
DROP POLICY IF EXISTS "follows_delete_own"    ON public.club_follows;

CREATE POLICY "follows_select_public" ON public.club_follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own"    ON public.club_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "follows_update_own"    ON public.club_follows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "follows_delete_own"    ON public.club_follows FOR DELETE USING (auth.uid() = user_id);

-- Migration one-shot : copie profiles.followed_clubs → club_follows
-- Only migrate entries whose value matches an existing clubs.id (cast to text for comparison).
INSERT INTO public.club_follows (user_id, club_id)
SELECT p.id, cid
FROM public.profiles p
CROSS JOIN LATERAL UNNEST(p.followed_clubs) AS cid
WHERE p.followed_clubs IS NOT NULL
  AND cardinality(p.followed_clubs) > 0
  AND cid IN (SELECT id::text FROM public.clubs)
ON CONFLICT (user_id, club_id) DO NOTHING;

-- Counts followers par club — maintenant via table dédiée (index sur club_id = O(log n))
DROP VIEW IF EXISTS public.club_follower_counts;
CREATE VIEW public.club_follower_counts AS
  SELECT club_id, COUNT(*)::int AS follower_count
  FROM public.club_follows
  GROUP BY club_id;

GRANT SELECT ON public.club_follower_counts TO anon, authenticated;

-- Grants club_page_views (pour anon qui visite une page club)
GRANT USAGE  ON SEQUENCE public.club_page_views_id_seq TO anon, authenticated;
GRANT INSERT, SELECT ON public.club_page_views TO anon, authenticated;


-- ════════════════════════════════════════════════════════════
-- 9. POSTER STUDIO — Tables
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.poster_folders (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid    REFERENCES auth.users(id)   ON DELETE CASCADE NOT NULL,
  club_id    uuid    REFERENCES public.clubs(id)  ON DELETE CASCADE,
  name       text    NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.posters (
  id            uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid    REFERENCES auth.users(id)              ON DELETE CASCADE NOT NULL,
  club_id       uuid    REFERENCES public.clubs(id)             ON DELETE SET NULL,
  event_id      uuid    REFERENCES public.events(id)            ON DELETE SET NULL,
  folder_id     uuid    REFERENCES public.poster_folders(id)    ON DELETE SET NULL,
  name          text    NOT NULL DEFAULT 'Affiche',
  status        text    NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','saved','published','archived')),
  format        text    NOT NULL DEFAULT 'story'
                CHECK (format IN ('story','post','banner')),
  template_id   text    NOT NULL DEFAULT 'simple',
  layers        jsonb   NOT NULL DEFAULT '{}',
  thumbnail_url text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poster_versions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id      uuid REFERENCES public.posters(id) ON DELETE CASCADE NOT NULL,
  version_number int  NOT NULL DEFAULT 1,
  layers         jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poster_templates (
  id            text PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id)  ON DELETE SET NULL,
  club_id       uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text DEFAULT '',
  is_system     boolean DEFAULT false,
  is_premium    boolean DEFAULT false,
  category      text DEFAULT 'match'
                CHECK (category IN ('match','result','event','tournament','training','recruitment')),
  sport         text,
  thumbnail_url text,
  layers        jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_brand_kits (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id         uuid REFERENCES public.clubs(id) ON DELETE CASCADE UNIQUE NOT NULL,
  kit_name        text DEFAULT 'Identité visuelle',
  primary_color   text DEFAULT '#22D96A',
  secondary_color text DEFAULT '#0D1117',
  accent_color    text DEFAULT '#ffffff',
  text_color      text DEFAULT '#ffffff',
  bg_color        text DEFAULT '#0D1117',
  primary_font    text DEFAULT 'Inter',
  logo_urls       jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id)  ON DELETE CASCADE NOT NULL,
  club_id     uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  type        text NOT NULL
              CHECK (type IN ('import','generate','dna','thumbnail')),
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','processing','done','failed')),
  priority    int  NOT NULL DEFAULT 5,
  input_url   text,
  input_data  jsonb DEFAULT '{}',
  output_data jsonb DEFAULT '{}',
  error_msg   text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_ai_usage (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id        uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  month          date NOT NULL,
  import_count   int  DEFAULT 0,
  generate_count int  DEFAULT 0,
  monthly_limit  int  DEFAULT 5,
  UNIQUE(club_id, month)
);


-- ════════════════════════════════════════════════════════════
-- 10. POSTER STUDIO — Index
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS posters_user_status    ON public.posters(user_id, status);
CREATE INDEX IF NOT EXISTS posters_club_status    ON public.posters(club_id, status);
CREATE INDEX IF NOT EXISTS posters_event          ON public.posters(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posters_updated        ON public.posters(updated_at DESC);
CREATE INDEX IF NOT EXISTS poster_versions_poster ON public.poster_versions(poster_id, version_number DESC);
CREATE INDEX IF NOT EXISTS ai_jobs_status_prio    ON public.ai_jobs(status, priority DESC)
  WHERE status IN ('pending','processing');

-- Contrainte unique pour le upsert draft : un seul brouillon par event+user
CREATE UNIQUE INDEX IF NOT EXISTS posters_draft_event_user
  ON public.posters(event_id, user_id)
  WHERE event_id IS NOT NULL AND status = 'draft';


-- ════════════════════════════════════════════════════════════
-- 11. POSTER STUDIO — RLS enable
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.poster_folders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posters           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_brand_kits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_ai_usage     ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════
-- 12. POSTER STUDIO — updated_at function + triggers
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  CREATE TRIGGER posters_updated_at
    BEFORE UPDATE ON public.posters
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER club_brand_kits_updated_at
    BEFORE UPDATE ON public.club_brand_kits
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER ai_jobs_updated_at
    BEFORE UPDATE ON public.ai_jobs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER poster_templates_updated_at
    BEFORE UPDATE ON public.poster_templates
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ════════════════════════════════════════════════════════════
-- 13. POSTER STUDIO — Policies RLS
-- ════════════════════════════════════════════════════════════

-- poster_folders
DROP POLICY IF EXISTS "folders_owner" ON public.poster_folders;
CREATE POLICY "folders_owner" ON public.poster_folders
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- posters
DROP POLICY IF EXISTS "posters_owner"      ON public.posters;
DROP POLICY IF EXISTS "posters_club_admin" ON public.posters;
CREATE POLICY "posters_owner" ON public.posters
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "posters_club_admin" ON public.posters FOR SELECT
  USING (
    club_id IS NOT NULL AND
    club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid())
  );

-- poster_versions
DROP POLICY IF EXISTS "versions_owner" ON public.poster_versions;
CREATE POLICY "versions_owner" ON public.poster_versions
  USING (
    poster_id IN (SELECT id FROM public.posters WHERE user_id = auth.uid())
  )
  WITH CHECK (
    poster_id IN (SELECT id FROM public.posters WHERE user_id = auth.uid())
  );

-- poster_templates
DROP POLICY IF EXISTS "templates_public_select" ON public.poster_templates;
DROP POLICY IF EXISTS "templates_owner_write"   ON public.poster_templates;
CREATE POLICY "templates_public_select" ON public.poster_templates FOR SELECT
  USING (
    is_system = true
    OR user_id = auth.uid()
    OR club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid())
  );
CREATE POLICY "templates_owner_write" ON public.poster_templates FOR ALL
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  );

-- club_brand_kits
DROP POLICY IF EXISTS "brand_kits_select"      ON public.club_brand_kits;
DROP POLICY IF EXISTS "brand_kits_owner_write" ON public.club_brand_kits;
CREATE POLICY "brand_kits_select" ON public.club_brand_kits FOR SELECT USING (true);
CREATE POLICY "brand_kits_owner_write" ON public.club_brand_kits FOR ALL
  USING (
    club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  )
  WITH CHECK (
    club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  );

-- ai_jobs
DROP POLICY IF EXISTS "ai_jobs_owner" ON public.ai_jobs;
CREATE POLICY "ai_jobs_owner" ON public.ai_jobs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- club_ai_usage
DROP POLICY IF EXISTS "ai_usage_club_admin" ON public.club_ai_usage;
CREATE POLICY "ai_usage_club_admin" ON public.club_ai_usage FOR SELECT
  USING (
    club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  );


-- ════════════════════════════════════════════════════════════
-- 14. ADMIN SETUP (idempotent — ne touche pas aux autres users)
-- ════════════════════════════════════════════════════════════

INSERT INTO public.profiles (id, name, role, onboarding_done)
SELECT id, 'Super Admin', 'superadmin', true
FROM auth.users
WHERE email = 'admin@sportlink.fr'
ON CONFLICT (id) DO UPDATE
  SET role = 'superadmin', onboarding_done = true, name = 'Super Admin';

-- ════════════════════════════════════════════════════════════
-- 15. RÉACTIONS SUR ÉVÉNEMENTS (EPIC-P5-1)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.event_reactions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   uuid        REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji      text        NOT NULL CHECK (emoji IN ('👏', '🔥', '💪')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (event_id, user_id, emoji)
);

ALTER TABLE public.event_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_public" ON public.event_reactions;
DROP POLICY IF EXISTS "reactions_insert_own"    ON public.event_reactions;
DROP POLICY IF EXISTS "reactions_delete_own"    ON public.event_reactions;

CREATE POLICY "reactions_select_public" ON public.event_reactions
  FOR SELECT USING (true);

CREATE POLICY "reactions_insert_own" ON public.event_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions_delete_own" ON public.event_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Vue agrégée des comptes par emoji
CREATE OR REPLACE VIEW public.event_reaction_counts AS
  SELECT event_id, emoji, COUNT(*)::int AS count
  FROM public.event_reactions
  GROUP BY event_id, emoji;

GRANT SELECT ON public.event_reaction_counts TO anon, authenticated;

-- ════════════════════════════════════════════════════════════
-- 16. COMMENTAIRES POST-MATCH (EPIC-P5-1)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.event_comments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   uuid        REFERENCES public.events(id)   ON DELETE CASCADE NOT NULL,
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content    text        NOT NULL
                         CHECK (length(trim(content)) >= 1 AND length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_comments_event_id_idx ON public.event_comments(event_id);

ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_public" ON public.event_comments;
DROP POLICY IF EXISTS "comments_insert_own"    ON public.event_comments;
DROP POLICY IF EXISTS "comments_delete_own"    ON public.event_comments;

CREATE POLICY "comments_select_public" ON public.event_comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_own" ON public.event_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON public.event_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FIN — Tout est idempotent, safe to re-run.
-- ============================================================
