import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventConvocations } from '../../../hooks/useEventConvocations.js';
import { isDemoMode } from '../../../lib/supabase.js';
import SimplePosterFrame from './SimplePosterFrame.js';
import { DEMO_OVERLAY_Z, type Theme, type Format } from './posterKit.js';

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
          renderPoster={({ t, accent, dim }) => <CompoDesign players={players} club={club} event={event} accent={accent} t={t} demo={isDemoMode()} dim={dim} />}
        />
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// Libellés des tours de coupe (mêmes clés que les données événements).
const CUP_ROUNDS: Record<string, string> = {
  round_of_64: '64es de finale', round_of_32: '32es de finale', round_of_16: '16es de finale',
  round_of_8: '8es de finale', eighth_final: '8es de finale',
  quarter_final: 'Quarts de finale', semi_final: 'Demi-finale',
  final: 'Finale', third_place: 'Petite finale',
};

// Compétition (bandeau) — même convention que EventCard/MobileEventSheet :
// event_type + level (championnat) / cup_type (coupe) / tournament_name (tournoi).
function competitionLabel(ev: Record<string, any>): { icon: string; text: string } | null {
  const type  = String(ev?.event_type ?? ev?.eventType ?? '');
  const level = String(ev?.level ?? '').trim();
  const cup   = String(ev?.cup_type ?? ev?.cupType ?? '').trim();
  const tour  = String(ev?.tournament_name ?? '').trim();
  if (type === 'championship') return { icon: '🏆', text: `Championnat${level ? ` · ${level}` : ''}` };
  if (type === 'cup') {
    const round = CUP_ROUNDS[cup] ?? (cup && !/coupe/i.test(cup) ? cup : '');
    const base  = /coupe/i.test(cup) ? cup : 'Coupe';
    return { icon: '🥇', text: base === 'Coupe' && round ? `Coupe · ${round}` : base };
  }
  if (type === 'friendly')   return { icon: '🤝', text: 'Match amical' };
  if (type === 'tournament') return { icon: '🏟️', text: tour || 'Tournoi' };
  return level ? { icon: '🏆', text: level } : null;
}

