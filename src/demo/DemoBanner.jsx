import { useState } from 'react';
import { trackCreateAccountClicked } from './demoAnalytics.js';

// DEMO_BANNER_HEIGHT is exported so App.jsx can add matching padding-top
export const DEMO_BANNER_HEIGHT = 40;

export default function DemoBanner({ onCreateAccount }) {
  const [pulse, setPulse] = useState(false);

  function handleCTA() {
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
    trackCreateAccountClicked('banner');
    onCreateAccount?.();
  }

  return (
    <>
      <div style={{
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        height:         DEMO_BANNER_HEIGHT,
        zIndex:         10000,
        background:     'linear-gradient(90deg, #1d3a8c 0%, #2d1b69 50%, #1d3a8c 100%)',
        borderBottom:   '1px solid rgba(99,102,241,0.3)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 12px 0 16px',
        gap:            12,
        boxShadow:      '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        {/* Left: status */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        8,
          minWidth:   0,
          overflow:   'hidden',
        }}>
          {/* Pulsing dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width:        8,
              height:       8,
              borderRadius: '50%',
              background:   '#818cf8',
              animation:    'sl-demo-pulse 2s ease-in-out infinite',
            }} />
          </div>

          <span style={{
            fontSize:    12,
            fontWeight:  600,
            color:       'rgba(255,255,255,0.85)',
            whiteSpace:  'nowrap',
            overflow:    'hidden',
            textOverflow: 'ellipsis',
          }}>
            <span style={{ color: '#a5b4fc' }}>Démonstration SportLink</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
              — Aucune donnée enregistrée
            </span>
          </span>
        </div>

        {/* Right: CTA */}
        <button
          onClick={handleCTA}
          style={{
            flexShrink:   0,
            background:   pulse
              ? 'rgba(99,102,241,0.4)'
              : 'rgba(99,102,241,0.2)',
            border:       '1px solid rgba(99,102,241,0.5)',
            borderRadius: 8,
            color:        '#c7d2fe',
            padding:      '5px 12px',
            fontSize:     11,
            fontWeight:   700,
            cursor:       'pointer',
            whiteSpace:   'nowrap',
            transition:   'all 0.15s',
            letterSpacing: 0.3,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.35)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
            e.currentTarget.style.color = '#c7d2fe';
          }}
        >
          Créer mon club →
        </button>
      </div>

      <style>{`
        @keyframes sl-demo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}
