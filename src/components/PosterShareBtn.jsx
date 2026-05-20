import { useState, useEffect, useRef } from 'react';
import { toBlob } from 'html-to-image';
import PosterRenderer, { BASE_DIMS } from './poster/PosterRenderer.jsx';

// ── PosterShareBtn ─────────────────────────────────────────────────────────────
// Un clic génère l'affiche en arrière-plan et ouvre le sélecteur de partage
// natif (ou télécharge si Web Share API indisponible).

export default function PosterShareBtn({ event }) {
  // 'idle' → 'rendering' (poster monté) → 'exporting' (toBlob en cours) → 'idle'
  const [phase, setPhase] = useState('idle');
  const exportRef = useRef(null);
  const { w, h } = BASE_DIMS.story;

  useEffect(() => {
    if (phase !== 'rendering') return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled || !exportRef.current) { setPhase('idle'); return; }
      setPhase('exporting');
      try {
        const blob = await toBlob(exportRef.current, { pixelRatio: 3, cacheBust: true });
        if (cancelled || !blob) { setPhase('idle'); return; }

        const file = new File([blob], 'affiche-sportlink.png', { type: 'image/png' });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: event?.title ?? 'SportLink' });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `affiche-${(event?.title ?? 'match').replace(/\s+/g, '-').toLowerCase()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch { /* annulation utilisateur ou erreur silencieuse */ }
      finally { if (!cancelled) setPhase('idle'); }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const parts = (event?.title ?? '').split(' vs ');
  const posterData = {
    event,
    homeTeam: { name: parts[0]?.trim() ?? event?.title ?? '', logo: null },
    awayTeam: { name: parts[1]?.trim() ?? '', logo: null },
    championship: event?.level ?? '',
    tagline: event?.venue ?? event?.city ?? '',
    accentColor: '#22D96A',
    bgImage: null,
    sponsor: null,
  };

  const busy = phase !== 'idle';

  return (
    <>
      {/* Poster rendu hors-écran uniquement pendant la phase rendering */}
      {phase === 'rendering' && (
        <div
          aria-hidden="true"
          style={{ position: 'fixed', left: -9999, top: 0, width: w, height: h, pointerEvents: 'none', zIndex: -1 }}
        >
          <PosterRenderer
            templateId="simple"
            data={posterData}
            format="story"
            previewWidth={w}
            innerRef={exportRef}
          />
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); if (!busy) setPhase('rendering'); }}
        disabled={busy}
        aria-label="Partager l'affiche"
        title="Partager l'affiche"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 8,
          cursor: busy ? 'wait' : 'pointer',
          color: busy ? 'var(--sl-green)' : 'var(--sl-t3)',
          border: `1px solid ${busy ? 'var(--sl-green)' : 'var(--sl-border-s)'}`,
          backgroundColor: 'transparent', flexShrink: 0,
          opacity: busy ? 0.65 : 1, transition: 'all 0.15s',
        }}
      >
        {busy
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
        }
      </button>
    </>
  );
}
