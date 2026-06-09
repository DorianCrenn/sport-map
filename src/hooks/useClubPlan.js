import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

// Tiers alignés sur subscriptionFeatures.ts : free / starter / pro / elite.
// 'premium' conservé pour la fenêtre de transition DB → code (migration 20260603).
const PLAN_RANK = { free: 0, starter: 1, premium: 1, pro: 2, elite: 3 };

/**
 * Retourne le plan actif d'un club depuis club_subscriptions.
 * Fallback : 'free' si aucune entrée ou statut non-actif.
 */
export function useClubPlan(clubId) {
  const [sub, setSub]         = useState(null);
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
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setSub(data);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [clubId]);

  const status   = sub?.status ?? null;
  const isActive = status === 'active' || status === 'trialing';
  const plan     = isActive ? (sub?.plan ?? 'free') : 'free';

  return {
    plan,
    status,
    loading,
    // Backward compat — isPremium = Starter+ | isElite = Elite uniquement
    isPremium: PLAN_RANK[plan] >= PLAN_RANK.starter,
    isElite:   PLAN_RANK[plan] >= PLAN_RANK.elite,
    isTrial:   status === 'trialing',
    periodEnd: sub?.current_period_end ?? null,
    // Covoiturage Starter : équipe autorisée
    carpoolAllowedTeamId: sub?.carpool_allowed_team_id ?? null,
  };
}
