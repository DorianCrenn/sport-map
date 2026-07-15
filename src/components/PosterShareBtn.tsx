import { useState, useEffect, useRef } from 'react';
import { toBlob } from 'html-to-image';
import PosterRenderer, { BASE_DIMS } from './poster/PosterRenderer.jsx';

interface PosterShareBtnProps { event?: Record<string, any> | null; }

type Phase = 'idle' | 'rendering' | 'exporting' | 'menu';

export default function PosterShareBtn({ event }: PosterShareBtnProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { w, h } = (BASE_DIMS as any).story;

  // Close menu on outside click
  useEffect(() => {
    if (phase !== 'menu') return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPhase('idle');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [phase]);

  // Cleanup blob URL on phase change
  useEffect(() => {
    if (phase === 'idle' && blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  }, [phase, blobUrl]);

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
        if ((navigator as any).canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: event?.title ?? 'SportLink' });
          if (!cancelled) setPhase('idle');
        } else {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          if (!cancelled) setPhase('menu');
        }
      } catch { if (!cancelled) setPhase('idle'); }
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDownload() {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `affiche-${(event?.title ?? 'match').replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
    setPhase('idle');
  }

  function handleWhatsApp() {
    const clubId = event?.club_id ?? event?.clubId;
    const pageUrl = clubId ? `${window.location.origin}/#club/${clubId}` : window.location.href;
    const text = encodeURIComponent(`🏆 ${event?.title ?? 'Prochain match'} — Suivez-nous sur SportLink !\n${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
    setPhase('idle');
  }

  async function handleCopyLink() {
    const clubId = event?.club_id ?? event?.clubId;
    const pageUrl = clubId ? `${window.location.origin}/#club/${clubId}` : window.location.href;
    try { await navigator.clipboard.writeText(pageUrl); } catch { /* fallback ignored */ }
    setPhase('idle');
  }

  const parts = (event?.title ?? '').split(' vs ');
  const posterData = { event, homeTeam: { name: parts[0]?.trim() ?? event?.title ?? '', logo: null }, awayTeam: { name: parts[1]?.trim() ?? '', logo: null }, championship: event?.level ?? '', tagline: event?.venue ?? event?.city ?? '', accentColor: '#22D96A', bgImage: null, sponsor: null };
  const busy = phase === 'rendering' || phase === 'exporting';

  return (
    <div style={{ position: 'relative' }}>
      {phase === 'rendering' && (
        <div aria-hidden="true" style={{ position: 'fixed', left: -9999, top: 0, width: w, height: h, pointerEvents: 'none', zIndex: -1 }}>
          <PosterRenderer templateId="simple" data={posterData} format="story" previewWidth={w} innerRef={exportRef} />
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); if (!busy && phase !== 'menu') setPhase('rendering'); }}
        disabled={busy}
        aria-label="Partager l'affiche"
        title="Partager l'affiche"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--sl-radius-md)', cursor: busy ? 'wait' : 'pointer', color: busy ? 'var(--sl-green)' : 'var(--sl-t3)', border: `1px solid ${busy ? 'var(--sl-green)' : 'var(--sl-border-s)'}`, backgroundColor: 'transparent', flexShrink: 0, opacity: busy ? 0.65 : 1, transition: 'all 0.15s' }}
      >
        {busy
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        }
      </button>

      {phase === 'menu' && (
        <div
          ref={menuRef}
          style={{ position: 'absolute', bottom: 44, right: 0, zIndex: 200, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', borderRadius: 'var(--sl-radius-xl)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
        >
          <ShareMenuItem icon="📥" label="Télécharger l'affiche" onClick={handleDownload} />
          <ShareMenuItem icon="🟢" label="Partager sur WhatsApp" onClick={handleWhatsApp} />
          <ShareMenuItem icon="🔗" label="Copier le lien du club" onClick={handleCopyLink} />
        </div>
      )}
    </div>
  );
}

function ShareMenuItem({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--sl-radius-md)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--sl-surface)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
