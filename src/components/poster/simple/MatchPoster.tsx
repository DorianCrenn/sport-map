import { useState, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { deriveInitialFields } from '../../../lib/posterVariables.js';
import {
  FORMATS, BGS, resolveClubAccent, buildPalette, makeTheme,
  chipStyle, ControlRow, ColorControl, PosterBg,
  type Format, type Bg, type Mode, type Theme,
} from './posterKit.js';

type MatchType = 'annonce' | 'result';

interface SimplePosterBodyProps {
  event: Record<string, any>;
  club: Record<string, any>;
  accentColor?: string;
  score?: { home: number | string; away: number | string } | null;
}

// Corps du mode Simple, intégré DANS la coquille du PosterStudio (en-tête + toggle
// Simple/Expert fournis par le studio). Contrôles épurés + aperçu + export.
export default function SimplePosterBody({ event, club, accentColor = '', score = null }: SimplePosterBodyProps) {
  const clubAccent = resolveClubAccent(accentColor, club);
  const palette = useMemo(() => buildPalette(clubAccent, club), [clubAccent, club]);

  const fields = useMemo(() => deriveInitialFields(event, club), [event, club]);
  const homeName = fields.homeName || club?.name || 'Domicile';
  const awayName = fields.awayName || event?.adversaire || 'Adversaire';
  const homeLogo = fields.homeLogo || null;
  const awayLogo = fields.awayLogo || null;
  const championship = fields.championship || event?.level || event?.championship || '';

  const d = event?.date ? new Date(event.date) : null;
  const dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const timeStr = event?.time || (d && !isNaN(d.getTime()) ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');
  const venue = event?.venue || event?.city || '';

  const sc = score ?? (event?.score && event.score.home != null ? event.score : null);
  const hasScore = !!(sc && sc.home != null && sc.away != null);
  const available: MatchType[] = hasScore ? ['result', 'annonce'] : ['annonce'];

  const [type, setType]     = useState<MatchType>(available[0]);
  const [format, setFormat] = useState<Format>('post');
  const [bg, setBg]         = useState<Bg>('spot');
  const [mode, setMode]     = useState<Mode>('dark');
  const [accent, setAccent] = useState<string>(clubAccent);
  const [exporting, setExporting]   = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const t = useMemo(() => makeTheme(mode), [mode]);
  const dim = FORMATS.find(f => f.id === format)!;
  const fileName = `match-${type}-${format}-${(awayName || 'match').toLowerCase().replace(/\s+/g, '-')}.png`;

  const getBlob = useCallback(async (): Promise<Blob | null> => {
    if (!posterRef.current) return null;
    const { toBlob } = await import('html-to-image');
    return toBlob(posterRef.current, { pixelRatio: 3, cacheBust: true });
  }, []);

  const handleDownload = useCallback(async () => {
    setExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current!, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = fileName; link.href = dataUrl; link.click();
      setExportOpen(false);
    } catch (err) { console.error('[SimplePoster] download failed:', err); }
    finally { setExporting(false); }
  }, [fileName]);

  const handleShare = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await getBlob();
      if (blob) {
        const file = new File([blob], fileName, { type: 'image/png' });
        const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
        if (nav.canShare?.({ files: [file] }) && typeof navigator.share === 'function') {
          await navigator.share({ files: [file], title: 'Affiche du match' });
          setExportOpen(false);
          return;
        }
      }
      await handleDownload();
    } catch (err) { if ((err as Error)?.name !== 'AbortError') console.error('[SimplePoster] share failed:', err); }
    finally { setExporting(false); }
  }, [getBlob, fileName, handleDownload]);

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Contrôles */}
      <div className="bg-black/85 flex-shrink-0 px-3 py-3 flex flex-col gap-2.5 overflow-y-auto" style={{ maxHeight: '42%' }}>
        {available.length > 1 && (
          <ControlRow label="Contenu">
            {available.includes('annonce') && <button onClick={() => setType('annonce')} style={chipStyle(type === 'annonce', accent)}>📣 Annonce</button>}
            {available.includes('result') && <button onClick={() => setType('result')} style={chipStyle(type === 'result', accent)}>🏆 Résultat</button>}
          </ControlRow>
        )}
        <ControlRow label="Format">
          {FORMATS.map(f => <button key={f.id} onClick={() => setFormat(f.id)} style={chipStyle(format === f.id, accent)}>{f.label}</button>)}
        </ControlRow>
        <ControlRow label="Thème">
          <button onClick={() => setMode('dark')}  style={chipStyle(mode === 'dark', accent)}>🌙 Sombre</button>
          <button onClick={() => setMode('light')} style={chipStyle(mode === 'light', accent)}>☀️ Clair</button>
        </ControlRow>
        <ControlRow label="Couleur"><ColorControl palette={palette} accent={accent} setAccent={setAccent} /></ControlRow>
        <ControlRow label="Fond">
          {BGS.map(b => <button key={b.id} onClick={() => setBg(b.id)} style={chipStyle(bg === b.id, accent)}>{b.label}</button>)}
        </ControlRow>
      </div>

      {/* Aperçu */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center p-4" style={{ backgroundColor: 'var(--sl-card-hi, #eef2f7)' }}>
        <div ref={posterRef} style={{
          width: dim.w, height: dim.h, flexShrink: 0, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', background: t.bg, borderRadius: 22, fontFamily: "'Inter', sans-serif",
        }}>
          <PosterBg bg={bg} accent={accent} t={t} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0', flexShrink: 0 }}>
            <span style={{ color: accent, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{type === 'result' ? 'Résultat' : 'Match à venir'}</span>
            {championship && <span style={{ color: t.dim, fontSize: 10, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{championship}</span>}
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 16 }}>
              <TeamSide name={homeName} logo={homeLogo} accent={accent} t={t} />
              <div style={{ flexShrink: 0, alignSelf: 'center', textAlign: 'center', minWidth: 70 }}>
                {type === 'result' && hasScore
                  ? <div style={{ color: t.text, fontSize: 34, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sc!.home}<span style={{ color: accent, margin: '0 4px' }}>–</span>{sc!.away}</div>
                  : <div style={{ color: accent, fontSize: 26, fontWeight: 900, letterSpacing: '0.04em' }}>VS</div>}
              </div>
              <TeamSide name={awayName} logo={awayLogo} accent={accent} t={t} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              {(dateStr || timeStr) && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${accent}1f`, border: `1px solid ${accent}44`, borderRadius: 999, padding: '6px 14px' }}>
                  <span style={{ color: t.text, fontSize: 12.5, fontWeight: 800, textTransform: 'capitalize' }}>{dateStr}</span>
                  {timeStr && <span style={{ color: accent, fontSize: 12.5, fontWeight: 900 }}>{timeStr}</span>}
                </div>
              )}
              {venue && <div style={{ color: t.dim, fontSize: 11, fontWeight: 600 }}>📍 {venue}</div>}
              {type === 'annonce' && <div style={{ color: t.faint, fontSize: 11, fontWeight: 700, marginTop: 2 }}>Venez nombreux !</div>}
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'center', color: t.foot, fontSize: 8.5, paddingBottom: 12, letterSpacing: '0.12em', fontWeight: 700, flexShrink: 0 }}>
            {club?.name ?? 'SportLink'} · SPORTLINK
          </div>
        </div>
      </div>

      {/* Barre d'export */}
      <div style={{ flexShrink: 0, padding: '10px 14px calc(10px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
        <button onClick={() => setExportOpen(true)} disabled={exporting} style={{ width: '100%', padding: '12px', borderRadius: 'var(--sl-radius-lg)', border: 'none', cursor: 'pointer', background: accent, color: '#000', fontSize: 14, fontWeight: 800 }}>
          {exporting ? 'Export…' : '⬇ Exporter l’affiche'}
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
              style={{ background: '#0f1a2e', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px 18px 0 0', padding: '12px 16px calc(20px + env(safe-area-inset-bottom,0px))' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Exporter l'affiche</div>
              <button onClick={handleShare} disabled={exporting} style={exportRowStyle(accent, true)}>
                <span style={{ fontSize: 18 }}>📤</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#000' }}>Partager</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>WhatsApp, Instagram… (image)</div>
                </div>
              </button>
              <button onClick={handleDownload} disabled={exporting} style={exportRowStyle(accent, false)}>
                <span style={{ fontSize: 18 }}>⬇</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>Télécharger en PNG</div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>HD 3× — {dim.label}</div>
                </div>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function exportRowStyle(accent: string, primary: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px',
    borderRadius: 14, marginBottom: 8, cursor: 'pointer', border: 'none',
    background: primary ? accent : 'rgba(255,255,255,0.06)',
  };
}

function TeamSide({ name, logo, accent, t }: { name: string; logo: string | null; accent: string; t: Theme }) {
  const initials = String(name).split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {logo
        ? <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 14, background: t.surface }} />
        : <div style={{ width: 58, height: 58, borderRadius: 14, background: `${accent}22`, border: `1.5px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontWeight: 900, fontSize: 20 }}>{initials}</div>}
      <div style={{ color: t.text, fontSize: 13.5, fontWeight: 800, textAlign: 'center', lineHeight: 1.15, wordBreak: 'break-word', width: '100%' }}>{name}</div>
    </div>
  );
}
