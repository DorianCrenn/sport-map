import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useMatchEncounters } from '../../hooks/useMatchEncounters.js';

function loadQuery(data, upsert) {
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q),
    order:  vi.fn(() => q),
    then:   (fn) => Promise.resolve({ data }).then(fn),
    upsert: upsert ?? vi.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) })),
  };
  return q;
}

beforeEach(() => { mockFrom.mockReset(); });

describe('useMatchEncounters', () => {
  it('sans données → génère les rencontres vides depuis la config du sport', async () => {
    mockFrom.mockReturnValue(loadQuery([]));
    const { result } = renderHook(() => useMatchEncounters('e1', 'tennis'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.encounters.length).toBeGreaterThan(0);
    expect(result.current.encounters.every(e => e.winner_side === null)).toBe(true);
    expect(result.current.isComplete).toBe(false);
  });

  it('computeTotalScore compte les victoires par camp', async () => {
    const DATA = [
      { id: 'x1', event_id: 'e1', encounter_type: 'single1', encounter_order: 1, winner_side: 'home', score_detail: {}, home_player1_data: {}, home_player2_data: {}, away_player1_data: {}, away_player2_data: {} },
      { id: 'x2', event_id: 'e1', encounter_type: 'single2', encounter_order: 2, winner_side: 'away', score_detail: {}, home_player1_data: {}, home_player2_data: {}, away_player1_data: {}, away_player2_data: {} },
      { id: 'x3', event_id: 'e1', encounter_type: 'single3', encounter_order: 3, winner_side: 'home', score_detail: {}, home_player1_data: {}, home_player2_data: {}, away_player1_data: {}, away_player2_data: {} },
    ];
    mockFrom.mockReturnValue(loadQuery(DATA));
    const { result } = renderHook(() => useMatchEncounters('e1', 'tennis'));
    await waitFor(() => expect(result.current.encounters).toHaveLength(3));
    expect(result.current.computeTotalScore()).toEqual({ home: 2, away: 1 });
    expect(result.current.isComplete).toBe(true); // tous ont un winner_side
  });

  it('upsertEncounter écrit avec le bon conflict', async () => {
    const upsert = vi.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }));
    mockFrom.mockReturnValue(loadQuery([], upsert));
    const { result } = renderHook(() => useMatchEncounters('e1', 'tennis'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.upsertEncounter({ encounter_type: 'single1', encounter_order: 1, winner_side: 'home' }); });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: 'e1', encounter_type: 'single1', winner_side: 'home' }),
      expect.objectContaining({ onConflict: 'event_id,encounter_type' }),
    );
  });
});
