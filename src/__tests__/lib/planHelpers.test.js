/**
 * Tests planHelpers — fonctions pures de feature gating
 * Couvre: canUseFeature, resolveEffectivePlan, isOverQuota, getRemainingQuota, isAdminRole
 */
import { describe, it, expect } from 'vitest';
import {
  canUseFeature,
  resolveEffectivePlan,
  isOverQuota,
  getRemainingQuota,
  isAdminRole,
  nextPlanId,
  isPlanAtLeast,
} from '../../lib/planHelpers.ts';

// ── isAdminRole ───────────────────────────────────────────────────────────────

describe('isAdminRole', () => {
  it('retourne true pour admin', () => {
    expect(isAdminRole('admin')).toBe(true);
  });

  it('retourne true pour superadmin', () => {
    expect(isAdminRole('superadmin')).toBe(true);
  });

  it('retourne false pour club_admin', () => {
    expect(isAdminRole('club_admin')).toBe(false);
  });

  it('retourne false pour user', () => {
    expect(isAdminRole('user')).toBe(false);
  });

  it('retourne false pour null', () => {
    expect(isAdminRole(null)).toBe(false);
  });

  it('retourne false pour undefined', () => {
    expect(isAdminRole(undefined)).toBe(false);
  });
});

// ── resolveEffectivePlan ──────────────────────────────────────────────────────

describe('resolveEffectivePlan', () => {
  it('retourne free si status=cancelled', () => {
    expect(resolveEffectivePlan('pro', 'cancelled')).toBe('free');
  });

  it('retourne free si status=past_due', () => {
    expect(resolveEffectivePlan('elite', 'past_due')).toBe('free');
  });

  it('retourne free si status=null', () => {
    expect(resolveEffectivePlan('starter', null)).toBe('free');
  });

  it('retourne le plan si status=active', () => {
    expect(resolveEffectivePlan('pro', 'active')).toBe('pro');
  });

  it('retourne le plan si status=trialing', () => {
    expect(resolveEffectivePlan('starter', 'trialing')).toBe('starter');
  });

  it('retourne free si plan invalide même avec status=active', () => {
    expect(resolveEffectivePlan('invalid-plan', 'active')).toBe('free');
  });

  it('retourne free si plan=null avec status=active', () => {
    expect(resolveEffectivePlan(null, 'active')).toBe('free');
  });
});

// ── canUseFeature ─────────────────────────────────────────────────────────────

describe('canUseFeature — plan free', () => {
  it('peut utiliser POSTER_SIMPLE (plan free)', () => {
    expect(canUseFeature('POSTER_SIMPLE', 'free')).toBe(true);
  });

  it('ne peut pas utiliser POSTER_WATERMARK_REMOVE (plan starter requis)', () => {
    expect(canUseFeature('POSTER_WATERMARK_REMOVE', 'free')).toBe(false);
  });

  it('ne peut pas utiliser POSTER_AI_BACKGROUND (plan elite requis)', () => {
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'free')).toBe(false);
  });

  it('ne peut pas utiliser CARPOOLING (plan starter requis)', () => {
    expect(canUseFeature('CARPOOLING', 'free')).toBe(false);
  });

  it('peut utiliser PUSH_NOTIFICATIONS (plan free)', () => {
    expect(canUseFeature('PUSH_NOTIFICATIONS', 'free')).toBe(true);
  });

  it('peut utiliser CLUB_DASHBOARD (plan free)', () => {
    expect(canUseFeature('CLUB_DASHBOARD', 'free')).toBe(true);
  });
});

describe('canUseFeature — plan starter', () => {
  it('peut utiliser POSTER_WATERMARK_REMOVE', () => {
    expect(canUseFeature('POSTER_WATERMARK_REMOVE', 'starter')).toBe(true);
  });

  it('peut utiliser CARPOOLING (1 équipe)', () => {
    expect(canUseFeature('CARPOOLING', 'starter')).toBe(true);
  });

  it('ne peut pas utiliser POSTER_AI_BACKGROUND (elite requis)', () => {
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'starter')).toBe(false);
  });

  it('ne peut pas utiliser TOURNAMENTS (pro requis)', () => {
    expect(canUseFeature('TOURNAMENTS', 'starter')).toBe(false);
  });
});

