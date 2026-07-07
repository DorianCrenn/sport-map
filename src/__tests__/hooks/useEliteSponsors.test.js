import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: { from: mockFrom },
}));

import { useEliteSponsors } from '../../hooks/useEliteSponsors.js';

// ── Chainable query builder ───────────────────────────────────────────────────

function q(terminal) {
  const obj = {
    then:    (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select:  vi.fn(() => obj),
    eq:      vi.fn(() => obj),
    in:      vi.fn(() => obj),
    limit:   vi.fn(() => obj),
  };
  return obj;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockImplementation(() => q({ data: [], error: null }));
});

// ── Aucun club elite ─────────────────────────────────────────────────────────

describe('useEliteSponsors — aucun club elite', () => {
  it('retourne [] si club_subscriptions ne contient pas de plan elite', async () => {
    mockFrom.mockImplementation(() => q({ data: [], error: null }));

    const { result } = renderHook(() => useEliteSponsors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sponsors).toEqual([]);
  });

  it('ne requête pas club_sponsors si aucun club elite', async () => {
    mockFrom.mockImplementation(() => q({ data: [], error: null }));

    renderHook(() => useEliteSponsors());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());

    const tables = mockFrom.mock.calls.map(([t]) => t);
    expect(tables).toContain('club_subscriptions');
    expect(tables).not.toContain('club_sponsors');
  });
});

// ── Avec clubs elite ──────────────────────────────────────────────────────────

describe('useEliteSponsors — avec clubs elite', () => {
  it('requête club_sponsors pour les club_ids trouvés', async () => {
    const callOrder = [];
    mockFrom.mockImplementation((table) => {
      callOrder.push(table);
      if (table === 'club_subscriptions') return q({ data: [{ club_id: 'c1' }], error: null });
      return q({ data: [{ id: 's1', club_id: 'c1', sponsor_name: 'Sponsor A', clubs: { name: 'FC Brest' } }], error: null });
    });

    const { result } = renderHook(() => useEliteSponsors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(callOrder).toContain('club_subscriptions');
    expect(callOrder).toContain('club_sponsors');
  });

  it('retourne les sponsors avec le nom du club via clubs(name)', async () => {
    mockFrom.mockImplementation((table) => {
      if (table === 'club_subscriptions') return q({ data: [{ club_id: 'c1' }], error: null });
      return q({
        data: [{ id: 's1', club_id: 'c1', sponsor_name: 'BrestAuto', logo_url: null, bg_color: '#111', tagline: 'Votre concessionnaire', cta_label: 'Voir', cta_url: 'https://example.com', clubs: { name: 'FC Brest' } }],
        error: null,
      });
    });

    const { result } = renderHook(() => useEliteSponsors());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sponsors).toHaveLength(1);
    expect(result.current.sponsors[0].sponsor_name).toBe('BrestAuto');
    expect(result.current.sponsors[0].clubs?.name).toBe('FC Brest');
  });

  it('le select club_sponsors inclut clubs(name) — join FK valide', async () => {
    let sponsorSelect = null;
    mockFrom.mockImplementation((table) => {
      if (table === 'club_subscriptions') return q({ data: [{ club_id: 'c1' }], error: null });
      const obj = q({ data: [], error: null });
      const orig = obj.select.bind(obj);
      obj.select = vi.fn((s) => { sponsorSelect = s; return orig(s); });
      return obj;
    });

    renderHook(() => useEliteSponsors());
    await waitFor(() => expect(sponsorSelect).not.toBeNull());

    expect(sponsorSelect).toMatch(/clubs\s*\(\s*name\s*\)/);
  });
});
