import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Supabase mock ─────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { useActiveClubs } from '../../hooks/useActiveClubs.js';

// ── Query builder ─────────────────────────────────────────────────────────────

function makeQuery(resolved = { data: [], error: null }) {
  const q = {
    select: vi.fn().mockReturnThis(),
    gte:    vi.fn().mockReturnThis(),
    lt:     vi.fn().mockReturnThis(),
    not:    vi.fn().mockResolvedValue(resolved),
    in:     vi.fn().mockResolvedValue(resolved),
  };
  return q;
}

beforeEach(() => mockFrom.mockReset());

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ROWS = [
  { club_id: 'c1', clubs: { id: 'c1', name: 'FC Brest', sport: 'Football', city: 'Brest', logo_url: null } },
  { club_id: 'c1', clubs: { id: 'c1', name: 'FC Brest', sport: 'Football', city: 'Brest', logo_url: null } },
  { club_id: 'c2', clubs: { id: 'c2', name: 'Rugby Finistère', sport: 'Rugby', city: 'Quimper', logo_url: null } },
  { club_id: 'c1', clubs: { id: 'c1', name: 'FC Brest', sport: 'Football', city: 'Brest', logo_url: null } },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useActiveClubs', () => {
  it('retourne le classement trié par nombre evenements desc', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: ROWS, error: null }));

    const { result } = renderHook(() => useActiveClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const { ranking } = result.current;
    expect(ranking[0].clubId).toBe('c1');
    expect(ranking[0].count).toBe(3);
    expect(ranking[1].clubId).toBe('c2');
    expect(ranking[1].count).toBe(1);
  });

  it('retourne [] si aucun événement ce mois', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));

    const { result } = renderHook(() => useActiveClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ranking).toEqual([]);
  });

  it('ignore les lignes sans club_id', async () => {
    const rows = [
      { club_id: null,  clubs: null },
      { club_id: 'c1',  clubs: { id: 'c1', name: 'FC Brest', sport: 'Football', city: 'Brest', logo_url: null } },
    ];
    mockFrom.mockReturnValue(makeQuery({ data: rows, error: null }));

    const { result } = renderHook(() => useActiveClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ranking).toHaveLength(1);
    expect(result.current.ranking[0].clubId).toBe('c1');
  });

  it('respecte la limite', async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      club_id: `club-${i}`,
      clubs: { id: `club-${i}`, name: `Club ${i}`, sport: 'Football', city: 'Test', logo_url: null },
    }));
    mockFrom.mockReturnValue(makeQuery({ data: rows, error: null }));

    const { result } = renderHook(() => useActiveClubs({ limit: 5 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ranking).toHaveLength(5);
  });

  it('retourne [] et ne crashe pas si Supabase renvoie une erreur', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'RLS denied' } }));

    const { result } = renderHook(() => useActiveClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.ranking).toEqual([]);
  });

  it('loading passe à false après le chargement', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: ROWS, error: null }));

    const { result } = renderHook(() => useActiveClubs());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
