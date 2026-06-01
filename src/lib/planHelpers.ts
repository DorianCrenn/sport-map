// ─────────────────────────────────────────────────────────────────────────────
// planHelpers.ts — Fonctions pures de feature gating
//
// Pas de dépendance React. Utilisable dans les hooks, les tests, et côté serveur.
// ─────────────────────────────────────────────────────────────────────────────

import {
  PLAN_RANK,
  PLAN_ORDER,
  PLAN_META,
  PLAN_QUOTAS,
  FEATURE_GATES,
} from './subscriptionFeatures';
import type { PlanId, FeatureKey, PlanQuotas } from './subscriptionFeatures';

// ── Rôles admin ───────────────────────────────────────────────────────────────

const ADMIN_ROLES = ['admin', 'superadmin'] as const;

export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as never);
}

// ── Résolution du plan effectif ───────────────────────────────────────────────

/**
 * Retourne le PlanId effectif en tenant compte du statut de subscription.
 * Un statut autre que 'active' ou 'trialing' → retourne 'free'.
 */
export function resolveEffectivePlan(
  plan: string | null | undefined,
  status: string | null | undefined,
): PlanId {
  const isActive = status === 'active' || status === 'trialing';
  if (!isActive) return 'free';
  return (PLAN_ORDER.includes(plan as PlanId) ? plan : 'free') as PlanId;
}

// ── Feature gating ────────────────────────────────────────────────────────────

/**
 * Vérifie si un plan peut utiliser une feature.
 * Les admins/superadmins bypassent toujours le gate.
 */
export function canUseFeature(
  feature: FeatureKey,
  planId: PlanId,
  role?: string | null,
): boolean {
  if (isAdminRole(role)) return true;
  const required = FEATURE_GATES[feature];
  if (!required) {
    if (typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
      console.warn(`[planHelpers] FeatureKey inconnue: "${feature}" — accès refusé par défaut`);
    }
    return false;
  }
  return PLAN_RANK[planId] >= PLAN_RANK[required];
}

/**
 * Retourne le plan minimum requis pour accéder à une feature.
 */
export function requiredPlanFor(feature: FeatureKey): PlanId {
  return FEATURE_GATES[feature] ?? 'elite';
}

// ── Quotas ────────────────────────────────────────────────────────────────────

export function getQuotas(planId: PlanId): PlanQuotas {
  return PLAN_QUOTAS[planId] ?? PLAN_QUOTAS.free;
}

/**
 * Vérifie si une utilisation dépasse le quota.
 * null = illimité → toujours false.
 */
export function isOverQuota(used: number, limit: number | null): boolean {
  return limit !== null && used >= limit;
}

/**
 * Nombre d'utilisations restantes pour un quota.
 * null = illimité.
 */
export function getRemainingQuota(used: number, limit: number | null): number | null {
  if (limit === null) return null;
  return Math.max(0, limit - used);
}

// ── Navigation entre plans ────────────────────────────────────────────────────

export function nextPlanId(planId: PlanId): PlanId | null {
  const idx = PLAN_ORDER.indexOf(planId);
  return idx >= 0 && idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null;
}

export function isUpgradeable(planId: PlanId): boolean {
  return nextPlanId(planId) !== null;
}

export function getPlanMeta(planId: PlanId) {
  return PLAN_META[planId] ?? PLAN_META.free;
}

export function isPlanAtLeast(current: PlanId, minimum: PlanId): boolean {
  return PLAN_RANK[current] >= PLAN_RANK[minimum];
}

// ── Backward compat — remplace l'ancienne API de plans.js ────────────────────

/** @deprecated Utiliser canUseFeature() avec FeatureKey typée */
export function canUse(feature: string, plan: string): boolean {
  return canUseFeature(feature as FeatureKey, plan as PlanId);
}
