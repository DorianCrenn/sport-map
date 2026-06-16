/**
 * Tests useFeedbackAdmin — gestion admin du feedback communautaire
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'admin-1' } })),
}));

import { useFeedbackAdmin } from '../../hooks/useFeedbackAdmin.js';

beforeEach(() => vi.clearAllMocks());

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRangeQuery(result = { data: [], count: 0, error: null }) {
  return {
    select:  vi.fn().mockReturnThis(),
    is:      vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    ilike:   vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    range:   vi.fn().mockResolvedValue(result),
    update:  vi.fn().mockReturnThis(),
    delete:  vi.fn().mockReturnThis(),
    single:  vi.fn().mockResolvedValue({ data: result.data?.[0] ?? null, error: null }),
  };
}

function makeIsQuery(data) {
  return {
    select: vi.fn().mockReturnThis(),
    is:     vi.fn().mockResolvedValue({ data }),
  };
}

function makeUpdateChain(returnData) {
  return {
    update: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error: null }),
  };
}

// ── État initial ──────────────────────────────────────────────────────────────

describe('useFeedbackAdmin — état initial', () => {
  it('retourne une liste vide et loading=false', () => {
    mockFrom.mockReturnValue(makeRangeQuery());
    const { result } = renderHook(() => useFeedbackAdmin());
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.total).toBe(0);
  });

  it('expose les fonctions fetchAll, fetchStats, updateFeedback, mergeDuplicate, deleteFeedback', () => {
    mockFrom.mockReturnValue(makeRangeQuery());
    const { result } = renderHook(() => useFeedbackAdmin());
    expect(typeof result.current.fetchAll).toBe('function');
    expect(typeof result.current.fetchStats).toBe('function');
    expect(typeof result.current.updateFeedback).toBe('function');
    expect(typeof result.current.mergeDuplicate).toBe('function');
    expect(typeof result.current.deleteFeedback).toBe('function');
  });
});

// ── fetchAll ──────────────────────────────────────────────────────────────────

describe('useFeedbackAdmin — fetchAll', () => {
  it('charge les items et met à jour total', async () => {
    const fakeData = [
      { id: '1', title: 'Bug critique', type: 'bug', status: 'new', vote_count: 3 },
      { id: '2', title: 'Idée feature', type: 'idea', status: 'analyzing', vote_count: 7 },
    ];
    mockFrom.mockReturnValue(makeRangeQuery({ data: fakeData, count: 2, error: null }));

    const { result } = renderHook(() => useFeedbackAdmin());

    await act(async () => { await result.current.fetchAll(); });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.total).toBe(2);
  });

  it('retourne un tableau vide si Supabase renvoie null', async () => {
    mockFrom.mockReturnValue(makeRangeQuery({ data: null, count: 0, error: null }));

    const { result } = renderHook(() => useFeedbackAdmin());
    await act(async () => { await result.current.fetchAll(); });

    expect(result.current.items).toEqual([]);
  });

  it('filtre par type quand le paramètre est fourni', async () => {
    const q = makeRangeQuery({ data: [], count: 0, error: null });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useFeedbackAdmin());
    await act(async () => { await result.current.fetchAll({ type: 'bug' }); });

    // eq() doit avoir été appelé avec ('type', 'bug')
    expect(q.eq).toHaveBeenCalledWith('type', 'bug');
  });

  it('trie par vote_count quand sort="votes"', async () => {
    const q = makeRangeQuery({ data: [], count: 0, error: null });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useFeedbackAdmin());
    await act(async () => { await result.current.fetchAll({ sort: 'votes' }); });

    expect(q.order).toHaveBeenCalledWith('vote_count', { ascending: false });
  });
});

// ── fetchStats ────────────────────────────────────────────────────────────────

describe('useFeedbackAdmin — fetchStats', () => {
  it('calcule les comptes par type et par statut', async () => {
    const rows = [
      { type: 'bug', status: 'new' },
      { type: 'bug', status: 'in_dev' },
      { type: 'idea', status: 'planned' },
      { type: 'question', status: 'resolved' },
    ];
    mockFrom.mockReturnValue(makeIsQuery(rows));

    const { result } = renderHook(() => useFeedbackAdmin());

    let stats;
    await act(async () => { stats = await result.current.fetchStats(); });

    expect(stats.total).toBe(4);
    expect(stats.byType.bug).toBe(2);
    expect(stats.byType.idea).toBe(1);
    expect(stats.byType.question).toBe(1);
    expect(stats.byStatus.new).toBe(1);
    expect(stats.byStatus.in_dev).toBe(1);
    expect(stats.byStatus.planned).toBe(1);
    expect(stats.byStatus.resolved).toBe(1);
  });

  it('stocke les stats dans result.current.stats après fetchStats', async () => {
    const rows = [{ type: 'bug', status: 'new' }];
    mockFrom.mockReturnValue(makeIsQuery(rows));

    const { result } = renderHook(() => useFeedbackAdmin());
    await act(async () => { await result.current.fetchStats(); });

    expect(result.current.stats).not.toBeNull();
    expect(result.current.stats.total).toBe(1);
  });
});

// ── updateFeedback ────────────────────────────────────────────────────────────

describe('useFeedbackAdmin — updateFeedback', () => {
  it('met à jour le statut dans la liste locale', async () => {
    const initial   = { id: 'fb-1', title: 'Test', type: 'bug', status: 'new', vote_count: 0 };
    const updated   = { ...initial, status: 'in_dev', admin_note: 'Traité', admin_updated_by: 'admin-1' };

    mockFrom
      .mockReturnValueOnce(makeRangeQuery({ data: [initial], count: 1, error: null }))
      .mockReturnValueOnce(makeUpdateChain(updated));

    const { result } = renderHook(() => useFeedbackAdmin());

    await act(async () => { await result.current.fetchAll(); });
    expect(result.current.items[0].status).toBe('new');

    await act(async () => {
      await result.current.updateFeedback('fb-1', { status: 'in_dev', admin_note: 'Traité' });
    });

    expect(result.current.items[0].status).toBe('in_dev');
    expect(result.current.items[0].admin_note).toBe('Traité');
  });
});
