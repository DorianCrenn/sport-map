import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CFG = {
  pending:     { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  accepted:    { label: 'Accepté',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  declined:    { label: 'Décliné',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  unavailable: { label: 'Indisponible', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

const RESPONSE_BUTTONS = [
  { status: 'accepted',    emoji: '✅', label: 'Accepter'     },
  { status: 'declined',    emoji: '❌', label: 'Décliner'     },
  { status: 'unavailable', emoji: '🤔', label: 'Indisponible' },
];

function ConvocationCard({ conv, onRespond }) {
  const event = conv.event;
  const player = conv.player;
  const statusCfg = STATUS_CFG[conv.status];

  const dateLabel = event?.date
    ? new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        .format(new Date(event.date))
    : '—';
  const timeLabel = event?.date?.length > 10
    ? new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const matchLabel = event
    ? (event.homeTeam && event.awayTeam
        ? `${event.homeTeam} · ${event.awayTeam}`
        : event.title ?? 'Match')
    : 'Événement';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      style={{
        borderRadius: 14, border: `1.5px solid ${statusCfg.color}40`,
        backgroundColor: 'var(--sl-card)', overflow: 'hidden',
      }}
    >
      {/* Barre colorée en haut */}
      <div style={{ height: 3, backgroundColor: statusCfg.color }} />

      <div style={{ padding: '11px 14px' }}>
        {/* Header : label convocation + statut */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#6366f1',
          }}>
            📋 Convocation{player ? ` — ${player.name}` : ''}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            backgroundColor: statusCfg.bg, color: statusCfg.color,
          }}>
            {statusCfg.label}
          </span>
        </div>

        {/* Titre match */}
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 3px' }}>
          {matchLabel}
        </p>
        <p style={{ fontSize: 11, color: 'var(--sl-t2)', margin: '0 0 10px', display: 'flex', gap: 4 }}>
          <span>{dateLabel}</span>
          {timeLabel && <><span>·</span><span>{timeLabel}</span></>}
          {event?.city && <><span>·</span><span>{event.city}</span></>}
        </p>

        {/* Boutons de réponse si pending */}
        {conv.status === 'pending' && (
          <div style={{ display: 'flex', gap: 5 }}>
            {RESPONSE_BUTTONS.map(btn => (
              <button
                key={btn.status}
                onClick={() => onRespond(conv.id, btn.status)}
                style={{
                  flex: 1, padding: '7px 4px',
                  borderRadius: 9, cursor: 'pointer',
                  border: '1.5px solid var(--sl-border)',
                  backgroundColor: 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 15 }}>{btn.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)' }}>{btn.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Statut si déjà répondu */}
        {conv.status !== 'pending' && conv.responded_by && (
          <p style={{ fontSize: 10, color: 'var(--sl-t3)', margin: 0 }}>
            Répondu {conv.note ? `· "${conv.note}"` : ''}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function ConvocationsList({ convocations, onRespond, showAll = false }) {
  const pending    = convocations.filter(c => c.status === 'pending');
  const responded  = convocations.filter(c => c.status !== 'pending');
  const displayed  = showAll ? convocations : pending;

  if (!displayed.length) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'var(--sl-t3)',
          }}>
            Convocations
          </span>
          {pending.length > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 800,
              color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)',
              padding: '2px 6px', borderRadius: 20,
            }}>
              {pending.length} en attente
            </span>
          )}
        </div>
        {!showAll && responded.length > 0 && (
          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>
            {responded.length} répondu{responded.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence mode="popLayout">
          {displayed.map(conv => (
            <ConvocationCard key={conv.id} conv={conv} onRespond={onRespond} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
