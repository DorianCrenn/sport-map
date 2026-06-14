import { useState, useEffect, useRef } from 'react';
import { trackSpotlightSeen } from './demoAnalytics.js';

// ── Styles injectés une seule fois ────────────────────────────────────────────

const STYLE_ID = 'sl-demo-spotlight-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes sl-demo-ring {
      0%   { transform: scale(1);    opacity: 0.7; }
      100% { transform: scale(1.55); opacity: 0;   }
    }
    @keyframes sl-demo-ring2 {
      0%   { transform: scale(1);    opacity: 0.45; }
      100% { transform: scale(1.9);  opacity: 0;    }
    }
    @keyframes sl-demo-arrow {
      0%, 100% { transform: translateY(0px);  }
      50%      { transform: translateY(-8px); }
    }
    @keyframes sl-demo-arrow-up {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(8px); }
    }
    @keyframes sl-demo-shake {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-8px); }
      40%      { transform: translateX(8px); }
      60%      { transform: translateX(-5px); }
      80%      { transform: translateX(5px); }
    }
    .sl-spotlight-shake {
      animation: sl-demo-shake 0.45s ease-in-out !important;
    }
  `;
  document.head.appendChild(style);
}

// ── Composant principal ───────────────────────────────────────────────────────

/**
 * DemoSpotlight — tutoriel interactif style jeu vidéo.
 *
 * @param {string}   target    — valeur de [data-demo="..."] à mettre en valeur
 * @param {boolean}  active    — actif ou non
 * @param {boolean}  shaking   — trigger shake (DemoApp le passe à true brièvement)
 */
export default function DemoSpotlight({ target, active, shaking = false }) {
  const [rect, setRect]      = useState(null);
  const pollingRef           = useRef(null);
  const observerRef          = useRef(null);
  const trackedRef           = useRef(false);
  const highlightRef         = useRef(null);

  useEffect(() => { injectStyles(); }, []);

  // ── Shake quand DemoApp le demande ────────────────────────────────────────
  useEffect(() => {
    if (!shaking || !highlightRef.current) return;
    const el = highlightRef.current;
    el.classList.remove('sl-spotlight-shake');
    // Force reflow for animation restart
    void el.offsetWidth;
    el.classList.add('sl-spotlight-shake');
    const timer = setTimeout(() => el.classList.remove('sl-spotlight-shake'), 500);
    return () => clearTimeout(timer);
  }, [shaking]);

  // ── Tracking position de l'élément cible ─────────────────────────────────
  useEffect(() => {
    if (!active || !target) {
      setRect(null);
      trackedRef.current = false;
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 80; // 8 secondes

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
      clearInterval(pollingRef.current);
      updateRect(el);

      if (!trackedRef.current) {
        trackSpotlightSeen(target);
        trackedRef.current = true;
      }

      observerRef.current?.disconnect();
      const ro = new ResizeObserver(() => updateRect(el));
      ro.observe(el);
      ro.observe(document.body);
      observerRef.current = ro;
    }

    pollingRef.current = setInterval(findAndTrack, 100);
    findAndTrack();

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

  const PAD = 10;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const arrowBelow = centerY < window.innerHeight * 0.55; // flèche sous l'élément si l'élément est haut
  const arrowSize  = 28;

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        10000,
        pointerEvents: 'none',
      }}
    >
      {/* ── Halo principal pulsant (box-shadow trick pour l'overlay sombre) ── */}
      <div
        ref={highlightRef}
        style={{
          position:   'fixed',
          top:        rect.top  - PAD,
          left:       rect.left - PAD,
          width:      rect.width  + PAD * 2,
          height:     rect.height + PAD * 2,
          borderRadius: 14,
          boxShadow: [
            `0 0 0 9999px rgba(0,0,0,0.58)`,                         // overlay sombre
            `0 0 0 2.5px rgba(99,102,241,0.9)`,                      // contour indigo
            `0 0 0 5px rgba(99,102,241,0.3)`,                        // halo proche
            `0 0 22px 4px rgba(99,102,241,0.5)`,                     // lueur diffuse
          ].join(', '),
          transition: 'top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease',
        }}
      />

      {/* ── Anneaux pulsants (expansion et disparition) ─────────────────── */}
      <div style={{
        position:     'fixed',
        top:          rect.top  - PAD,
        left:         rect.left - PAD,
        width:        rect.width  + PAD * 2,
        height:       rect.height + PAD * 2,
        borderRadius: 14,
        border:       '2px solid rgba(99,102,241,0.6)',
        animation:    'sl-demo-ring 1.4s ease-out infinite',
        transformOrigin: 'center',
        transition:   'top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease',
      }} />
      <div style={{
        position:     'fixed',
        top:          rect.top  - PAD,
        left:         rect.left - PAD,
        width:        rect.width  + PAD * 2,
        height:       rect.height + PAD * 2,
        borderRadius: 14,
        border:       '1.5px solid rgba(129,140,248,0.4)',
        animation:    'sl-demo-ring2 1.4s ease-out 0.4s infinite',
        transformOrigin: 'center',
        transition:   'top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease',
      }} />

      {/* ── Flèche animée + label "Clique ici" ───────────────────────────── */}
      {arrowBelow ? (
        /* Flèche pointant vers le haut (↑), positionnée sous l'élément */
        <div style={{
          position:   'fixed',
          top:        rect.top + rect.height + PAD + 8,
          left:       centerX,
          transform:  'translateX(-50%)',
          display:    'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap:        4,
          animation:  'sl-demo-arrow 0.9s ease-in-out infinite',
          transition: 'top 0.15s ease, left 0.15s ease',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1,
            color: '#a5b4fc', textTransform: 'uppercase',
            textShadow: '0 1px 8px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}>
            👆 Clique ici
          </span>
          <svg width={arrowSize} height={arrowSize} viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5M5 12l7-7 7 7" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ) : (
        /* Flèche pointant vers le bas (↓), positionnée au-dessus de l'élément */
        <div style={{
          position:   'fixed',
          top:        rect.top - PAD - arrowSize - 24,
          left:       centerX,
          transform:  'translateX(-50%)',
          display:    'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap:        4,
          animation:  'sl-demo-arrow-up 0.9s ease-in-out infinite',
          transition: 'top 0.15s ease, left 0.15s ease',
        }}>
          <svg width={arrowSize} height={arrowSize} viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M19 12l-7 7-7-7" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1,
            color: '#a5b4fc', textTransform: 'uppercase',
            textShadow: '0 1px 8px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}>
            👆 Clique ici
          </span>
        </div>
      )}
    </div>
  );
}
