import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAndroidBack } from '../../hooks/useAndroidBack.js';

describe('useAndroidBack', () => {
  let pushStateSpy;

  beforeEach(() => {
    pushStateSpy = vi.spyOn(history, 'pushState').mockImplementation(() => {});
    vi.spyOn(history, 'go').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  it('pousse un état fictif dans history quand isOpen=true', () => {
    renderHook(() => useAndroidBack(true, vi.fn()));
    expect(pushStateSpy).toHaveBeenCalledWith({ sl_overlay: true }, '');
  });

  it('ne pousse pas si isOpen=false', () => {
    renderHook(() => useAndroidBack(false, vi.fn()));
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('appelle onClose lors de l\'événement popstate', () => {
    const onClose = vi.fn();
    renderHook(() => useAndroidBack(true, onClose));
    window.dispatchEvent(new PopStateEvent('popstate', {}));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('nettoie le listener au démontage et appelle history.replaceState', () => {
    const replaceStateSpy = vi.spyOn(history, 'replaceState').mockImplementation(() => {});
    const { unmount } = renderHook(() => useAndroidBack(true, vi.fn()));
    unmount();
    // replaceState utilisé à la place de go(-1) pour ne pas déclencher popstate (StrictMode)
    expect(replaceStateSpy).toHaveBeenCalled();
    replaceStateSpy.mockRestore();
  });

  it('ne déclenche pas onClose si overlay non ouvert (isOpen=false)', () => {
    const onClose = vi.fn();
    renderHook(() => useAndroidBack(false, onClose));
    window.dispatchEvent(new PopStateEvent('popstate', {}));
    expect(onClose).not.toHaveBeenCalled();
  });
});
