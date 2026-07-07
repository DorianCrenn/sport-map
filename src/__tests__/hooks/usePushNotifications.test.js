import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const {
  mockGetPushSubscription,
  mockSubscribeToPush,
  mockUnsubscribeFromPush,
  mockGetUser,
} = vi.hoisted(() => ({
  mockGetPushSubscription:  vi.fn(),
  mockSubscribeToPush:      vi.fn(),
  mockUnsubscribeFromPush:  vi.fn(),
  mockGetUser:              vi.fn(),
}));

vi.mock('../../lib/pushNotifications.js', () => ({
  getPushSubscription:  mockGetPushSubscription,
  subscribeToPush:      mockSubscribeToPush,
  unsubscribeFromPush:  mockUnsubscribeFromPush,
}));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: { auth: { getUser: mockGetUser } },
}));

import { usePushNotifications } from '../../hooks/usePushNotifications.js';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'Notification', {
    value: { permission: 'default' },
    configurable: true,
    writable: true,
  });
  mockGetPushSubscription.mockResolvedValue(null);
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePushNotifications — état initial', () => {
  it('démarre en loading=true', () => {
    mockGetPushSubscription.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePushNotifications());
    expect(result.current.loading).toBe(true);
  });

  it('loading=false après résolution, subscribed=false sans souscription', async () => {
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subscribed).toBe(false);
  });

  it('subscribed=true si une souscription existe', async () => {
    mockGetPushSubscription.mockResolvedValue({ endpoint: 'https://push.example.com/x' });
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subscribed).toBe(true);
  });

  it('subscribed=false si getPushSubscription rejette', async () => {
    mockGetPushSubscription.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subscribed).toBe(false);
  });

  it('permission reflète Notification.permission', async () => {
    window.Notification.permission = 'granted';
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.permission).toBe('granted');
  });
});

describe('usePushNotifications — toggle (abonnement)', () => {
  it('appelle subscribeToPush et passe subscribed=true', async () => {
    mockSubscribeToPush.mockResolvedValue({});
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.toggle(); });

    expect(mockSubscribeToPush).toHaveBeenCalledWith('user-1');
    expect(result.current.subscribed).toBe(true);
    expect(result.current.permission).toBe('granted');
  });

  it('expose error si subscribeToPush échoue', async () => {
    mockSubscribeToPush.mockRejectedValue(new Error('Permission denied'));
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.toggle(); });

    expect(result.current.error).toBe('Permission denied');
    expect(result.current.subscribed).toBe(false);
  });
});

describe('usePushNotifications — toggle (désabonnement)', () => {
  it('appelle unsubscribeFromPush et passe subscribed=false', async () => {
    mockGetPushSubscription.mockResolvedValue({ endpoint: 'https://x' });
    mockUnsubscribeFromPush.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subscribed).toBe(true);

    await act(async () => { await result.current.toggle(); });

    expect(mockUnsubscribeFromPush).toHaveBeenCalledWith('user-1');
    expect(result.current.subscribed).toBe(false);
  });

  it('expose error si unsubscribeFromPush échoue', async () => {
    mockGetPushSubscription.mockResolvedValue({ endpoint: 'https://x' });
    mockUnsubscribeFromPush.mockRejectedValue(new Error('SW error'));

    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.toggle(); });

    expect(result.current.error).toBe('SW error');
  });
});

describe('usePushNotifications — utilisateur non connecté', () => {
  it('expose error "Non connecté" si getUser retourne null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.toggle(); });

    expect(result.current.error).toBe('Non connecté');
    expect(mockSubscribeToPush).not.toHaveBeenCalled();
  });
});
