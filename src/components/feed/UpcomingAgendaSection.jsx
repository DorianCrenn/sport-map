import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMyTeamAgenda } from '../../hooks/useMyTeamAgenda.js';
import { useRides } from '../../hooks/useRides.js';
import MatchLineupSheet from './MatchLineupSheet.jsx';

const STATUS_CONFIG = {
  present: { label: 'Présent',   emoji: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  absent:  { label: 'Absent',    emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  unsure:  { label: 'Peut-être', emoji: '🤔', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
};

const CONVOC_BUTTONS = [
  { status: 'accepted',    emoji: '✅', label: 'Accepter'     },
  { status: 'declined',    emoji: '❌', label: 'Décliner'     },
  { status: 'unavailable', emoji: '🤔', label: 'Indispo'      },
];

const CONVOC_STATUS_CFG = {
  pending:     { label: 'En attente',    color: '#f59e0b' },
  accepted:    { label: 'Accepté ✓',    color: '#22c55e' },
  declined:    { label: 'Décliné',       color: '#ef4444' },
  unavailable: { label: 'Indisponible',  color: '#64748b' },
};

/** Nudge inline "peux-tu conduire ?" affiché après avoir marqué présent. */
function CarpoolNudge({ eventId }) {
  const { createRide } = useRides(eventId);
  const [answered, setAnswered] = useState(false);
  const [seats, setSeats]       = useState(3);
  const [showSeats, setShowSeats] = useState(false);

  if (answered) return null;

  async function handleYes() {
    await createRide({
      departureLocation: '', availableSeats: seats,
      detourFlexibility: 'none', notes: '', acceptedEquipment: [],
    });
    setAnswered(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{
        marginTop: 8, padding: '10px 12px', borderRadius: 10,
        backgroundColor: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-green)', margin: '0 0 8px' }}>
        🚗 Peux-tu conduire ?
      </p>
      {!showSeats ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setShowSeats(true)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 12, fontWeight: 700 }}
          >
            Oui, je conduis
          </button>
          <button
            onClick={() => setAnswered(true)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: '1px solid var(--sl-border)', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 12, fontWeight: 600 }}
          >
            Non, merci
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--sl-t2)', whiteSpace: 'nowrap' }}>Places :</span>
          <input
            type="number" min={1} max={8} value={seats}
            onChange={e => setSeats(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
            style={{ width: 52, padding: '5px 8px', borderRadius: 8, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, textAlign: 'center' }}
          />
          <button
            onClick={handleYes}
            style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 12, fontWeight: 700 }}
          >
            Confirmer
          </button>
        </div>
      )}
    </motion.div>
  );
}

function PresenceButtons({ myStatus, onRespond, small = false }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
        <button
          key={s}
          onClick={() => onRespond(s)}
          style={{
            flex: 1, padding: small ? '5px 3px' : '7px 4px',
            borderRadius: 9, cursor: 'pointer',
            border: `1.5px solid ${myStatus === s ? cfg.color : 'var(--sl-border)'}`,
            backgroundColor: myStatus === s ? cfg.bg : 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: small ? 14 : 16 }}>{cfg.emoji}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: myStatus === s ? cfg.color : 'var(--sl-t3)' }}>
            {cfg.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function TrainingItem({ item, onRespond }) {
  const { data: session, myStatus, teamName } = item;
  // session.date est toujours une date seule (YYYY-MM-DD), ajout de l'heure pour éviter le fuseau UTC
  const _sessionDateStr = session.date?.length === 10 ? session.date + 'T12:00:00' : (session.date ?? '');
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(_sessionDateStr));

  return (
    <div style={{
      borderRadius: 14, border: '1px solid var(--sl-border)',
      backgroundColor: 'var(--sl-card)', overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: 'linear-gradient(to right, #f97316, #ea580c)' }} />
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: '#f97316',
          }}>
            🏋️ Entraînement
          </span>
          {teamName && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sl-t3)' }}>
              {teamName}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 3px', textTransform: 'capitalize' }}>
          {dateLabel}
        </p>
        <p style={{ fontSize: 11, color: 'var(--sl-t2)', margin: '0 0 10px', display: 'flex', gap: 4 }}>
          {session.time && <span>{session.time}</span>}
          {session.time && session.location && <span>·</span>}
          {session.location && <span>{session.location}</span>}
        </p>
        <PresenceButtons myStatus={myStatus} onRespond={(s) => onRespond('training', session.id, s)} />
      </div>
    </div>
  );
}

