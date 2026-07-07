/**
 * Tests useClubPlayers — gestion des joueurs d'un club
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: { from: mockFrom },
}));

import { useClubPlayers } from '../../hooks/useClubPlayers.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePlayer(overrides = {}) {
  return {
    id: 'p-1', club_id: 'club-1', team_id: 'team-1',
    name: 'Jean Dupont', number: 10, position: 'Attaquant',
    photo_url: null, email: 'jean@test.fr', user_id: null, is_active: true,
    ...overrides,
  };
}

function makeQuery(result = { data: [], error: null }) {
  return {
    select:   vi.fn().mockReturnThis(),
    eq:       vi.fn().mockReturnThis(),
    order:    vi.fn().mockReturnThis(),
    insert:   vi.fn().mockReturnThis(),
    update:   vi.fn().mockReturnThis(),
    delete:   vi.fn().mockReturnThis(),
    in:       vi.fn().mockReturnThis(),
    single:   vi.fn().mockResolvedValue(result),
    then:     (fn) => Promise.resolve(result).then(fn),
  };
}

function renderPlayers(clubId = 'club-1', teamId = null) {
  return renderHook(() => useClubPlayers(clubId, teamId));
}

// ── Tests — état initial ───────────────────────────────────────────────────────

describe('useClubPlayers — sans club', () => {
  beforeEach(() => mockFrom.mockReturnValue(makeQuery()));

  it('players est vide si clubId est null', async () => {
    const { result } = renderHook(() => useClubPlayers(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.players).toEqual([]);
  });

  it('loading passe à false immédiatement si pas de clubId', async () => {
    const { result } = renderHook(() => useClubPlayers(''));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('useClubPlayers — chargement', () => {
  it('charge les joueurs depuis Supabase', async () => {
    const p = makePlayer();
    mockFrom.mockReturnValue(makeQuery({ data: [p], error: null }));
    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.players).toEqual([p]);
  });

  it('players vide si Supabase retourne une erreur', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'DB error' } }));
    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.players).toEqual([]);
  });

  it('claims vide par défaut', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.claims).toEqual([]);
  });
});

// ── Tests — addPlayer ─────────────────────────────────────────────────────────

describe('useClubPlayers — addPlayer', () => {
  it('retourne null si name est vide', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));

    let added;
    await act(async () => {
      added = await result.current.addPlayer({ name: '  ', number: 7 });
    });
    expect(added).toBeNull();
  });

  it('ajoute un joueur et met à jour la liste', async () => {
    const newPlayer = makePlayer({ id: 'p-new', name: 'Marie Martin', number: 7 });
    const selectQuery = makeQuery({ data: [], error: null });
    const insertQuery = { ...makeQuery({ data: newPlayer, error: null }), select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: newPlayer, error: null }) };

    mockFrom
      .mockReturnValueOnce(selectQuery) // initial load players (returns [])
      .mockReturnValueOnce(selectQuery) // loadClaims: get player ids (returns [] → stops early, no 3rd query)
      .mockReturnValue(insertQuery);     // addPlayer

    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));

    let added;
    await act(async () => {
      added = await result.current.addPlayer({ name: 'Marie Martin', number: 7 });
    });
    expect(added).toEqual(newPlayer);
    expect(result.current.players.some(p => p.id === 'p-new')).toBe(true);
  });
});

// ── Tests — updatePlayer ──────────────────────────────────────────────────────

describe('useClubPlayers — updatePlayer', () => {
  it('met à jour un joueur optimistiquement', async () => {
    const p = makePlayer({ id: 'p-1', position: 'Gardien' });
    const q = makeQuery({ data: [p], error: null });
    q.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue(q);

    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updatePlayer('p-1', { position: 'Milieu' });
    });
    expect(result.current.players.find(p => p.id === 'p-1')?.position).toBe('Milieu');
  });
});

// ── Tests — removePlayer ──────────────────────────────────────────────────────

describe('useClubPlayers — removePlayer', () => {
  it('supprime un joueur de la liste (soft delete)', async () => {
    const p = makePlayer({ id: 'p-1' });
    const q = makeQuery({ data: [p], error: null });
    q.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue(q);

    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removePlayer('p-1');
    });
    expect(result.current.players.find(p => p.id === 'p-1')).toBeUndefined();
  });
});

// ── Tests — approveClaim / rejectClaim ────────────────────────────────────────

describe('useClubPlayers — gestion des claims', () => {
  it('approveClaim retourne true et retire la demande', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updateQ = { ...makeQuery({ error: null }), eq: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(updateQ);

    let ok;
    await act(async () => {
      ok = await result.current.approveClaim('claim-1');
    });
    expect(ok).toBe(true);
  });

  it('rejectClaim retourne true', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updateQ = { ...makeQuery({ error: null }), eq: vi.fn().mockResolvedValue({ error: null }) };
    mockFrom.mockReturnValue(updateQ);

    let ok;
    await act(async () => {
      ok = await result.current.rejectClaim('claim-1');
    });
    expect(ok).toBe(true);
  });

  it('approveClaim retourne false si Supabase échoue', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderPlayers();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updateQ = { ...makeQuery({ error: { message: 'fail' } }), eq: vi.fn().mockResolvedValue({ error: { message: 'fail' } }) };
    mockFrom.mockReturnValue(updateQ);

    let ok;
    await act(async () => {
      ok = await result.current.approveClaim('claim-1');
    });
    expect(ok).toBe(false);
  });
});
