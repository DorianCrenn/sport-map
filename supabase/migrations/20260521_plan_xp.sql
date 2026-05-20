-- ============================================================
-- Migration: Add plan + xp columns to profiles
-- Stripe preparation — no payment integration yet
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'federation')),
  ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0;

-- Index for leaderboard queries (ORDER BY xp DESC)
CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles (xp DESC);

-- RLS: users can update their own xp/plan fields (plan set server-side in production)
-- For now, allow self-update of xp (will be restricted to service_role when Stripe is live)
-- Existing update policy on profiles already covers this via "Users update own profile"
