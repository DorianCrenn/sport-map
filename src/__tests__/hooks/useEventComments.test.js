import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockGetUser, mockChannel, mockRemoveChannel, mockUseAuth } = vi.hoisted(() => ({
  mockFrom:          vi.fn(),
  mockGetUser:       vi.fn().mockResolvedValue({ data: { user: null } }),
  mockChannel:       vi.fn(),
  mockRemoveChannel: vi.fn(),
  mockUseAuth:       vi.fn(() => ({ currentUser: null, isLoggedIn: false })),
}));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from:          mockFrom,
    auth:          { getUser: mockGetUser },
    channel:       mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

import { useEventComments } from '../../hooks/useEventComments.js';

// ── Chainable query builder ───────────────────────────────────────────────────

function q(terminal) {
  const obj = {
    then:        (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select:      vi.fn(),
    eq:          vi.fn(),
    order:       vi.fn(),
    limit:       vi.fn(),
    insert:      vi.fn(),
    delete:      vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(terminal),
  };
  obj.select.mockReturnValue(obj);
  obj.eq.mockReturnValue(obj);
  obj.order.mockReturnValue(obj);
  obj.limit.mockReturnValue(obj);
  obj.insert.mockReturnValue(obj);
  obj.delete.mockReturnValue(obj);
  return obj;
}

function makeChannel() {
  const ch = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
  mockChannel.mockReturnValue(ch);
  return ch;
}

// Sample comment rows
function makeComment(overrides = {}) {
  return {
    id: 'c1',
    content: 'Super match !',
    created_at: new Date().toISOString(),
    user_id: 'u1',
    profiles: { name: 'Alice' },
    ...overrides,
  };
}

beforeEach(() => {
  mockFrom.mockReset();
  mockGetUser.mockReset().mockResolvedValue({ data: { user: null } });
  mockChannel.mockReset();
  mockRemoveChannel.mockReset();
  mockUseAuth.mockReturnValue({ currentUser: null, isLoggedIn: false });
  makeChannel();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useEventComments — initial state', () => {
  it('loading passe a false et comments est vide quand aucune donnee', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.comments).toEqual([]);
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('charge les commentaires existants depuis event_comments', async () => {
    const comment = makeComment();
    mockFrom.mockReturnValue(q({ data: [comment], error: null }));

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0].content).toBe('Super match !');
  });

  it('loading passe a false immediatement quand eventId est null', async () => {
    const { result } = renderHook(() => useEventComments(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toEqual([]);
  });
});

describe('useEventComments — isLoggedIn', () => {
  it('isLoggedIn est true quand un user est connecte', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' }, isLoggedIn: true });
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.isLoggedIn).toBe(true));
  });
});

describe('useEventComments — addComment', () => {
  it('addComment retourne error invalid si non connecte', async () => {
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res;
    await act(async () => { res = await result.current.addComment('Bonjour'); });
    expect(res).toEqual({ error: 'invalid' });
  });

  it('addComment retourne error invalid si contenu vide', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res;
    await act(async () => { res = await result.current.addComment('   '); });
    expect(res).toEqual({ error: 'invalid' });
  });

  it('addComment retourne error invalid si contenu > 500 chars', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const longText = 'a'.repeat(501);
    let res;
    await act(async () => { res = await result.current.addComment(longText); });
    expect(res).toEqual({ error: 'invalid' });
  });

  it('addComment ajoute un commentaire optimiste puis le remplace par le vrai', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' }, isLoggedIn: true });

    const realComment = makeComment({ id: 'c-real', content: 'Bravo !' });

    // First call = initial load (returns array), second call = insert (maybeSingle returns single row)
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // initial load resolves as { data: [], error: null }
        return q({ data: [], error: null });
      }
      // insert: override maybeSingle to return the real comment
      const obj = q({ data: realComment, error: null });
      obj.maybeSingle = vi.fn().mockResolvedValue({ data: realComment, error: null });
      return obj;
    });

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.addComment('Bravo !'); });

    expect(result.current.comments.some(c => c.id === 'c-real')).toBe(true);
    expect(result.current.comments.every(c => !c._temp)).toBe(true);
  });

  it('addComment retire le commentaire temporaire si erreur serveur', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' }, isLoggedIn: true });

    // First call (load) returns empty, second call (insert) returns error
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return q({ data: [], error: null }); // initial load
      // insert returns error via maybeSingle
      const obj = q({ data: null, error: { message: 'RLS denied' } });
      obj.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } });
      return obj;
    });

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let res;
    await act(async () => { res = await result.current.addComment('Bravo !'); });

    expect(res.error).toBe('RLS denied');
    expect(result.current.comments.every(c => !c._temp)).toBe(true);
    expect(result.current.comments).toHaveLength(0);
  });
});

describe('useEventComments — deleteComment', () => {
  it('deleteComment retire le commentaire immediatement (optimiste)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' }, isLoggedIn: true });
    const comment = makeComment({ id: 'c1', user_id: 'u1' });
    mockFrom.mockReturnValue(q({ data: [comment], error: null }));

    const { result } = renderHook(() => useEventComments('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    await act(async () => { await result.current.deleteComment('c1'); });

    expect(result.current.comments).toHaveLength(0);
  });
});
