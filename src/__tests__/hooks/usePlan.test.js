/**
 * Tests usePlan — plan et accès aux fonctionnalités utilisateur
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: mockUseAuth }));

// plans.js re-exporte depuis subscriptionFeatures.ts et planHelpers.ts
vi.mock('../../lib/plans.js', () => ({
  PLAN_TIERS: {
    free:      { id: 'free',      label: 'Gratuit',   price: 0   },
    'club-pro': { id: 'club-pro', label: 'Pro',        price: 19  },
    federation: { id: 'federation', label: 'Fédération', price: 49 },
  },
  canUse: vi.fn((feature, planId) => {
    if (feature === 'basic') return true;
    if (feature === 'advanced') return planId !== 'free';
    return false;
  }),
  isUpgradeable: vi.fn((planId) => planId !== 'federation'),
  nextPlan: vi.fn((planId) => {
    if (planId === 'free') return 'club-pro';
    if (planId === 'club-pro') return 'federation';
    return null;
  }),
}));

import { usePlan } from '../../hooks/usePlan.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePlan — utilisateur gratuit (free)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ currentUser: { plan: 'free' } });
  });

  it('planId est "free"', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.planId).toBe('free');
  });

  it('plan contient les métadonnées du plan gratuit', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.plan.label).toBe('Gratuit');
  });

  it('isUpgradeable est true pour un utilisateur free', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.isUpgradeable).toBe(true);
  });

  it('nextPlanId est "club-pro"', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.nextPlanId).toBe('club-pro');
  });

  it('canUse retourne true pour une feature basique', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.canUse('basic')).toBe(true);
  });

  it('canUse retourne false pour une feature avancée', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.canUse('advanced')).toBe(false);
  });
});

describe('usePlan — utilisateur Pro', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ currentUser: { plan: 'club-pro' } });
  });

  it('planId est "club-pro"', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.planId).toBe('club-pro');
  });

  it('canUse retourne true pour une feature avancée', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.canUse('advanced')).toBe(true);
  });

  it('isUpgradeable est true', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.isUpgradeable).toBe(true);
  });

  it('nextPlanId est "federation"', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.nextPlanId).toBe('federation');
  });
});

describe('usePlan — utilisateur Federation (plan max)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ currentUser: { plan: 'federation' } });
  });

  it('isUpgradeable est false', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.isUpgradeable).toBe(false);
  });

  it('nextPlanId est null', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.nextPlanId).toBeNull();
  });

  it('nextPlan est null', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.nextPlan).toBeNull();
  });
});

describe('usePlan — utilisateur non connecté (currentUser null)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ currentUser: null });
  });

  it('planId est "free" par défaut', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.planId).toBe('free');
  });

  it('plan fallback sur PLAN_TIERS.free', () => {
    const { result } = renderHook(() => usePlan());
    expect(result.current.plan).toBeDefined();
  });
});
