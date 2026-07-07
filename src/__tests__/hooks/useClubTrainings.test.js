import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useClubTrainings } from '../../hooks/useClubTrainings.js';

function query(result) {
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q),
    upsert: vi.fn(() => Promise.resolve({ error: null })),
    then:   (fn) => Promise.resolve(result).then(fn),
  };
  return q;
}

beforeEach(() => {
  mockFrom.mockReset();
  localStorage.clear();
});

describe('useClubTrainings', () => {
  it('charge les créneaux depuis la DB, indexés par team_id', async () => {
    const DATA = [
      { team_id: 'team-A', sessions: [{ day: 'lundi', time: '18h30' }] },
      { team_id: 'team-B', sessions: [] },
    ];
    mockFrom.mockReturnValue(query({ data: DATA, error: null }));
    const { result } = renderHook(() => useClubTrainings('club-1'));
    await waitFor(() => expect(Object.keys(result.current[0])).toHaveLength(2));
    expect(result.current[0]['team-A']).toEqual([{ day: 'lundi', time: '18h30' }]);
    expect(result.current[0]['team-B']).toEqual([]);
  });

  it('retombe sur localStorage si la requête DB échoue', async () => {
    localStorage.setItem('club-trainings-club-1', JSON.stringify({ 'team-A': [{ day: 'mardi' }] }));
    mockFrom.mockReturnValue(query({ data: null, error: { message: 'network down' } }));
    const { result } = renderHook(() => useClubTrainings('club-1'));
    await waitFor(() => expect(result.current[0]['team-A']).toBeDefined());
    expect(result.current[0]['team-A']).toEqual([{ day: 'mardi' }]);
  });

  it('expose un setter [trainings, setTrainings]', () => {
    mockFrom.mockReturnValue(query({ data: [], error: null }));
    const { result } = renderHook(() => useClubTrainings('club-1'));
    expect(Array.isArray(result.current)).toBe(true);
    expect(typeof result.current[1]).toBe('function');
  });
});
