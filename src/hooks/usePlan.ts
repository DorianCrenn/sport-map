import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { PLAN_TIERS, canUse, isUpgradeable, nextPlan } from '../lib/plans.js';
import type { PlanId } from '../types/sportlink.js';

export function usePlan() {
  const { currentUser } = useAuth();
  const planId = (currentUser?.plan ?? 'free') as PlanId;

  return useMemo(() => {
    const nId = nextPlan(planId);
    return {
      planId,
      plan: PLAN_TIERS[planId] ?? PLAN_TIERS.free,
      canUse: (feature: string) => canUse(feature, planId),
      isUpgradeable: isUpgradeable(planId),
      nextPlanId: nId,
      nextPlan: nId ? PLAN_TIERS[nId] : null,
    };
  }, [planId]);
}
