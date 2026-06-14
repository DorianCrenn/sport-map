/**
 * Tests useClubAIUsage — suivi des quotas d'usage IA par club
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { useClubAIUsage } from '../../hooks/useClubAIUsage.js';

beforeEach(() => vi.clearAllMocks());

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQuery(result = { data: null }) {
  return {
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnValue(Promise.resolve(result)),
    then:        (fn) => Promise.resolve(result).then(fn),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubAIUsage — état initial', () => {
  it('retourne { import_count: 0, generate_count: 0 } par défaut', () => {
    mockFrom.mockReturnValue(makeQuery({ data: null }));
    const { result } = renderHook(() => useClubAIUsage('club-1'));
    expect(result.current.usage.import_count).toBe(0);
    expect(result.current.usage.generate_count).toBe(0);
  });

  it('ne fait pas de requête Supabase si clubId est null', () => {
    const { result } = renderHook(() => useClubAIUsage(null));
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.usage).toEqual({ import_count: 0, generate_count: 0 });
  });
});

describe('useClubAIUsage — chargement depuis DB', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue(makeQuery({ data: { import_count: 3, generate_count: 7 } }));
  });

  it('charge les compteurs depuis Supabase', async () => {
    const { result } = renderHook(() => useClubAIUsage('club-1'));
    await waitFor(() => {
      expect(result.current.usage.import_count).toBe(3);
      expect(result.current.usage.generate_count).toBe(7);
    });
  });
});

describe('useClubAIUsage — optimisticIncrement', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue(makeQuery({ data: { import_count: 2, generate_count: 5 } }));
  });

  it('incrémente generate_count optimistiquement', async () => {
    const { result } = renderHook(() => useClubAIUsage('club-1'));
    await waitFor(() => expect(result.current.usage.generate_count).toBe(5));

    act(() => result.current.optimisticIncrement('generate_count'));
    expect(result.current.usage.generate_count).toBe(6);
  });

  it('incrémente import_count optimistiquement', async () => {
    const { result } = renderHook(() => useClubAIUsage('club-1'));
    await waitFor(() => expect(result.current.usage.import_count).toBe(2));

    act(() => result.current.optimisticIncrement('import_count'));
    expect(result.current.usage.import_count).toBe(3);
  });

  it('initialise à 1 si la valeur précédente est undefined', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null }));
    const { result } = renderHook(() => useClubAIUsage('club-1'));

    act(() => result.current.optimisticIncrement('generate_count'));
    expect(result.current.usage.generate_count).toBe(1);
  });

  it('plusieurs incréments cumulatifs', async () => {
    const { result } = renderHook(() => useClubAIUsage('club-1'));

    act(() => {
      result.current.optimisticIncrement('generate_count');
      result.current.optimisticIncrement('generate_count');
      result.current.optimisticIncrement('generate_count');
    });
    await waitFor(() => expect(result.current.usage.generate_count).toBeGreaterThanOrEqual(3));
  });
});
