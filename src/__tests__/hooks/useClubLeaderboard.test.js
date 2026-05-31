import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { useClubLeaderboard } from '../../hooks/useClubLeaderboard.js';

// ── Chainable query builder ───────────────────────────────────────────────────
// Le hook utilise la vue `club_monthly_leaderboard` avec UNE seule requête :
// .from('club_monthly_leaderboard').select(...).order(...).limit(...)

function q(terminal) {
  const obj = {
    then:   (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(),
  };
  obj.select.mockReturnValue(obj);
  obj.eq.mockReturnValue(obj);
  obj.order.mockReturnValue(obj);
  obj.limit.mockReturnValue(obj);
  return obj;
}

// Rows tels que retournés par la vue club_monthly_leaderboard
const viewRows = [
  { club_id: 'c1', name: 'FC Brest',   sport: 'Football', city: 'Brest',   logo_url: null, event_count: 3, rank: 1 },
  { club_id: 'c2', name: 'HB Brest',   sport: 'Handball', city: 'Brest',   logo_url: null, event_count: 2, rank: 2 },
  { club_id: 'c3', name: 'Rugby Club', sport: 'Rugby',    city: 'Quimper', logo_url: null, event_count: 1, rank: 3 },
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
    mockFrom.mockReturnValue(q({ data: viewRows, error: null }));
    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('useClubLeaderboard — classement', () => {
  it('retourne les clubs triés par nombre d\'événements décroissant', async () => {
    mockFrom.mockReturnValue(q({ data: viewRows, error: null }));

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
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaderboard).toEqual([]);
  });

  it('respecte la limite `limit`', async () => {
    const manyRows = Array.from({ length: 15 }, (_, i) => ({
      club_id: `c${i}`, name: `Club ${i}`, sport: 'Football', city: 'Brest',
      logo_url: null, event_count: 15 - i, rank: i + 1,
    }));

    mockFrom.mockReturnValue(q({ data: manyRows.slice(0, 5), error: null }));

    const { result } = renderHook(() => useClubLeaderboard({ limit: 5 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaderboard.length).toBeLessThanOrEqual(5);
  });

  it('attribue les rangs en séquence 1, 2, 3…', async () => {
    mockFrom.mockReturnValue(q({ data: viewRows.slice(0, 2), error: null }));

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaderboard[0].rank).toBe(1);
    expect(result.current.leaderboard[1].rank).toBe(2);
  });
});

describe('useClubLeaderboard — filtrage sport', () => {
  it('appelle .eq("sport", sportFilter) si fourni', async () => {
    let capturedQuery = null;
    const obj = q({ data: [], error: null });
    const origEq = obj.eq.bind(obj);
    obj.eq = vi.fn((col, val) => { capturedQuery = { col, val }; return origEq(col, val); });
    mockFrom.mockReturnValue(obj);

    renderHook(() => useClubLeaderboard({ sportFilter: 'Football' }));
    await waitFor(() => expect(capturedQuery).not.toBeNull());
    expect(capturedQuery.col).toBe('sport');
    expect(capturedQuery.val).toBe('Football');
  });
});

describe('useClubLeaderboard — gestion erreurs', () => {
  it('expose error si la requête échoue', async () => {
    mockFrom.mockReturnValue(q({ data: null, error: { message: 'DB down' } }));

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('DB down');
    expect(result.current.leaderboard).toEqual([]);
  });

  it('utilise "Club inconnu" si club absent du résultat (nom vide)', async () => {
    const rowsWithMissing = [
      { club_id: 'c99', name: null, sport: null, city: null, logo_url: null, event_count: 1, rank: 1 },
    ];
    mockFrom.mockReturnValue(q({ data: rowsWithMissing, error: null }));

    const { result } = renderHook(() => useClubLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.leaderboard[0].club.name).toBe('Club inconnu');
  });
});
