import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubPlan } from './useClubPlan.js';
import {
  canUseFeature,
  getQuotas,
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
 * Combine le plan Supabase du club et le rôle de l'utilisateur courant.
 * Les admins/superadmins ont accès à toutes les features (plan effectif = 'elite').
 *
 * @param {string | null | undefined} clubId
 *
 * @example
 * const features = useClubFeatures(club.id);
 * if (!features.can('CARPOOLING')) return <PlanGate ... />;
 */
export function useClubFeatures(clubId) {
  const { currentUser } = useAuth();
  const {
    plan: rawPlan,
    status,
    loading,
    isTrial,
    periodEnd,
    carpoolAllowedTeamId,
  } = useClubPlan(clubId);

  return useMemo(() => {
    const role    = currentUser?.role;
    const isAdmin = isAdminRole(role);

    // Les admins obtiennent le plan effectif maximum
    const effectivePlan = isAdmin
      ? 'elite'
      : resolveEffectivePlan(rawPlan, status);

    const quotas = getQuotas(effectivePlan);
    const meta   = getPlanMeta(effectivePlan);
    const next   = nextPlanId(effectivePlan);

    return {
      // ── Plan info ──────────────────────────────────────────────────────────
      planId:       effectivePlan,
      planMeta:     meta,
      isTrial,
      periodEnd,
      loading,

      // ── Feature gate principal ─────────────────────────────────────────────
      /**
       * @param {import('../lib/subscriptionFeatures.ts').FeatureKey} feature
       * @returns {boolean}
       */
      can: (feature) => canUseFeature(feature, effectivePlan, role),

      // ── Quotas ─────────────────────────────────────────────────────────────
      quotas,

      /** Nombre restant pour un quota (null = illimité) */
      remaining: (quota, used) => getRemainingQuota(used, quotas[quota]),

      /** True si le quota est dépassé */
      overQuota: (quota, used) => isOverQuota(used, quotas[quota]),

      // ── Covoiturage Starter ─────────────────────────────────────────────────
      carpoolAllowedTeamId,

      // ── Upgrade ────────────────────────────────────────────────────────────
      nextPlanId:    next,
      nextPlanMeta:  next ? getPlanMeta(next) : null,
      isUpgradeable: next !== null,

      // ── Shortcuts lisibles (remplacent isPremium / isElite) ────────────────
      isStarter: ['starter', 'pro', 'elite'].includes(effectivePlan),
      isPro:     ['pro', 'elite'].includes(effectivePlan),
      isElite:   effectivePlan === 'elite',
      isAdmin,
    };
  }, [currentUser?.role, rawPlan, status, loading, isTrial, periodEnd, carpoolAllowedTeamId]);
}
