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
