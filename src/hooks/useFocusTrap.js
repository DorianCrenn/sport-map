import { useEffect } from 'react';

const FOCUSABLE_SEL = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(ref, enabled = true) {
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const container = ref.current;

    function getFocusable() {
      return [...container.querySelectorAll(FOCUSABLE_SEL)].filter(
        el => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none'
      );
    }

    // Focus first element on open
    const first = getFocusable()[0];
    if (first) {
      // Small delay so animation has time to render the element
      const tid = setTimeout(() => first.focus(), 50);
      return () => clearTimeout(tid);
    }

    function onKeyDown(e) {
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
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [ref, enabled]);
}
