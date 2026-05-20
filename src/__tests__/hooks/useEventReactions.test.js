import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockGetUser, mockChannel, mockRemoveChannel } = vi.hoisted(() => ({
  mockFrom:          vi.fn(),
  mockGetUser:       vi.fn().mockResolvedValue({ data: { user: null } }),
  mockChannel:       vi.fn(),
  mockRemoveChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from:          mockFrom,
    auth:          { getUser: mockGetUser },
    channel:       mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

import { useEventReactions, REACTION_EMOJIS } from '../../hooks/useEventReactions.js';

// ── Helper : query-builder entièrement chaînable ──────────────────────────────

/**
 * Retourne un objet qui se chaîne (select, eq, delete, insert)
 * et se résout comme une Promise avec `terminal`.
 */
function q(terminal) {
  const obj = {
    then:   (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select: vi.fn(),
    eq:     vi.fn(),
    delete: vi.fn(),
    insert: vi.fn().mockResolvedValue(terminal),
  };
  obj.select.mockReturnValue(obj);
  obj.eq.mockReturnValue(obj);
  obj.delete.mockReturnValue(obj);
  return obj;
}

function makeChannel() {
  const ch = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
  mockChannel.mockReturnValue(ch);
  return ch;
}

beforeEach(() => {
  mockFrom.mockReset();
  mockGetUser.mockReset().mockResolvedValue({ data: { user: null } });
  mockChannel.mockReset();
  mockRemoveChannel.mockReset();
  makeChannel();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('REACTION_EMOJIS', () => {
  it('contient exactement les 3 emojis supportes', () => {
    expect(REACTION_EMOJIS).toEqual(['👏', '🔥', '💪']);
  });
});

describe('useEventReactions — utilisateur non connecte', () => {
  it('isLoggedIn est false quand aucun user', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventReactions('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.mine.size).toBe(0);
  });

  it('counts initialises a 0 quand aucune reaction en base', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventReactions('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.counts).toEqual({ '👏': 0, '🔥': 0, '💪': 0 });
  });

  it('mappe les counts depuis event_reaction_counts', async () => {
    const agg = [{ emoji: '👏', count: 5 }, { emoji: '🔥', count: 2 }];
    mockFrom.mockReturnValue(q({ data: agg, error: null }));

    const { result } = renderHook(() => useEventReactions('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.counts['👏']).toBe(5);
    expect(result.current.counts['🔥']).toBe(2);
    expect(result.current.counts['💪']).toBe(0);
  });
});

describe('useEventReactions — toggle (optimiste)', () => {
  it('ne fait rien si pas connecte', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventReactions('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.toggle('👏'); });

    expect(result.current.mine.size).toBe(0);
    expect(result.current.counts['👏']).toBe(0);
  });

  it('ajoute un emoji dans mine immediatement (optimiste)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    // Tous les appels retournent un q vide (pas de réactions initiales)
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventReactions('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.toggle('👏'); });

    expect(result.current.mine.has('👏')).toBe(true);
    expect(result.current.counts['👏']).toBe(1);
  });

  it('retire un emoji de mine si deja present (optimiste)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    // agg: 🔥=3, own: [🔥]
    mockFrom.mockImplementation((table) => {
      if (table === 'event_reaction_counts') return q({ data: [{ emoji: '🔥', count: 3 }], error: null });
      return q({ data: [{ emoji: '🔥' }], error: null }); // event_reactions (own + delete)
    });

    const { result } = renderHook(() => useEventReactions('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.mine.has('🔥')).toBe(true));

    await act(async () => { await result.current.toggle('🔥'); });

    expect(result.current.mine.has('🔥')).toBe(false);
    expect(result.current.counts['🔥']).toBe(2);
  });
});

describe('useEventReactions — sans eventId', () => {
  it('loading passe a false et ne crash pas', async () => {
    const { result } = renderHook(() => useEventReactions(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.counts).toEqual({ '👏': 0, '🔥': 0, '💪': 0 });
  });
});
