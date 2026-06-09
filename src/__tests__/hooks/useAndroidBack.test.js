import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAndroidBack } from '../../hooks/useAndroidBack.js';

describe('useAndroidBack', () => {
  let pushStateSpy;
  let goSpy;

  beforeEach(() => {
    pushStateSpy = vi.spyOn(history, 'pushState').mockImplementation(() => {});
    goSpy = vi.spyOn(history, 'go').mockImplementation(() => {});
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

  it('nettoie le listener au démontage et appelle history.go(-1)', () => {
    const { unmount } = renderHook(() => useAndroidBack(true, vi.fn()));
    unmount();
    // L'entrée fictive doit être dépilée au démontage
    expect(goSpy).toHaveBeenCalledWith(-1);
  });

  it('ne déclenche pas onClose si overlay non ouvert (isOpen=false)', () => {
    const onClose = vi.fn();
    renderHook(() => useAndroidBack(false, onClose));
    window.dispatchEvent(new PopStateEvent('popstate', {}));
    expect(onClose).not.toHaveBeenCalled();
  });
});
