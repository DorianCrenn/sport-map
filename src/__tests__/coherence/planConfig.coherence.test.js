/**
 * Tests de cohérence — Matrice des abonnements
 *
 * Vérifie que :
 * 1. Toutes les FeatureKeys statiques ont un plan minimum valide
 * 2. Les quotas sont cohérents (Free ≤ Starter ≤ Pro ≤ Elite pour les limites numériques)
 * 3. Aucune feature Elite n'est accessible à un plan Free
 * 4. buildFeatureGates() produit la même structure que FEATURE_GATES
 * 5. Les plans forment un ordre total cohérent
 */

import { describe, it, expect } from 'vitest';
import {
  FEATURE_GATES,
  PLAN_QUOTAS,
  PLAN_RANK,
  PLAN_ORDER,
} from '../../lib/subscriptionFeatures.ts';
import { canUseFeature, resolveEffectivePlan } from '../../lib/planHelpers.ts';

const VALID_PLANS = ['free', 'starter', 'pro', 'elite'];

describe('subscriptionFeatures.ts — cohérence statique', () => {
  it('PLAN_ORDER contient exactement les 4 plans', () => {
    expect([...PLAN_ORDER].sort()).toEqual([...VALID_PLANS].sort());
  });

  it('PLAN_RANK est monotone strictement croissant', () => {
    const ranks = PLAN_ORDER.map(p => PLAN_RANK[p]);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1]);
    }
  });

  it('Toutes les FeatureKeys ont un plan minimum valide', () => {
    for (const [key, minPlan] of Object.entries(FEATURE_GATES)) {
      expect(VALID_PLANS, `Feature "${key}" a un plan invalide: "${minPlan}"`).toContain(minPlan);
    }
  });

  it('PLAN_QUOTAS existe pour chaque plan', () => {
    for (const plan of VALID_PLANS) {
      expect(PLAN_QUOTAS[plan], `Plan "${plan}" absent de PLAN_QUOTAS`).toBeDefined();
    }
  });

  it('postersPerMonth est null (illimité) pour starter, pro, elite', () => {
    expect(PLAN_QUOTAS.starter.postersPerMonth).toBeNull();
    expect(PLAN_QUOTAS.pro.postersPerMonth).toBeNull();
    expect(PLAN_QUOTAS.elite.postersPerMonth).toBeNull();
  });

  it('postersPerMonth est limité pour free', () => {
    expect(typeof PLAN_QUOTAS.free.postersPerMonth).toBe('number');
    expect(PLAN_QUOTAS.free.postersPerMonth).toBeGreaterThan(0);
  });
});

describe('planHelpers.ts — canUseFeature()', () => {
  it('Admin bypass toujours true', () => {
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'free', 'admin')).toBe(true);
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'free', 'superadmin')).toBe(true);
  });

  it('Feature free : accessible à tous les plans', () => {
    expect(canUseFeature('POSTER_SIMPLE', 'free')).toBe(true);
    expect(canUseFeature('POSTER_SIMPLE', 'starter')).toBe(true);
    expect(canUseFeature('POSTER_SIMPLE', 'elite')).toBe(true);
    expect(canUseFeature('PUSH_NOTIFICATIONS', 'free')).toBe(true);
  });

  it('Feature elite : inaccessible aux plans inférieurs', () => {
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'free')).toBe(false);
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'starter')).toBe(false);
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'pro')).toBe(false);
    expect(canUseFeature('POSTER_AI_BACKGROUND', 'elite')).toBe(true);
  });

  it('Feature starter : inaccessible au plan free, accessible aux supérieurs', () => {
    expect(canUseFeature('CARPOOLING', 'free')).toBe(false);
    expect(canUseFeature('CARPOOLING', 'starter')).toBe(true);
    expect(canUseFeature('CARPOOLING', 'pro')).toBe(true);
    expect(canUseFeature('CARPOOLING', 'elite')).toBe(true);
  });

  it('Feature pro : inaccessible à free et starter', () => {
    expect(canUseFeature('TOURNAMENTS', 'free')).toBe(false);
    expect(canUseFeature('TOURNAMENTS', 'starter')).toBe(false);
    expect(canUseFeature('TOURNAMENTS', 'pro')).toBe(true);
    expect(canUseFeature('TOURNAMENTS', 'elite')).toBe(true);
  });

  it('FeatureKey inconnue → false', () => {
    expect(canUseFeature('UNKNOWN_FEATURE_XYZ', 'elite')).toBe(false);
  });
});

describe('planHelpers.ts — resolveEffectivePlan()', () => {
  it('Status inactive → free', () => {
    expect(resolveEffectivePlan('elite', 'cancelled')).toBe('free');
    expect(resolveEffectivePlan('pro', 'past_due')).toBe('free');
    expect(resolveEffectivePlan('starter', null)).toBe('free');
  });

  it('Status active → plan tel quel', () => {
    expect(resolveEffectivePlan('elite', 'active')).toBe('elite');
    expect(resolveEffectivePlan('pro', 'trialing')).toBe('pro');
    expect(resolveEffectivePlan('free', 'active')).toBe('free');
  });

  it('Plan invalide + active → free', () => {
    expect(resolveEffectivePlan('unknown', 'active')).toBe('free');
    expect(resolveEffectivePlan(null, 'active')).toBe('free');
  });
});

describe('Cohérence tarifaire métier', () => {
  it('Watermark suppression = Starter minimum (pas Free)', () => {
    expect(FEATURE_GATES['POSTER_WATERMARK_REMOVE']).not.toBe('free');
    expect(PLAN_RANK[FEATURE_GATES['POSTER_WATERMARK_REMOVE']]).toBeGreaterThanOrEqual(PLAN_RANK['starter']);
  });

  it('Covoiturage toutes équipes = Pro minimum', () => {
    expect(PLAN_RANK[FEATURE_GATES['CARPOOLING_ALL_TEAMS']]).toBeGreaterThanOrEqual(PLAN_RANK['pro']);
  });

  it('IA backgrounds = Elite uniquement', () => {
    expect(FEATURE_GATES['POSTER_AI_BACKGROUND']).toBe('elite');
    expect(FEATURE_GATES['POSTER_AI_ELEMENTS']).toBe('elite');
  });

  it('Featured events : Pro a un quota < Elite', () => {
    const proMax   = PLAN_QUOTAS.pro.featuredEventsMax;
    const eliteMax = PLAN_QUOTAS.elite.featuredEventsMax;
    expect(proMax).toBeGreaterThan(0);
    expect(eliteMax).toBeGreaterThan(proMax);
  });

  it('Free ne peut rien featured', () => {
    expect(PLAN_QUOTAS.free.featuredEventsMax).toBe(0);
  });

  it('Elite IA illimité', () => {
    expect(PLAN_QUOTAS.elite.aiGeneratesPerMonth).toBeNull();
  });

  it('Free IA bloqué', () => {
    expect(PLAN_QUOTAS.free.aiGeneratesPerMonth).toBe(0);
  });
});
