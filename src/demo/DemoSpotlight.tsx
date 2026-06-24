import { useState, useEffect, useRef, type CSSProperties } from 'react';
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
    const MAX_ATTEMPTS = 300; // 30 secondes (assez long pour que l'utilisateur navigue vers la page club)

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
    // capture:true pour attraper les scrolls sur tous les conteneurs internes
    window.addEventListener('scroll', onLayoutChange, { passive: true, capture: true });
    window.addEventListener('resize', onLayoutChange, { passive: true });

    return () => {
      clearInterval(pollingRef.current);
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', onLayoutChange, { capture: true } as any);
      window.removeEventListener('resize', onLayoutChange);
    };
  }, [active, target]);

  if (!active || !rect || rect.width === 0) return null;

  // Utiliser le Visual Viewport pour les mobiles (tient compte du clavier, zoom, chrome navigateur)
  const vvp      = (typeof window !== 'undefined' && window.visualViewport) ? window.visualViewport : null;
  const PAD      = 10;
  const VW       = vvp ? vvp.width  : window.innerWidth;
  const VH       = vvp ? vvp.height : window.innerHeight;
  const VVP_X    = vvp ? vvp.offsetLeft : 0;
  const VVP_Y    = vvp ? vvp.offsetTop  : 0;

  const centerX    = rect.left + rect.width / 2;
  const rectBottom = rect.top + rect.height;
  const rectRight  = rect.left + rect.width;

  // Ne pas afficher si l'élément est hors du viewport
  if (rect.top > VH + VVP_Y || rectBottom < VVP_Y || rect.left > VW + VVP_X || rectRight < VVP_X) return null;

  // ── Dimensions conservatives du bloc flèche+label ────────────────────────
  // Estimées larges pour le clamping → le label ne sortira jamais du viewport.
  // LABEL_W : "👆 CLIQUE ICI" en uppercase 11px + letter-spacing 1px + marge
  const LABEL_W  = 220;
  const LABEL_H  = 60;   // SVG 28px + gap 4px + texte 18px + marge
  const MARGIN_H = 16;
  const MARGIN_V = 10;

  // ── Position horizontale : left absolu (pas de translateX) ───────────────
  // On calcule le left du bord gauche du container pour qu'il soit entièrement visible.
  const idealLeft = centerX - LABEL_W / 2;
  const labelLeft = Math.max(
    MARGIN_H,
    Math.min(idealLeft, VW - LABEL_W - MARGIN_H),
  );

  // ── Direction verticale : au-dessus ou en dessous de l'élément ───────────
  const spaceBelow = VH - (rectBottom - VVP_Y) - PAD - MARGIN_V;
  const spaceAbove = (rect.top - VVP_Y) - PAD - MARGIN_V;

  let arrowBelow;
  if (spaceBelow >= LABEL_H && spaceAbove >= LABEL_H) {
    arrowBelow = rect.top - VVP_Y < VH * 0.60;
  } else {
    arrowBelow = spaceBelow >= LABEL_H || spaceAbove < LABEL_H;
  }

  // ── Position verticale clampée ────────────────────────────────────────────
  const arrowSize = 28;
  let labelTop;
  if (arrowBelow) {
    // Flèche sous l'élément, pointant vers le haut
    labelTop = Math.min(
      rectBottom + PAD + 8,
      VH + VVP_Y - LABEL_H - MARGIN_V,
    );
  } else {
    // Flèche au-dessus de l'élément, pointant vers le bas
    labelTop = Math.max(
      rect.top - PAD - arrowSize - 24,
      VVP_Y + MARGIN_V,
    );
  }

  const labelStyle: CSSProperties = {
    position:      'fixed',
    top:           labelTop,
    left:          labelLeft,
    width:         LABEL_W,
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           4,
    transition:    'top 0.15s ease, left 0.15s ease',
    overflow:      'visible',
  };

  const textStyle: CSSProperties = {
    fontSize:      11,
    fontWeight:    800,
    letterSpacing: 1,
    color:         '#a5b4fc',
    textTransform: 'uppercase',
    textShadow:    '0 1px 8px rgba(0,0,0,0.8)',
    whiteSpace:    'nowrap',
    maxWidth:      LABEL_W - 8,
    textAlign:     'center',
  };

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
            `0 0 0 9999px rgba(0,0,0,0.58)`,
            `0 0 0 2.5px rgba(99,102,241,0.9)`,
            `0 0 0 5px rgba(99,102,241,0.3)`,
            `0 0 22px 4px rgba(99,102,241,0.5)`,
          ].join(', '),
          transition: 'top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease',
        }}
      />

      {/* ── Anneaux pulsants ────────────────────────────────────────────── */}
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
        <div style={{ ...labelStyle, animation: 'sl-demo-arrow 0.9s ease-in-out infinite' }}>
          <span style={textStyle}>👆 Clique ici</span>
          <svg width={arrowSize} height={arrowSize} viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5M5 12l7-7 7 7" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ) : (
        /* Flèche pointant vers le bas (↓), positionnée au-dessus de l'élément */
        <div style={{ ...labelStyle, animation: 'sl-demo-arrow-up 0.9s ease-in-out infinite' }}>
          <svg width={arrowSize} height={arrowSize} viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M19 12l-7 7-7-7" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={textStyle}>👆 Clique ici</span>
        </div>
      )}
    </div>
  );
}
