import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, premium: 1, pro: 2, elite: 3 };

interface ClubPlanSubscription {
  plan?: string;
  status?: string;
  current_period_end?: string | null;
  trial_end?: string | null;
  carpool_allowed_team_id?: string | null;
}

interface UseClubPlanResult {
  plan: string;
  status: string | null;
  loading: boolean;
  isPremium: boolean;
  isElite: boolean;
  isTrial: boolean;
  periodEnd: string | null;
  carpoolAllowedTeamId: string | null;
}

export function useClubPlan(clubId: string | null | undefined): UseClubPlanResult {
  const [sub, setSub]         = useState<ClubPlanSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from('club_subscriptions')
      .select('plan, status, current_period_end, trial_end, carpool_allowed_team_id')
      .eq('club_id', String(clubId))
      .maybeSingle()
      .then(({ data, error }: { data: ClubPlanSubscription | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (!error) setSub(data);
        setLoading(false);
      },
        () => { if (!cancelled) setLoading(false); }
      );

    return () => { cancelled = true; };
  }, [clubId]);

  const status   = sub?.status ?? null;
  const isActive = status === 'active' || status === 'trialing';
  const plan     = isActive ? (sub?.plan ?? 'free') : 'free';

  return {
    plan,
    status,
    loading,
    isPremium:            PLAN_RANK[plan] >= PLAN_RANK.starter,
    isElite:              PLAN_RANK[plan] >= PLAN_RANK.elite,
    isTrial:              status === 'trialing',
    periodEnd:            sub?.current_period_end ?? null,
    carpoolAllowedTeamId: sub?.carpool_allowed_team_id ?? null,
  };
}
