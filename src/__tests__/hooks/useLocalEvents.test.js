import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase ─────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: null }),
}));

vi.mock('../../lib/sanitize.js', () => ({
  sanitizeText: (v) => v ?? '',
}));

// Chainable async query builder
function q(terminal) {
  const p = Promise.resolve(terminal);
  return {
    select:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    limit:   vi.fn().mockReturnThis(),
    then:    (fn, rej) => p.then(fn, rej),
    catch:   (fn)      => p.catch(fn),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

import { useLocalEvents } from '../../hooks/useLocalEvents.js';

const VALID_ROW = {
  id: 'e1', title: 'Test', sport: 'Football',
  date: '2026-06-01', lat: 48, lng: -4, user_id: 'u1',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dbRow(overrides = {}) {
  return {
    id: 'e1', title: 'FC Brest vs Quimper', sport: 'Football',
    date: '2026-07-10T18:00:00Z', lat: 48.39, lng: -4.49,
    city: 'Brest', venue: 'Stade Francis-Le Blé',
    event_type: 'match', home_or_away: 'home',
    user_id: 'user-1', club_id: 'club-1',
    description: '', adversaire: '', score: null,
    man_of_match: null, series_id: null,
    ...overrides,
  };
}


describe('useLocalEvents — fetch initial', () => {
  beforeEach(() => mockFrom.mockReset());

  it('démarre avec loading=false et events=[] après fetch vide', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([]);
  });

  it('charge les events et passe loading=false', async () => {
    mockFrom.mockReturnValue(q({ data: [dbRow()], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(1);
  });

  it('mappe event_type → eventType (camelCase)', async () => {
    mockFrom.mockReturnValue(q({ data: [dbRow({ event_type: 'tournament' })], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events[0].eventType).toBe('tournament');
  });

  it('mappe home_or_away → homeOrAway', async () => {
    mockFrom.mockReturnValue(q({ data: [dbRow({ home_or_away: 'away' })], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events[0].homeOrAway).toBe('away');
  });

  it('mappe club_id → clubId', async () => {
    mockFrom.mockReturnValue(q({ data: [dbRow({ club_id: 'c-99' })], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events[0].clubId).toBe('c-99');
  });

  it('champs optionnels absents → valeurs vides par défaut', async () => {
    mockFrom.mockReturnValue(q({
      data: [{ id: 'bare', sport: 'Football', date: '2026-07-10', user_id: 'u1' }],
      error: null,
    }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const e = result.current.events[0];
    expect(e.city).toBe('');
    expect(e.venue).toBe('');
    expect(e.description).toBe('');
    expect(e.adversaire).toBe('');
    expect(e.manOfMatch).toBe('');
  });
});

describe('useLocalEvents', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('fallback sans is_archived fonctionne si première requête échoue', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: null, error: { message: 'column is_archived does not exist' } });
      return q({ data: [VALID_ROW], error: null });
    });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(1);
  });

  it('double échec → loading false, events vide, pas de crash', async () => {
    mockFrom.mockReturnValue(q({ data: null, error: { message: 'DB unavailable' } }));

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([]);
  });

  it('exception dans mapFromDB → loading false quand même (finally)', async () => {
    // Row with no title — mapFromDB access on undefined won't throw,
    // but a null id causes issues in sorting; use a completely broken row
    mockFrom.mockReturnValue(q({
      data: [{ id: null, title: null, sport: null, date: 'bad-date', lat: null, lng: null }],
      error: null,
    }));

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });
  });
});
