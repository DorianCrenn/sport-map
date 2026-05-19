import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── vi.hoisted : variables disponibles avant le hoist de vi.mock ──────────────
const { mockFrom, mockChannelInstance } = vi.hoisted(() => ({
  mockFrom:          vi.fn(),
  mockChannelInstance: { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() },
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from:          mockFrom,
    channel:       vi.fn(() => mockChannelInstance),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'user-1' } })),
}));

import { useLocalEvents } from '../../hooks/useLocalEvents.js';

// ── DB rows fixtures ──────────────────────────────────────────────────────────

const dbRow1 = {
  id: 'evt-1', title: 'Match Football', sport: 'Football',
  date: '2026-06-10T10:00:00', lat: 48.39, lng: -4.49,
  city: 'Brest', description: 'Derby', event_type: 'friendly',
  team_name: 'AS Brest', category: 'Seniors', club_id: 'club-1',
  user_id: 'user-1', score: null,
};

const dbRow2 = {
  id: 'evt-2', title: 'Match Rugby', sport: 'Rugby',
  date: '2026-06-15T14:00:00', lat: 47.99, lng: -4.10,
  city: 'Quimper', description: '', event_type: 'championship',
  team_name: '', category: '', club_id: null, user_id: 'user-2', score: null,
};

function makeQuery(result = { data: [], error: null }) {
  return {
    select:  vi.fn().mockReturnThis(),
    insert:  vi.fn().mockReturnThis(),
    update:  vi.fn().mockReturnThis(),
    delete:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    single:  vi.fn().mockResolvedValue(result),
    then:    (fn, rej) => Promise.resolve(result).then(fn, rej),
  };
}

// ── Tests — mapping DB → app ──────────────────────────────────────────────────

describe('useLocalEvents — mapFromDB (via chargement initial)', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue(makeQuery({ data: [dbRow1], error: null }));
  });

  it('mappe correctement les champs DB vers les champs app', async () => {
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const evt = result.current.events[0];
    expect(evt.id).toBe('evt-1');
    expect(evt.title).toBe('Match Football');
    expect(evt.eventType).toBe('friendly');
    expect(evt.teamName).toBe('AS Brest');
    expect(evt.clubId).toBe('club-1');
    expect(evt.userId).toBe('user-1');
    expect(evt.city).toBe('Brest');
    expect(evt.source).toBe('user');
  });

  it('fournit des valeurs par défaut pour les champs optionnels', async () => {
    mockFrom.mockReturnValue(makeQuery({
      data: [{
        ...dbRow2,
        city: null, description: null, event_type: null,
        team_name: null, category: null, club_id: null, score: null,
      }],
      error: null,
    }));

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const evt = result.current.events[0];
    expect(evt.city).toBe('');
    expect(evt.description).toBe('');
    expect(evt.eventType).toBe('friendly');
    expect(evt.teamName).toBe('');
    expect(evt.category).toBe('');
    expect(evt.clubId).toBeNull();
    expect(evt.score).toBeNull();
  });
});

describe('useLocalEvents — chargement initial', () => {
  it('commence en état loading', () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    expect(result.current.loading).toBe(true);
  });

  it('charge les événements depuis Supabase', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [dbRow1, dbRow2], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(2);
  });

  it('conserve l\'ordre renvoyé par Supabase (tri délégué à ORDER BY)', async () => {
    // Supabase renvoie déjà trié par date ASC — le hook s'y fie
    mockFrom.mockReturnValue(makeQuery({ data: [dbRow1, dbRow2], error: null }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events[0].id).toBe('evt-1'); // June 10
    expect(result.current.events[1].id).toBe('evt-2'); // June 15
  });

  it('gère une erreur Supabase sans crasher', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'Network error' } }));
    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(0);
  });
});

describe('useLocalEvents — addEvent (optimiste)', () => {
  it('ajoute l\'événement immédiatement (optimiste) puis le confirme', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [], error: null }))
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: dbRow1, error: null }),
        then:   (fn) => Promise.resolve({ data: [], error: null }).then(fn),
      });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newEvent = { title: 'Match Football', sport: 'Football', date: '2026-06-10T10:00:00', lat: 48.39, lng: -4.49 };
    let added;
    await act(async () => { added = await result.current.addEvent(newEvent); });

    expect(added.id).toBe('evt-1');
    expect(result.current.events.some(e => e.id === 'evt-1')).toBe(true);
  });

  it('rollback si Supabase échoue lors du addEvent', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [], error: null }))
      .mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } }),
        then:   (fn) => Promise.resolve({ data: [], error: null }).then(fn),
      });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newEvent = { title: 'Fail Event', sport: 'Rugby', date: '2026-06-20T10:00:00', lat: 0, lng: 0 };
    await act(async () => {
      await expect(result.current.addEvent(newEvent)).rejects.toThrow();
    });

    expect(result.current.events).toHaveLength(0);
  });
});

describe('useLocalEvents — deleteEvent (optimiste)', () => {
  it('supprime immédiatement puis confirme', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [dbRow1], error: null }))
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        then:   (fn) => Promise.resolve({ error: null }).then(fn),
      });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toHaveLength(1);

    await act(async () => { await result.current.deleteEvent('evt-1'); });
    expect(result.current.events).toHaveLength(0);
  });

  it('rollback si Supabase échoue lors du deleteEvent', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [dbRow1], error: null }))
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        then:   (fn) => Promise.resolve({ error: { message: 'forbidden' } }).then(fn),
      });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.deleteEvent('evt-1')).rejects.toThrow();
    });
    expect(result.current.events.some(e => e.id === 'evt-1')).toBe(true);
  });
});

describe('useLocalEvents — updateEvent (optimiste)', () => {
  it('met à jour immédiatement puis confirme', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [dbRow1], error: null }))
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        then:   (fn) => Promise.resolve({ error: null }).then(fn),
      });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.updateEvent('evt-1', { title: 'Titre modifié' }); });
    expect(result.current.events[0].title).toBe('Titre modifié');
  });

  it('rollback si Supabase échoue lors du updateEvent', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [dbRow1], error: null }))
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        then:   (fn) => Promise.resolve({ error: { message: 'forbidden' } }).then(fn),
      });

    const { result } = renderHook(() => useLocalEvents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.updateEvent('evt-1', { title: 'Bad update' })).rejects.toThrow();
    });
    expect(result.current.events[0].title).toBe('Match Football');
  });
});