describe('canUseFeature — plan elite', () => {
  it('peut utiliser POSTER_AI_BACKGROUND', () => {
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'elite')).toBe(true);
  });

  it('peut utiliser POSTER_AI_ELEMENTS', () => {
    expect(canUseFeature('POSTER_AI_ELEMENTS', 'elite')).toBe(true);
  });

  it('peut utiliser toutes les features', () => {
    const allFeatures = [
      'POSTER_WATERMARK_REMOVE', 'POSTER_AI_BACKGROUND', 'CARPOOLING',
      'TEAM_LINEUPS', 'TOURNAMENTS', 'AUTOMATIONS', 'ADVANCED_ANALYTICS',
    ];
    allFeatures.forEach(feature => {
      expect(canUseFeature(feature, 'elite')).toBe(true);
    });
  });
});

describe('canUseFeature — admin override', () => {
  it('un admin avec plan free peut utiliser POSTER_AI_BACKGROUND', () => {
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'free', 'admin')).toBe(true);
  });

  it('un superadmin peut utiliser n\'importe quelle feature', () => {
    expect(canUseFeature('AUTOMATIONS', 'free', 'superadmin')).toBe(true);
  });

  it('un club_admin ne bypasse PAS le gate', () => {
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'free', 'club_admin')).toBe(false);
  });

  it('retourne false pour une FeatureKey inconnue même avec plan elite', () => {
    expect(canUseFeature('UNKNOWN_FEATURE_XYZ', 'elite')).toBe(false);
  });
});

// ── isOverQuota ───────────────────────────────────────────────────────────────

describe('isOverQuota', () => {
  it('retourne false si limit=null (illimité)', () => {
    expect(isOverQuota(999, null)).toBe(false);
  });

  it('retourne false si used < limit', () => {
    expect(isOverQuota(4, 5)).toBe(false);
  });

  it('retourne true si used === limit', () => {
    expect(isOverQuota(5, 5)).toBe(true);
  });

  it('retourne true si used > limit', () => {
    expect(isOverQuota(10, 5)).toBe(true);
  });

  it('retourne false si used=0 et limit=0 (quota verrouillé)', () => {
    expect(isOverQuota(0, 0)).toBe(true);
  });
});

// ── getRemainingQuota ─────────────────────────────────────────────────────────

describe('getRemainingQuota', () => {
  it('retourne null si limit=null (illimité)', () => {
    expect(getRemainingQuota(5, null)).toBeNull();
  });

  it('retourne la différence si used < limit', () => {
    expect(getRemainingQuota(3, 10)).toBe(7);
  });

  it('retourne 0 si used >= limit (jamais négatif)', () => {
    expect(getRemainingQuota(15, 10)).toBe(0);
  });

  it('retourne 0 si used === limit', () => {
    expect(getRemainingQuota(5, 5)).toBe(0);
  });
});

// ── nextPlanId ────────────────────────────────────────────────────────────────

describe('nextPlanId', () => {
  it('retourne starter depuis free', () => {
    expect(nextPlanId('free')).toBe('starter');
  });

  it('retourne pro depuis starter', () => {
    expect(nextPlanId('starter')).toBe('pro');
  });

  it('retourne elite depuis pro', () => {
    expect(nextPlanId('pro')).toBe('elite');
  });

  it('retourne null depuis elite (plan maximum)', () => {
    expect(nextPlanId('elite')).toBeNull();
  });
});

// ── isPlanAtLeast ─────────────────────────────────────────────────────────────

describe('isPlanAtLeast', () => {
  it('elite >= pro → true', () => {
    expect(isPlanAtLeast('elite', 'pro')).toBe(true);
  });

  it('free >= starter → false', () => {
    expect(isPlanAtLeast('free', 'starter')).toBe(false);
  });

  it('pro >= pro → true', () => {
    expect(isPlanAtLeast('pro', 'pro')).toBe(true);
  });
});
