import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useClubStats } from '../../hooks/useClubStats.js';

// club_stats brut
const CLUB_STATS = [{ team_name: 'Seniors A', points: 30 }];

// events récents (score) — pour form5. home_or_away + score → W/D/L
const RECENT = [
  { team_name: 'Seniors A', home_or_away: 'home', score: { home: 3, away: 1 }, date: '2026-06-10' }, // W
  { team_name: 'Seniors A', home_or_away: 'away', score: { home: 2, away: 0 }, date: '2026-06-08' }, // L (away, home gagne)
  { team_name: 'Seniors A', home_or_away: 'home', score: { home: 1, away: 1 }, date: '2026-06-05' }, // D
];

// events avec man_of_match — pour topMotm
const MOTM = [
  { man_of_match: 'Alice' }, { man_of_match: 'Alice' }, { man_of_match: 'Bob' },
];

function makeQuery(dataResolver) {
  let cols = '';
  const q = {
    select: vi.fn((c) => { cols = c; return q; }),
    eq:     vi.fn(() => q),
    not:    vi.fn(() => q),
    order:  vi.fn(() => q),
    limit:  vi.fn(() => q),
    then:   (fn) => Promise.resolve({ data: dataResolver(cols), error: null }).then(fn),
  };
  return q;
}

beforeEach(() => {
  mockFrom.mockReset();
  mockFrom.mockImplementation((table) => {
    if (table === 'club_stats') return makeQuery(() => CLUB_STATS);
    // deux requêtes sur 'events' : distinguées par les colonnes sélectionnées
    if (table === 'events') return makeQuery((cols) => cols.includes('man_of_match') ? MOTM : RECENT);
    return makeQuery(() => []);
  });
});

describe('useClubStats', () => {
  it('sans clubId → loading false, données vides', async () => {
    const { result } = renderHook(() => useClubStats(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual([]);
    expect(result.current.topMotm).toEqual([]);
  });

  it('calcule la forme (W/D/L) des 5 derniers matchs par équipe', async () => {
    const { result } = renderHook(() => useClubStats('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.form5['Seniors A']).toEqual(['W', 'L', 'D']);
  });

  it('classe les hommes du match par fréquence (top 5)', async () => {
    const { result } = renderHook(() => useClubStats('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.topMotm).toEqual([
      { name: 'Alice', count: 2 },
      { name: 'Bob',   count: 1 },
    ]);
  });

  it('remonte les stats brutes du club', async () => {
    const { result } = renderHook(() => useClubStats('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual(CLUB_STATS);
  });
});
