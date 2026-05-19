import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── vi.hoisted : variables disponibles avant le hoist de vi.mock ──────────────
const { mockFrom, mockUseAuth } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: mockUseAuth,
}));

import { useFavorites } from '../../hooks/useFavorites.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQuery(result = { data: [], error: null }) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    then:   (fn, rej) => Promise.resolve(result).then(fn, rej),
  };
}

// ── Tests — utilisateur non connecté ─────────────────────────────────────────

describe('useFavorites — non connecté', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
  });

  it('favorites est un Set vide par défaut', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites.size).toBe(0);
  });

  it('isFavorite retourne false pour tout id', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite('evt-1')).toBe(false);
  });

  it('toggleFavorite ajoute en local sans appeler Supabase', async () => {
    const { result } = renderHook(() => useFavorites());
    await act(async () => { result.current.toggleFavorite('evt-1'); });
    expect(result.current.isFavorite('evt-1')).toBe(true);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('toggleFavorite retire un favori existant', async () => {
    const { result } = renderHook(() => useFavorites());
    await act(async () => { result.current.toggleFavorite('evt-1'); });
    await act(async () => { result.current.toggleFavorite('evt-1'); });
    expect(result.current.isFavorite('evt-1')).toBe(false);
  });
});

// ── Tests — utilisateur connecté ─────────────────────────────────────────────

describe('useFavorites — connecté', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'user-1' } });
  });

  it('charge les favoris depuis Supabase au montage', async () => {
    mockFrom.mockReturnValue(makeQuery({
      data: [{ event_id: 'evt-1' }, { event_id: 'evt-2' }],
      error: null,
    }));
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(2));
    expect(result.current.isFavorite('evt-1')).toBe(true);
    expect(result.current.isFavorite('evt-2')).toBe(true);
  });

  it('isFavorite est false pour un id non chargé', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [{ event_id: 'evt-1' }], error: null }));
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(1));
    expect(result.current.isFavorite('evt-99')).toBe(false);
  });

  it('toggleFavorite appelle Supabase INSERT pour un nouveau favori', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [], error: null }))
      .mockReturnValueOnce(makeQuery({ error: null }));

    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(0));

    await act(async () => { result.current.toggleFavorite('evt-1'); });

    expect(result.current.isFavorite('evt-1')).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('favorites');
  });

  it('toggleFavorite appelle Supabase DELETE pour retirer un favori', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [{ event_id: 'evt-1' }], error: null }))
      .mockReturnValueOnce(makeQuery({ error: null }));

    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(1));

    await act(async () => { result.current.toggleFavorite('evt-1'); });
    expect(result.current.isFavorite('evt-1')).toBe(false);
  });

  it('rollback si INSERT Supabase échoue', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [], error: null }))
      .mockReturnValueOnce(makeQuery({ error: { message: 'RLS denied' } }));

    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(0));

    await act(async () => { result.current.toggleFavorite('evt-1'); });
    await waitFor(() => expect(result.current.isFavorite('evt-1')).toBe(false));
  });

  it('rollback si DELETE Supabase échoue', async () => {
    mockFrom
      .mockReturnValueOnce(makeQuery({ data: [{ event_id: 'evt-1' }], error: null }))
      .mockReturnValueOnce(makeQuery({ error: { message: 'RLS denied' } }));

    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(1));

    await act(async () => { result.current.toggleFavorite('evt-1'); });
    await waitFor(() => expect(result.current.isFavorite('evt-1')).toBe(true));
  });

  it('utilise le cache localStorage si Supabase échoue', async () => {
    localStorage.setItem('sl-favs-user-1', JSON.stringify(['evt-cached']));
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'offline' } }));

    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(1));
    expect(result.current.isFavorite('evt-cached')).toBe(true);
  });

  it('isFavorite fonctionne avec id numérique (coerce en string)', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [{ event_id: '42' }], error: null }));
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(1));
    expect(result.current.isFavorite(42)).toBe(true);
    expect(result.current.isFavorite('42')).toBe(true);
  });
});

describe('useFavorites — changement d\'utilisateur', () => {
  it('vide les favoris quand l\'utilisateur se déconnecte', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'user-1' } });
    mockFrom.mockReturnValue(makeQuery({ data: [{ event_id: 'evt-1' }], error: null }));

    const { result, rerender } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.favorites.size).toBe(1));

    mockUseAuth.mockReturnValue({ currentUser: null });
    rerender();
    await waitFor(() => expect(result.current.favorites.size).toBe(0));
  });
});
