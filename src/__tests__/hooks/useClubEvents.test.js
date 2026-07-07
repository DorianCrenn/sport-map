import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: { from: mockFrom },
}));

import { makeQuery } from '../../test/mocks/supabase.js';
import { useClubEvents } from '../../hooks/useClubEvents.js';

const EV_ROW = {
  id: 'e-1', title: 'Match', date: '2026-07-10T18:00:00Z',
  sport: 'Football', venue: 'Stade', city: 'Brest',
  team_name: 'Seniors', adversaire: 'Quimper', home_or_away: 'home',
  event_type: 'match', score: null, category: 'Seniors',
  level: 'D1', cup_type: '', club_id: 'c-1', is_archived: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(makeQuery({ data: [EV_ROW], error: null }));
});

describe('useClubEvents — chargement', () => {
  it('retourne [] si clubId null', () => {
    const { result } = renderHook(() => useClubEvents(null));
    expect(result.current).toEqual([]);
  });

  it('charge les événements depuis Supabase', async () => {
    const { result } = renderHook(() => useClubEvents('c-1', 'FC Brest'));
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    expect(result.current[0].id).toBe('e-1');
  });

  it('mappe home_or_away → homeOrAway', async () => {
    const { result } = renderHook(() => useClubEvents('c-1', 'FC Brest'));
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    expect(result.current[0].homeOrAway).toBe('home');
  });

  it('construit homeTeam correctement (home = clubName)', async () => {
    const { result } = renderHook(() => useClubEvents('c-1', 'FC Brest'));
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    expect(result.current[0].homeTeam).toBe('FC Brest');
    expect(result.current[0].awayTeam).toBe('Quimper');
  });

  it('construit homeTeam correctement pour away', async () => {
    mockFrom.mockReturnValue(makeQuery({
      data: [{ ...EV_ROW, home_or_away: 'away' }], error: null,
    }));
    const { result } = renderHook(() => useClubEvents('c-1', 'FC Brest'));
    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
    expect(result.current[0].homeTeam).toBe('Quimper');
    expect(result.current[0].awayTeam).toBe('FC Brest');
  });

  it('retourne [] en cas d\'erreur', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'err' } }));
    const { result } = renderHook(() => useClubEvents('c-1'));
    await waitFor(() => {});
    expect(result.current).toEqual([]);
  });
});