function CompoDesign({ players, club, event, accent, t, demo, dim }: { players: Player[]; club: Record<string, any>; event: Record<string, any>; accent: string; t: Theme; demo: boolean; dim: { id: Format; w: number; h: number } }) {
  const n = players.length;
  const confirmed = players.filter(p => p.status === 'accepted').length;
  const pending = n - confirmed;

  // ── Infos match ──────────────────────────────────────────────────────────
  const clubName = club?.name ?? 'Notre équipe';
  const adversaire = event?.adversaire || event?.awayTeam || '';
  const away = String(event?.home_or_away ?? 'home') === 'away';
  const home = away ? adversaire : clubName;
  const visitor = away ? clubName : adversaire;
  const d = event?.date ? new Date(event.date) : null;
  const valid = !!d && !isNaN(d.getTime());
  const dateStr = valid ? d!.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '') : '';
  const timeStr = valid ? d!.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h') : '';
  const venue = event?.venue || event?.lieu || event?.city || '';
  const category = event?.category || event?.team_name || '';
  const comp = competitionLabel(event);
  const logo = club?.logoUrl ?? club?.logo_url ?? null;

  // ── Dimensionnement anti-débordement ─────────────────────────────────────
  // On MESURE la hauteur réelle de l'en-tête (le nom du club/adversaire peut le
  // faire varier), puis on répartit les joueurs dans la place restante → jamais
  // coupé, quel que soit le format/effectif. offsetHeight = px de layout (non
  // affecté par le transform:scale de l'aperçu).
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(150);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const FOOTER = 30, VPAD = 12;
  const availH = Math.max(80, dim.h - headerH - FOOTER - VPAD);
  const gap = 5, maxRow = 46;
  // Colonnes fixées par format : formats hauts (Publication/Story) = 2 colonnes
  // LARGES → noms entiers ; Carré (court) = 3 colonnes ; +1 colonne si gros
  // effectif. La hauteur de ligne s'adapte ensuite pour tout faire tenir.
  const tall = dim.h >= 440;
  let cols = tall ? 2 : 3;
  if (n > (tall ? 22 : 21)) cols += 1;
  cols = Math.min(cols, 4);
  const perCol = Math.ceil(n / cols);
  const rowH = Math.max(18, Math.min((availH - (perCol - 1) * gap) / perCol, maxRow));
  const av = Math.max(18, Math.min(rowH - 8, cols === 2 ? 40 : 32));
  const lastFs = Math.max(10, Math.min(Math.round(rowH * 0.32), 14));
  const lines = rowH >= 38 ? 2 : 1;

  // En-tête compact sur format court (Carré) → rend de la place aux joueurs.
  const H = tall
    ? { padTop: 14, bannerFs: 11, bannerPad: '4px 12px', bannerMb: 10, logoSz: 42, matchFs: 15.5, chipMt: 10 }
    : { padTop: 10, bannerFs: 9.5, bannerPad: '3px 10px', bannerMb: 6, logoSz: 34, matchFs: 13, chipMt: 7 };

  const Chip = ({ icon, children, strong }: { icon: string; children: React.ReactNode; strong?: boolean }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: strong ? `${accent}1f` : t.surface, border: `1px solid ${strong ? `${accent}59` : `${accent}22`}`, borderRadius: 999, padding: strong ? '4px 11px' : '3px 9px', fontSize: strong ? 11.5 : 10, fontWeight: strong ? 800 : 700, color: t.text, maxWidth: '100%', minWidth: 0 }}>
      <span style={{ fontSize: strong ? 11 : 10, flexShrink: 0 }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </span>
  );

  return (
    <>
      {/* En-tête : compétition (bandeau) + confrontation + infos match */}
      <div ref={headerRef} style={{ position: 'relative', flexShrink: 0, padding: `${H.padTop}px 18px 8px` }}>
        {/* Bandeau compétition — accent plein, bien visible */}
        {comp && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: accent, color: '#fff', borderRadius: 999, padding: H.bannerPad, fontSize: H.bannerFs, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: H.bannerMb, maxWidth: '100%', boxShadow: `0 3px 10px ${accent}59` }}>
            <span style={{ fontSize: H.bannerFs + 1, flexShrink: 0 }}>{comp.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.text}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {logo
            ? <img src={logo} alt="" {...(demo ? {} : { crossOrigin: 'anonymous' as const })} style={{ width: H.logoSz, height: H.logoSz, objectFit: 'contain', borderRadius: 11, background: t.surface, flexShrink: 0 }} />
            : <div style={{ width: H.logoSz, height: H.logoSz, borderRadius: 11, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: H.logoSz * 0.43, flexShrink: 0 }}>{(clubName ?? 'FC')[0]}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: accent, fontSize: 9.5, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Le groupe {category && `· ${category}`}</div>
            <div style={{ color: t.text, fontSize: H.matchFs, fontWeight: 900, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
              {home}{visitor && <span style={{ color: t.dim }}> vs {visitor}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: H.chipMt }}>
          {dateStr && <Chip icon="🗓" strong>{dateStr}{timeStr ? ` · ${timeStr}` : ''}</Chip>}
          {venue && <Chip icon="📍">{venue}</Chip>}
          <Chip icon="✅">{confirmed} présent{confirmed > 1 ? 's' : ''}{pending > 0 ? ` · ${pending} en attente` : ''}</Chip>
        </div>
      </div>

      {/* Liste des joueurs — dimensionnée pour tenir dans le format */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 14px ${VPAD}px`, overflow: 'hidden' }}>
        {n === 0
          ? <div style={{ color: t.dim, fontSize: 12, fontWeight: 600 }}>Aucun joueur convoqué</div>
          : <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: `${rowH}px`, gap, width: '100%' }}>
              {players.map((p, i) => <PlayerCard key={p.id ?? i} p={p} accent={accent} t={t} av={av} lastFs={lastFs} lines={lines} demo={demo} />)}
            </div>}
      </div>

      <div style={{ position: 'relative', textAlign: 'center', color: t.foot, fontSize: 8.5, paddingBottom: 12, letterSpacing: '0.12em', fontWeight: 700, flexShrink: 0 }}>
        {clubName} · SPORTLINK
      </div>
    </>
  );
}

function PlayerCard({ p, accent, t, av, lastFs, lines, demo }: { p: Player; accent: string; t: Theme; av: number; lastFs: number; lines: number; demo: boolean }) {
  const conf = p.status === 'accepted';
  const parts = String(p.name).trim().split(/\s+/);
  const first = parts[0] ?? '';
  const last  = parts.length > 1 ? parts.slice(1).join(' ') : first;
  const initials = ((first[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  const badgeRing = t.bg.includes('#0b') ? '#0b1220' : '#fff';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px 3px 4px', height: '100%', boxSizing: 'border-box',
      borderRadius: 10, minWidth: 0, opacity: conf ? 1 : 0.72,
      background: conf ? `${accent}12` : t.surface,
      border: `1px solid ${conf ? `${accent}38` : `${accent}18`}`,
    }}>
      <div style={{ position: 'relative', width: av, height: av, borderRadius: 9, overflow: 'hidden', background: `${accent}22`, border: `1.5px ${conf ? 'solid' : 'dashed'} ${conf ? accent : t.dim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ position: 'absolute', color: accent, fontWeight: 900, fontSize: av * 0.36 }}>{initials}</span>
        {/* En démo : pas de crossOrigin (photos externes s'affichent) ; en prod : crossOrigin pour l'export. */}
        {p.photo && <img src={p.photo} alt="" {...(demo ? {} : { crossOrigin: 'anonymous' as const })} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {p.number != null && p.number !== '' && (
          <div style={{ position: 'absolute', bottom: -3, right: -3, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 8, background: accent, color: '#000', fontSize: 8.5, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${badgeRing}` }}>{p.number}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: lastFs - 2.5, fontWeight: 600, color: t.dim, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{first}</div>
        <div style={{ fontSize: lastFs, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 1.08, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>{last}</div>
      </div>
    </div>
  );
}
