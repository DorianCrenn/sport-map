import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockChannel } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from:          mockFrom,
    channel:       mockChannel,
    removeChannel: vi.fn(),
  },
}));

import { useNewsFeed } from '../../hooks/useNewsFeed.js';

// ── Chainable query builder ───────────────────────────────────────────────────

let capturedSelect = null;

function q(terminal) {
  const obj = {
    then:   (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select: vi.fn((s) => { capturedSelect = s; return obj; }),
    in:     vi.fn(() => obj),
    not:    vi.fn(() => obj),
    lt:     vi.fn(() => obj),
    lte:    vi.fn(() => obj),
    gte:    vi.fn(() => obj),
    order:  vi.fn(() => obj),
    limit:  vi.fn(() => obj),
  };
  return obj;
}

function mockRealtimeChannel() {
  const ch = { on: vi.fn(), subscribe: vi.fn() };
  ch.on.mockReturnValue(ch);
  ch.subscribe.mockReturnValue(ch);
  return ch;
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedSelect = null;
  mockFrom.mockReturnValue(q({ data: [], error: null }));
  mockChannel.mockReturnValue(mockRealtimeChannel());
});

// ── hasClubs = false ──────────────────────────────────────────────────────────

describe('useNewsFeed — sans clubs', () => {
  it('ne déclenche aucune requête Supabase si followedClubIds=[]', () => {
    renderHook(() => useNewsFeed({ followedClubIds: [] }));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('loading est false quand hasClubs=false', () => {
    const { result } = renderHook(() => useNewsFeed({ followedClubIds: [] }));
    expect(result.current.loading).toBe(false);
  });

  it('retourne hasClubs=false', () => {
    const { result } = renderHook(() => useNewsFeed({ followedClubIds: [] }));
    expect(result.current.hasClubs).toBe(false);
  });
});

// ── Régression : pas de clubs() join sur events ────────────────────────────────
// events.club_id est TEXT, clubs.id est UUID → pas de FK déclarée → 400 PostgREST

describe('useNewsFeed — structure query events (régression 400)', () => {
  it('le select events ne contient PAS clubs(name,', async () => {
    const selects = [];
    mockFrom.mockImplementation(() => {
      const obj = q({ data: [], error: null });
      const orig = obj.select.bind(obj);
      obj.select = vi.fn((s) => { selects.push(s); return orig(s); });
      return obj;
    });

    renderHook(() => useNewsFeed({ followedClubIds: ['c1'] }));
    await waitFor(() => expect(selects.length).toBeGreaterThan(0));

    const eventsSelects = selects.filter(s => s.includes('title') && s.includes('sport') && s.includes('date'));
    eventsSelects.forEach(s => {
      expect(s).not.toMatch(/clubs\s*\(/);
    });
  });
});

// ── Avec clubs ────────────────────────────────────────────────────────────────

describe('useNewsFeed — avec clubs', () => {
  it('loading=false après chargement', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));
    mockChannel.mockReturnValue(mockRealtimeChannel());

    const { result } = renderHook(() => useNewsFeed({ followedClubIds: ['c1'] }));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('retourne hasClubs=true', async () => {
    const { result } = renderHook(() => useNewsFeed({ followedClubIds: ['c1'] }));
    expect(result.current.hasClubs).toBe(true);
  });
});
