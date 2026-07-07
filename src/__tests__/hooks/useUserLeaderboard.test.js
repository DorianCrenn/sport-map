import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useUserLeaderboard } from '../../hooks/useUserLeaderboard.js';

// Query builder chaînable : select().limit() est "thenable".
function makeQuery(result) {
  const q = {
    select: vi.fn(() => q),
    limit:  vi.fn(() => q),
    then:   (fn) => Promise.resolve(result).then(fn),
  };
  return q;
}

const USERS = [
  { id: 'u-1', name: 'Alice', avatar_url: null, xp: 1200, badges: [], plan_tier: 'free' },
  { id: 'u-2', name: 'Bob',   avatar_url: null, xp: 900,  badges: [], plan_tier: 'pro' },
  { id: 'u-3', name: 'Carol', avatar_url: null, xp: 700,  badges: [], plan_tier: 'free' },
];

beforeEach(() => {
  mockFrom.mockReset();
});

describe('useUserLeaderboard', () => {
  it('démarre en loading avec un classement vide', () => {
    mockFrom.mockReturnValue(makeQuery({ data: USERS, error: null }));
    const { result } = renderHook(() => useUserLeaderboard());
    expect(result.current.loading).toBe(true);
    expect(result.current.ranking).toEqual([]);
  });

  it('charge le classement puis loading = false', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: USERS, error: null }));
    const { result } = renderHook(() => useUserLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ranking).toHaveLength(3);
    expect(result.current.ranking[0].name).toBe('Alice');
  });

  it('interroge la vue user_leaderboard avec la limite', async () => {
    const q = makeQuery({ data: USERS, error: null });
    mockFrom.mockReturnValue(q);
    renderHook(() => useUserLeaderboard({ limit: 5 }));
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('user_leaderboard'));
    expect(q.limit).toHaveBeenCalledWith(5);
  });

  it('retourne un classement vide en cas d\'erreur', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'boom' } }));
    const { result } = renderHook(() => useUserLeaderboard());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.ranking).toEqual([]);
  });
});
