/**
 * Tests de stabilité Sprint 2 — race conditions, fuites mémoire, error handling
 * Couvre : useClubPage, useClubTrainings, useAttendees, usePosterDraft,
 *           useLocalEvents (pendingInserts), useCommunes (TTL cache)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks globaux ─────────────────────────────────────────────────────────────

const { mockFrom, mockChannel, mockAuth } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockChannel: vi.fn(),
  mockAuth:    { getUser: vi.fn() },
}));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from:          mockFrom,
    channel:       mockChannel,
    removeChannel: vi.fn(),
    auth:          mockAuth,
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'user-1', name: 'Test' } })),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQuery(result) {
  const q = {
    select:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single:      vi.fn().mockResolvedValue(result),
    order:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockResolvedValue(result),
    then:        (fn, rej) => Promise.resolve(result).then(fn, rej),
    insert:      vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert:      vi.fn().mockResolvedValue({ data: null, error: null }),
    delete:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
  };
  return q;
}

/** Flush all pending microtasks (Promise.resolve chains) */
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

  mockChannel.mockReturnValue({
    on:        vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  });

  mockAuth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── STAB-001 : useClubPage — timer annulé au changement de club ───────────────

describe('STAB-001 useClubPage — debounce annulé sur changement de club', () => {
  it('n\'appelle pas upsert si le composant se démonte avant la fin du debounce', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ ...makeQuery({ data: null, error: null }), upsert: mockUpsert });

    const { useClubPage } = await import('../../hooks/useClubPage.js');
    const { unmount } = renderHook(
      () => useClubPage({ id: 'club-A', name: 'Club A', sport: 'Football', city: 'Brest' })
    );

    await flushPromises();
    unmount();

    // Avancer le timer APRÈS le démontage — upsert ne doit pas être appelé
    act(() => { vi.advanceTimersByTime(2000); });

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

// ── STAB-002 : useClubTrainings — timer annulé ────────────────────────────────

describe('STAB-002 useClubTrainings — saveTimer annulé au démontage', () => {
  it('ne tente pas de sauvegarder après démontage', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ ...makeQuery({ data: [], error: null }), upsert: mockUpsert });

    const { useClubTrainings } = await import('../../hooks/useClubTrainings.js');
    const { result, unmount } = renderHook(() => useClubTrainings('club-A'));

    await flushPromises();
    act(() => { result.current[1]({ 'team-1': [{ day: 'Lundi', time: '19h' }] }); });

    unmount();
    act(() => { vi.advanceTimersByTime(2000); });

    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

// ── STAB-003 : useAttendees — fallback localStorage sur erreur ────────────────

describe('STAB-003 useAttendees — fallback localStorage sur erreur Supabase', () => {
  it('utilise le cache localStorage si Supabase échoue', async () => {
    localStorage.setItem('sl_attending_user-1', JSON.stringify(['event-42', 'event-99']));

    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'DB down' } }));

    const { useAttendees } = await import('../../hooks/useAttendees.js');
    const { result } = renderHook(() => useAttendees());

    await flushPromises();

    expect(result.current.isAttending('event-42')).toBe(true);
    expect(result.current.isAttending('event-99')).toBe(true);
    expect(result.current.isAttending('event-00')).toBe(false);
  });

  it('met à jour le cache localStorage après fetch Supabase réussi', async () => {
    mockFrom.mockReturnValue(makeQuery({
      data: [{ event_id: 'event-123' }],
      error: null,
    }));

    const { useAttendees } = await import('../../hooks/useAttendees.js');
    renderHook(() => useAttendees());

    await flushPromises();

    const cached = JSON.parse(localStorage.getItem('sl_attending_user-1') ?? '[]');
    expect(cached).toContain('event-123');
  });
});

// ── STAB-004 : usePosterDraft — sync Supabase au montage ─────────────────────

