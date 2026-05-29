import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const PLAN_RANK = { free: 0, premium: 1, elite: 2 };

/**
 * Retourne le plan actif d'un club.
 * Fallback : 'free' si aucune entrée en DB.
 */
export function useClubPlan(clubId) {
  const [sub, setSub]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from('club_subscriptions')
      .select('plan, status, current_period_end, trial_end')
      .eq('club_id', String(clubId))
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setSub(data);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [clubId]);

  const plan = sub?.status === 'active' || sub?.status === 'trialing'
    ? (sub?.plan ?? 'free')
    : 'free';

  return {
    plan,
    loading,
    isPremium: PLAN_RANK[plan] >= PLAN_RANK.premium,
    isElite:   PLAN_RANK[plan] >= PLAN_RANK.elite,
    isTrial:   sub?.status === 'trialing',
    periodEnd: sub?.current_period_end ?? null,
  };
}
