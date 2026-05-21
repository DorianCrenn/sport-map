import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockChannel, mockRemoveChannel } = vi.hoisted(() => ({
  mockFrom:          vi.fn(),
  mockChannel:       vi.fn(),
  mockRemoveChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from:          mockFrom,
    channel:       mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: { id: 'user-1' } }),
}));

import { useLocalEvents } from '../../hooks/useLocalEvents.js';

// ── Chainable query builder ───────────────────────────────────────────────────

function q(terminal) {
  const obj = {
    then:   (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select: vi.fn(), eq: vi.fn(), order: vi.fn(),
    insert: vi.fn(), update: vi.fn(), delete: vi.fn(),
    single: vi.fn().mockResolvedValue(terminal),
    filter: vi.fn(), not: vi.fn(), in: vi.fn(),
    lt: vi.fn(), gte: vi.fn(), limit: vi.fn(),
  };
  obj.select.mockReturnValue(obj); obj.eq.mockReturnValue(obj); obj.order.mockReturnValue(obj);
  obj.insert.mockReturnValue(obj); obj.update.mockReturnValue(obj); obj.delete.mockReturnValue(obj);
  obj.filter.mockReturnValue(obj); obj.not.mockReturnValue(obj); obj.in.mockReturnValue(obj);
  obj.lt.mockReturnValue(obj); obj.gte.mockReturnValue(obj); obj.limit.mockReturnValue(obj);
  return obj;
}

function makeChannel() {
  const ch = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
  mockChannel.mockReturnValue(ch);
  return ch;
}

function dbRow(overrides = {}) {
  return {
    id: 'evt-1', title: 'FC Brest vs FC Quimper', sport: 'Football',
    date: '2026-06-15T15:00:00', lat: 48.39, lng: -4.48,
    city: 'Brest', venue: 'Stade Francis-Le Ble', description: 'Test',
    event_type: 'championship', team_name: 'Seniors A', category: 'Senior',
    level: 'D1', cup_type: 'Coupe de France', home_or_away: 'home', adversaire: 'FC Quimper',
    standings: { home: { team: 'FC Brest', wins: 5, draws: 1, losses: 0, points: 16 } },
    score: null, club_id: 'club-1', user_id: 'user-1', series_id: 'series-1', source: 'user',
    ...overrides,
  };
}

beforeEach(() => {
  mockFrom.mockReset();
  mockChannel.mockReset();
  mockRemoveChannel.mockReset();
  makeChannel();
});

// ── mapFromDB ─────────────────────────────────────────────────────────────────

describe('mapFromDB — champs complets', () => {
  it('mappe venue, level, cupType, homeOrAway, adversaire, standings, seriesId', async () => {
    mockFrom.mockReturnValue(q({ data: [dbRow()], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const evt = result.current.events[0];
    expect(evt.venue).toBe('Stade Francis-Le Ble');
    expect(evt.level).toBe('D1');
    expect(evt.cupType).toBe('Coupe de France');
    expect(evt.homeOrAway).toBe('home');
    expect(evt.adversaire).toBe('FC Quimper');
    expect(evt.standings).toEqual(dbRow().standings);
    expect(evt.seriesId).toBe('series-1');
    expect(evt.clubId).toBe('club-1');
  });

  it('valeurs par defaut pour les champs null', async () => {
    mockFrom.mockReturnValue(q({ data: [dbRow({ venue: null, level: null, cup_type: null, home_or_away: null, adversaire: null, standings: null, series_id: null })], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const evt = result.current.events[0];
    expect(evt.venue).toBe('');
    expect(evt.level).toBe('');
    expect(evt.cupType).toBe('');
    expect(evt.homeOrAway).toBe('home');
    expect(evt.adversaire).toBe('');
    expect(evt.standings).toBeNull();
    expect(evt.seriesId).toBeNull();
  });
});

// ── mapToDB ───────────────────────────────────────────────────────────────────

describe('addEvent — mapToDB envoie tous les champs critiques', () => {
  it('inclut venue, level, cup_type, home_or_away, adversaire, standings, series_id', async () => {
    let insertedArg = null;
    let callCount = 0;

    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [], error: null }); // initial load
      const obj = q(null);
      obj.insert = vi.fn((arg) => { insertedArg = arg; return obj; });
      obj.single = vi.fn().mockResolvedValue({ data: dbRow({ id: 'evt-real' }), error: null });
      return obj;
    });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const eventData = {
      title: 'Test', sport: 'Football', date: '2026-06-15T15:00:00', lat: 48, lng: -4,
      city: 'Brest', venue: 'Stade X', description: '',
      eventType: 'championship', teamName: 'Seniors A', category: 'Senior',
      level: 'D1', cupType: 'Coupe de France', homeOrAway: 'away', adversaire: 'AS Morlaix',
      standings: { home: { team: 'A' }, away: { team: 'B' } },
      score: null, clubId: 'club-1', seriesId: 'series-42',
    };

    await act(async () => { await result.current.addEvent(eventData); });

    expect(insertedArg).not.toBeNull();
    expect(insertedArg.venue).toBe('Stade X');
    expect(insertedArg.level).toBe('D1');
    expect(insertedArg.cup_type).toBe('Coupe de France');
    expect(insertedArg.home_or_away).toBe('away');
    expect(insertedArg.adversaire).toBe('AS Morlaix');
    expect(insertedArg.standings).toEqual(eventData.standings);
    expect(insertedArg.series_id).toBe('series-42');
    expect(insertedArg.user_id).toBe('user-1');
  });
});

// ── addEvent optimistic + rollback ────────────────────────────────────────────

describe('addEvent — optimistic update', () => {
  it('ajoute un evenement temp puis le remplace par le vrai', async () => {
    let callCount = 0;
    // Simulate a slow insert so the optimistic state is visible before resolution
    let resolveInsert;
    const insertDelay = new Promise(res => { resolveInsert = res; });

    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [], error: null });
      const obj = q(null);
      obj.single = vi.fn().mockImplementation(() => insertDelay.then(() => ({ data: dbRow({ id: 'evt-real' }), error: null })));
      return obj;
    });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Start addEvent (don't await yet)
    let promise;
    act(() => { promise = result.current.addEvent({ title: 'T', sport: 'Football', date: '2026-06-15T15:00:00', lat: 0, lng: 0 }); });

    // Optimistic event should appear before DB resolves
    await waitFor(() => expect(result.current.events.some(e => String(e.id).startsWith('temp_'))).toBe(true));

    // Now resolve the DB insert
    await act(async () => { resolveInsert(); await promise; });

    expect(result.current.events.some(e => String(e.id).startsWith('temp_'))).toBe(false);
    expect(result.current.events.some(e => e.id === 'evt-real')).toBe(true);
  });

  it('rollback du temp si erreur serveur', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [], error: null });
      const obj = q(null);
      obj.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } });
      return obj;
    });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.addEvent({ title: 'T', sport: 'Football', date: '2026-06-15T15:00:00', lat: 0, lng: 0 }))
        .rejects.toThrow('RLS denied');
    });

    expect(result.current.events).toHaveLength(0);
  });
});

