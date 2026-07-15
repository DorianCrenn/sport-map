import { motion } from 'framer-motion';
import { useEventPredictions } from '../hooks/useEventPredictions.js';

const INDIVIDUAL_SPORTS = ['Trail', 'Running', 'Cyclisme', 'Natation', 'Triathlon', 'Athlétisme'];
const NO_DRAW_SPORTS    = ['Basketball', 'Volleyball', 'Tennis', 'Badminton', 'Squash', 'Baseball'];

const COLORS: Record<string, { main: string; dim: string; border: string }> = {
  home: { main: '#3b82f6', dim: 'rgba(59,130,246,0.18)',  border: '#3b82f6' },
  draw: { main: '#94a3b8', dim: 'rgba(148,163,184,0.15)', border: '#64748b' },
  away: { main: '#ef4444', dim: 'rgba(239,68,68,0.18)',   border: '#ef4444' },
};

interface EventPredictionsProps { eventId: string | number; event?: Record<string, any> | null; }

export default function EventPredictions({ eventId, event }: EventPredictionsProps) {
  const sport      = event?.sport ?? '';
  const adversaire = event?.adversaire ?? '';
  const shouldShow = !INDIVIDUAL_SPORTS.includes(sport) && !!adversaire;
  const showDraw   = !NO_DRAW_SPORTS.includes(sport);
  const choices    = showDraw ? ['home', 'draw', 'away'] : ['home', 'away'];
  const homeTeam   = event?.homeTeam || event?.teamName || 'Domicile';
  const awayTeam   = adversaire || 'Visiteur';
  const labels: Record<string, string> = { home: homeTeam, draw: 'Nul', away: awayTeam };

  const { counts, mine, vote, loading, isLocked, total, isLoggedIn } = useEventPredictions(shouldShow ? String(eventId) : null, event?.date);
  if (!shouldShow || loading) return null;

  const displayTotal = showDraw ? (total as number) : ((counts as any).home ?? 0) + ((counts as any).away ?? 0);
  const showPct = displayTotal > 0;

  return (
    <div style={{ borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', padding: '10px 12px 12px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>⚡</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)' }}>{showDraw ? 'Qui va gagner ?' : "Qui l'emporte ?"}</span>
          {displayTotal > 0 && <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>· {displayTotal >= 1000 ? `${(displayTotal / 1000).toFixed(1)}k` : displayTotal} vote{displayTotal > 1 ? 's' : ''}</span>}
        </div>
        {isLocked ? (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)', color: 'var(--sl-t3)', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)' }}>⏱ Verrouillé</span>
        ) : !isLoggedIn ? (
          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Connecte-toi pour voter</span>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {choices.map(choice => {
          const rawCount = (counts as Record<string, number>)[choice] ?? 0;
          const pct = showPct ? Math.round(rawCount / displayTotal * 100) : 0;
          const isVoted   = mine === choice;
          const color     = COLORS[choice];
          const leadingCount = Math.max((counts as any).home ?? 0, showDraw ? ((counts as any).draw ?? 0) : 0, (counts as any).away ?? 0);
          const isLeading = showPct && rawCount === leadingCount && rawCount > 0;
          return (
            <button key={choice} onClick={() => (vote as (c: string) => void)(choice)} disabled={(isLocked as boolean) || !(isLoggedIn as boolean)} style={{ flex: 1, position: 'relative', minHeight: 56, borderRadius: 'var(--sl-radius-lg)', border: `1.5px solid ${isVoted ? color.border : isLeading ? `${color.main}55` : 'var(--sl-border-s)'}`, backgroundColor: isVoted ? color.dim : 'var(--sl-surface)', overflow: 'hidden', cursor: (isLocked as boolean) || !(isLoggedIn as boolean) ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', transition: 'border-color 0.15s', gap: 2 }}>
              {showPct && <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: isVoted ? color.dim : `${color.main}12`, pointerEvents: 'none' }} />}
              <span style={{ fontSize: choice === 'draw' ? 15 : 10, fontWeight: choice === 'draw' ? 800 : 700, color: isVoted ? color.main : isLeading ? color.main : 'var(--sl-t2)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', paddingInline: 2, position: 'relative', zIndex: 1, lineHeight: 1.2 }}>
                {choice === 'draw' ? 'X' : labels[choice]}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: isVoted ? color.main : isLeading ? color.main : 'var(--sl-t3)', position: 'relative', zIndex: 1, lineHeight: 1 }}>{showPct ? `${pct}%` : '—'}</span>
              {isVoted && <span style={{ fontSize: 9, color: color.main, position: 'relative', zIndex: 1, fontWeight: 700 }}>✓ mon vote</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
