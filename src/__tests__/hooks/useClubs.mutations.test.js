/**
 * Tests useClubs — nouveaux champs post-migration + mutations admin
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn());
const mockFunctionsInvoke = vi.hoisted(() => vi.fn());
const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
    auth: { getSession: mockGetSession },
    functions: { invoke: mockFunctionsInvoke },
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: { id: 'user-abc' } }),
}));

function makeChain(result) {
  const p = Promise.resolve(result);
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    order:  vi.fn().mockReturnThis(),
    limit:  vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue(Promise.resolve(result)),
    then:   (fn, rej) => p.then(fn, rej),
    catch:  (fn)      => p.catch(fn),
  };
}

import { useClubs } from '../../hooks/useClubs.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubs — mapFromDB nouveaux champs', () => {
  beforeEach(() => { mockFrom.mockReset(); });

  it('mapFromDB inclut status, sigle, primaryColor et les champs contact', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [{
        id: 'club-1', name: 'FC Test', sport: 'Football', city: 'Brest',
        status: 'pending_verification',
        sigle: 'FCT',
        primary_color: '#003087',
        manager_name: 'Jean Dupont',
        manager_function: 'Président',
        postal_code: '29200',
        region: 'Bretagne',
        facebook: 'facebook.com/fctest',
        created_at: '2026-01-01',
      }],
      error: null,
    }));

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.userClubs).toHaveLength(1));

    const club = result.current.userClubs[0];
    expect(club.status).toBe('pending_verification');
    expect(club.sigle).toBe('FCT');
    expect(club.primaryColor).toBe('#003087');
    expect(club.managerName).toBe('Jean Dupont');
    expect(club.postalCode).toBe('29200');
    expect(club.region).toBe('Bretagne');
    expect(club.facebook).toBe('facebook.com/fctest');
  });

  it('status par défaut est pending_verification si absent', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [{ id: 'club-2', name: 'FC Inconnu', sport: 'Football', created_at: '2026-01-01' }],
      error: null,
    }));

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.userClubs).toHaveLength(1));
    expect(result.current.userClubs[0].status).toBe('pending_verification');
  });
});

describe('useClubs — mutations admin', () => {
  const CLUB_ROW = { id: 'club-1', name: 'FC Test', sport: 'Football', status: 'pending_verification', created_at: '2026-01-01' };

  beforeEach(() => {
    mockFrom.mockReset();
    // Premier appel = fetch initial, tous les suivants = update (no error)
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [CLUB_ROW], error: null }))
      .mockReturnValue(makeChain({ error: null }));
  });

  it('verifyClub met à jour le statut vers verified localement', async () => {
    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userClubs).toHaveLength(1);

    await act(async () => {
      await result.current.verifyClub('club-1', 'OK');
    });

    expect(result.current.userClubs.find(c => c.id === 'club-1')?.status).toBe('verified');
  });

  it('rejectClub met à jour le statut vers rejected localement', async () => {
    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.rejectClub('club-1', 'Infos insuffisantes');
    });

    expect(result.current.userClubs.find(c => c.id === 'club-1')?.status).toBe('rejected');
  });

  it('suspendClub met à jour le statut vers suspended', async () => {
    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.suspendClub('club-1', 'Violation CGU');
    });

    expect(result.current.userClubs.find(c => c.id === 'club-1')?.status).toBe('suspended');
  });

  it('addClubAndNotify est une fonction exposée par le hook', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
      .mockReturnValue(makeChain({ error: null }));

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.addClubAndNotify).toBe('function');
  });
});
