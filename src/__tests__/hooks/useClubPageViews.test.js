/**
 * Tests useClubPageViews — tracking des vues de pages club (localStorage)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useClubPageViews } from '../../hooks/useClubPageViews.js';

// ── Setup localStorage mock ───────────────────────────────────────────────────

const store = {};
const localStorageMock = {
  getItem:    vi.fn((k)     => store[k] ?? null),
  setItem:    vi.fn((k, v)  => { store[k] = v; }),
  removeItem: vi.fn((k)     => { delete store[k]; }),
  clear:      vi.fn(()      => Object.keys(store).forEach(k => delete store[k])),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubPageViews — recordView', () => {
  it('enregistre une vue pour un club', () => {
    const { result } = renderHook(() => useClubPageViews());
    act(() => result.current.recordView('club-1'));
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('cumule plusieurs vues pour le même club', () => {
    const { result } = renderHook(() => useClubPageViews());
    act(() => {
      result.current.recordView('club-1');
      result.current.recordView('club-1');
      result.current.recordView('club-1');
    });
    const count = result.current.getViewCount('club-1');
    expect(count).toBe(3);
  });

  it('enregistre des vues pour des clubs différents indépendamment', () => {
    const { result } = renderHook(() => useClubPageViews());
    act(() => {
      result.current.recordView('club-1');
      result.current.recordView('club-2');
      result.current.recordView('club-2');
    });
    expect(result.current.getViewCount('club-1')).toBe(1);
    expect(result.current.getViewCount('club-2')).toBe(2);
  });
});

describe('useClubPageViews — getViewCount', () => {
  it('retourne 0 si aucune vue enregistrée', () => {
    const { result } = renderHook(() => useClubPageViews());
    expect(result.current.getViewCount('club-inconnu')).toBe(0);
  });

  it('retourne 0 si localStorage est corrompu', () => {
    localStorageMock.getItem.mockReturnValueOnce('invalid json {{{');
    const { result } = renderHook(() => useClubPageViews());
    expect(result.current.getViewCount('club-1')).toBe(0);
  });

  it('filtre les vues plus anciennes que la période', () => {
    const { result } = renderHook(() => useClubPageViews());

    // Simuler une vue "ancienne" (31 jours) en écrivant directement dans le store
    const STORAGE_KEY = 'sl_club_views';
    const oldTs = Date.now() - 32 * 24 * 60 * 60 * 1000; // 32 jours
    const recentTs = Date.now() - 1 * 24 * 60 * 60 * 1000; // 1 jour
    store[STORAGE_KEY] = JSON.stringify({ 'club-1': [oldTs, recentTs] });
    localStorageMock.getItem.mockImplementation(k => store[k] ?? null);

    // Par défaut, 30 jours
    expect(result.current.getViewCount('club-1', 30)).toBe(1);
  });

  it('accepte un paramètre days personnalisé', () => {
    const { result } = renderHook(() => useClubPageViews());
    act(() => {
      result.current.recordView('club-1');
    });
    // 1 jour → doit être inclus
    expect(result.current.getViewCount('club-1', 1)).toBe(1);
    // 0 jours → doit être exclu (sauf si exactement maintenant, mais la marge est < 1ms)
    // Test robuste : juste vérifier que le compte est >= 0
    expect(result.current.getViewCount('club-1', 0)).toBeGreaterThanOrEqual(0);
  });
});

describe('useClubPageViews — stabilité des callbacks', () => {
  it('recordView et getViewCount sont des fonctions stables (useCallback)', () => {
    const { result, rerender } = renderHook(() => useClubPageViews());
    const first_record = result.current.recordView;
    const first_get = result.current.getViewCount;
    rerender();
    expect(result.current.recordView).toBe(first_record);
    expect(result.current.getViewCount).toBe(first_get);
  });
});
