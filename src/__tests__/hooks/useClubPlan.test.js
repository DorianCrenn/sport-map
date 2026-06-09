import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { makeQuery } from '../../test/mocks/supabase.js';
import { useClubPlan } from '../../hooks/useClubPlan.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockSub(plan, status, extra = {}) {
  mockFrom.mockReturnValue(makeQuery({
    data: { plan, status, current_period_end: null, trial_end: null, carpool_allowed_team_id: null, ...extra },
    error: null,
  }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubPlan — plan actif', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne plan="free" si aucune souscription (data=null)', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: null }));
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plan).toBe('free');
  });

  it('retourne plan="starter" pour status=active + plan=starter', async () => {
    mockSub('starter', 'active');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plan).toBe('starter');
  });

  it('retourne plan="pro" pour status=active + plan=pro', async () => {
    mockSub('pro', 'active');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plan).toBe('pro');
  });

  it('retourne plan="elite" pour status=active + plan=elite', async () => {
    mockSub('elite', 'active');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plan).toBe('elite');
  });

  it('retourne plan="free" si status=cancelled (inactif)', async () => {
    mockSub('pro', 'cancelled');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plan).toBe('free');
  });

  it('retourne isTrial=true pour status=trialing', async () => {
    mockSub('starter', 'trialing');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isTrial).toBe(true);
    expect(result.current.plan).toBe('starter');
  });
});

describe('useClubPlan — flags isPremium / isElite', () => {
  beforeEach(() => vi.clearAllMocks());

  it('isPremium=false pour plan free', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: null }));
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isPremium).toBe(false);
  });

  it('isPremium=true pour plan starter (Starter+)', async () => {
    mockSub('starter', 'active');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isPremium).toBe(true);
  });

  it('isPremium=true pour plan pro', async () => {
    mockSub('pro', 'active');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isPremium).toBe(true);
  });

  it('isElite=false pour plan pro', async () => {
    mockSub('pro', 'active');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isElite).toBe(false);
  });

  it('isElite=true uniquement pour plan elite', async () => {
    mockSub('elite', 'active');
    const { result } = renderHook(() => useClubPlan('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isElite).toBe(true);
  });

  it('retourne loading=false et plan=free si clubId absent', () => {
    const { result } = renderHook(() => useClubPlan(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.plan).toBe('free');
  });
});
