import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { rankBy } from './tabs/seasonRanking.js';
import type { PlayerSeasonStat } from '../../hooks/usePlayerStats.js';

type Bilan = { played: number; wins: number; draws: number; losses: number; gf: number; ga: number };
type Motm = { name: string; count: number };
type PosterType = 'scorers' | 'bilan' | 'motm';

const TYPES: { id: PosterType; label: string }[] = [
  { id: 'scorers', label: '⚽ Buteurs' },
  { id: 'bilan',   label: '📊 Bilan' },
  { id: 'motm',    label: '⭐ Homme du match' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

// Modal plein écran : doit recouvrir aussi le calque démo (bandeau z:10000, guide z:10001)
const DEMO_OVERLAY_Z = 10050;

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
  // Couleur concrète pour l'export (évite les var() CSS dans html-to-image)
  const accent = (accentColor && !accentColor.startsWith('var('))
    ? accentColor
    : (club?.theme?.primary ?? club?.primaryColor ?? '#22d96a');

  const available: PosterType[] = useMemo(() => {
    const t: PosterType[] = [];
    if (rankBy(players, 'goals').length) t.push('scorers');
    if (bilan.played > 0) t.push('bilan');
    if (motm.length) t.push('motm');
    return t.length ? t : ['scorers'];
  }, [players, bilan.played, motm.length]);

  const [type, setType]         = useState<PosterType>(available[0]);
  const [exporting, setExporting] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const scorers = useMemo(() => rankBy(players, 'goals').slice(0, 5), [players]);
  const logoUrl = club?.logoUrl ?? club?.logo_url ?? null;
  const subtitle = teamName ?? club?.name ?? '';

  const handleExport = useCallback(async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(posterRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement('a');
      link.download = `saison-${type}-${(teamName ?? 'club').toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[SeasonPoster] export failed:', err);
    } finally { setExporting(false); }
  }, [type, teamName]);

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

        <div className="flex justify-center gap-2 py-2 bg-black/60 flex-shrink-0 flex-wrap px-3">
          {TYPES.filter(t => available.includes(t.id)).map(t => (
            <button key={t.id} onClick={() => setType(t.id)} className="text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={type === t.id ? { background: accent, color: '#000' } : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto flex items-start justify-center p-4">
          <div ref={posterRef} style={{
            width: 360, minHeight: 460, flexShrink: 0, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(160deg, #0b1220 0%, #13233f 55%, #0b1220 100%)',
            borderRadius: 22, fontFamily: "'Inter', sans-serif",
          }}>
            {/* Glow accent */}
            <div style={{ position: 'absolute', top: -70, right: -60, width: 240, height: 240, borderRadius: '50%', background: accent, opacity: 0.22, filter: 'blur(8px)' }} />

            {/* En-tête club */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 8px' }}>
              {logoUrl
                ? <img src={logoUrl} alt="" crossOrigin="anonymous" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 12, background: 'rgba(255,255,255,0.08)' }} />
                : <div style={{ width: 46, height: 46, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: 18 }}>{(club?.name ?? 'FC')[0]}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 900, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club?.name ?? 'Mon club'}</div>
                <div style={{ color: accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Saison · {subtitle}</div>
              </div>
            </div>

            <div style={{ position: 'relative', padding: '4px 20px 20px' }}>
              {type === 'scorers' && <ScorersPoster scorers={scorers} accent={accent} />}
              {type === 'bilan'   && <BilanPoster bilan={bilan} form={form} accent={accent} />}
              {type === 'motm'    && <MotmPoster motm={motm} accent={accent} />}
            </div>

            <div style={{ position: 'relative', textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: 8.5, paddingBottom: 12, letterSpacing: '0.12em', fontWeight: 700 }}>
              {club?.name ?? 'SportLink'} · SPORTLINK
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${accent}22`, border: `1px solid ${accent}55`, color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: '0.06em', padding: '5px 12px', borderRadius: 999, marginBottom: 14 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: `linear-gradient(120deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}55`, borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
          <span style={{ fontSize: 30 }}>🥇</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hero.playerName}</div>
            {hero.position && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600 }}>{hero.position}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: accent, fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{hero.totalGoals}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700 }}>BUTS</div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {scorers.slice(1).map((p, i) => (
          <div key={p.playerId} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '9px 12px' }}>
            <span style={{ width: 20, textAlign: 'center', fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>{i + 2 <= 3 ? MEDALS[i + 1] : i + 2}</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: `linear-gradient(120deg, ${accent}33, ${accent}11)`, border: `1px solid ${accent}55`, borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
          <span style={{ fontSize: 30 }}>🥇</span>
          <div style={{ flex: 1, minWidth: 0, color: '#fff', fontSize: 17, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hero.name}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: accent, fontSize: 26, fontWeight: 900, lineHeight: 1 }}>×{hero.count}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700 }}>ÉLU</div>
          </div>
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
