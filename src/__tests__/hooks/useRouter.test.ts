import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouter } from '../../hooks/useRouter.js';

function setHash(h: string) {
  window.history.replaceState(null, '', window.location.pathname + h);
}

beforeEach(() => {
  sessionStorage.clear();
  setHash('');
});

describe('useRouter — onglet', () => {
  it('démarre sur home sans valeur stockée', () => {
    const { result } = renderHook(() => useRouter());
    expect(result.current.tab).toBe('home');
  });

  it('restaure l\'onglet stocké (normalisé)', () => {
    sessionStorage.setItem('sl-tab', 'map');
    const { result } = renderHook(() => useRouter());
    expect(result.current.tab).toBe('map');
  });

  it('normalise un onglet non restaurable en home', () => {
    sessionStorage.setItem('sl-tab', 'mon-club');
    const { result } = renderHook(() => useRouter());
    expect(result.current.tab).toBe('home');
  });

  it('go() change l\'onglet et le persiste', () => {
    const { result } = renderHook(() => useRouter());
    act(() => result.current.go('clubs'));
    expect(result.current.tab).toBe('clubs');
    expect(sessionStorage.getItem('sl-tab')).toBe('clubs');
  });

  it('go() vers un onglet non restaurable (mon-club) ne modifie pas le stockage', () => {
    sessionStorage.setItem('sl-tab', 'clubs');
    const { result } = renderHook(() => useRouter());
    act(() => result.current.go('mon-club'));
    expect(result.current.tab).toBe('mon-club');
    // La valeur restaurable précédente reste intacte → reload reviendrait sur clubs
    expect(sessionStorage.getItem('sl-tab')).toBe('clubs');
  });

  it('go() calcule le sens de transition', () => {
    const { result } = renderHook(() => useRouter());
    act(() => result.current.go('admin'));
    expect(result.current.tabDir).toBe(1);
    act(() => result.current.go('home'));
    expect(result.current.tabDir).toBe(-1);
  });
});

describe('useRouter — deep-links', () => {
  it('readInitialDeepLink lit le hash courant', () => {
    setHash('#club/xyz');
    const { result } = renderHook(() => useRouter());
    expect(result.current.readInitialDeepLink()).toEqual({ kind: 'club', id: 'xyz' });
  });

  it('readInitialDeepLink retourne null sans hash', () => {
    const { result } = renderHook(() => useRouter());
    expect(result.current.readInitialDeepLink()).toBeNull();
  });

  it('pushOverlay écrit le hash correspondant', () => {
    const { result } = renderHook(() => useRouter());
    act(() => result.current.pushOverlay({ kind: 'event', id: '7' }));
    expect(window.location.hash).toBe('#event/7');
  });

  it('clearHash retire le fragment', () => {
    setHash('#user/u1');
    const { result } = renderHook(() => useRouter());
    act(() => result.current.clearHash());
    expect(window.location.hash).toBe('');
  });

  it('onDeepLink notifie sur hashchange et se désabonne', () => {
    const { result } = renderHook(() => useRouter());
    const cb = vi.fn();
    let unsub: () => void = () => {};
    act(() => { unsub = result.current.onDeepLink(cb); });

    act(() => {
      setHash('#club/abc');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(cb).toHaveBeenCalledWith({ kind: 'club', id: 'abc' });

    act(() => { unsub(); });
    cb.mockClear();
    act(() => {
      setHash('#event/9');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(cb).not.toHaveBeenCalled();
  });
});

afterEach(() => {
  sessionStorage.clear();
  setHash('');
});
