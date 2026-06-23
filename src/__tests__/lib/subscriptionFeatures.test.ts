import { describe, it, expect } from 'vitest';
import {
  PLAN_RANK,
  PLAN_ORDER,
  PLAN_META,
  FEATURE_GATES,
  PLAN_QUOTAS,
  type PlanId,
  type FeatureKey,
} from '../../lib/subscriptionFeatures.js';

describe('PLAN_RANK', () => {
  it('free < starter < pro < elite', () => {
    expect(PLAN_RANK.free).toBeLessThan(PLAN_RANK.starter);
    expect(PLAN_RANK.starter).toBeLessThan(PLAN_RANK.pro);
    expect(PLAN_RANK.pro).toBeLessThan(PLAN_RANK.elite);
  });

  it('les 4 plans sont définis', () => {
    const plans: PlanId[] = ['free', 'starter', 'pro', 'elite'];
    plans.forEach(p => expect(PLAN_RANK[p]).toBeTypeOf('number'));
  });
});

describe('PLAN_ORDER', () => {
  it('ordre correct free→elite', () => {
    expect(PLAN_ORDER).toEqual(['free', 'starter', 'pro', 'elite']);
  });
});

describe('PLAN_META', () => {
  it('chaque plan a name, price, color, badge', () => {
    const plans: PlanId[] = ['free', 'starter', 'pro', 'elite'];
    plans.forEach(p => {
      const m = PLAN_META[p];
      expect(m.name).toBeTruthy();
      expect(typeof m.price).toBe('number');
      expect(m.color).toBeTruthy();
      expect(m.badge).toBeTruthy();
    });
  });

  it('free est gratuit (price=0)', () => {
    expect(PLAN_META.free.price).toBe(0);
  });

  it('les prix croissent avec le plan', () => {
    expect(PLAN_META.starter.price).toBeLessThan(PLAN_META.pro.price);
    expect(PLAN_META.pro.price).toBeLessThan(PLAN_META.elite.price);
  });
});

describe('FEATURE_GATES', () => {
  it('POSTER_SIMPLE est disponible en free', () => {
    expect(FEATURE_GATES.POSTER_SIMPLE).toBe('free');
  });

  it('fonctionnalités IA réservées à elite', () => {
    const eliteFeatures: FeatureKey[] = ['POSTER_AI_BACKGROUND', 'POSTER_AI_ELEMENTS', 'ADVANCED_AI', 'ADVANCED_ANALYTICS'];
    eliteFeatures.forEach(f => expect(FEATURE_GATES[f]).toBe('elite'));
  });

  it('fonctionnalités pro disponibles en pro', () => {
    const proFeatures: FeatureKey[] = ['TEAM_LINEUPS', 'PLAYER_STATS', 'TOURNAMENTS'];
    proFeatures.forEach(f => expect(FEATURE_GATES[f]).toBe('pro'));
  });

  it('PUSH_NOTIFICATIONS est gratuit', () => {
    expect(FEATURE_GATES.PUSH_NOTIFICATIONS).toBe('free');
  });

  it('chaque gate pointe vers un plan valide', () => {
    const validPlans = new Set<PlanId>(['free', 'starter', 'pro', 'elite']);
    Object.values(FEATURE_GATES).forEach(plan => {
      expect(validPlans.has(plan as PlanId)).toBe(true);
    });
  });

  it('un plan peut accéder à une feature si PLAN_RANK[plan] >= PLAN_RANK[gate]', () => {
    const canAccess = (plan: PlanId, feature: FeatureKey): boolean =>
      PLAN_RANK[plan] >= PLAN_RANK[FEATURE_GATES[feature]];

    expect(canAccess('elite', 'POSTER_AI_BACKGROUND')).toBe(true);
    expect(canAccess('pro',   'POSTER_AI_BACKGROUND')).toBe(false);
    expect(canAccess('free',  'POSTER_SIMPLE')).toBe(true);
    expect(canAccess('starter', 'POSTER_EXPERT')).toBe(true);
  });
});

describe('PLAN_QUOTAS', () => {
  it('free a des quotas limités', () => {
    const q = PLAN_QUOTAS.free;
    expect(q.postersPerMonth).toBe(3);
    expect(q.aiGeneratesPerMonth).toBe(0);
    expect(q.featuredEventsMax).toBe(0);
    expect(q.carpoolingTeamsMax).toBe(0);
  });

  it('elite a des quotas illimités (null)', () => {
    const q = PLAN_QUOTAS.elite;
    expect(q.postersPerMonth).toBeNull();
    expect(q.aiGeneratesPerMonth).toBeNull();
    expect(q.aiImportsPerMonth).toBeNull();
    expect(q.carpoolingTeamsMax).toBeNull();
  });

  it('starter a postersPerMonth illimité', () => {
    expect(PLAN_QUOTAS.starter.postersPerMonth).toBeNull();
  });

  it('pro a plus d\'événements featured que starter', () => {
    expect(PLAN_QUOTAS.pro.featuredEventsMax).toBeGreaterThan(PLAN_QUOTAS.starter.featuredEventsMax);
  });

  it('elite a plus d\'événements featured que pro', () => {
    expect(PLAN_QUOTAS.elite.featuredEventsMax).toBeGreaterThan(PLAN_QUOTAS.pro.featuredEventsMax);
  });
});
