import { useEffect, RefObject } from 'react';

const FOCUSABLE_SEL = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(ref: RefObject<HTMLElement | null>, enabled = true): void {
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const container = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;

    function getFocusable(): HTMLElement[] {
      return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)].filter(
        el => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none',
      );
    }

    const tid = setTimeout(() => getFocusable()[0]?.focus(), 50);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) { e.preventDefault(); return; }
      const firstEl = focusable[0];
      const lastEl  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      } else {
        if (document.activeElement === lastEl)  { e.preventDefault(); firstEl.focus(); }
      }
    }

    container.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(tid);
      container.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [ref, enabled]);
}
