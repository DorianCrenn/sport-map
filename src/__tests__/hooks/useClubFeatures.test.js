/**
 * Tests useClubFeatures — feature gating, quotas, admin override
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'u1', role: 'club_admin' } })),
}));

vi.mock('../../hooks/useClubPlan.js', () => ({
  useClubPlan: vi.fn(() => ({
    plan: 'free',
    status: 'active',
    loading: false,
    isTrial: false,
    periodEnd: null,
    carpoolAllowedTeamId: null,
  })),
}));

import { useClubFeatures } from '../../hooks/useClubFeatures.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useClubPlan } from '../../hooks/useClubPlan.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFeatures(planOverrides = {}, authOverrides = {}) {
  useClubPlan.mockReturnValue({
    plan: 'free',
    status: 'active',
    loading: false,
    isTrial: false,
    periodEnd: null,
    carpoolAllowedTeamId: null,
    ...planOverrides,
  });
  useAuth.mockReturnValue({
    currentUser: { id: 'u1', role: 'club_admin' },
    ...authOverrides,
  });
  const { result } = renderHook(() => useClubFeatures('club-1'));
  return result.current;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Plan free ─────────────────────────────────────────────────────────────────

describe('useClubFeatures — plan free', () => {
  it('planId est "free"', () => {
    const f = getFeatures({ plan: 'free', status: 'active' });
    expect(f.planId).toBe('free');
  });

  it('can(POSTER_SIMPLE) → true', () => {
    const f = getFeatures({ plan: 'free', status: 'active' });
    expect(f.can('POSTER_SIMPLE')).toBe(true);
  });

  it('can(POSTER_WATERMARK_REMOVE) → false', () => {
    const f = getFeatures({ plan: 'free', status: 'active' });
    expect(f.can('POSTER_WATERMARK_REMOVE')).toBe(false);
  });

  it('can(POSTER_AI_BACKGROUND) → false', () => {
    const f = getFeatures({ plan: 'free', status: 'active' });
    expect(f.can('POSTER_AI_BACKGROUND')).toBe(false);
  });

  it('can(CARPOOLING) → false', () => {
    const f = getFeatures({ plan: 'free', status: 'active' });
    expect(f.can('CARPOOLING')).toBe(false);
  });

  it('can(PUSH_NOTIFICATIONS) → true', () => {
    const f = getFeatures({ plan: 'free', status: 'active' });
    expect(f.can('PUSH_NOTIFICATIONS')).toBe(true);
  });
});

// ── Plan elite ────────────────────────────────────────────────────────────────

describe('useClubFeatures — plan elite', () => {
  it('planId est "elite"', () => {
    const f = getFeatures({ plan: 'elite', status: 'active' });
    expect(f.planId).toBe('elite');
  });

  it('can(POSTER_AI_BACKGROUND) → true', () => {
    const f = getFeatures({ plan: 'elite', status: 'active' });
    expect(f.can('POSTER_AI_BACKGROUND')).toBe(true);
  });

  it('can(AUTOMATIONS) → true', () => {
    const f = getFeatures({ plan: 'elite', status: 'active' });
    expect(f.can('AUTOMATIONS')).toBe(true);
  });

  it('can(TOURNAMENTS) → true', () => {
    const f = getFeatures({ plan: 'elite', status: 'active' });
    expect(f.can('TOURNAMENTS')).toBe(true);
  });
});

// ── Admin override ────────────────────────────────────────────────────────────

describe('useClubFeatures — admin override', () => {
  it('un admin avec plan free a planId="elite" (effectivePlan)', () => {
    const f = getFeatures(
      { plan: 'free', status: 'active' },
      { currentUser: { id: 'u1', role: 'admin' } },
    );
    expect(f.planId).toBe('elite');
  });

  it('un admin peut utiliser POSTER_AI_BACKGROUND même en plan free', () => {
    const f = getFeatures(
      { plan: 'free', status: 'active' },
      { currentUser: { id: 'u1', role: 'admin' } },
    );
    expect(f.can('POSTER_AI_BACKGROUND')).toBe(true);
  });

  it('un superadmin peut utiliser toutes les features', () => {
    const f = getFeatures(
      { plan: 'free', status: 'active' },
      { currentUser: { id: 'u1', role: 'superadmin' } },
    );
    expect(f.can('AUTOMATIONS')).toBe(true);
    expect(f.can('ADVANCED_ANALYTICS')).toBe(true);
  });

  it('un club_admin NE bypasse PAS le gate', () => {
    const f = getFeatures(
      { plan: 'free', status: 'active' },
      { currentUser: { id: 'u1', role: 'club_admin' } },
    );
    expect(f.can('POSTER_AI_BACKGROUND')).toBe(false);
  });
});

// ── Status subscription ───────────────────────────────────────────────────────

describe('useClubFeatures — statut subscription', () => {
  it('statut cancelled → plan free effectif', () => {
    const f = getFeatures({ plan: 'pro', status: 'cancelled' });
    expect(f.planId).toBe('free');
    expect(f.can('TOURNAMENTS')).toBe(false);
  });

  it('statut trialing → plan actif', () => {
    const f = getFeatures({ plan: 'starter', status: 'trialing' });
    expect(f.planId).toBe('starter');
    expect(f.can('POSTER_WATERMARK_REMOVE')).toBe(true);
  });

  it('statut null → plan free', () => {
    const f = getFeatures({ plan: 'elite', status: null });
    expect(f.planId).toBe('free');
  });
});

// ── Quotas ────────────────────────────────────────────────────────────────────

describe('useClubFeatures — quotas', () => {
  it('remaining() retourne null pour quota illimité (elite)', () => {
    const f = getFeatures({ plan: 'elite', status: 'active' });
    // postersPerMonth = null pour elite → remaining retourne null
    expect(f.remaining('postersPerMonth', 5)).toBeNull();
  });

  it('overQuota() retourne false si used < limit', () => {
    const f = getFeatures({ plan: 'starter', status: 'active' });
    // aiGeneratesPerMonth = 0 pour starter (en attente de config)
    // postersPerMonth = 20 pour starter
    expect(f.overQuota('postersPerMonth', 5)).toBe(false);
  });

  it('overQuota() retourne true si used >= limit (aiImportsPerMonth=10 pour starter)', () => {
    const f = getFeatures({ plan: 'starter', status: 'active' });
    // starter a aiImportsPerMonth=10, donc 10 imports utilisés → quota atteint
    expect(f.overQuota('aiImportsPerMonth', 10)).toBe(true);
  });

  it('loading reflète l\'état de useClubPlan', () => {
    const f = getFeatures({ plan: 'free', status: 'active', loading: true });
    expect(f.loading).toBe(true);
  });
});

// ── Upgrade path ──────────────────────────────────────────────────────────────

describe('useClubFeatures — upgrade path', () => {
  it('nextPlanId retourne le plan suivant pour free', () => {
    const f = getFeatures({ plan: 'free', status: 'active' });
    expect(f.nextPlanId).toBe('starter');
  });

  it('nextPlanId retourne null pour elite', () => {
    const f = getFeatures({ plan: 'elite', status: 'active' });
    expect(f.nextPlanId).toBeNull();
  });
});
