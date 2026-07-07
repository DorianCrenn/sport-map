import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useMatchStats, usePlayerSeasonStats, useMyPlayerStats } from '../../hooks/usePlayerStats.js';

const PMS = [
  { id: 's1', event_id: 'e1', player_id: 'p1', club_id: 'c1', status: 'present', goals: 2, assists: 1, yellow_cards: 0, red_cards: 0, minutes_played: 90 },
  { id: 's2', event_id: 'e1', player_id: 'p2', club_id: 'c1', status: 'absent' }, // champs manquants → défauts
];
const PSS = [
  { player_id: 'p1', club_id: 'c1', player_name: 'Alice', jersey_number: 9, position: 'ATT', matches_total: 10, matches_played: 8, total_goals: '5', total_assists: 3, total_yellow: 1, total_red: 0 },
];

function thenable(data, overrides = {}) {
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q), limit: vi.fn(() => q),
    maybeSingle: vi.fn(() => Promise.resolve({ data: Array.isArray(data) ? data[0] ?? null : data })),
    upsert: vi.fn(() => Promise.resolve({ error: null })),
    then: (fn) => Promise.resolve({ data, error: null }).then(fn),
    ...overrides,
  };
  return q;
}

beforeEach(() => { mockFrom.mockReset(); });

describe('useMatchStats', () => {
  it('sans eventId → stats vides', () => {
    mockFrom.mockReturnValue(thenable([]));
    const { result } = renderHook(() => useMatchStats(null));
    expect(result.current.stats).toEqual([]);
  });

  it('charge et mappe les stats (snake_case → camelCase, défauts)', async () => {
    mockFrom.mockReturnValue(thenable(PMS));
    const { result } = renderHook(() => useMatchStats('e1'));
    await waitFor(() => expect(result.current.stats).toHaveLength(2));
    expect(result.current.stats[0]).toMatchObject({ eventId: 'e1', playerId: 'p1', goals: 2, assists: 1 });
    // champs manquants → défauts
    expect(result.current.stats[1]).toMatchObject({ goals: 0, assists: 0, status: 'absent' });
  });

  it('upsertStat écrit en snake_case avec le bon conflict', async () => {
    const upsert = vi.fn(() => Promise.resolve({ error: null }));
    mockFrom.mockReturnValue(thenable(PMS, { upsert }));
    const { result } = renderHook(() => useMatchStats('e1'));
    await waitFor(() => expect(result.current.stats).toHaveLength(2));
    await act(async () => {
      await result.current.upsertStat({ eventId: 'e1', playerId: 'p3', clubId: 'c1', status: 'present', goals: 1, assists: 0, yellowCards: 0, redCards: 0 });
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: 'e1', player_id: 'p3', goals: 1, yellow_cards: 0 }),
      expect.objectContaining({ onConflict: 'event_id,player_id' }),
    );
  });
});

describe('usePlayerSeasonStats', () => {
  it('sans clubId → vide', () => {
    mockFrom.mockReturnValue(thenable([]));
    const { result } = renderHook(() => usePlayerSeasonStats(null));
    expect(result.current.stats).toEqual([]);
  });

  it('charge et convertit les totaux en nombres', async () => {
    mockFrom.mockReturnValue(thenable(PSS));
    const { result } = renderHook(() => usePlayerSeasonStats('c1'));
    await waitFor(() => expect(result.current.stats).toHaveLength(1));
    const s = result.current.stats[0];
    expect(s.playerName).toBe('Alice');
    expect(s.totalGoals).toBe(5);      // '5' (string) → 5 (number)
    expect(typeof s.totalGoals).toBe('number');
  });
});

describe('useMyPlayerStats', () => {
  it('sans userId → null', () => {
    mockFrom.mockReturnValue(thenable(null));
    const { result } = renderHook(() => useMyPlayerStats(null));
    expect(result.current.stats).toBeNull();
  });

  it('null si le joueur n\'a pas de fiche club active', async () => {
    // club_players.maybeSingle() → null
    mockFrom.mockImplementation(() => thenable(null));
    const { result } = renderHook(() => useMyPlayerStats('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toBeNull();
  });
});
