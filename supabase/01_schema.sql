-- ============================================================
-- SportLink — Schéma complet (source unique de vérité)
-- Idempotent : safe to re-run sur une base existante.
-- Ordre d'exécution : 01_schema.sql → 02_rls.sql → 03_views.sql → seed.sql
-- ============================================================

-- ── Helper admin (SECURITY DEFINER évite la récursion RLS) ──────────────────

CREATE OR REPLACE FUNCTION public.sl_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  );
$$;

-- ── profiles ─────────────────────────────────────────────────────────────────

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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── events ───────────────────────────────────────────────────────────────────

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

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- ── favorites ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id   TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- ── attendees ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.attendees (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id   TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- ── clubs ────────────────────────────────────────────────────────────────────

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
  -- Catégories + équipes (JSONB) : [{ id, name, teams: [{ id, name, level, category }] }]
  categories  JSONB   NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- ── club_pages ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.club_pages (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id    TEXT    NOT NULL UNIQUE,
  blocks     JSONB   NOT NULL DEFAULT '[]',
  typography JSONB   NOT NULL DEFAULT '{"titleFont":"Oswald","bodyFont":"Inter"}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.club_pages ENABLE ROW LEVEL SECURITY;

-- ── club_managers ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.club_managers (
  id       UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id  TEXT    NOT NULL,
  email    TEXT    NOT NULL,
  name     TEXT    NOT NULL DEFAULT '',
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, email)
);

ALTER TABLE public.club_managers ENABLE ROW LEVEL SECURITY;

-- ── club_trainings ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.club_trainings (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id    TEXT    NOT NULL,
  team_id    TEXT    NOT NULL,
  sessions   JSONB   NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (club_id, team_id)
);

ALTER TABLE public.club_trainings ENABLE ROW LEVEL SECURITY;

-- ── club_page_views ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.club_page_views (
  id         BIGSERIAL PRIMARY KEY,
  club_id    TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cpv_club_idx ON public.club_page_views (club_id, viewed_at DESC);

ALTER TABLE public.club_page_views ENABLE ROW LEVEL SECURITY;

-- ── Admin setup ──────────────────────────────────────────────────────────────
-- Passer le compte admin en superadmin (idempotent, safe to re-run)

INSERT INTO public.profiles (id, name, role, onboarding_done)
SELECT id, 'Super Admin', 'superadmin', true
FROM auth.users
WHERE email = 'admin@sportlink.fr'
ON CONFLICT (id) DO UPDATE
  SET role = 'superadmin', onboarding_done = true, name = 'Super Admin';
