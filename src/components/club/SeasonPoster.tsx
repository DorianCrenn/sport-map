import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { rankBy } from './tabs/seasonRanking.js';
import JerseyBadge from './JerseyBadge.js';
import type { PlayerSeasonStat } from '../../hooks/usePlayerStats.js';

type Bilan = { played: number; wins: number; draws: number; losses: number; gf: number; ga: number };
type Motm = { name: string; count: number };
type PosterType = 'scorers' | 'bilan' | 'motm';
type Format = 'post' | 'story' | 'square';

const TYPES: { id: PosterType; label: string }[] = [
  { id: 'scorers', label: '⚽ Buteurs' },
  { id: 'bilan',   label: '📊 Bilan' },
  { id: 'motm',    label: '⭐ Homme du match' },
];

const FORMATS: { id: Format; label: string; w: number; h: number; rows: number }[] = [
  { id: 'post',   label: 'Publication', w: 360, h: 450, rows: 5 }, // 4:5
  { id: 'story',  label: 'Story',       w: 360, h: 640, rows: 7 }, // 9:16
  { id: 'square', label: 'Carré',       w: 360, h: 360, rows: 3 }, // 1:1
];

type Bg = 'spot' | 'rayures' | 'bande' | 'terrain' | 'vif' | 'epure';
const BGS: { id: Bg; label: string }[] = [
  { id: 'spot',    label: 'Spot' },
  { id: 'rayures', label: 'Rayures' },
  { id: 'bande',   label: 'Bande' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'vif',     label: 'Vif' },
  { id: 'epure',   label: 'Épuré' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

// Modal plein écran : doit recouvrir aussi le calque démo (bandeau z:10000, guide z:10001)
const DEMO_OVERLAY_Z = 10050;

const isHex = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);

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
  // Couleur du club par défaut (concrète — évite les var() CSS dans html-to-image)
  const clubAccent = isHex(accentColor) ? accentColor
    : (isHex(club?.theme?.primary) ? club.theme.primary
    : isHex(club?.primary_color) ? club.primary_color : '#22c55e');

  const available: PosterType[] = useMemo(() => {
    const t: PosterType[] = [];
    if (rankBy(players, 'goals').length) t.push('scorers');
    if (bilan.played > 0) t.push('bilan');
    if (motm.length) t.push('motm');
    return t.length ? t : ['scorers'];
  }, [players, bilan.played, motm.length]);

  const palette = useMemo(() => {
    const raw = [clubAccent, club?.primary_color, club?.theme?.primary, club?.theme?.accent, club?.colors?.accent,
      '#22c55e', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899'];
    const seen = new Set<string>();
    return raw.filter(c => isHex(c) && !seen.has(c.toLowerCase()) && seen.add(c.toLowerCase())) as string[];
  }, [clubAccent, club]);

  const [type, setType]     = useState<PosterType>(available[0]);
  const [format, setFormat] = useState<Format>('post');
  const [bg, setBg]         = useState<Bg>('spot');
  const [accent, setAccent] = useState<string>(clubAccent);
  const [exporting, setExporting] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

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

        {/* Type */}
        <div className="flex justify-center gap-2 pt-2 bg-black/60 flex-shrink-0 flex-wrap px-3">
          {TYPES.filter(t => available.includes(t.id)).map(t => (
            <button key={t.id} onClick={() => setType(t.id)} className="text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={type === t.id ? { background: accent, color: '#000' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Format + couleur */}
        <div className="bg-black/60 flex-shrink-0 px-3 py-2 flex flex-col items-center gap-2">
          <div className="flex gap-2">
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={format === f.id ? { background: accent, color: '#000' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {BGS.map(b => (
              <button key={b.id} onClick={() => setBg(b.id)} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={bg === b.id ? { background: accent, color: '#000' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {palette.map(c => (
              <button key={c} onClick={() => setAccent(c)} aria-label={`Couleur ${c}`}
                style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: accent.toLowerCase() === c.toLowerCase() ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)' }} />
            ))}
            <label title="Couleur personnalisée" style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', position: 'relative', display: 'inline-block', background: 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' }}>
              <input type="color" value={accent} onChange={e => setAccent(e.target.value)} style={{ position: 'absolute', inset: -4, opacity: 0, cursor: 'pointer' }} />
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex items-start justify-center p-4">
          <div ref={posterRef} style={{
            width: dim.w, height: dim.h, flexShrink: 0, position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(160deg, #0b1220 0%, #13233f 55%, #0b1220 100%)',
            borderRadius: 22, fontFamily: "'Inter', sans-serif",
          }}>
            {/* Fond décoratif */}
            <PosterBg bg={bg} accent={accent} />

            {/* En-tête club */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 8px', flexShrink: 0 }}>
              {logoUrl
                ? <img src={logoUrl} alt="" crossOrigin="anonymous" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 12, background: 'rgba(255,255,255,0.08)' }} />
                : <div style={{ width: 46, height: 46, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: 18 }}>{(club?.name ?? 'FC')[0]}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 900, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club?.name ?? 'Mon club'}</div>
                <div style={{ color: accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Saison · {subtitle}</div>
              </div>
            </div>

            <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px 20px' }}>
              {type === 'scorers' && <ScorersPoster scorers={scorers} accent={accent} />}
              {type === 'bilan'   && <BilanPoster bilan={bilan} form={form} accent={accent} />}
              {type === 'motm'    && <MotmPoster motm={motm.slice(0, dim.rows)} accent={accent} />}
            </div>

            <div style={{ position: 'relative', textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: 8.5, paddingBottom: 12, letterSpacing: '0.12em', fontWeight: 700, flexShrink: 0 }}>
              {club?.name ?? 'SportLink'} · SPORTLINK
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function PosterBg({ bg, accent }: { bg: Bg; accent: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Épuré : fond plat, aucun décor (juste le liseré commun) */}

      {bg === 'spot' && <>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 55% at 50% -12%, ${accent}66, transparent 60%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 75% at 50% 130%, rgba(0,0,0,0.7), transparent 55%)' }} />
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 90px 20px rgba(0,0,0,0.5)' }} />
      </>}

      {bg === 'rayures' && <>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: '50%', background: accent, opacity: 0.16, filter: 'blur(10px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(45deg, ${accent}1a 0 3px, transparent 3px 18px)` }} />
      </>}

      {bg === 'bande' && <>
        <div style={{ position: 'absolute', top: '12%', left: '-25%', width: '150%', height: 130, background: `linear-gradient(90deg, transparent, ${accent}55, transparent)`, transform: 'rotate(-24deg)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '-25%', width: '150%', height: 70, background: `linear-gradient(90deg, transparent, ${accent}2e, transparent)`, transform: 'rotate(-24deg)' }} />
        <div style={{ position: 'absolute', top: '60%', left: '-25%', width: '150%', height: 40, background: `linear-gradient(90deg, transparent, ${accent}1c, transparent)`, transform: 'rotate(-24deg)' }} />
      </>}

      {bg === 'terrain' && <>
        {/* Marquages de terrain de foot */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: `${accent}22` }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 170, height: 170, borderRadius: '50%', border: `2px solid ${accent}22` }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 7, height: 7, borderRadius: '50%', background: `${accent}44` }} />
        <div style={{ position: 'absolute', top: -34, left: '50%', transform: 'translate(-50%,-50%)', width: 90, height: 90, borderRadius: '50%', border: `2px solid ${accent}1e` }} />
        <div style={{ position: 'absolute', bottom: -34, left: '50%', transform: 'translate(-50%,50%)', width: 90, height: 90, borderRadius: '50%', border: `2px solid ${accent}1e` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accent}20, transparent 60%)` }} />
      </>}

      {bg === 'vif' && <>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${accent}dd 0%, ${accent}55 28%, transparent 58%)` }} />
        <div style={{ position: 'absolute', bottom: -110, right: -80, width: 260, height: 260, borderRadius: '50%', background: accent, opacity: 0.3, filter: 'blur(12px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 20px)` }} />
      </>}

      {/* Liseré accent en bas (commun) */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />
    </div>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6, background: `${accent}22`, border: `1px solid ${accent}55`, color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', padding: '5px 12px', borderRadius: 999, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function ScorersPoster({ scorers, accent }: { scorers: PlayerSeasonStat[]; accent: string }) {
  const hero = scorers[0];
  return (
    <div>
      <SectionTitle accent={accent}>⚽ TOP BUTEURS</SectionTitle>
      {hero && (
        <div style={{ background: `linear-gradient(120deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}55`, borderRadius: 16, padding: '12px 16px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', color: '#fbbf24' }}>🥇 MEILLEUR BUTEUR</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ color: accent, fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{hero.totalGoals}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>buts</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {hero.jerseyNumber != null && <JerseyBadge number={hero.jerseyNumber} accent={accent} size={36} numberColor="#fff" fill={`${accent}44`} stroke="rgba(255,255,255,0.7)" />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, lineHeight: 1.12, wordBreak: 'break-word' }}>{hero.playerName}</div>
              {hero.position && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, marginTop: 1 }}>{hero.position}</div>}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {scorers.slice(1).map((p, i) => (
          <div key={p.playerId} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 12px' }}>
            <span style={{ width: 20, textAlign: 'center', fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>{i + 2 <= 3 ? MEDALS[i + 1] : i + 2}</span>
            {p.jerseyNumber != null && <JerseyBadge number={p.jerseyNumber} accent={accent} size={22} numberColor="#fff" fill={`${accent}33`} stroke="rgba(255,255,255,0.55)" />}
            <span style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.playerName}</span>
            <span style={{ color: accent, fontSize: 16, fontWeight: 900 }}>{p.totalGoals}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MotmPoster({ motm, accent }: { motm: Motm[]; accent: string }) {
  const hero = motm[0];
  return (
    <div>
      <SectionTitle accent={accent}>⭐ HOMME DU MATCH</SectionTitle>
      {hero && (
        <div style={{ background: `linear-gradient(120deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}55`, borderRadius: 16, padding: '12px 16px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', color: '#fbbf24' }}>🥇 LE PLUS ÉLU</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ color: accent, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>×{hero.count}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>fois</span>
            </div>
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, lineHeight: 1.12, wordBreak: 'break-word' }}>{hero.name}</div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {motm.slice(1).map((m, i) => (
          <div key={m.name + i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '9px 12px' }}>
            <span style={{ width: 20, textAlign: 'center', fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>{i + 2 <= 3 ? MEDALS[i + 1] : i + 2}</span>
            <span style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
            <span style={{ color: accent, fontSize: 15, fontWeight: 900 }}>⭐ ×{m.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BilanPoster({ bilan, form, accent }: { bilan: Bilan; form: ('W' | 'D' | 'L')[]; accent: string }) {
  const diff = bilan.gf - bilan.ga;
  const fmap: Record<string, [string, string]> = { W: ['#22c55e', 'V'], D: ['#f59e0b', 'N'], L: ['#ef4444', 'D'] };
  return (
    <div>
      <SectionTitle accent={accent}>📊 BILAN · {bilan.played} MATCHS</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { n: bilan.wins,   label: 'Victoires', color: '#22c55e' },
          { n: bilan.draws,  label: 'Nuls',      color: '#f59e0b' },
          { n: bilan.losses, label: 'Défaites',  color: '#ef4444' },
        ].map(x => (
          <div key={x.label} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '16px 4px' }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: x.color, lineHeight: 1 }}>{x.n}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 5 }}>{x.label}</div>
          </div>
        ))}
      </div>
      {form.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Forme</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {form.map((r, i) => {
              const [bg, label] = fmap[r] ?? fmap.D;
              return <span key={i} style={{ width: 22, height: 22, borderRadius: 6, background: bg, color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{label}</span>;
            })}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '12px 8px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>{bilan.gf}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700 }}>MARQUÉS</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>{bilan.ga}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700 }}>ENCAISSÉS</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: diff >= 0 ? '#22c55e' : '#ef4444', fontSize: 20, fontWeight: 900 }}>{diff >= 0 ? '+' : ''}{diff}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700 }}>DIFF.</div>
        </div>
      </div>
    </div>
  );
}
