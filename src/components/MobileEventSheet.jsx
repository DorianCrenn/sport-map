import { motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import SportIcon from './SportIcon.jsx';

const EVENT_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',        color: '#f97316' },
  friendly:     { label: 'Amical',       color: '#22C55E' },
};

const CalendarSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PinSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const MedalSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="15" r="5"/>
    <path d="M8.56 2.75l4.13 4.13 4.14-4.14"/>
  </svg>
);

export default function MobileEventSheet({ event, onClose, onEdit, onDelete, isFavorite, onToggleFavorite }) {
  const { allSports: SPORTS } = useSports();
  const group = SPORTS[event.sport];
  const fav = isFavorite?.(event.id) ?? false;
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="absolute bottom-0 left-0 right-0 rounded-t-2xl md:hidden overflow-hidden"
      style={{
        backgroundColor: 'var(--sl-card)',
        maxHeight: '65vh',
        zIndex: 1100,
        boxShadow: 'var(--sl-shadow-xl)',
        border: '1px solid var(--sl-border)',
        borderBottom: 'none',
      }}
    >
      <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--sl-border-s)' }} />
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(65vh - 28px)' }}>
        <div className="px-4 pb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full text-white flex items-center gap-1.5"
              style={{ backgroundColor: group?.color }}>
              <SportIcon sport={event.sport} size={14} color="white" />
              {event.sport}
            </span>
            <div className="flex items-center gap-1">
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(event.id)}
                  className="p-2 rounded-xl transition-colors cursor-pointer"
                  style={fav ? { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)' } : { color: 'var(--sl-t3)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl transition-colors cursor-pointer"
                style={{ color: 'var(--sl-t3)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <h2 className="font-bold text-lg leading-tight mb-3 font-oswald tracking-wide" style={{ color: 'var(--sl-t1)' }}>{event.title}</h2>

          <div className="space-y-1.5 mb-3 font-inter">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--sl-t2)' }}>
              <CalendarSvg />
              <span className="font-oswald">{dateStr} à {timeStr}</span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--sl-t2)' }}>
              <PinSvg />
              <span>{event.venue || event.city}</span>
            </div>
            {(event.eventType || event.level) && (
              <div className="flex items-center gap-2 text-sm">
                <MedalSvg style={{ color: 'var(--sl-t2)' }} />
                {EVENT_TYPE_META[event.eventType] ? (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: EVENT_TYPE_META[event.eventType].color, backgroundColor: `${EVENT_TYPE_META[event.eventType].color}22` }}
                  >
                    {EVENT_TYPE_META[event.eventType].label}
                  </span>
                ) : (
                  <span style={{ color: 'var(--sl-t2)' }}>{event.level}</span>
                )}
                {event.teamName && (
                  <span className="text-xs font-medium" style={{ color: 'var(--sl-t3)' }}>· {event.teamName}</span>
                )}
                {event.category && (
                  <span className="text-xs font-medium" style={{ color: 'var(--sl-t3)' }}>({event.category})</span>
                )}
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm leading-relaxed border-t pt-3 mb-3" style={{ color: 'var(--sl-t2)', borderColor: 'var(--sl-border)' }}>
              {event.description}
            </p>
          )}

          {event.standings && (
            <div className="border-t pt-3 mb-3" style={{ borderColor: 'var(--sl-border)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--sl-t3)' }}>Classement</div>
              <div className="flex items-center gap-2 text-[10px] mb-1 px-1" style={{ color: 'var(--sl-t3)' }}>
                <span className="w-5 flex-shrink-0" />
                <span className="flex-1">Équipe</span>
                <span className="w-6 text-center">J</span>
                <span className="w-5 text-center text-green-600">V</span>
                <span className="w-5 text-center">N</span>
                <span className="w-5 text-center text-red-500">D</span>
                {event.standings.home?.points != null && <span className="w-6 text-center font-bold" style={{ color: 'var(--sl-t2)' }}>Pts</span>}
              </div>
              {[event.standings.home, event.standings.away].map((team) => {
                const p = (team.wins ?? 0) + (team.draws ?? 0) + (team.losses ?? 0);
                return (
                  <div key={team.team} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--sl-border)' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>{team.rank}</span>
                    <span className="flex-1 font-medium text-xs truncate font-oswald tracking-wide" style={{ color: 'var(--sl-t1)' }}>{team.team}</span>
                    <span className="text-xs w-6 text-center" style={{ color: 'var(--sl-t3)' }}>{p || '-'}</span>
                    <span className="text-green-600 text-xs w-5 text-center font-medium">{team.wins ?? '-'}</span>
                    <span className="text-xs w-5 text-center" style={{ color: 'var(--sl-t3)' }}>{team.draws ?? '-'}</span>
                    <span className="text-red-500 text-xs w-5 text-center">{team.losses ?? '-'}</span>
                    {team.points != null && <span className="font-bold text-xs w-6 text-center" style={{ color: 'var(--sl-t1)' }}>{team.points}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {event.source === 'user' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onEdit(event)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ color: 'var(--sl-blue)', backgroundColor: 'var(--sl-blue-dim)' }}
              >
                Modifier
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}
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
