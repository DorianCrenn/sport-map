import { useEffect, RefObject } from 'react';

export function useScrollInputIntoView(containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function onFocusIn(e: FocusEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;
      setTimeout(() => {
        try {
          (e.target as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch { /* ignore */ }
      }, 320);
    }

    const el = containerRef?.current;
    if (!el) return;
    el.addEventListener('focusin', onFocusIn);
    return () => el.removeEventListener('focusin', onFocusIn);
  }, [containerRef]);
}
