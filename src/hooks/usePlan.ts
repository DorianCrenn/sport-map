import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { PLAN_TIERS, canUse, isUpgradeable, nextPlan } from '../lib/plans.js';
import type { PlanId } from '../types/sportlink.js';

export function usePlan() {
  const { currentUser } = useAuth();
  const planId = (currentUser?.plan ?? 'free') as PlanId;

  return useMemo(() => ({
    planId,
    plan: (PLAN_TIERS as Record<string, unknown>)[planId] ?? (PLAN_TIERS as Record<string, unknown>).free,
    canUse: (feature: string) => canUse(feature, planId),
    isUpgradeable: isUpgradeable(planId),
    nextPlanId: nextPlan(planId),
    nextPlan: (PLAN_TIERS as Record<string, unknown>)[nextPlan(planId) as string] ?? null,
  }), [planId]);
}
