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

import { useClubs } from '../../hooks/useClubs.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function q(terminal) {
  const obj = {
    then:    (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select:  vi.fn(), eq: vi.fn(), order: vi.fn(),
    insert:  vi.fn(), update: vi.fn(), delete: vi.fn(),
    single:  vi.fn().mockResolvedValue(terminal),
  };
  obj.select.mockReturnValue(obj); obj.eq.mockReturnValue(obj); obj.order.mockReturnValue(obj);
  obj.insert.mockReturnValue(obj); obj.update.mockReturnValue(obj); obj.delete.mockReturnValue(obj);
  return obj;
}

function makeChannel() {
  const ch = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
  mockChannel.mockReturnValue(ch);
  return ch;
}

function dbClub(overrides = {}) {
  return {
    id: 'club-1', name: 'FC Brest', sport: 'Football', city: 'Brest',
    description: 'Un grand club', logo_url: 'https://example.com/logo.png',
    website: 'https://fcbrest.fr', phone: '0298000000', email: 'contact@fcbrest.fr',
    categories: [{ id: 'cat-1', name: 'Seniors', teams: [{ id: 'tm-1', name: 'Seniors A', level: 'D1' }] }],
    user_id: 'user-1',
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

describe('useClubs — mapFromDB', () => {
  it('mappe logo_url → logoUrl et email correctement', async () => {
    mockFrom.mockReturnValue(q({ data: [dbClub()], error: null }));
    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const club = result.current.userClubs[0];
    expect(club.logoUrl).toBe('https://example.com/logo.png');
    expect(club.email).toBe('contact@fcbrest.fr');
    expect(club.website).toBe('https://fcbrest.fr');
    expect(club.categories).toHaveLength(1);
  });
});

// ── addClub — field mapping ────────────────────────────────────────────────────

describe('addClub — mapToDB envoie logo_url et email', () => {
  it('transmet logoUrl → logo_url et email → email en DB', async () => {
    let insertedArg = null;
    let callCount = 0;

    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [], error: null }); // initial fetch
      const obj = q(null);
      obj.insert = vi.fn((arg) => { insertedArg = arg; return obj; });
      obj.single = vi.fn().mockResolvedValue({ data: dbClub({ id: 'club-new' }), error: null });
      return obj;
    });

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addClub({
        name: 'FC Brest', sport: 'Football', city: 'Brest',
        logoUrl: 'https://example.com/logo.png',
        email: 'contact@fcbrest.fr',
        categories: [],
      });
    });

    expect(insertedArg).not.toBeNull();
    expect(insertedArg.logo_url).toBe('https://example.com/logo.png');
    expect(insertedArg.email).toBe('contact@fcbrest.fr');
    expect(insertedArg.user_id).toBe('user-1');
  });

  it('logo_url est null si logoUrl absent', async () => {
    let insertedArg = null;
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [], error: null });
      const obj = q(null);
      obj.insert = vi.fn((arg) => { insertedArg = arg; return obj; });
      obj.single = vi.fn().mockResolvedValue({ data: dbClub({ id: 'club-new', logo_url: null }), error: null });
      return obj;
    });

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.addClub({ name: 'FC Brest', sport: 'Football', city: 'Brest', categories: [] }); });

    expect(insertedArg.logo_url).toBeNull();
  });

  it('retourne le club cree (pas une Promise)', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [], error: null });
      const obj = q(null);
      obj.single = vi.fn().mockResolvedValue({ data: dbClub({ id: 'club-created' }), error: null });
      return obj;
    });

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created;
    await act(async () => {
      created = await result.current.addClub({ name: 'FC Brest', sport: 'Football', city: 'Brest', categories: [] });
    });

    expect(created).toBeDefined();
    expect(created.id).toBe('club-created');
    expect(typeof created).toBe('object');
    expect(typeof created.then).toBe('undefined'); // pas une Promise
  });
});

// ── updateClub — rollback ──────────────────────────────────────────────────────

describe('updateClub — rollback si erreur', () => {
  it('restaure le club original si la mise a jour DB echoue', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [dbClub()], error: null });
      return q({ data: null, error: { message: 'RLS denied' } });
    });

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.userClubs).toHaveLength(1));

    await act(async () => {
      await expect(result.current.updateClub('club-1', { name: 'Nouveau nom' })).rejects.toThrow('RLS denied');
    });

    expect(result.current.userClubs[0].name).toBe('FC Brest');
  });
});

// ── deleteClub — rollback ──────────────────────────────────────────────────────

describe('deleteClub — rollback si erreur', () => {
  it('restitue le club si la suppression DB echoue', async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [dbClub()], error: null });
      return q({ data: null, error: { message: 'RLS denied' } });
    });

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.userClubs).toHaveLength(1));

    await act(async () => {
      await expect(result.current.deleteClub('club-1')).rejects.toThrow('RLS denied');
    });

    expect(result.current.userClubs).toHaveLength(1);
    expect(result.current.userClubs[0].id).toBe('club-1');
  });
});

// ── Realtime — canal fixe ─────────────────────────────────────────────────────

describe('Realtime — canal fixe', () => {
  it('utilise le canal fixe clubs-realtime (pas Math.random)', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));
    renderHook(() => useClubs());
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    expect(mockChannel).toHaveBeenCalledWith('clubs-realtime');
    // Verifier qu il n y a pas de suffixe aleatoire
    const calledWith = mockChannel.mock.calls[0][0];
    expect(calledWith).toBe('clubs-realtime');
    expect(calledWith).not.toMatch(/clubs-realtime-.+/);
  });
});
