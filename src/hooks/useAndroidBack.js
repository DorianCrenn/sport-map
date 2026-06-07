import { useEffect, useRef } from 'react';

/**
 * Intercepts the Android hardware back button (and browser back) to close an overlay.
 *
 * When `isOpen` becomes true → pushes a fake history entry.
 * When the user presses Android back → browser fires `popstate` → we call onClose.
 * When the overlay closes by other means (button, Escape) → we pop the fake entry ourselves.
 *
 * Works correctly when overlays are stacked:
 *   Each open overlay pushes one entry, each back press pops one → deepest overlay closes first.
 */
export function useAndroidBack(isOpen, onClose) {
  const pushed = useRef(false);
  // Stable ref so the effect doesn't re-run when onClose identity changes
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!isOpen) return;

    history.pushState({ sl_overlay: true }, '');
    pushed.current = true;

    function handlePopState() {
      pushed.current = false;
      onCloseRef.current?.();
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Overlay was closed normally (not by back button) → pop our fake entry
      if (pushed.current) {
        pushed.current = false;
        history.go(-1);
      }
    };
  }, [isOpen]);  
}
