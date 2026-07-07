import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks hoistés ─────────────────────────────────────────────────────────────

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockGetUser: vi.fn().mockResolvedValue({ data: { user: null } }),
}));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: mockFrom,
    auth: { getUser: mockGetUser },
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: null })),
}));

import { useAuth } from '../../contexts/AuthContext.jsx';

import {
  usePosterDraft,
  usePosterLibrary,
  useFavoriteTemplates,
  useDefaultTemplate,
} from '../../hooks/usePosterDraft.js';

function makeQuery(resolved = { data: null, error: null }) {
  const q = {
    select:      vi.fn().mockReturnThis(),
    insert:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    delete:      vi.fn().mockReturnThis(),
    upsert:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    order:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockReturnThis(),
    then: (fn, rej) => Promise.resolve(resolved).then(fn, rej),
  };
  return q;
}

// ── usePosterDraft ─────────────────────────────────────────────────────────────

describe('usePosterDraft', () => {
  it('loadDraft retourne null si rien en localStorage', () => {
    const { result } = renderHook(() => usePosterDraft('evt-1'));
    expect(result.current.loadDraft()).toBeNull();
  });

  it('hasDraft retourne false si rien en localStorage', () => {
    const { result } = renderHook(() => usePosterDraft('evt-1'));
    expect(result.current.hasDraft()).toBe(false);
  });

  it('saveDraft écrit le brouillon en localStorage', () => {
    const { result } = renderHook(() => usePosterDraft('evt-1'));
    act(() => { result.current.saveDraft({ templateId: 'simple', format: 'story' }); });

    const draft = result.current.loadDraft();
    expect(draft).not.toBeNull();
    expect(draft.state.templateId).toBe('simple');
    expect(draft.eventKey).toBe('evt-1');
  });

  it('hasDraft retourne true après saveDraft', () => {
    const { result } = renderHook(() => usePosterDraft('evt-1'));
    act(() => { result.current.saveDraft({ templateId: 'neon' }); });
    expect(result.current.hasDraft()).toBe(true);
  });

  it('loadDraft retourne null pour un eventId différent', () => {
    const { result: hook1 } = renderHook(() => usePosterDraft('evt-1'));
    const { result: hook2 } = renderHook(() => usePosterDraft('evt-2'));

    act(() => { hook1.current.saveDraft({ templateId: 'impact' }); });
    expect(hook2.current.loadDraft()).toBeNull();
  });

  it('loadDraft retourne le brouillon pour le bon eventId', () => {
    const { result } = renderHook(() => usePosterDraft('evt-42'));
    act(() => { result.current.saveDraft({ accentColor: '#ff0000' }); });

    const draft = result.current.loadDraft();
    expect(draft.state.accentColor).toBe('#ff0000');
  });

  it('clearDraft supprime le brouillon', () => {
    const { result } = renderHook(() => usePosterDraft('evt-1'));
    act(() => { result.current.saveDraft({ templateId: 'luxe' }); });
    act(() => { result.current.clearDraft(); });

    expect(result.current.loadDraft()).toBeNull();
    expect(result.current.hasDraft()).toBe(false);
  });

  it('savedAt est une date ISO valide', () => {
    const { result } = renderHook(() => usePosterDraft('evt-1'));
    act(() => { result.current.saveDraft({ templateId: 'simple' }); });

    const draft = result.current.loadDraft();
    expect(() => new Date(draft.savedAt)).not.toThrow();
    expect(new Date(draft.savedAt).getFullYear()).toBeGreaterThanOrEqual(2026);
  });

  it('pas de Supabase call pour un eventId entier (non-UUID)', () => {
    const { result } = renderHook(() => usePosterDraft(1));
    act(() => { result.current.saveDraft({ templateId: 'simple' }); });
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});

// ── usePosterLibrary ──────────────────────────────────────────────────────────

describe('usePosterLibrary — localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.mockReturnValue({ currentUser: null });
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
  });

  it('entries vide par défaut', () => {
    const { result } = renderHook(() => usePosterLibrary());
    expect(result.current.entries).toHaveLength(0);
  });

  it('save ajoute une entrée dans entries', async () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => { result.current.save({ templateId: 'simple' }, 'Mon affiche'); });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].name).toBe('Mon affiche');
  });

  it('save génère un id unique', async () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => { result.current.save({ templateId: 'simple' }, 'A'); });
    act(() => { result.current.save({ templateId: 'neon'   }, 'B'); });
    const ids = result.current.entries.map(e => e.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('save utilise un nom par défaut si vide', () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => { result.current.save({ templateId: 'simple' }); });
    expect(result.current.entries[0].name).toMatch(/Affiche/);
  });

  it('save les entrées les plus récentes en premier', () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => { result.current.save({}, 'Première'); });
    act(() => { result.current.save({}, 'Deuxième'); });
    expect(result.current.entries[0].name).toBe('Deuxième');
  });

  it('limite à 20 entrées', () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => {
      for (let i = 0; i < 25; i++) result.current.save({}, `Affiche ${i}`);
    });
    expect(result.current.entries).toHaveLength(20);
  });

  it('remove supprime l\'entrée par id', () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => { result.current.save({ templateId: 'simple' }, 'À supprimer'); });
    const id = result.current.entries[0].id;
    act(() => { result.current.remove(id); });
    expect(result.current.entries).toHaveLength(0);
  });

  it('remove ne touche pas aux autres entrées', () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => { result.current.save({}, 'A'); });
    act(() => { result.current.save({}, 'B'); });
    const idToRemove = result.current.entries.find(e => e.name === 'A').id;
    act(() => { result.current.remove(idToRemove); });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].name).toBe('B');
  });

  it('duplicate crée une copie avec "(copie)" dans le nom', () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => { result.current.save({ templateId: 'impact' }, 'Original'); });
    const id = result.current.entries[0].id;
    act(() => { result.current.duplicate(id); });
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0].name).toBe('Original (copie)');
  });

  it('duplicate copie bien le state', () => {
    const { result } = renderHook(() => usePosterLibrary());
    act(() => { result.current.save({ templateId: 'luxe', accentColor: '#gold' }, 'Orig'); });
    const id = result.current.entries[0].id;
    act(() => { result.current.duplicate(id); });
    expect(result.current.entries[0].state.templateId).toBe('luxe');
    expect(result.current.entries[0].state.accentColor).toBe('#gold');
  });

  it('duplicate retourne null pour un id inconnu', () => {
    const { result } = renderHook(() => usePosterLibrary());
    let ret;
    act(() => { ret = result.current.duplicate('id-inexistant'); });
    expect(ret).toBeNull();
  });

  it('persiste dans localStorage entre les hooks', () => {
    const { result: h1 } = renderHook(() => usePosterLibrary());
    act(() => { h1.current.save({ templateId: 'color' }, 'Persistée'); });

    // Nouveau hook — doit lire le localStorage
    const { result: h2 } = renderHook(() => usePosterLibrary());
    expect(h2.current.entries).toHaveLength(1);
    expect(h2.current.entries[0].name).toBe('Persistée');
  });
});

