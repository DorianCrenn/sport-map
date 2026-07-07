import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useMatchLineup } from '../../hooks/useMatchLineup.js';

const ROW = { id: 'lu-1', lineup_data: [{ playerId: 'p1', x: 50, y: 90 }], formation: '4-4-2', locked: false };

function wire({ loadData = null, insert, update } = {}) {
  mockFrom.mockImplementation(() => {
    const q = {
      select: vi.fn(() => q), eq: vi.fn(() => q),
      maybeSingle: vi.fn(() => Promise.resolve({ data: loadData })),
      insert: insert ?? vi.fn(() => ({ select: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'new-1' }, error: null }) }) })),
      update: update ?? vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    };
    return q;
  });
}

beforeEach(() => { mockFrom.mockReset(); });

describe('useMatchLineup', () => {
  it('sans eventId → loading false, formation par défaut', async () => {
    wire();
    const { result } = renderHook(() => useMatchLineup(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.formation).toBe('4-3-3');
    expect(result.current.lineup).toEqual([]);
  });

  it('charge la compo existante', async () => {
    wire({ loadData: ROW });
    const { result } = renderHook(() => useMatchLineup('e1'));
    await waitFor(() => expect(result.current.formation).toBe('4-4-2'));
    expect(result.current.lineup).toHaveLength(1);
  });

  it('updateLineup insère si aucune ligne existante', async () => {
    const insert = vi.fn(() => ({ select: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'new-1' }, error: null }) }) }));
    wire({ loadData: null, insert });
    const { result } = renderHook(() => useMatchLineup('e1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.updateLineup({ formation: '3-5-2', lineup_data: [{ playerId: 'p9' }] }); });

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ event_id: 'e1', side: 'home', formation: '3-5-2' }));
    expect(result.current.formation).toBe('3-5-2');
  });

  it('updateLineup met à jour si une ligne existe déjà', async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }));
    const update = vi.fn(() => ({ eq }));
    wire({ loadData: ROW, update });
    const { result } = renderHook(() => useMatchLineup('e1'));
    await waitFor(() => expect(result.current.formation).toBe('4-4-2'));

    await act(async () => { await result.current.updateLineup({ formation: '5-3-2' }); });

    expect(update).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 'lu-1');
    expect(result.current.formation).toBe('5-3-2');
  });
});
