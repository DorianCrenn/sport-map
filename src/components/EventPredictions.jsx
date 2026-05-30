import { motion, AnimatePresence } from 'framer-motion';
import { useEventPredictions } from '../hooks/useEventPredictions.js';

const LABELS = {
  home: { icon: '🏠', label: 'Domicile' },
  draw: { icon: '⚖️', label: 'Match nul' },
  away: { icon: '✈️', label: 'Visiteur' },
};

export default function EventPredictions({ eventId, event }) {
  const homeTeam = event?.homeTeam || event?.teamName || 'Domicile';
  const awayTeam = event?.awayTeam || 'Visiteur';

  const labels = {
    home: { icon: '🏠', label: homeTeam },
    draw: { icon: '⚖️', label: 'Nul' },
    away: { icon: '✈️', label: awayTeam },
  };

  const { counts, mine, vote, loading, isLocked, total, isLoggedIn } =
    useEventPredictions(eventId, event?.date);

  if (loading) return null;

  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid var(--sl-border)',
      backgroundColor: 'var(--sl-card)',
      padding: '12px 14px',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>Pronostic</span>
          {total > 0 && (
            <span style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 500 }}>
              {total} vote{total > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isLocked && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            color: 'var(--sl-t3)', backgroundColor: 'var(--sl-surface)',
            border: '1px solid var(--sl-border-s)',
          }}>
            ⏱ Verrouillé
          </span>
        )}
      </div>

      {/* Vote buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(['home', 'draw', 'away']).map(choice => {
          const count  = counts[choice] ?? 0;
          const pct    = total > 0 ? Math.round((count / total) * 100) : 0;
          const isVoted = mine === choice;
          const showBar = total > 0 || isVoted;

          return (
            <button
              key={choice}
              onClick={() => vote(choice)}
              disabled={isLocked || !isLoggedIn}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center',
                width: '100%', minHeight: 44,
                padding: '0 12px',
                borderRadius: 10,
                border: `1.5px solid ${isVoted ? 'var(--sl-green)' : 'var(--sl-border-s)'}`,
                backgroundColor: isVoted
                  ? 'var(--sl-green-dim)'
                  : isLocked
                    ? 'var(--sl-surface)'
                    : 'var(--sl-surface)',
                cursor: isLocked || !isLoggedIn ? 'default' : 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              {/* Progress bar background */}
              {showBar && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    backgroundColor: isVoted
                      ? 'rgba(34,197,94,0.15)'
                      : 'rgba(148,163,184,0.1)',
                    borderRadius: 10,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Label */}
              <span style={{ fontSize: 14, marginRight: 8, position: 'relative', zIndex: 1 }}>
                {labels[choice].icon}
              </span>
              <span style={{
                flex: 1, textAlign: 'left', fontSize: 12, fontWeight: isVoted ? 700 : 500,
                color: isVoted ? 'var(--sl-green)' : 'var(--sl-t2)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                position: 'relative', zIndex: 1,
              }}>
                {labels[choice].label}
              </span>

              {/* Percentage */}
              {showBar && (
                <span style={{
                  fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'right',
                  color: isVoted ? 'var(--sl-green)' : 'var(--sl-t3)',
                  position: 'relative', zIndex: 1,
                }}>
                  {pct}%
                </span>
              )}

              {/* "ta voix" indicator */}
              {isVoted && (
                <span style={{ fontSize: 10, color: 'var(--sl-green)', marginLeft: 6, position: 'relative', zIndex: 1 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* CTA non connecté */}
      {!isLoggedIn && !isLocked && (
        <p style={{ fontSize: 11, color: 'var(--sl-t3)', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
          Connecte-toi pour voter
        </p>
      )}

      {/* Message après coup d'envoi */}
      {isLocked && total === 0 && (
        <p style={{ fontSize: 11, color: 'var(--sl-t3)', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
          Aucun pronostic pour ce match
        </p>
      )}
    </div>
  );
}