describe('usePosterLibrary — Supabase sync', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.mockReturnValue({ currentUser: null });
    mockFrom.mockClear();
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
  });

  it('charge depuis Supabase si utilisateur connecté', async () => {
    useAuth.mockReturnValue({ currentUser: { id: 'user-1' } });
    mockFrom.mockReturnValue(makeQuery({
      data: [
        { id: 'p1', name: 'Remote 1', created_at: '2026-01-01T00:00:00Z', layers: { templateId: 'neon' } },
        { id: 'p2', name: 'Remote 2', created_at: '2026-01-02T00:00:00Z', layers: { templateId: 'luxe' } },
      ],
      error: null,
    }));

    const { result } = renderHook(() => usePosterLibrary());
    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    expect(result.current.entries[0].name).toBe('Remote 1');
  });

  it('ne remplace pas le localStorage si Supabase retourne erreur', async () => {
    useAuth.mockReturnValue({ currentUser: { id: 'user-1' } });
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'offline' } }));

    localStorage.setItem('sl-poster-library', JSON.stringify([
      { id: 'local-1', name: 'Local', savedAt: '2026-01-01', state: {} },
    ]));

    const { result } = renderHook(() => usePosterLibrary());
    // Supabase retourne une erreur → les entrées locales doivent rester
    await waitFor(() => expect(result.current.entries.length).toBeGreaterThan(0));
    expect(result.current.entries[0].name).toBe('Local');
  });

  it('ne fait pas de requête Supabase si non connecté', async () => {
    // useAuth retourne null par défaut (beforeEach)
    renderHook(() => usePosterLibrary());
    await act(async () => {});
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── useFavoriteTemplates ──────────────────────────────────────────────────────

describe('useFavoriteTemplates', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.mockReturnValue({ currentUser: null });
  });

  it('getAll retourne [] par défaut', () => {
    const { result } = renderHook(() => useFavoriteTemplates());
    expect(result.current.getAll()).toEqual([]);
  });

  it('isFav retourne false par défaut', () => {
    const { result } = renderHook(() => useFavoriteTemplates());
    expect(result.current.isFav('simple')).toBe(false);
  });

  it('toggle ajoute un template aux favoris', () => {
    const { result } = renderHook(() => useFavoriteTemplates());
    result.current.toggle('neon');
    expect(result.current.isFav('neon')).toBe(true);
  });

  it('toggle retire un template déjà favori', () => {
    const { result } = renderHook(() => useFavoriteTemplates());
    result.current.toggle('neon');
    result.current.toggle('neon');
    expect(result.current.isFav('neon')).toBe(false);
  });

  it('toggle ne touche pas aux autres templates', () => {
    const { result } = renderHook(() => useFavoriteTemplates());
    result.current.toggle('neon');
    result.current.toggle('luxe');
    result.current.toggle('neon'); // retire neon
    expect(result.current.isFav('luxe')).toBe(true);
    expect(result.current.isFav('neon')).toBe(false);
  });

  it('toggle retourne la nouvelle liste', () => {
    const { result } = renderHook(() => useFavoriteTemplates());
    const next = result.current.toggle('impact');
    expect(next).toContain('impact');
  });

  it('getAll liste tous les favoris', () => {
    const { result } = renderHook(() => useFavoriteTemplates());
    result.current.toggle('simple');
    result.current.toggle('neon');
    result.current.toggle('luxe');
    const all = result.current.getAll();
    expect(all).toHaveLength(3);
    expect(all).toContain('simple');
    expect(all).toContain('neon');
    expect(all).toContain('luxe');
  });

  it('persiste dans localStorage entre instances', () => {
    const { result: h1 } = renderHook(() => useFavoriteTemplates());
    h1.current.toggle('retro');

    const { result: h2 } = renderHook(() => useFavoriteTemplates());
    expect(h2.current.isFav('retro')).toBe(true);
  });
});

