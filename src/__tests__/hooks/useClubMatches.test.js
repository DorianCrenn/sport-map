import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../hooks/useClubs.js', () => ({
  useClubs: vi.fn(() => ({ userClubs: [] })),
}));

import { useClubs } from '../../hooks/useClubs.js';
import { useClubMatches } from '../../hooks/useClubMatches.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useClubs).mockReturnValue({ userClubs: [] });
  localStorage.clear();
});

describe('useClubMatches', () => {
  it('retourne un tableau (directement)', () => {
    const { result } = renderHook(() => useClubMatches());
    expect(Array.isArray(result.current)).toBe(true);
  });

  it('retourne [] si aucun club', () => {
    const { result } = renderHook(() => useClubMatches());
    expect(result.current).toEqual([]);
  });

  it('retourne [] si clubs sans données localStorage', () => {
    vi.mocked(useClubs).mockReturnValue({
      userClubs: [{ id: 'c-1', name: 'FC Brest', sport: 'Football', city: 'Brest' }],
    });
    const { result } = renderHook(() => useClubMatches());
    expect(result.current).toEqual([]);
  });
});
