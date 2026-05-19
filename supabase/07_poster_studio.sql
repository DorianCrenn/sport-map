-- ── PosterStudio Schema ── 2026-05-19
-- Tables: poster_folders, posters, poster_versions, poster_templates,
--         club_brand_kits, ai_jobs, club_ai_usage
-- Run after 01_schema.sql + 02_rls.sql

-- ── poster_folders ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.poster_folders (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid    REFERENCES auth.users(id)   ON DELETE CASCADE NOT NULL,
  club_id    uuid    REFERENCES public.clubs(id)  ON DELETE CASCADE,
  name       text    NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ── posters ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posters (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid    REFERENCES auth.users(id)          ON DELETE CASCADE NOT NULL,
  club_id     uuid    REFERENCES public.clubs(id)         ON DELETE SET NULL,
  event_id    uuid    REFERENCES public.events(id)        ON DELETE SET NULL,
  folder_id   uuid    REFERENCES public.poster_folders(id) ON DELETE SET NULL,
  name        text    NOT NULL DEFAULT 'Affiche',
  status      text    NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','saved','published','archived')),
  format      text    NOT NULL DEFAULT 'story'
              CHECK (format IN ('story','post','banner')),
  template_id text    NOT NULL DEFAULT 'simple',
  layers      jsonb   NOT NULL DEFAULT '{}',
  thumbnail_url text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ── poster_versions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.poster_versions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id      uuid REFERENCES public.posters(id) ON DELETE CASCADE NOT NULL,
  version_number int  NOT NULL DEFAULT 1,
  layers         jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz DEFAULT now()
);

-- ── poster_templates ───────────────────────────────────────────────────────────
-- is_system = true → templates built into code (migrated here for future DB-driven delivery)
CREATE TABLE IF NOT EXISTS public.poster_templates (
  id            text PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- ── club_brand_kits ────────────────────────────────────────────────────────────
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
  logo_urls       jsonb DEFAULT '{}',   -- { main, white, dark }
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ── ai_jobs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- ── club_ai_usage ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_ai_usage (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id        uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  month          date NOT NULL,  -- first day of the month
  import_count   int  DEFAULT 0,
  generate_count int  DEFAULT 0,
  monthly_limit  int  DEFAULT 5,
  UNIQUE(club_id, month)
);

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS posters_user_status   ON public.posters(user_id, status);
CREATE INDEX IF NOT EXISTS posters_club_status   ON public.posters(club_id, status);
CREATE INDEX IF NOT EXISTS posters_event         ON public.posters(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS posters_updated       ON public.posters(updated_at DESC);
CREATE INDEX IF NOT EXISTS poster_versions_poster ON public.poster_versions(poster_id, version_number DESC);
CREATE INDEX IF NOT EXISTS ai_jobs_status_prio   ON public.ai_jobs(status, priority DESC) WHERE status IN ('pending','processing');

-- ── updated_at trigger ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  CREATE TRIGGER posters_updated_at         BEFORE UPDATE ON public.posters          FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  CREATE TRIGGER club_brand_kits_updated_at BEFORE UPDATE ON public.club_brand_kits  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  CREATE TRIGGER ai_jobs_updated_at         BEFORE UPDATE ON public.ai_jobs          FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  CREATE TRIGGER poster_templates_updated_at BEFORE UPDATE ON public.poster_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.poster_folders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posters           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poster_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_brand_kits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_ai_usage     ENABLE ROW LEVEL SECURITY;

-- poster_folders
DROP POLICY IF EXISTS "folders_owner"       ON public.poster_folders;
CREATE POLICY "folders_owner" ON public.poster_folders
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- posters: owner full access + club admin read/write their club's posters
DROP POLICY IF EXISTS "posters_owner"       ON public.posters;
DROP POLICY IF EXISTS "posters_club_admin"  ON public.posters;
CREATE POLICY "posters_owner" ON public.posters
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "posters_club_admin" ON public.posters FOR SELECT
  USING (
    club_id IS NOT NULL AND
    club_id IN (
      SELECT id FROM public.clubs WHERE user_id = auth.uid()
    )
  );

-- poster_versions: mirrors poster access
DROP POLICY IF EXISTS "versions_owner" ON public.poster_versions;
CREATE POLICY "versions_owner" ON public.poster_versions
  USING (
    poster_id IN (
      SELECT id FROM public.posters WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    poster_id IN (
      SELECT id FROM public.posters WHERE user_id = auth.uid()
    )
  );

-- poster_templates: system templates are public read; user templates owner only
DROP POLICY IF EXISTS "templates_public_select"  ON public.poster_templates;
DROP POLICY IF EXISTS "templates_owner_write"    ON public.poster_templates;
CREATE POLICY "templates_public_select" ON public.poster_templates FOR SELECT
  USING (is_system = true OR user_id = auth.uid() OR club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid()));
CREATE POLICY "templates_owner_write" ON public.poster_templates FOR ALL
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  );

-- club_brand_kits: club owner + admin write; everyone can SELECT (for template rendering)
DROP POLICY IF EXISTS "brand_kits_select"       ON public.club_brand_kits;
DROP POLICY IF EXISTS "brand_kits_owner_write"  ON public.club_brand_kits;
CREATE POLICY "brand_kits_select" ON public.club_brand_kits FOR SELECT USING (true);
CREATE POLICY "brand_kits_owner_write" ON public.club_brand_kits FOR ALL
  USING (
    club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  )
  WITH CHECK (
    club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  );

-- ai_jobs: user inserts/reads own jobs; service role updates status
DROP POLICY IF EXISTS "ai_jobs_owner"  ON public.ai_jobs;
CREATE POLICY "ai_jobs_owner" ON public.ai_jobs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- club_ai_usage: club admin reads their own usage; service role writes
DROP POLICY IF EXISTS "ai_usage_club_admin" ON public.club_ai_usage;
CREATE POLICY "ai_usage_club_admin" ON public.club_ai_usage FOR SELECT
  USING (
    club_id IN (SELECT id FROM public.clubs WHERE user_id = auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  );