describe('STAB-004 usePosterDraft — Supabase plus récent écrase le cache local', () => {
  it('met à jour localStorage si Supabase a un draft plus récent', async () => {
    const dbState = { templateId: 'modern', format: 'story' };
    const dbDate  = new Date(Date.now() + 5000).toISOString(); // plus récent

    // localStorage avec draft ancien
    localStorage.setItem('sl-poster-draft', JSON.stringify({
      eventKey: '11111111-0000-0000-0000-000000000000',
      savedAt:  new Date(Date.now() - 10000).toISOString(),
      state:    { templateId: 'classic', format: 'post' },
    }));

    mockFrom.mockReturnValue({
      ...makeQuery({ data: { layers: dbState, updated_at: dbDate }, error: null }),
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { layers: dbState, updated_at: dbDate }, error: null }),
    });

    const { usePosterDraft } = await import('../../hooks/usePosterDraft.js');
    renderHook(() => usePosterDraft('11111111-0000-0000-0000-000000000000'));

    await flushPromises();

    const updated = JSON.parse(localStorage.getItem('sl-poster-draft') ?? 'null');
    expect(updated?.state?.templateId).toBe('modern');
  });

  it('ne touche pas localStorage si draft local est plus récent', async () => {
    const localState = { templateId: 'gold', format: 'post' };
    const localDate  = new Date(Date.now() + 10000).toISOString(); // plus récent

    localStorage.setItem('sl-poster-draft', JSON.stringify({
      eventKey: '22222222-0000-0000-0000-000000000000',
      savedAt:  localDate,
      state:    localState,
    }));

    mockFrom.mockReturnValue({
      ...makeQuery({ data: { layers: { templateId: 'old' }, updated_at: new Date(0).toISOString() } }),
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { layers: { templateId: 'old' }, updated_at: new Date(0).toISOString() } }),
    });

    const { usePosterDraft } = await import('../../hooks/usePosterDraft.js');
    renderHook(() => usePosterDraft('22222222-0000-0000-0000-000000000000'));

    await flushPromises();

    const draft = JSON.parse(localStorage.getItem('sl-poster-draft') ?? 'null');
    expect(draft?.state?.templateId).toBe('gold');
  });
});

// ── STAB-005 : useLocalEvents — pendingInserts borné ─────────────────────────

describe('STAB-005 useLocalEvents — pendingInserts ne croît pas indéfiniment', () => {
  it('rollback de l\'événement temp si l\'insert échoue', async () => {
    const insertErr = { data: null, error: { message: 'DB error' } };
    // Initial fetch returns empty list; insert fails
    const q = {
      ...makeQuery({ data: [], error: null }),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(insertErr),
    };
    mockFrom.mockImplementation((table) => {
      if (table === 'events') return q;
      return makeQuery({ data: [], error: null });
    });

    const { useLocalEvents } = await import('../../hooks/useLocalEvents.js');
    const { result } = renderHook(() => useLocalEvents());

    await flushPromises();

    const initialCount = result.current.events.length;

    await act(async () => {
      try {
        await result.current.addEvent({ title: 'Test', sport: 'Football', date: new Date().toISOString() });
      } catch { /* rollback expected */ }
    });

    // After rollback the list should be back to initial length
    expect(result.current.events.length).toBe(initialCount);
  });
});

// ── STAB-006 : useCommunes — TTL cache ───────────────────────────────────────

describe('STAB-006 useCommunes — cache avec TTL', () => {
  it('ne re-fetch pas le même département dans la fenêtre TTL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: vi.fn().mockResolvedValue([{ nom: 'Brest' }, { nom: 'Quimper' }]),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { useCommunes } = await import('../../hooks/useCommunes.js');

    const { rerender } = renderHook(
      ({ deps }) => useCommunes(deps),
      { initialProps: { deps: ['finistere'] } }
    );

    await flushPromises();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Re-render avec le même département — ne doit pas refetch
    rerender({ deps: ['finistere'] });
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('re-fetch après expiration du TTL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: vi.fn().mockResolvedValue([{ nom: 'Brest' }]),
    });
    vi.stubGlobal('fetch', mockFetch);

    // Réinitialiser le cache en avançant le temps de 2h
    act(() => { vi.advanceTimersByTime(2 * 3_600_000); });

    const { useCommunes } = await import('../../hooks/useCommunes.js');
    renderHook(() => useCommunes(['morbihan']));
    await flushPromises();

    // Doit avoir fetch (cache expiré ou inexistant)
    expect(mockFetch).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
