import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { deriveInitialFields } from '../../../lib/posterVariables.js';
import {
  FORMATS, BGS, DEMO_OVERLAY_Z, resolveClubAccent, buildPalette, makeTheme,
  chipStyle, ControlRow, ColorControl, PosterBg,
  type Format, type Bg, type Mode, type Theme,
} from './posterKit.js';

type MatchType = 'annonce' | 'result';

interface MatchPosterProps {
  event: Record<string, any>;
  club: Record<string, any>;
  accentColor?: string;
  score?: { home: number | string; away: number | string } | null;
  onClose: () => void;
  onExpert?: () => void;
}

export default function MatchPoster({ event, club, accentColor = '', score = null, onClose, onExpert }: MatchPosterProps) {
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
  const [exporting, setExporting] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const t = useMemo(() => makeTheme(mode), [mode]);
  const dim = FORMATS.find(f => f.id === format)!;

  const handleExport = useCallback(async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = `match-${type}-${format}-${(awayName || 'match').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[MatchPoster] export failed:', err);
    } finally { setExporting(false); }
  }, [type, format, awayName]);

  return createPortal(
    <AnimatePresence>
      <motion.div role="dialog" aria-modal="true" className="fixed inset-0 flex flex-col bg-black/70 overscroll-contain"
        style={{ zIndex: DEMO_OVERLAY_Z } as React.CSSProperties}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
          <button onClick={onClose} aria-label="Fermer" className="text-white/70 text-sm font-semibold">✕ Fermer</button>
          <h2 className="text-white font-bold text-sm">Affiche du match</h2>
          <button onClick={handleExport} disabled={exporting} className="text-xs font-bold px-3 py-1.5 rounded-lg text-black disabled:opacity-40" style={{ background: accent }}>
            {exporting ? '…' : '⬇ Exporter'}
          </button>
        </div>

        <div className="bg-black/70 flex-shrink-0 px-3 py-3 flex flex-col gap-2.5 overflow-y-auto" style={{ maxHeight: '38vh' }}>
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
          {onExpert && (
            <button onClick={onExpert} className="self-center mt-1 text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)' }}>
              🎛️ Mode expert — tous les outils
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto flex items-start justify-center p-4">
          <div ref={posterRef} style={{
            width: dim.w, height: dim.h, flexShrink: 0, position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', background: t.bg, borderRadius: 22, fontFamily: "'Inter', sans-serif",
          }}>
            <PosterBg bg={bg} accent={accent} t={t} />

            {/* En-tête */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0', flexShrink: 0 }}>
              <span style={{ color: accent, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {type === 'result' ? 'Résultat' : 'Match à venir'}
              </span>
              {championship && <span style={{ color: t.dim, fontSize: 10, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{championship}</span>}
            </div>

            {/* Confrontation */}
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

              {/* Date / lieu */}
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
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
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
