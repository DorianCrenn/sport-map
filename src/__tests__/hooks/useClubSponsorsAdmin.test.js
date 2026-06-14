/**
 * Tests useClubSponsorsAdmin — gestion des sponsors d'un club (panel admin)
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

import { useClubSponsorsAdmin } from '../../hooks/useClubSponsorsAdmin.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSponsor(overrides = {}) {
  return {
    id: 'sp-1', club_id: 'club-1', sponsor_name: 'Nike', tier: 'gold',
    logo_url: null, logo_white_url: null, website_url: 'https://nike.com',
    bg_color: '#111827', tagline: 'Just Do It', cta_label: null, cta_url: null,
    active: true, page_visible: true, show_in_poster: true, show_tier_labels: true,
    display_order: 0, valid_from: null, valid_until: null, season_id: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeQuery(result = { data: [], error: null }) {
  return {
    select:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    insert:  vi.fn().mockReturnThis(),
    update:  vi.fn().mockReturnThis(),
    delete:  vi.fn().mockReturnThis(),
    single:  vi.fn().mockResolvedValue(result),
    then:    (fn) => Promise.resolve(result).then(fn),
  };
}

// ── Tests — état initial ──────────────────────────────────────────────────────

describe('useClubSponsorsAdmin — sans club', () => {
  it('sponsors est vide si clubId est null', () => {
    const { result } = renderHook(() => useClubSponsorsAdmin(null));
    expect(result.current.sponsors).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});

// ── Tests — chargement ────────────────────────────────────────────────────────

describe('useClubSponsorsAdmin — chargement', () => {
  it('charge les sponsors depuis Supabase', async () => {
    const sp = makeSponsor();
    mockFrom.mockReturnValue(makeQuery({ data: [sp] }));
    const { result } = renderHook(() => useClubSponsorsAdmin('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sponsors).toHaveLength(1);
    expect(result.current.sponsors[0].sponsor_name).toBe('Nike');
  });
});

// ── Tests — addSponsor ────────────────────────────────────────────────────────

describe('useClubSponsorsAdmin — addSponsor', () => {
  it('retourne false si sponsor_name est vide', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [] }));
    const { result } = renderHook(() => useClubSponsorsAdmin('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let ok;
    await act(async () => {
      ok = await result.current.addSponsor({ sponsor_name: '' });
    });
    expect(ok).toBe(false);
  });

  it('ajoute optimistiquement un sponsor', async () => {
    const newSp = makeSponsor({ id: 'sp-new', sponsor_name: 'Adidas' });
    const q = makeQuery({ data: [] });
    q.single = vi.fn().mockResolvedValue({ data: newSp, error: null });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useClubSponsorsAdmin('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addSponsor({ sponsor_name: 'Adidas' });
    });
    expect(result.current.sponsors.some(s => s.id === 'sp-new')).toBe(true);
  });

  it('rollback si l\'insertion échoue en DB', async () => {
    const errQ = makeQuery({ data: [] });
    errQ.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    mockFrom.mockReturnValue(errQ);

    const { result } = renderHook(() => useClubSponsorsAdmin('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addSponsor({ sponsor_name: 'Puma' });
    });
    expect(result.current.sponsors.some(s => s.sponsor_name === 'Puma')).toBe(false);
  });
});

// ── Tests — updateSponsor ─────────────────────────────────────────────────────

describe('useClubSponsorsAdmin — updateSponsor', () => {
  it('met à jour un sponsor optimistiquement', async () => {
    const sp = makeSponsor({ id: 'sp-1', active: false });
    const q = makeQuery({ data: [sp] });
    q.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useClubSponsorsAdmin('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateSponsor('sp-1', { active: true });
    });
    expect(result.current.sponsors.find(s => s.id === 'sp-1')?.active).toBe(true);
  });
});

// ── Tests — removeSponsor ─────────────────────────────────────────────────────

describe('useClubSponsorsAdmin — removeSponsor', () => {
  it('supprime un sponsor de la liste', async () => {
    const sp = makeSponsor({ id: 'sp-1' });
    const q = makeQuery({ data: [sp] });
    q.delete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue(q);

    const { result } = renderHook(() => useClubSponsorsAdmin('club-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeSponsor('sp-1');
    });
    expect(result.current.sponsors.find(s => s.id === 'sp-1')).toBeUndefined();
  });
});
