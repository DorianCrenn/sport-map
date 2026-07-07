import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockUseManagedClubs } = vi.hoisted(() => ({ mockUseManagedClubs: vi.fn() }));

vi.mock('../../hooks/useManagedClubs.js', () => ({
  useManagedClubs: mockUseManagedClubs,
}));
vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), then: (fn) => Promise.resolve({ data: [], error: null }).then(fn) })) },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useWeekendPosters, getMockWeekendMatches } from '../../hooks/useWeekendPosters.js';

beforeEach(() => {
  mockUseManagedClubs.mockReset();
});

describe('useWeekendPosters', () => {
  it('retourne [] quand l\'utilisateur ne gère aucun club', () => {
    mockUseManagedClubs.mockReturnValue({ managedClubs: [], teamFilters: [] });
    const { result } = renderHook(() => useWeekendPosters());
    expect(result.current).toEqual([]);
  });

  it('robustesse : refs instables de managedClubs ne bouclent pas', async () => {
    // Nouvelle ref à chaque rendu (comme useManagedClubs peut le faire) → avant
    // le fix de stabilité par contenu, setMatches([]) bouclait à l'infini.
    mockUseManagedClubs.mockImplementation(() => ({ managedClubs: [], teamFilters: [] }));
    const { result } = renderHook(() => useWeekendPosters());
    await waitFor(() => expect(result.current).toEqual([]));
    expect(Array.isArray(result.current)).toBe(true);
  });
});

describe('getMockWeekendMatches', () => {
  it('retourne un tableau non vide de matchs de démo', () => {
    const mocks = getMockWeekendMatches();
    expect(Array.isArray(mocks)).toBe(true);
    expect(mocks.length).toBeGreaterThan(0);
  });

  it('chaque match de démo a les champs d\'affiche essentiels', () => {
    const [m] = getMockWeekendMatches();
    expect(m).toHaveProperty('sport');
    expect(m).toHaveProperty('homeTeam');
  });
});
