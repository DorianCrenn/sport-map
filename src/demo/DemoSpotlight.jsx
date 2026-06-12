import { useState, useEffect, useRef } from 'react';
import { trackSpotlightSeen } from './demoAnalytics.js';

// Keyframes CSS injectés une seule fois
const STYLE_ID = 'sl-demo-spotlight-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes sl-demo-highlight {
      0%   { box-shadow: 0 0 0 9999px rgba(0,0,0,0.52), 0 0 0 2px rgba(99,102,241,0.7), 0 0 12px rgba(99,102,241,0.4); }
      50%  { box-shadow: 0 0 0 9999px rgba(0,0,0,0.52), 0 0 0 3px rgba(129,140,248,1),   0 0 24px rgba(99,102,241,0.7); }
      100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.52), 0 0 0 2px rgba(99,102,241,0.7), 0 0 12px rgba(99,102,241,0.4); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * DemoSpotlight — met en évidence un élément DOM identifié par [data-demo="target"].
 * Crée un overlay sombre autour de l'élément cible avec une bordure lumineuse pulsante.
 * pointer-events:none sur tout le composant — les clics passent à travers.
 */
export default function DemoSpotlight({ target, active }) {
  const [rect, setRect]           = useState(null);
  const pollingRef                 = useRef(null);
  const observerRef                = useRef(null);
  const trackedRef                 = useRef(false);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (!active || !target) {
      setRect(null);
      trackedRef.current = false;
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 6 secondes

    function updateRect(el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    function findAndTrack() {
      const el = document.querySelector(`[data-demo="${target}"]`);
      if (!el) {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) clearInterval(pollingRef.current);
        return;
      }

      // Élément trouvé — annuler le polling
      clearInterval(pollingRef.current);
      updateRect(el);

      if (!trackedRef.current) {
        trackSpotlightSeen(target);
        trackedRef.current = true;
      }

      // Observer les changements de taille / layout
      observerRef.current?.disconnect();
      const ro = new ResizeObserver(() => updateRect(el));
      ro.observe(el);
      ro.observe(document.body);
      observerRef.current = ro;
    }

    // Polling toutes les 100ms jusqu'à trouver l'élément
    pollingRef.current = setInterval(findAndTrack, 100);
    findAndTrack(); // tentative immédiate

    // Mettre à jour la position sur scroll et resize
    function onLayoutChange() {
      const el = document.querySelector(`[data-demo="${target}"]`);
      if (el) updateRect(el);
    }
    window.addEventListener('scroll', onLayoutChange, { passive: true });
    window.addEventListener('resize', onLayoutChange, { passive: true });

    return () => {
      clearInterval(pollingRef.current);
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', onLayoutChange);
      window.removeEventListener('resize', onLayoutChange);
    };
  }, [active, target]);

  if (!active || !rect || rect.width === 0) return null;

  const PAD = 8;

  return (
    // Wrapper non-interactif — couvre tout l'écran
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        10000,
        pointerEvents: 'none',
      }}
    >
      {/* Halo pulsant autour de l'élément cible */}
      <div style={{
        position:     'fixed',
        top:          rect.top  - PAD,
        left:         rect.left - PAD,
        width:        rect.width  + PAD * 2,
        height:       rect.height + PAD * 2,
        borderRadius: 12,
        animation:    'sl-demo-highlight 1.8s ease-in-out infinite',
        pointerEvents: 'none',
        // Transition fluide quand l'élément change de position
        transition:   'top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease',
      }} />
    </div>
  );
}
