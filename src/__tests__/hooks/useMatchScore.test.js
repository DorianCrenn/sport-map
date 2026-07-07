import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useMatchScore } from '../../hooks/useMatchScore.js';

const LOADED = { id: 'ms-1', event_id: 'e1', sport: 'Football', score_home: 2, score_away: 1, score_detail: {}, man_of_match: 'Alice', status: 'final' };

function wire({ loadData = null, saveData = null, upsert, eventsUpdateEq } = {}) {
  mockFrom.mockImplementation((table) => {
    if (table === 'match_scores') {
      const q = {
        select: vi.fn(() => q), eq: vi.fn(() => q),
        maybeSingle: vi.fn(() => Promise.resolve({ data: loadData, error: null })),
        upsert: upsert ?? vi.fn(() => q),
        single: vi.fn(() => Promise.resolve({ data: saveData, error: null })),
      };
      return q;
    }
    if (table === 'events') {
      return { update: vi.fn(() => ({ eq: eventsUpdateEq ?? vi.fn(() => Promise.resolve({ error: null })) })) };
    }
    return {};
  });
}

beforeEach(() => { mockFrom.mockReset(); });

describe('useMatchScore', () => {
  it('sans eventId → pas de fetch', () => {
    wire();
    const { result } = renderHook(() => useMatchScore(null));
    expect(result.current.matchScore).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('charge le score existant', async () => {
    wire({ loadData: LOADED });
    const { result } = renderHook(() => useMatchScore('e1'));
    await waitFor(() => expect(result.current.matchScore).not.toBeNull());
    expect(result.current.matchScore.score_home).toBe(2);
    expect(result.current.loading).toBe(false);
  });

  it('saveScore upsert + met à jour events + onUpdated + retourne true', async () => {
    const upsert = vi.fn(() => {
      const chain = { select: vi.fn(() => chain), single: vi.fn(() => Promise.resolve({ data: LOADED, error: null })) };
      return chain;
    });
    const eventsUpdateEq = vi.fn(() => Promise.resolve({ error: null }));
    wire({ loadData: null, upsert, eventsUpdateEq });

    const onUpdated = vi.fn();
    const { result } = renderHook(() => useMatchScore('e1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok;
    await act(async () => {
      ok = await result.current.saveScore({ score_home: 3, score_away: 0, man_of_match: 'Bob' }, onUpdated);
    });

    expect(ok).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: 'e1', score_home: 3, score_away: 0, man_of_match: 'Bob' }),
      expect.objectContaining({ onConflict: 'event_id' }),
    );
    expect(eventsUpdateEq).toHaveBeenCalled(); // events.score synchronisé
    expect(onUpdated).toHaveBeenCalledWith({ score: { home: 3, away: 0 }, man_of_match: 'Bob' });
  });
});
