import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PLAN_TIERS, canUse, isUpgradeable, nextPlan } from '../lib/plans.js';

export function usePlan() {
  const { currentUser } = useAuth();
  const planId = currentUser?.plan ?? 'free';

  return useMemo(() => ({
    planId,
    plan: PLAN_TIERS[planId] ?? PLAN_TIERS.free,
    canUse: (feature) => canUse(feature, planId),
    isUpgradeable: isUpgradeable(planId),
    nextPlanId: nextPlan(planId),
    nextPlan: PLAN_TIERS[nextPlan(planId)] ?? null,
  }), [planId]);
}
