import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { makeQuery } from '../../test/mocks/supabase.js';
import { useClubById } from '../../hooks/useClubById.js';

// ── Fixture ───────────────────────────────────────────────────────────────────

const DB_ROW = {
  id: 'club-1',
  name: 'FC Plouvorn',
  sport: 'Football',
  city: 'Plouvorn',
  description: 'Club de foot breton',
  logo_url: 'https://cdn.example.com/logo.png',
  website: 'https://fc-plouvorn.fr',
  phone: '02 98 00 00 00',
  email: 'contact@fc-plouvorn.fr',
  categories: [{ name: 'Seniors' }],
  user_id: 'user-1',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne loading=false et club=null si clubId est null', () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: null }));
    const { result } = renderHook(() => useClubById(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.club).toBeNull();
  });

  it('mappe les colonnes DB vers les props camelCase', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: DB_ROW, error: null }));
    const { result } = renderHook(() => useClubById('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const club = result.current.club;
    expect(club.id).toBe('club-1');
    expect(club.name).toBe('FC Plouvorn');
    expect(club.logoUrl).toBe('https://cdn.example.com/logo.png');
    expect(club.userId).toBe('user-1');
  });

  it('retourne club=null si la requête retourne une erreur', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'RLS denied' } }));
    const { result } = renderHook(() => useClubById('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.club).toBeNull();
  });

  it('retourne club=null si data est null (club non trouvé)', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: null }));
    const { result } = renderHook(() => useClubById('inexistant'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.club).toBeNull();
  });

  it('utilise maybeSingle sur la requête (pas single)', async () => {
    const q = makeQuery({ data: DB_ROW, error: null });
    mockFrom.mockReturnValue(q);
    renderHook(() => useClubById('club-1'));
    await waitFor(() => {});
    expect(q.maybeSingle).toHaveBeenCalled();
  });

  it('passe le bon club_id dans le filtre eq', async () => {
    const q = makeQuery({ data: DB_ROW, error: null });
    mockFrom.mockReturnValue(q);
    renderHook(() => useClubById('club-42'));
    await waitFor(() => {});
    expect(q.eq).toHaveBeenCalledWith('id', 'club-42');
  });
});
