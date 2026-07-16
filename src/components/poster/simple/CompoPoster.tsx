import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventConvocations } from '../../../hooks/useEventConvocations.js';
import { isDemoMode } from '../../../lib/supabase.js';
import SimplePosterFrame from './SimplePosterFrame.js';
import { DEMO_OVERLAY_Z, type Theme } from './posterKit.js';

const FILTERS = [{ id: 'all', label: '👥 Tous' }, { id: 'confirmed', label: '✅ Confirmés' }];

interface Player { id: string | number | undefined; name: string; photo: string | null; number: string | number | null; status: string }

interface CompoPosterProps {
  event: Record<string, any>;
  club: Record<string, any>;
  accentColor?: string;
  onClose: () => void;
}

// Affiche « du groupe » : joueurs convoqués placés automatiquement en grille
// adaptative (colonnes/taille selon l'effectif). Même cadre partagé (SimplePosterFrame).
export default function CompoPoster({ event, club, accentColor = '', onClose }: CompoPosterProps) {
  const { convocations } = useEventConvocations(event?.id) as { convocations: any[] };
  const [filter, setFilter] = useState('all');
  const [demoConv, setDemoConv] = useState<any[] | null>(null);

  // Démo : les convocations ne viennent pas de Supabase → on alimente depuis les
  // données démo (joint aux joueurs pour photo + numéro).
  useEffect(() => {
    if (!isDemoMode()) return;
    Promise.all([import('../../../demo/data/convocations.js'), import('../../../demo/data/players.js')]).then(([cv, pl]) => {
      const byId = new Map((pl.demoPlayers as any[]).map(p => [p.id, p]));
      let rows = (cv.demoConvocations as any[]).filter(c => c.event_id === event?.id);
      if (!rows.length) rows = (cv.demoConvocations as any[]).filter(c => c.event_id === 'demo-event-001');
      setDemoConv(rows.map(c => {
        const p = byId.get(c.player_id);
        return { id: c.id, player_name: c.player_name, photo_url: p?.photo_url ?? null, number: p?.number ?? null, status: c.status };
      }));
    });
  }, [event?.id]);

  const source = isDemoMode() ? (demoConv ?? []) : convocations;

  const players: Player[] = useMemo(() => {
    const norm: Player[] = (source ?? []).map(c => ({
      id: c.id,
      name: c.player?.name ?? c.player_name ?? '?',
      photo: c.player?.photo_url ?? c.photo_url ?? null,
      number: c.player?.number ?? c.number ?? null,
      status: c.status,
    }));
    const keep = filter === 'confirmed' ? ['accepted'] : ['accepted', 'pending'];
    const kept = norm.filter(p => keep.includes(p.status));
    return [...kept.filter(p => p.status === 'accepted'), ...kept.filter(p => p.status !== 'accepted')];
  }, [source, filter]);

  return createPortal(
    <AnimatePresence>
      <motion.div role="dialog" aria-modal="true" className="fixed inset-0 flex flex-col bg-black/70 overscroll-contain"
        style={{ zIndex: DEMO_OVERLAY_Z } as React.CSSProperties}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 flex-shrink-0">
          <button onClick={onClose} aria-label="Fermer" className="text-white/70 text-sm font-semibold">✕ Fermer</button>
          <h2 className="text-white font-bold text-sm">Affiche du groupe</h2>
          <div style={{ width: 56 }} />
        </div>

        <SimplePosterFrame
          club={club}
          accentColor={accentColor}
          fileBase={`groupe-${(event?.adversaire ?? 'match').toLowerCase().replace(/\s+/g, '-')}`}
          contentTabs={FILTERS}
          content={filter}
          onContent={setFilter}
          renderPoster={({ t, accent }) => <CompoDesign players={players} club={club} event={event} accent={accent} t={t} demo={isDemoMode()} />}
        />
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function CompoDesign({ players, club, event, accent, t, demo }: { players: Player[]; club: Record<string, any>; event: Record<string, any>; accent: string; t: Theme; demo: boolean }) {
  const n = players.length;
  const confirmed = players.filter(p => p.status === 'accepted').length;
  const pending = n - confirmed;
  // Liste sur 2 colonnes (3 si très gros effectif) — avatar + nom aligné à gauche.
  const cols = n > 20 ? 3 : 2;
  const perCol = Math.ceil(n / cols);
  const compact = perCol > 7;                    // resserre pour tenir en Publication/Carré
  const av = compact ? 32 : cols === 2 ? 40 : 34;
  const lastFs = compact ? 11 : cols === 2 ? 13 : 11;

  const adversaire = event?.adversaire || event?.awayTeam || '';
  const d = event?.date ? new Date(event.date) : null;
  const dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const logo = club?.logoUrl ?? club?.logo_url ?? null;

  return (
    <>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 6px', flexShrink: 0 }}>
        {logo
          ? <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 12, background: t.surface }} />
          : <div style={{ width: 44, height: 44, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: 18 }}>{(club?.name ?? 'FC')[0]}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: t.text, fontSize: 15, fontWeight: 900, lineHeight: 1.1 }}>Le groupe {adversaire && <span style={{ color: t.dim, fontWeight: 700 }}>vs {adversaire}</span>}</div>
          <div style={{ color: accent, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
            {confirmed} confirmé{confirmed > 1 ? 's' : ''}{pending > 0 ? ` · ${pending} en attente` : ''}{dateStr ? ` · ${dateStr}` : ''}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 14px', overflow: 'hidden' }}>
        {n === 0
          ? <div style={{ color: t.dim, fontSize: 12, fontWeight: 600 }}>Aucun joueur convoqué</div>
          : <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: compact ? 5 : 7, width: '100%' }}>
              {players.map((p, i) => <PlayerCard key={p.id ?? i} p={p} accent={accent} t={t} av={av} lastFs={lastFs} compact={compact} demo={demo} />)}
            </div>}
      </div>

      <div style={{ position: 'relative', textAlign: 'center', color: t.foot, fontSize: 8.5, paddingBottom: 12, letterSpacing: '0.12em', fontWeight: 700, flexShrink: 0 }}>
        {club?.name ?? 'SportLink'} · SPORTLINK
      </div>
    </>
  );
}

