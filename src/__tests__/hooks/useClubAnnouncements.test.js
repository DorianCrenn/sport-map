import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom, mockChannel } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: vi.fn().mockResolvedValue(undefined),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
  isDemoMode: vi.fn(() => false),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ currentUser: { id: 'u-1' } }),
}));

vi.mock('../../lib/sanitize.js', () => ({ sanitizeText: (v) => v ?? '' }));

import { makeQuery, makeChannel } from '../../test/mocks/supabase.js';
import { useClubAnnouncements } from '../../hooks/useClubAnnouncements.js';

const ANN_ROW = {
  id: 'a-1', club_id: 'c-1', club_name: 'FC Brest', author_id: 'u-1', author_name: 'Admin',
  type: 'info', title: 'Match samedi', message: 'Rendez-vous Ã  14h',
  target_teams: [], created_at: '2026-06-12T10:00:00Z', scheduled_for: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(makeQuery({ data: [ANN_ROW], error: null }));
  mockChannel.mockReturnValue(makeChannel());
});

describe('useClubAnnouncements â€” chargement', () => {
  it('démarre avec loading=true si clubId fourni', () => {
    const { result } = renderHook(() => useClubAnnouncements('c-1'));
    expect(result.current.loading).toBe(true);
  });

  it('loading=false sans clubId', () => {
    const { result } = renderHook(() => useClubAnnouncements(null));
    expect(result.current.loading).toBe(false);
  });

  it('charge les annonces depuis Supabase', async () => {
    const { result } = renderHook(() => useClubAnnouncements('c-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements).toHaveLength(1);
  });

  it('mappe club_id â†’ clubId', async () => {
    const { result } = renderHook(() => useClubAnnouncements('c-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements[0].clubId).toBe('c-1');
  });

  it('mappe title correctement', async () => {
    const { result } = renderHook(() => useClubAnnouncements('c-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements[0].title).toBe('Match samedi');
  });

  it('retourne annonces=[] en cas d\'erreur Supabase', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'error' } }));
    const { result } = renderHook(() => useClubAnnouncements('c-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.announcements).toEqual([]);
  });
});

describe('useClubAnnouncements â€” sendAnnouncement', () => {
  it('expose la fonction sendAnnouncement', async () => {
    const { result } = renderHook(() => useClubAnnouncements('c-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.sendAnnouncement).toBe('function');
  });
});
