import { motion } from 'framer-motion';
import { useEventPredictions } from '../hooks/useEventPredictions.js';

const COLORS = {
  home: { main: '#3b82f6', dim: 'rgba(59,130,246,0.18)', border: '#3b82f6' },
  draw: { main: '#94a3b8', dim: 'rgba(148,163,184,0.15)', border: '#64748b' },
  away: { main: '#ef4444', dim: 'rgba(239,68,68,0.18)', border: '#ef4444' },
};

export default function EventPredictions({ eventId, event }) {
  const homeTeam = event?.homeTeam || event?.teamName || 'Domicile';
  const awayTeam = event?.awayTeam || 'Visiteur';

  const labels = {
    home: homeTeam,
    draw: 'Nul',
    away: awayTeam,
  };

  const { counts, mine, vote, loading, isLocked, total, isLoggedIn } =
    useEventPredictions(eventId, event?.date);

  if (loading) return null;

  const showPct = total > 0;

  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid var(--sl-border)',
      backgroundColor: 'var(--sl-card)',
      padding: '10px 12px 12px',
      marginBottom: 12,
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>⚡</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)' }}>Qui va gagner ?</span>
          {total > 0 && (
            <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>
              · {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total} vote{total > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isLocked ? (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: 'var(--sl-t3)', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)' }}>
            ⏱ Verrouillé
          </span>
        ) : !isLoggedIn ? (
          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>Connecte-toi pour voter</span>
        ) : null}
      </div>

      {/* ── 3 colonnes ── */}
      <div style={{ display: 'flex', gap: 5 }}>
        {(['home', 'draw', 'away']).map(choice => {
          const pct     = showPct ? Math.round((counts[choice] ?? 0) / total * 100) : 0;
          const isVoted = mine === choice;
          const color   = COLORS[choice];
          const isLeading = showPct && pct === Math.max(counts.home, counts.draw, counts.away) / total * 100;

          return (
            <button
              key={choice}
              onClick={() => vote(choice)}
              disabled={isLocked || !isLoggedIn}
              style={{
                flex: 1,
                position: 'relative',
                minHeight: 56,
                borderRadius: 10,
                border: `1.5px solid ${isVoted ? color.border : isLeading && showPct ? `${color.main}55` : 'var(--sl-border-s)'}`,
                backgroundColor: isVoted ? color.dim : 'var(--sl-surface)',
                overflow: 'hidden',
                cursor: isLocked || !isLoggedIn ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '6px 4px',
                transition: 'border-color 0.15s',
                gap: 2,
              }}
            >
              {/* Barre de progression horizontale en fond */}
              {showPct && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    backgroundColor: isVoted ? color.dim : `${color.main}12`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Nom de l'équipe / X */}
              <span style={{
                fontSize: choice === 'draw' ? 15 : 10,
                fontWeight: choice === 'draw' ? 800 : 700,
                color: isVoted ? color.main : isLeading && showPct ? color.main : 'var(--sl-t2)',
                textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                width: '100%', paddingInline: 2,
                position: 'relative', zIndex: 1,
                lineHeight: 1.2,
              }}>
                {choice === 'draw' ? 'X' : labels[choice]}
              </span>

              {/* Pourcentage */}
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: isVoted ? color.main : isLeading && showPct ? color.main : 'var(--sl-t3)',
                position: 'relative', zIndex: 1,
                lineHeight: 1,
              }}>
                {showPct ? `${pct}%` : '—'}
              </span>

              {/* Indicateur "ta voix" */}
              {isVoted && (
                <span style={{ fontSize: 9, color: color.main, position: 'relative', zIndex: 1, fontWeight: 700 }}>
                  ✓ mon vote
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
