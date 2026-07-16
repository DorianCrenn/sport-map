import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { rankBy } from './tabs/seasonRanking.js';
import JerseyBadge from './JerseyBadge.js';
import type { PlayerSeasonStat } from '../../hooks/usePlayerStats.js';
import {
  FORMATS, BGS, DEMO_OVERLAY_Z, resolveClubAccent, buildPalette, makeTheme,
  chipStyle, ControlRow, ColorControl, PosterBg,
  type Theme, type Format, type Bg, type Mode,
} from '../poster/simple/posterKit.js';

type Bilan = { played: number; wins: number; draws: number; losses: number; gf: number; ga: number };
type Motm = { name: string; count: number };
type PosterType = 'scorers' | 'bilan' | 'motm';

const TYPES: { id: PosterType; label: string }[] = [
  { id: 'scorers', label: '⚽ Buteurs' },
  { id: 'bilan',   label: '📊 Bilan' },
  { id: 'motm',    label: '⭐ Homme du match' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

interface SeasonPosterProps {
  club: Record<string, any>;
  teamName: string | null;
  accentColor: string;
  players: PlayerSeasonStat[];
  bilan: Bilan;
  form: ('W' | 'D' | 'L')[];
  motm: Motm[];
  onClose: () => void;
}

export default function SeasonPoster({ club, teamName, accentColor, players, bilan, form, motm, onClose }: SeasonPosterProps) {
  const clubAccent = resolveClubAccent(accentColor, club);

  const available: PosterType[] = useMemo(() => {
    const t: PosterType[] = [];
    if (rankBy(players, 'goals').length) t.push('scorers');
    if (bilan.played > 0) t.push('bilan');
    if (motm.length) t.push('motm');
    return t.length ? t : ['scorers'];
  }, [players, bilan.played, motm.length]);

  const palette = useMemo(() => buildPalette(clubAccent, club), [clubAccent, club]);

  const [type, setType]     = useState<PosterType>(available[0]);
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
  const scorers = useMemo(() => rankBy(players, 'goals').slice(0, dim.rows), [players, dim.rows]);
  const logoUrl = club?.logoUrl ?? club?.logo_url ?? null;
  const subtitle = teamName ?? club?.name ?? '';

  const handleExport = useCallback(async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = `saison-${type}-${format}-${(teamName ?? 'club').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[SeasonPoster] export failed:', err);
    } finally { setExporting(false); }
  }, [type, format, teamName]);

  return createPortal(
    <AnimatePresence>
      <motion.div role="dialog" aria-modal="true" className="fixed inset-0 flex flex-col bg-black/70 overscroll-contain"
        style={{ zIndex: DEMO_OVERLAY_Z } as React.CSSProperties}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
          <button onClick={onClose} aria-label="Fermer" className="text-white/70 text-sm font-semibold">✕ Fermer</button>
          <h2 className="text-white font-bold text-sm">Affiche de la saison</h2>
          <button onClick={handleExport} disabled={exporting} className="text-xs font-bold px-3 py-1.5 rounded-lg text-black disabled:opacity-40" style={{ background: accent }}>
            {exporting ? '…' : '⬇ Exporter'}
          </button>
        </div>

        {/* Contrôles — du « quoi » vers le « style » */}
        <div className="bg-black/70 flex-shrink-0 px-3 py-3 flex flex-col gap-2.5 overflow-y-auto" style={{ maxHeight: '38vh' }}>
          <ControlRow label="Contenu">
            {TYPES.filter(x => available.includes(x.id)).map(x => (
              <button key={x.id} onClick={() => setType(x.id)} style={chipStyle(type === x.id, accent)}>{x.label}</button>
            ))}
          </ControlRow>
          <ControlRow label="Format">
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)} style={chipStyle(format === f.id, accent)}>{f.label}</button>
            ))}
          </ControlRow>
          <ControlRow label="Thème">
            <button onClick={() => setMode('dark')}  style={chipStyle(mode === 'dark', accent)}>🌙 Sombre</button>
            <button onClick={() => setMode('light')} style={chipStyle(mode === 'light', accent)}>☀️ Clair</button>
          </ControlRow>
          <ControlRow label="Couleur"><ColorControl palette={palette} accent={accent} setAccent={setAccent} /></ControlRow>
          <ControlRow label="Fond">
            {BGS.map(b => (
              <button key={b.id} onClick={() => setBg(b.id)} style={chipStyle(bg === b.id, accent)}>{b.label}</button>
            ))}
          </ControlRow>
        </div>

        <div className="flex-1 overflow-y-auto flex items-start justify-center p-4">
          <div ref={posterRef} style={{
            width: dim.w, height: dim.h, flexShrink: 0, position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', background: t.bg, borderRadius: 22, fontFamily: "'Inter', sans-serif",
          }}>
            <PosterBg bg={bg} accent={accent} t={t} />

            {/* En-tête club */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 8px', flexShrink: 0 }}>
              {logoUrl
                ? <img src={logoUrl} alt="" crossOrigin="anonymous" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 12, background: t.surface }} />
                : <div style={{ width: 46, height: 46, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: 18 }}>{(club?.name ?? 'FC')[0]}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: t.text, fontSize: 15, fontWeight: 900, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club?.name ?? 'Mon club'}</div>
                <div style={{ color: accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Saison · {subtitle}</div>
              </div>
            </div>

            <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 20px' }}>
              {type === 'scorers' && <ScorersPoster scorers={scorers} accent={accent} t={t} />}
              {type === 'bilan'   && <BilanPoster bilan={bilan} form={form} accent={accent} t={t} />}
              {type === 'motm'    && <MotmPoster motm={motm.slice(0, dim.rows)} accent={accent} t={t} />}
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

function SectionTitle({ children, accent, t }: { children: React.ReactNode; accent: string; t: Theme }) {
  return (
    <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6, background: `${accent}22`, border: `1px solid ${accent}55`, color: t.text, fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', padding: '5px 12px', borderRadius: 999, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function ScorersPoster({ scorers, accent, t }: { scorers: PlayerSeasonStat[]; accent: string; t: Theme }) {
  const hero = scorers[0];
  return (
    <div>
      <SectionTitle accent={accent} t={t}>⚽ TOP BUTEURS</SectionTitle>
      {hero && (
        <div style={{ background: `linear-gradient(120deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}55`, borderRadius: 16, padding: '12px 16px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', color: '#d97706' }}>🥇 MEILLEUR BUTEUR</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ color: accent, fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{hero.totalGoals}</span>
              <span style={{ color: t.dim, fontSize: 10, fontWeight: 700 }}>buts</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {hero.jerseyNumber != null && <JerseyBadge number={hero.jerseyNumber} accent={accent} size={36} numberColor={t.jNum} fill={`${accent}44`} stroke={t.jStroke} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: t.text, fontSize: 18, fontWeight: 900, lineHeight: 1.12, wordBreak: 'break-word' }}>{hero.playerName}</div>
              {hero.position && <div style={{ color: t.dim, fontSize: 11, fontWeight: 600, marginTop: 1 }}>{hero.position}</div>}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {scorers.slice(1).map((p, i) => (
          <div key={p.playerId} style={{ display: 'flex', alignItems: 'center', gap: 9, background: t.surface, borderRadius: 12, padding: '8px 12px' }}>
            <span style={{ width: 20, textAlign: 'center', fontSize: 14, fontWeight: 900, color: t.faint }}>{i + 2 <= 3 ? MEDALS[i + 1] : i + 2}</span>
            {p.jerseyNumber != null && <JerseyBadge number={p.jerseyNumber} accent={accent} size={22} numberColor={t.jNum} fill={`${accent}33`} stroke={t.jStroke} />}
            <span style={{ flex: 1, minWidth: 0, color: t.text, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.playerName}</span>
            <span style={{ color: accent, fontSize: 16, fontWeight: 900 }}>{p.totalGoals}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MotmPoster({ motm, accent, t }: { motm: Motm[]; accent: string; t: Theme }) {
  const hero = motm[0];
  return (
    <div>
      <SectionTitle accent={accent} t={t}>⭐ HOMME DU MATCH</SectionTitle>
      {hero && (
        <div style={{ background: `linear-gradient(120deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}55`, borderRadius: 16, padding: '12px 16px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', color: '#d97706' }}>🥇 LE PLUS ÉLU</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ color: accent, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>×{hero.count}</span>
              <span style={{ color: t.dim, fontSize: 10, fontWeight: 700 }}>fois</span>
            </div>
          </div>
          <div style={{ color: t.text, fontSize: 18, fontWeight: 900, lineHeight: 1.12, wordBreak: 'break-word' }}>{hero.name}</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {motm.slice(1).map((m, i) => (
          <div key={m.name + i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.surface, borderRadius: 12, padding: '9px 12px' }}>
            <span style={{ width: 20, textAlign: 'center', fontSize: 14, fontWeight: 900, color: t.faint }}>{i + 2 <= 3 ? MEDALS[i + 1] : i + 2}</span>
            <span style={{ flex: 1, minWidth: 0, color: t.text, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
            <span style={{ color: accent, fontSize: 15, fontWeight: 900 }}>⭐ ×{m.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BilanPoster({ bilan, form, accent, t }: { bilan: Bilan; form: ('W' | 'D' | 'L')[]; accent: string; t: Theme }) {
  const diff = bilan.gf - bilan.ga;
  const fmap: Record<string, [string, string]> = { W: ['#16a34a', 'V'], D: ['#d97706', 'N'], L: ['#dc2626', 'D'] };
  return (
    <div>
      <SectionTitle accent={accent} t={t}>📊 BILAN · {bilan.played} MATCHS</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { n: bilan.wins,   label: 'Victoires', color: '#16a34a' },
          { n: bilan.draws,  label: 'Nuls',      color: '#d97706' },
          { n: bilan.losses, label: 'Défaites',  color: '#dc2626' },
        ].map(x => (
          <div key={x.label} style={{ flex: 1, textAlign: 'center', background: t.surface, borderRadius: 14, padding: '16px 4px' }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: x.color, lineHeight: 1 }}>{x.n}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.dim, marginTop: 5 }}>{x.label}</div>
          </div>
        ))}
      </div>
      {form.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: t.faint, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Forme</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {form.map((r, i) => {
              const [bgc, label] = fmap[r] ?? fmap.D;
              return <span key={i} style={{ width: 22, height: 22, borderRadius: 6, background: bgc, color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{label}</span>;
            })}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-around', background: t.surface, borderRadius: 14, padding: '12px 8px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: t.text, fontSize: 20, fontWeight: 900 }}>{bilan.gf}</div>
          <div style={{ color: t.faint, fontSize: 9, fontWeight: 700 }}>MARQUÉS</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: t.text, fontSize: 20, fontWeight: 900 }}>{bilan.ga}</div>
          <div style={{ color: t.faint, fontSize: 9, fontWeight: 700 }}>ENCAISSÉS</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: diff >= 0 ? '#16a34a' : '#dc2626', fontSize: 20, fontWeight: 900 }}>{diff >= 0 ? '+' : ''}{diff}</div>
          <div style={{ color: t.faint, fontSize: 9, fontWeight: 700 }}>DIFF.</div>
        </div>
      </div>
    </div>
  );
}
