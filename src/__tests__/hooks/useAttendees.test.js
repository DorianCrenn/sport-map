import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockUseAuth } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: mockUseAuth,
}));

import { useAttendees } from '../../hooks/useAttendees.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQuery(result = { data: [], error: null }) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    then:   (fn, rej) => Promise.resolve(result).then(fn, rej),
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ currentUser: null });
  mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
});

// ── Tests — non connecté ──────────────────────────────────────────────────────

describe('useAttendees — non connecté (localStorage)', () => {
  it('attending est un Set vide par défaut', () => {
    const { result } = renderHook(() => useAttendees());
    expect(result.current.attending).toBeInstanceOf(Set);
    expect(result.current.attending.size).toBe(0);
  });

  it('isAttending retourne false si event non présent', () => {
    const { result } = renderHook(() => useAttendees());
    expect(result.current.isAttending('evt-1')).toBe(false);
  });

  it('toggle ajoute l\'event_id dans attending', async () => {
    const { result } = renderHook(() => useAttendees());
    await act(async () => { await result.current.toggle('evt-42'); });
    expect(result.current.attending.has('evt-42')).toBe(true);
  });

  it('double toggle supprime l\'event_id', async () => {
    const { result } = renderHook(() => useAttendees());
    await act(async () => { await result.current.toggle('evt-42'); });
    await act(async () => { await result.current.toggle('evt-42'); });
    expect(result.current.attending.has('evt-42')).toBe(false);
  });

  it('toggle persist dans localStorage sans user', async () => {
    const { result } = renderHook(() => useAttendees());
    await act(async () => { await result.current.toggle('evt-99'); });
    const stored = JSON.parse(localStorage.getItem('sl_attending_anon') ?? '[]');
    expect(stored).toContain('evt-99');
  });

  it('ne fait pas appel à Supabase si non connecté', async () => {
    const { result } = renderHook(() => useAttendees());
    await act(async () => { await result.current.toggle('evt-5'); });
    // insert/delete ne doivent pas être appelés
    expect(mockFrom).not.toHaveBeenCalledWith('attendees');
  });
});

// ── Tests — connecté ──────────────────────────────────────────────────────────

describe('useAttendees — connecté', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'user-1' } });
  });

  it('charge les attendees depuis Supabase au mount', async () => {
    mockFrom.mockReturnValue(makeQuery({
      data: [{ event_id: 'evt-server-1' }],
      error: null,
    }));
    const { result } = renderHook(() => useAttendees());
    await waitFor(() => expect(result.current.attending.has('evt-server-1')).toBe(true));
  });

  it('isAttending retourne true pour un event chargé depuis Supabase', async () => {
    mockFrom.mockReturnValue(makeQuery({
      data: [{ event_id: 'evt-server-2' }],
      error: null,
    }));
    const { result } = renderHook(() => useAttendees());
    await waitFor(() => expect(result.current.isAttending('evt-server-2')).toBe(true));
  });

  it('toggle appelle Supabase INSERT pour ajouter', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderHook(() => useAttendees());
    await waitFor(() => {});
    await act(async () => { await result.current.toggle('evt-new'); });
    expect(mockFrom).toHaveBeenCalledWith('attendees');
  });

  it('toggle appelle Supabase DELETE pour retirer', async () => {
    mockFrom.mockReturnValue(makeQuery({
      data: [{ event_id: 'evt-del' }],
      error: null,
    }));
    const { result } = renderHook(() => useAttendees());
    await waitFor(() => expect(result.current.attending.has('evt-del')).toBe(true));
    await act(async () => { await result.current.toggle('evt-del'); });
    expect(result.current.attending.has('evt-del')).toBe(false);
  });

  it('rollback optimiste si Supabase INSERT échoue', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [], error: null }))
      .mockReturnValue(makeQuery({ data: null, error: { message: 'RLS denied' } }));
    const { result } = renderHook(() => useAttendees());
    await waitFor(() => {});
    await act(async () => { await result.current.toggle('evt-fail'); });
    // Après rollback, l'event ne doit pas être dans attending
    await waitFor(() => expect(result.current.attending.has('evt-fail')).toBe(false));
  });

  it('fallback localStorage si fetch Supabase échoue', async () => {
    localStorage.setItem('sl_attending_user-1', JSON.stringify(['evt-cached']));
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'network error' } }));
    const { result } = renderHook(() => useAttendees());
    await waitFor(() => expect(result.current.attending.has('evt-cached')).toBe(true));
  });
});

// ── Tests — isAttending ───────────────────────────────────────────────────────

describe('useAttendees — isAttending', () => {
  it('isAttending est une fonction', () => {
    const { result } = renderHook(() => useAttendees());
    expect(typeof result.current.isAttending).toBe('function');
  });

  it('attending est un Set', () => {
    const { result } = renderHook(() => useAttendees());
    expect(result.current.attending).toBeInstanceOf(Set);
  });
});
