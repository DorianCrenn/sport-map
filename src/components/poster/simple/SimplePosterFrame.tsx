import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { FORMATS, BGS, resolveClubAccent, buildPalette, makeTheme, PosterBg, type Format, type Bg, type Mode, type Theme } from './posterKit.js';

const SEG_BOX: React.CSSProperties = {
  display: 'inline-flex', gap: 2, flexShrink: 0,
  backgroundColor: 'var(--sl-surface)', borderRadius: 'var(--sl-radius-xl)', padding: 3, border: '1px solid var(--sl-border)',
};
function seg(active: boolean, accent: string): React.CSSProperties {
  return {
    padding: '6px 11px', borderRadius: 'var(--sl-radius-lg)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
    border: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s',
    background: active ? accent : 'transparent', color: active ? '#fff' : 'var(--sl-t2)',
  };
}

export interface PosterCtx { t: Theme; accent: string; dim: typeof FORMATS[number]; format: Format }

interface SimplePosterFrameProps {
  club: Record<string, any>;
  accentColor?: string;
  fileBase: string;
  contentTabs?: { id: string; label: string }[];
  content?: string;
  onContent?: (id: string) => void;
  renderPoster: (ctx: PosterCtx) => React.ReactNode;
}

// Cadre partagé des affiches « simples » (match + saison) : barre haute (contenu +
// format + thème), aperçu mis à l'échelle, barre d'outils bas (couleur/fond/export).
export default function SimplePosterFrame({ club, accentColor = '', fileBase, contentTabs, content, onContent, renderPoster }: SimplePosterFrameProps) {
  const clubAccent = resolveClubAccent(accentColor, club);
  const palette = useMemo(() => buildPalette(clubAccent, club), [clubAccent, club]);

  const [format, setFormat] = useState<Format>('post');
  const [bg, setBg]         = useState<Bg>('spot');
  const [mode, setMode]     = useState<Mode>('dark');
  const [accent, setAccent] = useState<string>(clubAccent);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [exporting, setExporting]   = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const posterRef  = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const t = useMemo(() => makeTheme(mode), [mode]);
  const dim = FORMATS.find(f => f.id === format)!;

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const compute = () => setScale(Math.min(1, (el.clientWidth - 28) / dim.w, (el.clientHeight - 28) / dim.h));
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dim.w, dim.h]);

  const exportOpts = { pixelRatio: 3, cacheBust: true, width: dim.w, height: dim.h, style: { transform: 'none', transformOrigin: 'top left' } };
  const fileName = `${fileBase}-${format}.png`;

  const handleDownload = useCallback(async () => {
    setExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current!, exportOpts);
      const link = document.createElement('a');
      link.download = fileName; link.href = dataUrl; link.click();
      setExportOpen(false);
    } catch (err) { console.error('[SimplePoster] download failed:', err); }
    finally { setExporting(false); }
  }, [fileName, dim.w, dim.h]);

  const handleShare = useCallback(async () => {
    setExporting(true);
    try {
      const { toBlob } = await import('html-to-image');
      const blob = posterRef.current ? await toBlob(posterRef.current, exportOpts) : null;
      if (blob) {
        const file = new File([blob], fileName, { type: 'image/png' });
        const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
        if (nav.canShare?.({ files: [file] }) && typeof navigator.share === 'function') {
          await navigator.share({ files: [file], title: 'Affiche' });
          setExportOpen(false);
          return;
        }
      }
      await handleDownload();
    } catch (err) { if ((err as Error)?.name !== 'AbortError') console.error('[SimplePoster] share failed:', err); }
    finally { setExporting(false); }
  }, [fileName, dim.w, dim.h, handleDownload]);

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '7px 13px', borderRadius: 'var(--sl-radius-lg)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${active ? 'transparent' : 'var(--sl-border)'}`, whiteSpace: 'nowrap',
    background: active ? accent : 'var(--sl-surface)', color: active ? '#fff' : 'var(--sl-t2)', transition: 'all 0.15s',
  });

  const tabs = [{ id: 'couleur', label: 'Couleur', icon: '🎨' }, { id: 'fond', label: 'Fond', icon: '✨' }];

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Barre haute — 1 clic */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
          {contentTabs && contentTabs.length > 1 && (
            <div style={SEG_BOX}>
              {contentTabs.map(c => <button key={c.id} onClick={() => onContent?.(c.id)} style={seg(content === c.id, accent)}>{c.label}</button>)}
            </div>
          )}
          <div style={SEG_BOX}>
            {FORMATS.map(f => <button key={f.id} onClick={() => setFormat(f.id)} style={seg(format === f.id, accent)}>{f.label}</button>)}
          </div>
        </div>
        <div style={{ ...SEG_BOX, flexShrink: 0 }}>
          <button onClick={() => setMode('dark')}  style={seg(mode === 'dark', accent)}  aria-label="Thème sombre">🌙 Sombre</button>
          <button onClick={() => setMode('light')} style={seg(mode === 'light', accent)} aria-label="Thème clair">☀️ Clair</button>
        </div>
      </div>

      {/* Aperçu — affiche entière (mise à l'échelle) */}
      <div ref={previewRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: 'var(--sl-card-hi, #eef2f7)' }}>
        <div style={{ width: dim.w * scale, height: dim.h * scale, flexShrink: 0 }}>
          <div ref={posterRef} style={{
            width: dim.w, height: dim.h, position: 'relative', overflow: 'hidden',
            transform: `scale(${scale})`, transformOrigin: 'top left',
            display: 'flex', flexDirection: 'column', background: t.bg, borderRadius: 22, fontFamily: "'Inter', sans-serif",
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          }}>
            <PosterBg bg={bg} accent={accent} t={t} />
            {renderPoster({ t, accent, dim, format })}
          </div>
        </div>
      </div>

      {/* Panneau d'options (à la demande) */}
      <AnimatePresence initial={false}>
        {activePanel && (
          <motion.div key={activePanel} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ flexShrink: 0, borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {activePanel === 'couleur' && <>
                {palette.map(c => (
                  <button key={c} onClick={() => setAccent(c)} aria-label={`Couleur ${c}`}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: accent.toLowerCase() === c.toLowerCase() ? '3px solid var(--sl-t1)' : '2px solid var(--sl-border)' }} />
                ))}
                <label title="Couleur personnalisée" style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--sl-border)', cursor: 'pointer', position: 'relative', display: 'inline-block', background: 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' }}>
                  <input type="color" value={accent} onChange={e => setAccent(e.target.value)} style={{ position: 'absolute', inset: -4, opacity: 0, cursor: 'pointer' }} />
                </label>
              </>}
              {activePanel === 'fond' && BGS.map(b => <button key={b.id} onClick={() => setBg(b.id)} style={chip(bg === b.id)}>{b.label}</button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre d'outils — style Expert */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'stretch', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(tab => {
          const active = activePanel === tab.id;
          return (
            <button key={tab.id} onClick={() => setActivePanel(active ? null : tab.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 4px 8px', border: 'none', borderTop: `2px solid ${active ? accent : 'transparent'}`, cursor: 'pointer', background: 'transparent', color: active ? accent : 'var(--sl-t3)', transition: 'color 0.15s' }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700 }}>{tab.label}</span>
            </button>
          );
        })}
        <button onClick={() => { setActivePanel(null); setExportOpen(true); }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 4px 8px', border: 'none', borderTop: '2px solid transparent', cursor: 'pointer', background: 'transparent', color: accent, transition: 'color 0.15s' }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>⬇</span>
          <span style={{ fontSize: 9, fontWeight: 800 }}>Exporter</span>
        </button>
      </div>

      {/* Menu d'export */}
      <AnimatePresence>
        {exportOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-end" style={{ zIndex: 5, background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setExportOpen(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }} onClick={e => e.stopPropagation()}
              style={{ background: 'var(--sl-card)', borderTop: '1px solid var(--sl-border)', borderRadius: '18px 18px 0 0', padding: '12px 16px calc(20px + env(safe-area-inset-bottom,0px))' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--sl-border)' }} />
              </div>
              <div style={{ color: 'var(--sl-t1)', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Exporter l'affiche</div>
              <button onClick={handleShare} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 14, marginBottom: 8, cursor: 'pointer', border: 'none', background: accent }}>
                <span style={{ fontSize: 18 }}>📤</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>Partager</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>WhatsApp, Instagram… (image)</div>
                </div>
              </button>
              <button onClick={handleDownload} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 14, cursor: 'pointer', border: '1px solid var(--sl-border)', background: 'var(--sl-surface)' }}>
                <span style={{ fontSize: 18 }}>⬇</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--sl-t1)' }}>Télécharger en PNG</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--sl-t3)' }}>HD 3× — {dim.label}</div>
                </div>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
