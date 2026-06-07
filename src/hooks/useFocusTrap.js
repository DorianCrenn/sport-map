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
    // Save the element that was focused before the trap opened
    const previousFocus = document.activeElement;

    function getFocusable() {
      return [...container.querySelectorAll(FOCUSABLE_SEL)].filter(
        el => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none'
      );
    }

    // Focus first element on open (delay for animation)
    const tid = setTimeout(() => getFocusable()[0]?.focus(), 50);

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
    return () => {
      clearTimeout(tid);
      container.removeEventListener('keydown', onKeyDown);
      // Restore focus to the element that was active before the trap
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [ref, enabled]);
}
