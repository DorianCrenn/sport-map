import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { useMatchesForDate } from '../../hooks/useMatchesForDate.js';

// ── Chainable query builder ───────────────────────────────────────────────────

let capturedSelect = null;
let capturedFilters = [];

function q(terminal) {
  const obj = {
    then:   (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select: vi.fn((s) => { capturedSelect = s; return obj; }),
    gte:    vi.fn(() => obj),
    lte:    vi.fn(() => obj),
    order:  vi.fn(() => obj),
    limit:  vi.fn(() => obj),
    in:     vi.fn((col, vals) => { capturedFilters.push({ col, vals }); return obj; }),
  };
  return obj;
}

const SAMPLE_EVENTS = [
  { id: '1', title: 'US Brest vs Plabennec', sport: 'Football', date: '2026-05-31T15:00:00', score: null, club_id: 'c1', venue: 'Stade', city: 'Brest', level: 'Amateur', event_type: 'match', man_of_match: null, team_name: 'Seniors A' },
  { id: '2', title: 'RC Brest vs Quimper',   sport: 'Rugby',    date: '2026-05-31T16:00:00', score: null, club_id: 'c2', venue: 'Terrain', city: 'Brest', level: 'Amateur', event_type: 'match', man_of_match: null, team_name: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  capturedSelect  = null;
  capturedFilters = [];
});

// ── skip / clubIds vide ────────────────────────────────────────────────────────

describe('useMatchesForDate — skip / early return', () => {
  it('retourne [] immédiatement si skip=true, sans appeler Supabase', () => {
    const { result } = renderHook(() =>
      useMatchesForDate({ date: new Date(), skip: true })
    );
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.matches).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('retourne [] immédiatement si clubIds=[], sans appeler Supabase', () => {
    const { result } = renderHook(() =>
      useMatchesForDate({ date: new Date(), clubIds: [] })
    );
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.matches).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});

// ── Pas de join clubs() ────────────────────────────────────────────────────────
// Régression : events.club_id est TEXT, clubs.id est UUID → pas de FK → 400 PostgREST

describe('useMatchesForDate — structure query Supabase', () => {
  it('ne contient PAS clubs() dans le select (évite le 400 PostgREST)', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    renderHook(() => useMatchesForDate({ date: new Date() }));
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());

    expect(capturedSelect).not.toMatch(/clubs\s*\(/);
  });

  it('appelle .from("events")', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    renderHook(() => useMatchesForDate({ date: new Date() }));
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());

    expect(mockFrom).toHaveBeenCalledWith('events');
  });
});

// ── Chargement normal ─────────────────────────────────────────────────────────

describe('useMatchesForDate — chargement', () => {
  it('retourne les matchs fournis par Supabase', async () => {
    mockFrom.mockReturnValue(q({ data: SAMPLE_EVENTS, error: null }));

    const { result } = renderHook(() => useMatchesForDate({ date: new Date() }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.matches).toHaveLength(2);
    expect(result.current.matches[0].sport).toBe('Football');
  });

  it('loading passe false après réception des données', async () => {
    mockFrom.mockReturnValue(q({ data: SAMPLE_EVENTS, error: null }));

    const { result } = renderHook(() => useMatchesForDate({ date: new Date() }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.matches).not.toBeNull();
  });
});

// ── Filtres ───────────────────────────────────────────────────────────────────

describe('useMatchesForDate — filtres', () => {
  it('ajoute .in("sport", sports) si sports est fourni', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    renderHook(() => useMatchesForDate({ date: new Date(), sports: ['Football', 'Rugby'] }));
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());

    const sportFilter = capturedFilters.find(f => f.col === 'sport');
    expect(sportFilter).toBeDefined();
    expect(sportFilter.vals).toContain('Football');
    expect(sportFilter.vals).toContain('Rugby');
  });

  it('ajoute .in("club_id", clubIds) si clubIds est fourni', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    renderHook(() => useMatchesForDate({ date: new Date(), clubIds: ['c1', 'c2'] }));
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());

    const clubFilter = capturedFilters.find(f => f.col === 'club_id');
    expect(clubFilter).toBeDefined();
    expect(clubFilter.vals).toContain('c1');
  });

  it('retourne [] si Supabase renvoie null', async () => {
    mockFrom.mockReturnValue(q({ data: null, error: null }));

    const { result } = renderHook(() => useMatchesForDate({ date: new Date() }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.matches).toEqual([]);
  });
});
