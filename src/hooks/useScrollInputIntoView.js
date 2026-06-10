import { useEffect } from 'react';

/**
 * useScrollInputIntoView — fait défiler automatiquement le champ actif dans
 * la zone visible quand le clavier virtuel s'ouvre sur mobile.
 *
 * Attacher sur le conteneur scrollable de la modale.
 * @param {React.RefObject} containerRef — ref du conteneur scroll de la modale
 */
export function useScrollInputIntoView(containerRef) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function onFocusIn(e) {
      const tag = e.target?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return;
      // Délai pour laisser le clavier s'ouvrir avant de scroller
      setTimeout(() => {
        try {
          e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch { /* ignore */ }
      }, 320);
    }

    const el = containerRef?.current;
    if (!el) return;
    el.addEventListener('focusin', onFocusIn);
    return () => el.removeEventListener('focusin', onFocusIn);
  }, [containerRef]);
}