function PlayerCard({ p, accent, t, av, lastFs, compact, demo }: { p: Player; accent: string; t: Theme; av: number; lastFs: number; compact: boolean; demo: boolean }) {
  const conf = p.status === 'accepted';
  const parts = String(p.name).trim().split(/\s+/);
  const first = parts[0] ?? '';
  const last  = parts.length > 1 ? parts.slice(1).join(' ') : first;
  const initials = ((first[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  const badgeRing = t.bg.includes('#0b') ? '#0b1220' : '#fff';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 7 : 9, padding: compact ? '4px 8px 4px 5px' : '6px 9px 6px 6px',
      borderRadius: 11, minWidth: 0, opacity: conf ? 1 : 0.72,
      background: conf ? `${accent}12` : t.surface,
      border: `1px solid ${conf ? `${accent}38` : `${accent}18`}`,
    }}>
      <div style={{ position: 'relative', width: av, height: av, borderRadius: 10, overflow: 'hidden', background: `${accent}22`, border: `1.5px ${conf ? 'solid' : 'dashed'} ${conf ? accent : t.dim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ position: 'absolute', color: accent, fontWeight: 900, fontSize: av * 0.36 }}>{initials}</span>
        {/* En démo : pas de crossOrigin (photos externes s'affichent) ; en prod : crossOrigin pour l'export. */}
        {p.photo && <img src={p.photo} alt="" {...(demo ? {} : { crossOrigin: 'anonymous' as const })} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {p.number != null && p.number !== '' && (
          <div style={{ position: 'absolute', bottom: -3, right: -3, minWidth: 16, height: 16, padding: '0 3px', borderRadius: 8, background: accent, color: '#000', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${badgeRing}` }}>{p.number}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: lastFs - 2.5, fontWeight: 600, color: t.dim, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{first}</div>
        <div style={{ fontSize: lastFs, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 1.1, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{last}</div>
      </div>
    </div>
  );
}