function MatchItem({ item, onRespond, currentUser, isCoach, convocation, onConvocationRespond }) {
  const { data: event, myStatus, clubId } = item;
  const [showLineup, setShowLineup]    = useState(false);
  const [showCarpool, setShowCarpool]  = useState(false);

  // Si event.date est déjà un datetime ISO complet, ne pas concaténer 'T12:00:00'
  const _eventDateStr = event.date?.length === 10 ? event.date + 'T12:00:00' : (event.date ?? '');
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(_eventDateStr));

  const timeLabel = event.date?.length > 10
    ? new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const convocStatus = convocation?.status;
  const convocCfg    = convocStatus ? CONVOC_STATUS_CFG[convocStatus] : null;

  function handlePresenceRespond(s) {
    onRespond('match', event.id, s);
    // Afficher le nudge covoiturage après avoir dit "présent"
    if (s === 'present') setShowCarpool(true);
    else setShowCarpool(false);
  }

  return (
    <>
      <div style={{
        borderRadius: 14, border: '1px solid var(--sl-border)',
        backgroundColor: 'var(--sl-card)', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} />
        <div style={{ padding: '10px 14px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1' }}>
                ⚽ Match
              </span>
              {convocCfg && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, backgroundColor: `${convocCfg.color}18`, color: convocCfg.color }}>
                  📋 {convocCfg.label}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowLineup(true)}
              style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 7, padding: '3px 9px', cursor: 'pointer' }}
            >
              Compo ›
            </button>
          </div>

          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 2px' }}>
            {event.homeTeam && event.awayTeam
              ? `${event.homeTeam} · ${event.awayTeam}`
              : event.homeTeam ?? event.awayTeam ?? 'Match'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--sl-t2)', margin: '0 0 10px', display: 'flex', gap: 4 }}>
            <span>{dateLabel}</span>
            {timeLabel && <><span>·</span><span>{timeLabel}</span></>}
            {event.city && <><span>·</span><span>{event.city}</span></>}
          </p>

          {/* Boutons convocation (si convoqué et pending) */}
          {convocation && convocStatus === 'pending' && onConvocationRespond ? (
            <div style={{ display: 'flex', gap: 5 }}>
              {CONVOC_BUTTONS.map(btn => (
                <button
                  key={btn.status}
                  onClick={() => onConvocationRespond(convocation.id, btn.status)}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: 9, cursor: 'pointer',
                    border: '1.5px solid var(--sl-border)', backgroundColor: 'transparent',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{btn.emoji}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)' }}>{btn.label}</span>
                </button>
              ))}
            </div>
          ) : (
            /* Boutons présence standards */
            <PresenceButtons myStatus={myStatus} onRespond={handlePresenceRespond} />
          )}

          {/* Nudge covoiturage (P3a) */}
          {showCarpool && (
            <CarpoolNudge eventId={event.id} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLineup && (
          <MatchLineupSheet
            eventId={event.id}
            clubId={String(clubId)}
            canEdit={isCoach}
            currentUserId={currentUser?.id}
            onClose={() => setShowLineup(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function UpcomingAgendaSection({ currentUser, convocations = [], onConvocationRespond }) {
  const { items, loading, respond } = useMyTeamAgenda(currentUser?.id);
  const isCoach = ['club_admin', 'admin', 'superadmin'].includes(currentUser?.role);

  // Indexer les convocations par event_id pour lookup O(1)
  const convocByEvent = Object.fromEntries(
    convocations.map(c => [String(c.event?.id ?? ''), c])
  );

  if (loading || items.length === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'var(--sl-t3)',
          }}>
            Mon agenda
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800, color: 'var(--sl-green)',
            backgroundColor: 'rgba(34,217,106,0.12)',
            padding: '2px 6px', borderRadius: 20,
          }}>
            {items.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          item.type === 'training' ? (
            <TrainingItem key={`t-${item.id}`} item={item} onRespond={respond} />
          ) : (
            <MatchItem
              key={`m-${item.id}`}
              item={item}
              onRespond={respond}
              currentUser={currentUser}
              isCoach={isCoach}
              convocation={convocByEvent[String(item.data?.id ?? '')] ?? null}
              onConvocationRespond={onConvocationRespond}
            />
          )
        ))}
      </div>
    </div>
  );
}
