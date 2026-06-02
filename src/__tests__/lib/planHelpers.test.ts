import { describe, it, expect } from 'vitest';
import {
  isAdminRole,
  resolveEffectivePlan,
  canUseFeature,
  requiredPlanFor,
  getQuotas,
  isOverQuota,
  getRemainingQuota,
  nextPlanId,
  isUpgradeable,
  isPlanAtLeast,
  getPlanMeta,
} from '../../lib/planHelpers';

// ── isAdminRole ───────────────────────────────────────────────────────────────

describe('isAdminRole', () => {
  it('retourne true pour admin', () => expect(isAdminRole('admin')).toBe(true));
  it('retourne true pour superadmin', () => expect(isAdminRole('superadmin')).toBe(true));
  it('retourne false pour club_admin', () => expect(isAdminRole('club_admin')).toBe(false));
  it('retourne false pour user', () => expect(isAdminRole('user')).toBe(false));
  it('retourne false pour null', () => expect(isAdminRole(null)).toBe(false));
  it('retourne false pour undefined', () => expect(isAdminRole(undefined)).toBe(false));
  it('retourne false pour chaîne vide', () => expect(isAdminRole('')).toBe(false));
});

// ── resolveEffectivePlan ──────────────────────────────────────────────────────

describe('resolveEffectivePlan', () => {
  it('retourne le plan si status=active', () => {
    expect(resolveEffectivePlan('pro', 'active')).toBe('pro');
  });
  it('retourne le plan si status=trialing', () => {
    expect(resolveEffectivePlan('starter', 'trialing')).toBe('starter');
  });
  it('retourne free si status=expired', () => {
    expect(resolveEffectivePlan('pro', 'expired')).toBe('free');
  });
  it('retourne free si status=null', () => {
    expect(resolveEffectivePlan('elite', null)).toBe('free');
  });
  it('retourne free si plan est invalide mais status=active', () => {
    expect(resolveEffectivePlan('invalid_plan', 'active')).toBe('free');
  });
  it('retourne free si plan=null et status=active', () => {
    expect(resolveEffectivePlan(null, 'active')).toBe('free');
  });
  it('élite actif reste élite', () => {
    expect(resolveEffectivePlan('elite', 'active')).toBe('elite');
  });
});

// ── canUseFeature ─────────────────────────────────────────────────────────────

describe('canUseFeature', () => {
  it('free peut utiliser POSTER_SIMPLE', () => {
    expect(canUseFeature('POSTER_SIMPLE', 'free')).toBe(true);
  });
  it('free ne peut pas enlever le watermark', () => {
    expect(canUseFeature('POSTER_WATERMARK_REMOVE', 'free')).toBe(false);
  });
  it('pro peut enlever le watermark', () => {
    expect(canUseFeature('POSTER_WATERMARK_REMOVE', 'pro')).toBe(true);
  });
  it('elite peut tout faire', () => {
    expect(canUseFeature('POSTER_AI_BRANDING', 'elite')).toBe(true);
  });
  it('admin bypasse toujours le gate', () => {
    expect(canUseFeature('POSTER_WATERMARK_REMOVE', 'free', 'admin')).toBe(true);
  });
  it('superadmin bypasse aussi', () => {
    expect(canUseFeature('POSTER_AI_BRANDING', 'free', 'superadmin')).toBe(true);
  });
  it('feature inconnue → false', () => {
    // @ts-expect-error testing unknown key
    expect(canUseFeature('UNKNOWN_FEATURE', 'elite')).toBe(false);
  });
  it('starter peut utiliser POSTER_EXPERT', () => {
    expect(canUseFeature('POSTER_EXPERT', 'starter')).toBe(true);
  });
});

// ── requiredPlanFor ───────────────────────────────────────────────────────────

describe('requiredPlanFor', () => {
  it('retourne un PlanId valide pour POSTER_WATERMARK_REMOVE', () => {
    const plan = requiredPlanFor('POSTER_WATERMARK_REMOVE');
    expect(['free', 'starter', 'pro', 'elite']).toContain(plan);
  });
  it('POSTER_SIMPLE est disponible sur free', () => {
    expect(requiredPlanFor('POSTER_SIMPLE')).toBe('free');
  });
});

