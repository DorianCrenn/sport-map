import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase ─────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
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

// Chainable query builder — terminal resolves with given value
function q(terminal) {
  const p = Promise.resolve(terminal);
  return {
    select: vi.fn().mockReturnThis(),
    order:  vi.fn().mockReturnThis(),
    limit:  vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    then:   (fn, rej) => p.then(fn, rej),
    catch:  (fn)      => p.catch(fn),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

import { useClubs } from '../../hooks/useClubs.js';

describe('useClubs', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('charge les clubs normalement', async () => {
    mockFrom.mockReturnValue(q({
      data: [{ id: '1', name: 'FC Test', sport: 'Football', created_at: '2026-01-01' }],
      error: null,
    }));

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userClubs).toHaveLength(1);
    expect(result.current.userClubs[0].name).toBe('FC Test');
  });

  it('erreur Supabase → loading false, userClubs vide, pas de crash', async () => {
    mockFrom.mockReturnValue(q({ data: null, error: { message: 'permission denied' } }));

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.userClubs).toEqual([]);
  });

  it('rejet réseau → loading false (pas de spinner éternel)', async () => {
    const rejection = Promise.reject(new Error('Network error'));
    rejection.catch(() => {}); // prevent unhandled rejection warning

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      then:   (fn, rej) => rejection.then(fn, rej),
      catch:  (fn)      => rejection.catch(fn),
    });

    const { result } = renderHook(() => useClubs());
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });
    expect(result.current.userClubs).toEqual([]);
  });
});
