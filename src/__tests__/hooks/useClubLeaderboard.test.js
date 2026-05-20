import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { useClubLeaderboard } from '../../hooks/useClubLeaderboard.js';

// ── Chainable query builder ───────────────────────────────────────────────────

function q(terminal) {
  const obj = {
    then:   (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select: vi.fn(), eq: vi.fn(), gte: vi.fn(),
    not:    vi.fn(), in: vi.fn(), single: vi.fn().mockResolvedValue(terminal),
  };
  obj.select.mockReturnValue(obj); obj.eq.mockReturnValue(obj);
  obj.gte.mockReturnValue(obj);    obj.not.mockReturnValue(obj);
  obj.in.mockReturnValue(obj);
  return obj;
}

function eventsQ(events) { return q({ data: events, error: null }); }
function clubsQ(clubs)   { return q({ data: clubs,  error: null }); }

const sampleClubs = [
  { id: 'c1', name: 'FC Brest',    sport: 'Football', city: 'Brest',    logo_url: null },
  { id: 'c2', name: 'HB Brest',    sport: 'Handball', city: 'Brest',    logo_url: null },
  { id: 'c3', name: 'Rugby Club',  sport: 'Rugby',    city: 'Quimper',  logo_url: null },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubLeaderboard — chargement', () => {
  it('démarre en loading=true', () => {
    mockFrom.mockReturnValue(q(new Promise(() => {})));
    const { result } = renderHook(() => useClubLeaderboard());
    expect(result.current.loading).toBe(true);
    expect(result.current.leaderboard).toEqual([]);
  });

  it('loading=false après résolution', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return eventsQ([{ club_id: 'c1' }]);
      return clubsQ([sampleClubs[0]]);
    });
    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('useClubLeaderboard — classement', () => {
  it('retourne les clubs triés par nombre d\'événements décroissant', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return eventsQ([
        { club_id: 'c1' }, { club_id: 'c1' }, { club_id: 'c1' }, // 3 événements
        { club_id: 'c2' }, { club_id: 'c2' },                     // 2 événements
        { club_id: 'c3' },                                          // 1 événement
      ]);
      return clubsQ(sampleClubs);
    });

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { leaderboard } = result.current;
    expect(leaderboard).toHaveLength(3);
    expect(leaderboard[0].club.id).toBe('c1');
    expect(leaderboard[0].eventCount).toBe(3);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].club.id).toBe('c2');
    expect(leaderboard[1].eventCount).toBe(2);
    expect(leaderboard[2].club.id).toBe('c3');
    expect(leaderboard[2].eventCount).toBe(1);
  });

  it('retourne un tableau vide si aucun événement ce mois', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return eventsQ([]);
      return clubsQ([]);
    });

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaderboard).toEqual([]);
  });

  it('respecte la limite `limit`', async () => {
    let callCount = 0;
    const manyEvents = Array.from({ length: 15 }, (_, i) => ({ club_id: `c${i}` }));
    const manyClubs  = Array.from({ length: 15 }, (_, i) => ({
      id: `c${i}`, name: `Club ${i}`, sport: 'Football', city: 'Brest', logo_url: null,
    }));

    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return eventsQ(manyEvents);
      return clubsQ(manyClubs);
    });

    const { result } = renderHook(() => useClubLeaderboard({ limit: 5 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaderboard.length).toBeLessThanOrEqual(5);
  });

  it('attribue les rangs en séquence 1, 2, 3…', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return eventsQ([
        { club_id: 'c1' }, { club_id: 'c1' },
        { club_id: 'c2' },
      ]);
      return clubsQ([sampleClubs[0], sampleClubs[1]]);
    });

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaderboard[0].rank).toBe(1);
    expect(result.current.leaderboard[1].rank).toBe(2);
  });
});

describe('useClubLeaderboard — filtrage sport', () => {
  it('appelle .eq("sport", sportFilter) si fourni', async () => {
    let callCount = 0;
    let capturedQuery = null;
    mockFrom.mockImplementation(() => {
      callCount++;
      const obj = eventsQ([]);
      if (callCount === 1) {
        const origEq = obj.eq.bind(obj);
        obj.eq = vi.fn((col, val) => { capturedQuery = { col, val }; return origEq(col, val); });
      }
      return obj;
    });

    renderHook(() => useClubLeaderboard({ sportFilter: 'Football' }));
    await waitFor(() => expect(capturedQuery).not.toBeNull());
    expect(capturedQuery.col).toBe('sport');
    expect(capturedQuery.val).toBe('Football');
  });
});

describe('useClubLeaderboard — gestion erreurs', () => {
  it('expose error si la requête events échoue', async () => {
    mockFrom.mockReturnValue(q({ data: null, error: { message: 'DB down' } }));

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('DB down');
    expect(result.current.leaderboard).toEqual([]);
  });

  it('expose error si la requête clubs échoue', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return eventsQ([{ club_id: 'c1' }]);
      return q({ data: null, error: { message: 'clubs error' } });
    });

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('clubs error');
  });

  it('utilise "Club inconnu" si club absent du résultat', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return eventsQ([{ club_id: 'c99' }]);
      return clubsQ([]); // club c99 pas retourné
    });

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaderboard[0].club.name).toBe('Club inconnu');
  });
});
