-- ============================================================
-- SportLink — Supabase Schema v2 (idempotent, safe to re-run)
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name             TEXT,
  role             TEXT NOT NULL DEFAULT 'user',
  avatar_url       TEXT,
  favorite_sports  TEXT[] DEFAULT '{}',
  followed_clubs   TEXT[] DEFAULT '{}',
  club_id          TEXT,
  onboarding_done  BOOLEAN DEFAULT FALSE,
  auth_provider    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "profiles_select_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"  ON public.profiles;

-- Profiles are publicly readable (no sensitive data — email is in auth.users)
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- Users can only create their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can edit their own profile; admins/superadmins can edit any profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'superadmin')
    )
  );


-- ── Auto-create profile on signup ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── Events ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  sport       TEXT NOT NULL,
  date        TIMESTAMPTZ NOT NULL,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  city        TEXT,
  description TEXT,
  event_type  TEXT DEFAULT 'friendly',
  team_name   TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  club_id     TEXT,
  source      TEXT DEFAULT 'user',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_all"   ON public.events;
DROP POLICY IF EXISTS "events_insert_auth"  ON public.events;
DROP POLICY IF EXISTS "events_update_own"   ON public.events;
DROP POLICY IF EXISTS "events_delete_own"   ON public.events;

CREATE POLICY "events_select_all"  ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert_auth" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_update_own"  ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "events_delete_own"  ON public.events FOR DELETE USING (auth.uid() = user_id);


-- ── Favorites ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_own" ON public.favorites;
CREATE POLICY "favorites_own" ON public.favorites
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── Attendees ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendees (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendees_own" ON public.attendees;
CREATE POLICY "attendees_own" ON public.attendees
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── Clubs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clubs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sport       TEXT NOT NULL,
  city        TEXT,
  description TEXT,
  logo_url    TEXT,
  website     TEXT,
  phone       TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clubs_select_all"   ON public.clubs;
DROP POLICY IF EXISTS "clubs_insert_auth"  ON public.clubs;
DROP POLICY IF EXISTS "clubs_update_own"   ON public.clubs;
DROP POLICY IF EXISTS "clubs_delete_own"   ON public.clubs;

CREATE POLICY "clubs_select_all"  ON public.clubs FOR SELECT USING (true);
CREATE POLICY "clubs_insert_auth" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clubs_update_own"  ON public.clubs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clubs_delete_own"  ON public.clubs FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- ADMIN SETUP — run AFTER the schema above
-- ============================================================

-- Step 1: verify or create admin profile with superadmin role
-- (safe to run multiple times)
INSERT INTO public.profiles (id, name, role, onboarding_done)
SELECT id, 'Super Admin', 'superadmin', true
FROM auth.users
WHERE email = 'admin@sportlink.fr'
ON CONFLICT (id) DO UPDATE
  SET role = 'superadmin', onboarding_done = true, name = 'Super Admin';

-- Step 2: diagnostic — run this to verify the admin profile
-- SELECT p.id, p.name, p.role, p.onboarding_done, u.email
-- FROM public.profiles p
-- JOIN auth.users u ON p.id = u.id
-- WHERE u.email = 'admin@sportlink.fr';

-- ============================================================
-- SUPABASE AUTH SETTINGS (do in Dashboard UI, not SQL)
-- Authentication > Configuration > Email:
--   ✓ Disable "Confirm email" for dev/demo
-- Authentication > Providers > Email:
--   ✓ Enable email provider
-- ============================================================
