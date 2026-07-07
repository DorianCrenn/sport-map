/**
 * Tests useTrainingSessions — gestion des séances d'entraînement
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

import { useTrainingSessions } from '../../hooks/useTrainingSessions.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(overrides = {}) {
  return {
    id: 's-1', club_id: 'club-1', team_id: 'team-1',
    date: new Date().toISOString().slice(0, 10),
    start_time: '18:00', end_time: '19:30',
    location: 'Gymnase', status: 'active',
    ...overrides,
  };
}

function makeQuery(result = { data: [], error: null }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    gte:    vi.fn().mockReturnThis(),
    order:  vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    in:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then:   (fn) => Promise.resolve(result).then(fn),
    catch:  (fn) => Promise.resolve(result).catch(fn),
  };
}

// ── Tests — sans club ─────────────────────────────────────────────────────────

describe('useTrainingSessions — sans club', () => {
  beforeEach(() => mockFrom.mockReturnValue(makeQuery()));

  it('sessions est vide si clubId est null', async () => {
    const { result } = renderHook(() => useTrainingSessions(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toEqual([]);
  });
});

// ── Tests — chargement ────────────────────────────────────────────────────────

describe('useTrainingSessions — chargement', () => {
  it('charge les séances depuis Supabase', async () => {
    const s = makeSession();
    mockFrom.mockReturnValue(makeQuery({ data: [s], error: null }));
    const { result } = renderHook(() => useTrainingSessions('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].id).toBe('s-1');
  });

  it('sessions est vide si Supabase retourne une erreur', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'DB error' } }));
    const { result } = renderHook(() => useTrainingSessions('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toEqual([]);
  });
});

// ── Tests — createSession ─────────────────────────────────────────────────────

describe('useTrainingSessions — createSession', () => {
  it('crée une séance et l\'ajoute à la liste', async () => {
    const s = makeSession({ id: 's-new' });
    const q = makeQuery({ data: [], error: null });
    q.single = vi.fn().mockResolvedValue({ data: s, error: null });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useTrainingSessions('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created;
    await act(async () => {
      created = await result.current.createSession({
        team_id: 'team-1', date: s.date, start_time: '18:00', end_time: '19:30', location: 'Gymnase',
      });
    });
    expect(created).toEqual(s);
  });

  it('retourne null si Supabase échoue', async () => {
    const errQ = makeQuery({ data: null, error: null });
    errQ.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    mockFrom.mockReturnValue(errQ);

    const { result } = renderHook(() => useTrainingSessions('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created;
    await act(async () => {
      created = await result.current.createSession({ date: '2026-07-01' });
    });
    expect(created).toBeNull();
  });
});

// ── Tests — updateSession ─────────────────────────────────────────────────────

describe('useTrainingSessions — updateSession', () => {
  it('met à jour optimistiquement le statut', async () => {
    const s = makeSession({ id: 's-1', status: 'active' });
    const q = makeQuery({ data: [s], error: null });
    q.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useTrainingSessions('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateSession('s-1', { status: 'cancelled' });
    });
    expect(result.current.sessions.find(s => s.id === 's-1')?.status).toBe('cancelled');
  });

  it('ignore les statuts invalides', async () => {
    const s = makeSession({ id: 's-1', status: 'active' });
    mockFrom.mockReturnValue(makeQuery({ data: [s], error: null }));

    const { result } = renderHook(() => useTrainingSessions('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateSession('s-1', { status: 'invalid-status' });
    });
    // Le statut ne devrait pas changer
    expect(result.current.sessions.find(s => s.id === 's-1')?.status).toBe('active');
  });
});

// ── Tests — deleteSession ─────────────────────────────────────────────────────

describe('useTrainingSessions — deleteSession', () => {
  it('supprime une séance de la liste', async () => {
    const s = makeSession({ id: 's-1' });
    const q = makeQuery({ data: [s], error: null });
    q.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useTrainingSessions('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteSession('s-1');
    });
    expect(result.current.sessions.find(s => s.id === 's-1')).toBeUndefined();
  });

  it('supprime définitivement si la DB réussit (pas de rollback)', async () => {
    // Test simplifié : vérifier que le succès = pas de restauration
    const s = makeSession({ id: 's-2' });
    const q = makeQuery({ data: [s], error: null });
    q.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useTrainingSessions('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteSession('s-2');
    });
    // La séance n'est pas restaurée (suppression réussie)
    expect(result.current.sessions.find(s => s.id === 's-2')).toBeUndefined();
  });
});
