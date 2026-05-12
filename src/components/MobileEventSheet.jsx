import { motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import SportIcon from './SportIcon.jsx';

const EVENT_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',        color: '#f97316' },
  friendly:     { label: 'Amical',       color: '#22d96a' },
};

export default function MobileEventSheet({ event, onClose, onEdit, onDelete, isFavorite, onToggleFavorite }) {
  const { allSports: SPORTS } = useSports();
  const group = SPORTS[event.sport];
  const sportColor = group?.color ?? '#22d96a';
  const fav = isFavorite?.(event.id) ?? false;
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const typeMeta = EVENT_TYPE_META[event.eventType];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderRadius: '20px 20px 0 0',
        backgroundColor: 'var(--sl-card)',
        maxHeight: '70vh',
        zIndex: 1100,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        border: '1px solid var(--sl-border)',
        borderBottom: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
        <div style={{ width: 36, height: 3, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
      </div>

      {/* Sport color top bar */}
      <div style={{ height: 3, backgroundColor: sportColor, margin: '0 0 16px' }} />

      <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 48px)' }}>
        <div style={{ padding: '0 16px 32px' }}>

          {/* Top row: sport badge + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
              color: '#fff', backgroundColor: sportColor,
            }}>
              <SportIcon sport={event.sport} size={14} color="white" />
              {event.sport}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(event.id)}
                  style={{
                    padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer',
                    backgroundColor: fav ? 'rgba(239,68,68,0.12)' : 'transparent',
                    color: fav ? '#ef4444' : 'var(--sl-t3)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer',
                  backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Title */}
          <h2 style={{
            fontWeight: 800, fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.02em',
            color: 'var(--sl-t1)', marginBottom: 14, fontFamily: 'Inter, sans-serif',
          }}>
            {event.title}
          </h2>

          {/* Meta info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sl-t2)' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                backgroundColor: 'var(--sl-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--sl-t1)', fontSize: 13 }}>{dateStr}</div>
                <div style={{ fontSize: 12, color: 'var(--sl-t3)' }}>à {timeStr}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--sl-t2)' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                backgroundColor: 'var(--sl-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, color: 'var(--sl-t1)', fontWeight: 500 }}>{event.venue || event.city}</span>
            </div>

            {typeMeta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  color: typeMeta.color, backgroundColor: `${typeMeta.color}20`,
                }}>
                  {typeMeta.label}
                </span>
                {event.teamName && (
                  <span style={{ fontSize: 12, color: 'var(--sl-t2)', fontWeight: 500 }}>{event.teamName}</span>
                )}
                {event.category && (
                  <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>({event.category})</span>
                )}
              </div>
            )}
          </div>

          {event.description && (
            <p style={{
              fontSize: 14, lineHeight: 1.65, color: 'var(--sl-t2)',
              borderTop: '1px solid var(--sl-border)', paddingTop: 14, marginBottom: 14,
            }}>
              {event.description}
            </p>
          )}

          {event.standings && (
            <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, color: 'var(--sl-t3)' }}>
                Classement
              </div>
              {[event.standings.home, event.standings.away].map((team) => {
                const p = (team.wins ?? 0) + (team.draws ?? 0) + (team.losses ?? 0);
                return (
                  <div key={team.team} style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                    padding: '8px 0', borderBottom: '1px solid var(--sl-border)',
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                      backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
                    }}>{team.rank}</span>
                    <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sl-t1)' }}>{team.team}</span>
                    <span style={{ width: 24, textAlign: 'center', color: 'var(--sl-t3)', fontSize: 12 }}>{p || '-'}</span>
                    <span style={{ width: 20, textAlign: 'center', color: '#22d96a', fontWeight: 600, fontSize: 12 }}>{team.wins ?? '-'}</span>
                    <span style={{ width: 20, textAlign: 'center', color: 'var(--sl-t3)', fontSize: 12 }}>{team.draws ?? '-'}</span>
                    <span style={{ width: 20, textAlign: 'center', color: '#ef4444', fontSize: 12 }}>{team.losses ?? '-'}</span>
                    {team.points != null && <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: 12, color: 'var(--sl-t1)' }}>{team.points}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {event.source === 'user' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => onEdit(event)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  color: '#3da5ff', backgroundColor: 'rgba(61,165,255,0.12)',
                }}
              >
                Modifier
              </button>
              <button
                onClick={() => onDelete(event.id)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)',
                }}
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
