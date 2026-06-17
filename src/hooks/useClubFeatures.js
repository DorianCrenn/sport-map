import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubPlan } from './useClubPlan.js';
import { usePlanConfig } from './usePlanConfig.js';
import {
  isAdminRole,
  resolveEffectivePlan,
  nextPlanId,
  getPlanMeta,
  getRemainingQuota,
  isOverQuota,
} from '../lib/planHelpers.ts';

/**
 * useClubFeatures — Hook principal de feature gating pour un club.
 *
 * Source de vérité : plan_features_config + plan_quotas_config (DB).
 * Fallback automatique sur subscriptionFeatures.ts si la DB est indisponible.
 *
 * @param {string | null | undefined} clubId
 */
export function useClubFeatures(clubId) {
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

    // canUseFeature : utilise la config DB si chargée, sinon les helpers statiques
    const can = (feature) => {
      if (isAdmin) return true;
      return canUseDB(feature, effectivePlan);
    };

    const quotas   = getQuotasDB(effectivePlan);
    const meta     = getPlanMeta(effectivePlan);
    const next     = nextPlanId(effectivePlan);

    return {
      // ── Plan info ────────────────────────────────────────────────────────────
      planId:       effectivePlan,
      planMeta:     meta,
      isTrial,
      periodEnd,
      loading,

      // ── Feature gate principal (DB-driven) ───────────────────────────────────
      can,

      // ── Quotas (DB-driven) ───────────────────────────────────────────────────
      quotas,

      remaining: (quota, used) => getRemainingQuota(used, quotas[quota] ?? null),
      overQuota: (quota, used) => isOverQuota(used, quotas[quota] ?? null),

      // ── Covoiturage Starter ──────────────────────────────────────────────────
      carpoolAllowedTeamId,

      // ── Upgrade ─────────────────────────────────────────────────────────────
      nextPlanId:    next,
      nextPlanMeta:  next ? getPlanMeta(next) : null,
      isUpgradeable: next !== null,

      // ── Shortcuts ────────────────────────────────────────────────────────────
      isStarter: ['starter', 'pro', 'elite'].includes(effectivePlan),
      isPro:     ['pro', 'elite'].includes(effectivePlan),
      isElite:   effectivePlan === 'elite',
      isAdmin,
    };
  }, [currentUser?.role, rawPlan, status, loading, isTrial, periodEnd, carpoolAllowedTeamId, canUseDB, getQuotasDB]);
}
