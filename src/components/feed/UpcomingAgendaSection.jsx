import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMyTeamAgenda } from '../../hooks/useMyTeamAgenda.js';
import MatchLineupSheet from './MatchLineupSheet.jsx';

const STATUS_CONFIG = {
  present: { label: 'Présent',   emoji: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  absent:  { label: 'Absent',    emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  unsure:  { label: 'Peut-être', emoji: '🤔', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
};

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
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(session.date + 'T12:00:00'));

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

function MatchItem({ item, onRespond, currentUser, isCoach }) {
  const { data: event, myStatus, clubId } = item;
  const [showLineup, setShowLineup] = useState(false);

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(event.date + 'T12:00:00'));

  const timeLabel = event.date?.length > 10
    ? new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <>
      <div style={{
        borderRadius: 14, border: '1px solid var(--sl-border)',
        backgroundColor: 'var(--sl-card)', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ height: 3, background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} />
        <div style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#6366f1',
            }}>
              ⚽ Match
            </span>
            <button
              onClick={() => setShowLineup(true)}
              style={{
                fontSize: 10, fontWeight: 700, color: '#6366f1',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 7, padding: '3px 9px', cursor: 'pointer',
              }}
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
          <PresenceButtons myStatus={myStatus} onRespond={(s) => onRespond('match', event.id, s)} />
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

export default function UpcomingAgendaSection({ currentUser }) {
  const { items, loading, respond } = useMyTeamAgenda(currentUser?.id);
  const isCoach = ['club_admin', 'admin', 'superadmin'].includes(currentUser?.role);

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
            <MatchItem key={`m-${item.id}`} item={item} onRespond={respond} currentUser={currentUser} isCoach={isCoach} />
          )
        ))}
      </div>
    </div>
  );
}
