import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom, mockUseAuth } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: mockUseAuth }));

import { makeQuery } from '../../test/mocks/supabase.js';
import { useMyAnnouncements } from '../../hooks/useMyAnnouncements.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
});

describe('useMyAnnouncements — non connecté', () => {
  it('retourne announcements=[] si non connecté', async () => {
    mockUseAuth.mockReturnValue({ currentUser: null, follows: [] });
    const { result } = renderHook(() => useMyAnnouncements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements).toEqual([]);
  });

  it('retourne announcements=[] si aucun club suivi', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u-1' }, follows: [] });
    const { result } = renderHook(() => useMyAnnouncements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements).toEqual([]);
  });
});

describe('useMyAnnouncements — connecté avec follows', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      currentUser: { id: 'u-1' },
      follows: [{ clubId: 'c-1', teams: [] }, { clubId: 'c-2', teams: [] }],
    });
  });

  it('retourne unreadCount basé sur readIds', async () => {
    const { result } = renderHook(() => useMyAnnouncements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.unreadCount).toBe('number');
    expect(result.current.unreadCount).toBeGreaterThanOrEqual(0);
  });

  it('expose markRead et markAllRead', async () => {
    const { result } = renderHook(() => useMyAnnouncements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.markRead).toBe('function');
    expect(typeof result.current.markAllRead).toBe('function');
  });

  it('readIds est un Set', async () => {
    const { result } = renderHook(() => useMyAnnouncements());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.readIds).toBeInstanceOf(Set);
  });
});
