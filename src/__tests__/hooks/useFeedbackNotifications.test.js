/**
 * Tests useFeedbackNotifications — notifications in-app changements de statut
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: { from: mockFrom },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: mockUseAuth,
}));

import { useFeedbackNotifications } from '../../hooks/useFeedbackNotifications.js';

const FAKE_USER = { id: 'user-42' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSelectQuery(data = []) {
  return {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    order:  vi.fn().mockReturnThis(),
    limit:  vi.fn().mockResolvedValue({ data }),
  };
}

// Chaîne pour markRead : .update({read:true}).eq('id', id).eq('user_id', uid)
// Deux .eq() enchaînés → chacun doit retourner un objet avec .eq()
function makeUpdateChain() {
  const chain = {
    update: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
  };
  // Le dernier .eq() doit retourner une promesse (await dans le hook)
  // On utilise une implémentation qui retourne this jusqu'au dernier appel
  let callCount = 0;
  chain.eq = vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount >= 2) return Promise.resolve({ error: null });
    return chain;
  });
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ currentUser: FAKE_USER });
});

// ── État initial ──────────────────────────────────────────────────────────────

describe('useFeedbackNotifications — état initial', () => {
  it('retourne une liste vide et unreadCount=0 avant chargement', () => {
    mockFrom.mockReturnValue(makeSelectQuery([]));
    const { result } = renderHook(() => useFeedbackNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('ne charge rien si currentUser est null', () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    renderHook(() => useFeedbackNotifications());
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('expose fetch, markRead, markAllRead', () => {
    mockFrom.mockReturnValue(makeSelectQuery([]));
    const { result } = renderHook(() => useFeedbackNotifications());
    expect(typeof result.current.fetch).toBe('function');
    expect(typeof result.current.markRead).toBe('function');
    expect(typeof result.current.markAllRead).toBe('function');
  });
});

// ── Chargement ────────────────────────────────────────────────────────────────

describe('useFeedbackNotifications — fetch', () => {
  it('charge les notifications et calcule unreadCount', async () => {
    const notifs = [
      { id: 'n1', feedback_title: 'Bug login', feedback_type: 'bug', new_status: 'in_dev', read: false, created_at: new Date().toISOString() },
      { id: 'n2', feedback_title: 'Idée dark mode', feedback_type: 'idea', new_status: 'resolved', read: true, created_at: new Date().toISOString() },
      { id: 'n3', feedback_title: 'Question FAQ', feedback_type: 'question', new_status: 'planned', read: false, created_at: new Date().toISOString() },
    ];
    mockFrom.mockReturnValue(makeSelectQuery(notifs));

    const { result } = renderHook(() => useFeedbackNotifications());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.unreadCount).toBe(2);
  });

  it('loaded passe à true après le premier chargement', async () => {
    mockFrom.mockReturnValue(makeSelectQuery([]));
    const { result } = renderHook(() => useFeedbackNotifications());
    await waitFor(() => expect(result.current.loaded).toBe(true));
  });
});

// ── markRead ──────────────────────────────────────────────────────────────────

describe('useFeedbackNotifications — markRead', () => {
  it('marque une notification comme lue et décrémente unreadCount', async () => {
    const notifs = [
      { id: 'n1', feedback_title: 'Test', feedback_type: 'bug', new_status: 'in_dev', read: false, created_at: new Date().toISOString() },
    ];
    mockFrom
      .mockReturnValueOnce(makeSelectQuery(notifs))
      .mockReturnValueOnce(makeUpdateChain());

    const { result } = renderHook(() => useFeedbackNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(async () => { await result.current.markRead('n1'); });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });
});

// ── markAllRead ───────────────────────────────────────────────────────────────

describe('useFeedbackNotifications — markAllRead', () => {
  it('marque toutes les notifications comme lues', async () => {
    const notifs = [
      { id: 'n1', read: false, feedback_title: 'A', feedback_type: 'bug', new_status: 'in_dev', created_at: new Date().toISOString() },
      { id: 'n2', read: false, feedback_title: 'B', feedback_type: 'idea', new_status: 'planned', created_at: new Date().toISOString() },
    ];

    // markAllRead : .update({read:true}).eq('user_id', uid).eq('read', false)
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    };
    let eqCalls = 0;
    updateChain.eq = vi.fn().mockImplementation(() => {
      eqCalls++;
      if (eqCalls >= 2) return Promise.resolve({ error: null });
      return updateChain;
    });

    mockFrom
      .mockReturnValueOnce(makeSelectQuery(notifs))
      .mockReturnValueOnce(updateChain);

    const { result } = renderHook(() => useFeedbackNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(2));

    await act(async () => { await result.current.markAllRead(); });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every(n => n.read)).toBe(true);
  });
});