// ── deleteEvent rollback ──────────────────────────────────────────────────────

describe('deleteEvent — rollback si erreur DB', () => {
  it('restitue l evenement si la suppression DB echoue', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [dbRow()], error: null });
      return q({ data: null, error: { message: 'RLS denied' } });
    });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.events).toHaveLength(1));

    await act(async () => {
      await expect(result.current.deleteEvent('evt-1')).rejects.toThrow('RLS denied');
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe('evt-1');
  });
});

// ── Schema DB complet ─────────────────────────────────────────────────────────
// Vérifie que mapToDB envoie exactement les colonnes attendues par la table events.
// Ce test est la "sentinelle" contre une régression du type PGRST204
// (colonne inconnue / manquante dans le payload Supabase).

describe('addEvent — colonnes DB complètes (sentinelle PGRST204)', () => {
  it('inclut toutes les colonnes nécessaires à la table events', async () => {
    let insertedArg = null;
    let callCount = 0;

    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [], error: null }); // initial load
      const obj = q(null);
      obj.insert = vi.fn((arg) => { insertedArg = arg; return obj; });
      obj.single = vi.fn().mockResolvedValue({ data: dbRow({ id: 'real-id' }), error: null });
      return obj;
    });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addEvent({
        title: 'Test', sport: 'Football', date: '2026-06-15T15:00:00',
        lat: 48.39, lng: -4.48, city: 'Brest', venue: 'Stade X',
        description: '', eventType: 'championship', teamName: 'Seniors A',
        category: 'Senior', level: 'D1', cupType: 'Coupe de France',
        homeOrAway: 'home', adversaire: 'AS Morlaix',
        standings: null, score: null, clubId: 'club-1', seriesId: null,
      });
    });

    // Colonnes obligatoires côté DB
    const requiredCols = [
      'title', 'sport', 'date', 'lat', 'lng',
      'city', 'venue', 'description',
      'event_type', 'team_name', 'category', 'level',
      'cup_type', 'home_or_away', 'adversaire',
      'standings', 'score', 'club_id', 'series_id',
      'user_id', 'source',
    ];

    for (const col of requiredCols) {
      expect(insertedArg, `colonne "${col}" absente du payload mapToDB`).toHaveProperty(col);
    }
  });
});

// ── Realtime ──────────────────────────────────────────────────────────────────

describe('Realtime — canal fixe', () => {
  it('utilise le canal fixe events-realtime sans Math.random', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));
    renderHook(() => useLocalEvents());
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    expect(mockChannel).toHaveBeenCalledWith('events-realtime');
  });
});
