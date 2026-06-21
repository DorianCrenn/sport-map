import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { useClubPlan } from './useClubPlan.js';
import { usePlanConfig } from './usePlanConfig.js';
import {
  isAdminRole,
  resolveEffectivePlan,
  nextPlanId,
  getPlanMeta,
  getRemainingQuota,
  isOverQuota,
} from '../lib/planHelpers.js';

export function useClubFeatures(clubId: string | null | undefined) {
  const { currentUser } = useAuth();
  const {
    plan: rawPlan,
    status,
    loading: planLoading,
    isTrial,
    periodEnd,
    carpoolAllowedTeamId,
  } = useClubPlan(clubId);

  const {
    loading:      configLoading,
    canUseFeature: canUseDB,
    getQuotas:    getQuotasDB,
  } = usePlanConfig();

  const loading = planLoading || configLoading;

  return useMemo(() => {
    const role    = currentUser?.role;
    const isAdmin = isAdminRole(role);

    const effectivePlan = isAdmin
      ? 'elite'
      : resolveEffectivePlan(rawPlan, status);

    const can = (feature: string): boolean => {
      if (isAdmin) return true;
      return canUseDB(feature, effectivePlan);
    };

    const quotas   = getQuotasDB(effectivePlan);
    const meta     = getPlanMeta(effectivePlan);
    const next     = nextPlanId(effectivePlan);

    return {
      planId:       effectivePlan,
      planMeta:     meta,
      isTrial,
      periodEnd,
      loading,
      can,
      quotas,
      remaining: (quota: string, used: number) => getRemainingQuota(used, (quotas as Record<string, number>)[quota] ?? null),
      overQuota: (quota: string, used: number) => isOverQuota(used, (quotas as Record<string, number>)[quota] ?? null),
      carpoolAllowedTeamId,
      nextPlanId:    next,
      nextPlanMeta:  next ? getPlanMeta(next) : null,
      isUpgradeable: next !== null,
      isStarter: ['starter', 'pro', 'elite'].includes(effectivePlan),
      isPro:     ['pro', 'elite'].includes(effectivePlan),
      isElite:   effectivePlan === 'elite',
      isAdmin,
    };
  }, [currentUser?.role, rawPlan, status, loading, isTrial, periodEnd, carpoolAllowedTeamId, canUseDB, getQuotasDB]);
}
