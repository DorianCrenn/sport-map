-- Migration : club_subscriptions — Plans d'abonnement clubs
-- Date: 2026-06-01

CREATE TABLE IF NOT EXISTS public.club_subscriptions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         TEXT        NOT NULL UNIQUE,
  plan            TEXT        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','premium','elite')),
  status          TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','past_due','cancelled','trialing')),
  stripe_sub_id   TEXT,
  stripe_cus_id   TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_end       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_sub_club ON public.club_subscriptions(club_id);
CREATE INDEX IF NOT EXISTS idx_club_sub_plan ON public.club_subscriptions(plan, status);

-- RLS
ALTER TABLE public.club_subscriptions ENABLE ROW LEVEL SECURITY;

-- Lecture : club_admin de son club + admins
CREATE POLICY "club_sub_select"
  ON public.club_subscriptions FOR SELECT TO authenticated
  USING (
    club_id = (SELECT club_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  );

-- Écriture : admins uniquement (Stripe webhook via service role, ou admin manuel)
CREATE POLICY "club_sub_write"
  ON public.club_subscriptions FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','superadmin')
  );
