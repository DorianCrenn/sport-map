/**
 * Tests useClubNotifications — notifications in-app pour les clubs
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn());
const mockChannel = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: vi.fn(),
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'user-1' } })),
}));

import { useClubNotifications } from '../../hooks/useClubNotifications.js';

function makeChain(result) {
  const p = Promise.resolve(result);
  const obj = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    order:  vi.fn().mockReturnThis(),
    limit:  vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    then:   (fn, rej) => p.then(fn, rej),
    catch:  (fn)      => p.catch(fn),
  };
  return obj;
}

function setupChannel() {
  const channelObj = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  };
  mockChannel.mockReturnValue(channelObj);
  return channelObj;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubNotifications', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockChannel.mockReset();
    setupChannel();
  });

  it('charge les notifications depuis Supabase', async () => {
    const notifs = [
      { id: 'n1', type: 'club_verified', title: 'Club vérifié', read: false, created_at: '2026-06-01' },
      { id: 'n2', type: 'new_club_pending', title: 'Nouveau club', read: true, created_at: '2026-06-01' },
    ];
    mockFrom.mockReturnValue(makeChain({ data: notifs, error: null }));

    const { result } = renderHook(() => useClubNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('unreadCount = 0 si toutes les notifs sont lues', async () => {
    mockFrom.mockReturnValue(makeChain({
      data: [
        { id: 'n1', type: 'club_verified', title: 'OK', read: true, created_at: '2026-06-01' },
      ],
      error: null,
    }));

    const { result } = renderHook(() => useClubNotifications());
    await waitFor(() => !result.current.loading);
    expect(result.current.unreadCount).toBe(0);
  });

  it('markAsRead met à jour localement et appelle Supabase', async () => {
    const notifs = [{ id: 'n1', type: 'club_verified', title: 'OK', read: false, created_at: '2026-06-01' }];
    const chain = makeChain({ data: notifs, error: null });
    const updateChain = makeChain({ error: null });
    updateChain.update = vi.fn().mockReturnValue(makeChain({ error: null }));

    mockFrom
      .mockReturnValueOnce(chain)
      .mockReturnValue(updateChain);

    const { result } = renderHook(() => useClubNotifications());
    await waitFor(() => !result.current.loading);

    await act(async () => {
      await result.current.markAsRead('n1');
    });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('erreur Supabase → notifications vide, pas de crash', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'permission denied' } }));

    const { result } = renderHook(() => useClubNotifications());
    await waitFor(() => !result.current.loading);

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('pas de fetch si currentUser est null', async () => {
    const { useAuth } = await import('../../contexts/AuthContext.jsx');
    useAuth.mockReturnValueOnce({ currentUser: null });

    const { result } = renderHook(() => useClubNotifications());
    // Loading ne devrait jamais passer à true pour un user non connecté
    expect(result.current.notifications).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