// ── getQuotas ─────────────────────────────────────────────────────────────────

describe('getQuotas', () => {
  it('retourne un objet quotas pour free', () => {
    const q = getQuotas('free');
    expect(q).toBeDefined();
    expect(typeof q).toBe('object');
  });
  it('les quotas elite ont plus d\'affiches (null=illimité) que free', () => {
    const free = getQuotas('free');
    const elite = getQuotas('elite');
    // free a 3 affiches/mois, elite a null (illimité)
    expect(elite.postersPerMonth === null || elite.postersPerMonth >= (free.postersPerMonth ?? 0)).toBe(true);
  });
  it('elite a plus de featured events max que free', () => {
    const free = getQuotas('free');
    const elite = getQuotas('elite');
    expect(elite.featuredEventsMax).toBeGreaterThanOrEqual(free.featuredEventsMax);
  });
  it('retourne les quotas free pour un plan inconnu', () => {
    // @ts-expect-error testing invalid plan
    const q = getQuotas('invalid');
    expect(q).toEqual(getQuotas('free'));
  });
});

// ── isOverQuota ───────────────────────────────────────────────────────────────

describe('isOverQuota', () => {
  it('false si limit=null (illimité)', () => expect(isOverQuota(9999, null)).toBe(false));
  it('false si used < limit', () => expect(isOverQuota(4, 5)).toBe(false));
  it('true si used === limit', () => expect(isOverQuota(5, 5)).toBe(true));
  it('true si used > limit', () => expect(isOverQuota(6, 5)).toBe(true));
  it('false si used=0 et limit=0 (interprété : 0>=0 → true)', () => expect(isOverQuota(0, 0)).toBe(true));
});

// ── getRemainingQuota ─────────────────────────────────────────────────────────

describe('getRemainingQuota', () => {
  it('null si limit=null', () => expect(getRemainingQuota(5, null)).toBeNull());
  it('retourne la différence', () => expect(getRemainingQuota(3, 10)).toBe(7));
  it('jamais négatif', () => expect(getRemainingQuota(15, 10)).toBe(0));
  it('0 si used === limit', () => expect(getRemainingQuota(10, 10)).toBe(0));
});

// ── nextPlanId ────────────────────────────────────────────────────────────────

describe('nextPlanId', () => {
  it('free → starter', () => expect(nextPlanId('free')).toBe('starter'));
  it('starter → pro', () => expect(nextPlanId('starter')).toBe('pro'));
  it('pro → elite', () => expect(nextPlanId('pro')).toBe('elite'));
  it('elite → null (pas de plan suivant)', () => expect(nextPlanId('elite')).toBeNull());
});

// ── isUpgradeable ─────────────────────────────────────────────────────────────

describe('isUpgradeable', () => {
  it('free est upgradeable', () => expect(isUpgradeable('free')).toBe(true));
  it('starter est upgradeable', () => expect(isUpgradeable('starter')).toBe(true));
  it('elite n\'est pas upgradeable', () => expect(isUpgradeable('elite')).toBe(false));
});

// ── isPlanAtLeast ─────────────────────────────────────────────────────────────

describe('isPlanAtLeast', () => {
  it('pro >= pro', () => expect(isPlanAtLeast('pro', 'pro')).toBe(true));
  it('elite >= pro', () => expect(isPlanAtLeast('elite', 'pro')).toBe(true));
  it('starter < pro', () => expect(isPlanAtLeast('starter', 'pro')).toBe(false));
  it('free < starter', () => expect(isPlanAtLeast('free', 'starter')).toBe(false));
});

// ── getPlanMeta ───────────────────────────────────────────────────────────────

describe('getPlanMeta', () => {
  it('retourne les métadonnées du plan free', () => {
    const meta = getPlanMeta('free');
    expect(meta.name).toBeTruthy();
    expect(typeof meta.price).toBe('number');
  });
  it('elite a le badge 👑', () => {
    expect(getPlanMeta('elite').badge).toBe('👑');
  });
  it('retourne les métadonnées free pour un plan inconnu', () => {
    // @ts-expect-error testing invalid plan
    expect(getPlanMeta('unknown')).toEqual(getPlanMeta('free'));
  });
});
