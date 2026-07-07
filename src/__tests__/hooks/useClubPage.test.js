/**
 * Tests for useClubPage — Supabase load, localStorage fallback, race condition
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from:          mockFrom,
    removeChannel: vi.fn(),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const CLUB_A = { id: 'club-a', name: 'Club A', sport: 'Football', city: 'Brest' };
const CLUB_B = { id: 'club-b', name: 'Club B', sport: 'Handball', city: 'Quimper' };

function makeQuery(result) {
  return {
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single:      vi.fn().mockResolvedValue(result),
    order:       vi.fn().mockReturnThis(),
    upsert:      vi.fn().mockResolvedValue({ error: null }),
    then:        (fn, rej) => Promise.resolve(result).then(fn, rej),
  };
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Load from Supabase ────────────────────────────────────────────────────────

describe('useClubPage — chargement depuis Supabase', () => {
  it('charge les blocs depuis Supabase et marque loaded=true', async () => {
    const savedBlocks = [{ id: 'b1', type: 'title', data: { text: 'Bienvenue' }, enabled: true, span: 12 }];
    mockFrom.mockReturnValue(makeQuery({
      data: { blocks: savedBlocks, typography: null, theme: null },
      error: null,
    }));

    const { useClubPage } = await import('../../hooks/useClubPage.js');
    const { result } = renderHook(() => useClubPage(CLUB_A));

    await flushPromises();

    // Block from DB should be in state (may have rowId injected)
    expect(result.current.blocks.some(b => b.type === 'title')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('club_pages');
  });

  it('retourne les blocs par défaut si Supabase renvoie null (premier usage)', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: null }));

    const { useClubPage } = await import('../../hooks/useClubPage.js');
    const { result } = renderHook(() => useClubPage(CLUB_A));

    await flushPromises();

    // Default blocks should include at least one title block
    expect(result.current.blocks.length).toBeGreaterThan(0);
    expect(result.current.blocks.some(b => b.type === 'title')).toBe(true);
  });

  it('ne déclenche pas de save pendant le chargement initial (loaded=false)', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    // Make the fetch hang so loaded never becomes true
    const hanging = { ...makeQuery(new Promise(() => {})), maybeSingle: vi.fn().mockReturnValue(new Promise(() => {})) };
    mockFrom.mockReturnValue({ ...hanging, upsert: mockUpsert });

    const { useClubPage } = await import('../../hooks/useClubPage.js');
    renderHook(() => useClubPage(CLUB_A));

    // Advance timers well past the debounce threshold
    act(() => { vi.advanceTimersByTime(5000); });

    // No save should happen while load is pending
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

// ── localStorage fallback ─────────────────────────────────────────────────────

describe('useClubPage — fallback localStorage sur erreur Supabase', () => {
  it('utilise le cache localStorage si Supabase échoue', async () => {
    const cachedBlocks = [{ id: 'b-cached', type: 'text', data: { content: 'Cached' }, enabled: true }];
    localStorage.setItem(`club-page-${CLUB_A.id}`, JSON.stringify(cachedBlocks));

    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'DB down' } }));

    const { useClubPage } = await import('../../hooks/useClubPage.js');
    const { result } = renderHook(() => useClubPage(CLUB_A));

    await flushPromises();

    expect(result.current.blocks.some(b => b.type === 'text')).toBe(true);
  });
});

// ── Race condition ────────────────────────────────────────────────────────────

describe('useClubPage — race condition changement de club', () => {
  it('ignore la réponse de l\'ancien club si le club change avant la réponse', async () => {
    let resolveA;
    const pendingA = new Promise(r => { resolveA = r; });
    const qA = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnValue(pendingA),
      upsert:      vi.fn().mockResolvedValue({ error: null }),
      then:        () => pendingA,
    };
    const blocksB = [{ id: 'b-B', type: 'title', data: { text: 'Club B' }, enabled: true, span: 12 }];
    const qB = makeQuery({ data: { blocks: blocksB, typography: null, theme: null }, error: null });

    mockFrom.mockReturnValueOnce(qA).mockReturnValue(qB);

    const { useClubPage } = await import('../../hooks/useClubPage.js');
    const { result, rerender } = renderHook(({ club }) => useClubPage(club), {
      initialProps: { club: CLUB_A },
    });

    // Club B renders before Club A's fetch resolves
    rerender({ club: CLUB_B });
    await flushPromises();

    // Now resolve Club A's fetch with stale data
    await act(async () => {
      resolveA({ data: { blocks: [{ id: 'b-A', type: 'title', data: { text: 'Club A stale' }, enabled: true, span: 12 }], typography: null, theme: null }, error: null });
      await Promise.resolve();
    });

    // Blocks should reflect Club B, not stale Club A response
    expect(result.current.blocks.some(b => b.data?.text === 'Club A stale')).toBe(false);
  });
});

// ── Debounced save ────────────────────────────────────────────────────────────

describe('useClubPage — save débounce', () => {
  it('sauvegarde après le délai de debounce quand loaded', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      ...makeQuery({ data: { blocks: [], typography: null, theme: null }, error: null }),
      upsert: mockUpsert,
    });

    const { useClubPage } = await import('../../hooks/useClubPage.js');
    const { result } = renderHook(() => useClubPage(CLUB_A));

    await flushPromises();

    // Trigger a mutation (add block mutates state)
    act(() => { result.current.addBlock('text'); });

    // Before debounce fires, no save yet
    act(() => { vi.advanceTimersByTime(1000); });
    const callsBefore = mockUpsert.mock.calls.length;

    // After debounce (1500ms total), save fires
    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockUpsert.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
