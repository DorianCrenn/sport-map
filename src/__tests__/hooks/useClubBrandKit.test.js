import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Supabase mock ─────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: { from: mockFrom },
}));

import { useClubBrandKit } from '../../hooks/useClubBrandKit.js';

// ── Query builder helper ──────────────────────────────────────────────────────

function makeQuery(resolved = { data: null, error: null }) {
  const q = {
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    upsert:      vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
  };
  return q;
}

beforeEach(() => { mockFrom.mockReset(); });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubBrandKit — chargement initial', () => {
  it('charge le kit depuis Supabase si existant', async () => {
    const existing = {
      club_id: 'c1', primary_color: '#ff0000', secondary_color: '#000000',
      accent_color: '#ffffff', text_color: '#ffffff', bg_color: '#111111',
      primary_font: 'Poppins', kit_name: 'Mon kit',
    };
    mockFrom.mockReturnValue(makeQuery({ data: existing, error: null }));

    const { result } = renderHook(() => useClubBrandKit('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.kit.primary_color).toBe('#ff0000');
    expect(result.current.kit.primary_font).toBe('Poppins');
  });

  it('utilise les valeurs par défaut si aucun kit en base', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: null }));

    const { result } = renderHook(() => useClubBrandKit('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.kit.primary_color).toBe('#22D96A');
    expect(result.current.kit.primary_font).toBe('Inter');
  });

  it("reste en loading=false si clubId est null", async () => {
    const { result } = renderHook(() => useClubBrandKit(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('expose une erreur si Supabase échoue', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'DB error' } }));

    const { result } = renderHook(() => useClubBrandKit('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('DB error');
  });
});

describe('useClubBrandKit — save()', () => {
  it('appelle upsert avec le bon payload', async () => {
    const upsertQuery = {
      upsert:      vi.fn().mockReturnThis(),
      select:      vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { club_id: 'c1', primary_color: '#3b82f6' }, error: null }),
    };

    // First call = fetch, second call = upsert
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: null, error: null }))
      .mockReturnValue(upsertQuery);

    const { result } = renderHook(() => useClubBrandKit('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const saveResult = await result.current.save({ primary_color: '#3b82f6' });
    expect(saveResult.error).toBeUndefined();
    expect(upsertQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ club_id: 'c1', primary_color: '#3b82f6' }),
      expect.objectContaining({ onConflict: 'club_id' })
    );
  });

  it('retourne une erreur si upsert échoue', async () => {
    const upsertQuery = {
      upsert:      vi.fn().mockReturnThis(),
      select:      vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } }),
    };

    mockFrom
      .mockReturnValueOnce(makeQuery({ data: null, error: null }))
      .mockReturnValue(upsertQuery);

    const { result } = renderHook(() => useClubBrandKit('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const saveResult = await result.current.save({ primary_color: '#ff0000' });
    expect(saveResult.error).toBe('RLS denied');
    await waitFor(() => expect(result.current.error).toBe('RLS denied'));
  });
});
