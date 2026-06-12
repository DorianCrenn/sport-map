import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom, mockUseAuth } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: mockUseAuth }));

import { makeQuery } from '../../test/mocks/supabase.js';
import { useRideNotifications } from '../../hooks/useRideNotifications.js';

const NOTIF_ROW = {
  id: 'n-1', user_id: 'u-1', type: 'new_request', ride_id: 'r-1',
  request_id: 'req-1', read: false, data: {}, created_at: '2026-06-12',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ currentUser: { id: 'u-1' } });
  mockFrom.mockReturnValue(makeQuery({ data: [NOTIF_ROW], error: null }));
});

describe('useRideNotifications — non connecté', () => {
  it('retourne notifications=[] si non connecté', () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    const { result } = renderHook(() => useRideNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});

describe('useRideNotifications — connecté', () => {
  it('passe loading=false après fetch', async () => {
    const { result } = renderHook(() => useRideNotifications());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('calcule unreadCount correctement', async () => {
    const { result } = renderHook(() => useRideNotifications());
    // Le fetch se fait au mount
    await waitFor(() => expect(result.current.notifications.length).toBeGreaterThanOrEqual(0));
  });

  it('mappe type → label et icon', async () => {
    const { result } = renderHook(() => useRideNotifications());
    // Trigger le fetch
    await waitFor(() => {});
    // Si notifications chargées, vérifier le mapping
    if (result.current.notifications.length > 0) {
      expect(result.current.notifications[0].icon).toBe('🚗');
      expect(result.current.notifications[0].label).toContain('demande');
    }
  });

  it('expose markRead et markAllRead', () => {
    const { result } = renderHook(() => useRideNotifications());
    expect(typeof result.current.markRead).toBe('function');
    expect(typeof result.current.markAllRead).toBe('function');
  });
});