// ── useDefaultTemplate ────────────────────────────────────────────────────────

describe('useDefaultTemplate', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.mockReturnValue({ currentUser: null });
  });

  it('get retourne null si rien défini', () => {
    const { result } = renderHook(() => useDefaultTemplate('club-1'));
    expect(result.current.get()).toBeNull();
  });

  it('set puis get retourne le bon templateId', () => {
    const { result } = renderHook(() => useDefaultTemplate('club-1'));
    result.current.set('impact');
    expect(result.current.get()).toBe('impact');
  });

  it('clear supprime le default', () => {
    const { result } = renderHook(() => useDefaultTemplate('club-1'));
    result.current.set('luxe');
    result.current.clear();
    expect(result.current.get()).toBeNull();
  });

  it('clubs différents ont des defaults indépendants', () => {
    const { result: h1 } = renderHook(() => useDefaultTemplate('club-1'));
    const { result: h2 } = renderHook(() => useDefaultTemplate('club-2'));

    h1.current.set('neon');
    h2.current.set('color');

    expect(h1.current.get()).toBe('neon');
    expect(h2.current.get()).toBe('color');
  });

  it('clear sur un club ne touche pas l\'autre', () => {
    const { result: h1 } = renderHook(() => useDefaultTemplate('club-1'));
    const { result: h2 } = renderHook(() => useDefaultTemplate('club-2'));

    h1.current.set('neon');
    h2.current.set('color');
    h1.current.clear();

    expect(h1.current.get()).toBeNull();
    expect(h2.current.get()).toBe('color');
  });

  it('utilise __global__ comme clé si clubId est undefined', () => {
    const { result: hGlobal } = renderHook(() => useDefaultTemplate(undefined));
    const { result: hClub }   = renderHook(() => useDefaultTemplate('club-x'));

    hGlobal.current.set('editorial');
    // club-x n'est pas affecté
    expect(hClub.current.get()).toBeNull();
    expect(hGlobal.current.get()).toBe('editorial');
  });

  it('persiste dans localStorage entre instances', () => {
    const { result: h1 } = renderHook(() => useDefaultTemplate('club-persist'));
    h1.current.set('magazine');

    const { result: h2 } = renderHook(() => useDefaultTemplate('club-persist'));
    expect(h2.current.get()).toBe('magazine');
  });
});
