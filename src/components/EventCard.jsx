import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useShare } from '../hooks/useShare.js';
import SportIcon from './SportIcon.jsx';

const EVENT_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',        color: '#f97316' },
  friendly:     { label: 'Amical',       color: '#22d96a' },
};

function EventTypeBadge({ event }) {
  const meta = EVENT_TYPE_META[event.eventType];
  if (!meta) {
    return event.level
      ? <span style={{ fontSize: 10, color: 'var(--sl-t3)', flexShrink: 0 }}>{event.level}</span>
      : null;
  }
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
        color: meta.color, backgroundColor: `${meta.color}20`, flexShrink: 0,
      }}
    >
      {meta.label}
    </span>
  );
}

function StandingsRow({ team, rank, wins, draws, losses, points }) {
  const played = (wins ?? 0) + (draws ?? 0) + (losses ?? 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0' }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 10,
        backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
      }}>
        {rank}
      </span>
      <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sl-t1)' }}>
        {team}
      </span>
      <span style={{ width: 20, textAlign: 'center', color: 'var(--sl-t3)' }}>{played || '-'}</span>
      <span style={{ width: 20, textAlign: 'center', color: '#22d96a', fontWeight: 600 }}>{wins ?? '-'}</span>
      <span style={{ width: 20, textAlign: 'center', color: 'var(--sl-t3)' }}>{draws ?? '-'}</span>
      <span style={{ width: 20, textAlign: 'center', color: '#ef4444' }}>{losses ?? '-'}</span>
      {points !== null && points !== undefined && (
        <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--sl-t1)' }}>{points}</span>
      )}
    </div>
  );
}

function ShareBtn({ event }) {
  const { share } = useShare();
  const [copied, setCopied] = useState(false);

  async function handleShare(e) {
    e.stopPropagation();
    const result = await share({
      title: event.title,
      text: `${event.title} — ${new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      url: window.location.href,
    });
    if (result.success && result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      title={copied ? 'Lien copié !' : 'Partager'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
        padding: '5px 10px', borderRadius: 10, cursor: 'pointer',
        color: copied ? 'var(--sl-green)' : 'var(--sl-t2)',
        border: `1px solid ${copied ? 'var(--sl-green)' : 'var(--sl-border-s)'}`,
        backgroundColor: copied ? 'var(--sl-green-dim)' : 'transparent',
      }}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      )}
      {copied ? 'Copié !' : 'Partager'}
    </button>
  );
}

const EventCard = forwardRef(function EventCard({ event, isSelected, onSelect, onEdit, onDelete, isFavorite, onToggleFavorite }, ref) {
  const { allSports: SPORTS } = useSports();
  const group = SPORTS[event.sport];
  const sportColor = group?.color ?? '#22d96a';
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isUserEvent = event.source === 'user';
  const hasStandings = !!event.standings;
  const showPoints = event.standings?.home?.points !== null && event.standings?.home?.points !== undefined;
  const fav = isFavorite?.(event.id) ?? false;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      onClick={onSelect}
      style={{
        backgroundColor: 'var(--sl-card)',
        borderRadius: 14,
        padding: '12px 12px 12px 0',
        marginBottom: 8,
        cursor: 'pointer',
        border: `1.5px solid ${isSelected ? sportColor : 'var(--sl-border)'}`,
        boxShadow: isSelected ? `0 0 0 1px ${sportColor}25, 0 4px 16px ${sportColor}15` : 'none',
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        overflow: 'hidden',
      }}
    >
      {/* Sport color accent bar */}
      <div style={{
        width: 3, minHeight: 40, flexShrink: 0,
        backgroundColor: sportColor,
        borderRadius: '0 3px 3px 0',
        marginRight: 10,
        alignSelf: 'stretch',
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: sport badge + type badge + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
            color: '#fff', backgroundColor: sportColor, flexShrink: 0,
          }}>
            <SportIcon sport={event.sport} size={10} color="white" />
            {event.sport}
          </span>
          <EventTypeBadge event={event} />
          {isUserEvent && (
            <span style={{ fontSize: 10, color: '#3da5ff', fontWeight: 600, flexShrink: 0 }}>✦ Club</span>
          )}
          {isUserEvent && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, flexShrink: 0 }}>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                style={{
                  padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer',
                  color: '#3da5ff', backgroundColor: 'transparent',
                }}
                title="Modifier"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
                style={{
                  padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer',
                  color: '#ef4444', backgroundColor: 'transparent',
                }}
                title="Supprimer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontWeight: 700, fontSize: 14, lineHeight: 1.3,
          color: 'var(--sl-t1)', marginBottom: 5,
          fontFamily: 'Inter, sans-serif',
        }}>
          {event.title}
        </div>

        {/* Meta: date + venue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--sl-t2)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{dateStr} · {timeStr}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--sl-t2)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.venue || event.city}
            </span>
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {event.description && (
                <p style={{
                  fontSize: 12, marginTop: 10, lineHeight: 1.6,
                  borderTop: '1px solid var(--sl-border)', paddingTop: 10,
                  color: 'var(--sl-t2)',
                }}>
                  {event.description}
                </p>
              )}
              <div style={{
                marginTop: 10, paddingTop: 10,
                borderTop: '1px solid var(--sl-border)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <ShareBtn event={event} />
              </div>
              {hasStandings && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sl-border)', overflowX: 'auto' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, color: 'var(--sl-t3)' }}>
                    Classement
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, marginBottom: 2, color: 'var(--sl-t3)' }}>
                    <span style={{ width: 20, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>Équipe</span>
                    <span style={{ width: 20, textAlign: 'center' }}>J</span>
                    <span style={{ width: 20, textAlign: 'center', color: '#22d96a' }}>V</span>
                    <span style={{ width: 20, textAlign: 'center' }}>N</span>
                    <span style={{ width: 20, textAlign: 'center', color: '#ef4444' }}>D</span>
                    {showPoints && <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--sl-t2)' }}>Pts</span>}
                  </div>
                  <StandingsRow {...event.standings.home} />
                  <StandingsRow {...event.standings.away} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(event.id); }}
          style={{
            padding: '6px 10px 6px 4px', border: 'none', cursor: 'pointer',
            backgroundColor: 'transparent', flexShrink: 0, alignSelf: 'flex-start',
            color: fav ? '#ef4444' : 'var(--sl-t3)',
          }}
          title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      )}
    </motion.div>
  );
});

export default EventCard;
