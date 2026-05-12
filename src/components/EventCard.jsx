import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useShare } from '../hooks/useShare.js';
import SportIcon from './SportIcon.jsx';

const EVENT_TYPE_META = {
  championship: { label: 'Championnat', color: '#3b82f6' },
  cup:          { label: 'Coupe',        color: '#f97316' },
  friendly:     { label: 'Amical',       color: '#22C55E' },
};

function EventTypeBadge({ event }) {
  const meta = EVENT_TYPE_META[event.eventType];
  if (!meta) {
    return event.level
      ? <span className="text-xs flex-shrink-0 font-inter" style={{ color: 'var(--sl-t3)' }}>{event.level}</span>
      : null;
  }
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
      style={{ color: meta.color, backgroundColor: `${meta.color}22` }}
    >
      {meta.label}
    </span>
  );
}

const CalendarSvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PinSvg = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

function StandingsRow({ team, rank, wins, draws, losses, points }) {
  const played = (wins ?? 0) + (draws ?? 0) + (losses ?? 0);
  return (
    <div className="flex items-center gap-2 text-xs py-1">
      <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px]"
        style={{ backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)' }}>
        {rank}
      </span>
      <span className="flex-1 font-medium truncate font-oswald tracking-wide" style={{ color: 'var(--sl-t1)' }}>{team}</span>
      <span className="w-5 text-center" style={{ color: 'var(--sl-t3)' }}>{played || '-'}</span>
      <span className="text-green-600 w-5 text-center font-medium">{wins ?? '-'}</span>
      <span className="w-5 text-center" style={{ color: 'var(--sl-t3)' }}>{draws ?? '-'}</span>
      <span className="text-red-500 w-5 text-center">{losses ?? '-'}</span>
      {points !== null && points !== undefined && (
        <span className="font-bold w-6 text-center" style={{ color: 'var(--sl-t1)' }}>{points}</span>
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
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer"
      style={copied
        ? { color: '#22C55E', borderColor: '#22C55E', backgroundColor: 'var(--sl-green-dim)' }
        : { color: 'var(--sl-t2)', borderColor: 'var(--sl-border-s)', backgroundColor: 'transparent' }}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      whileHover={{ scale: isSelected ? 1 : 1.01 }}
      onClick={onSelect}
      className="rounded-xl p-3 mb-2 cursor-pointer border-2 transition-all"
      style={{
        backgroundColor: 'var(--sl-card)',
        borderColor: isSelected ? group?.color : 'transparent',
        boxShadow: isSelected
          ? `0 0 0 1px ${group?.color}30, 0 4px 12px ${group?.color}20`
          : 'var(--sl-shadow)',
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-1 rounded-full self-stretch flex-shrink-0"
          style={{ backgroundColor: group?.color, minHeight: '40px' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0 font-inter flex items-center gap-1"
              style={{ backgroundColor: group?.color }}
            >
              <SportIcon sport={event.sport} size={11} color="white" />
              {event.sport}
            </span>
            <EventTypeBadge event={event} />
            {isUserEvent && (
              <span className="text-[10px] text-blue-400 font-medium flex-shrink-0">✦ Club</span>
            )}
            {isUserEvent && (
              <div className="ml-auto flex gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                  className="p-1 rounded-md text-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                  style={{ hover: { backgroundColor: 'var(--sl-blue-dim)' } }}
                  title="Modifier"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
                  className="p-1 rounded-md text-red-400 hover:text-red-600 transition-colors cursor-pointer"
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

          <div className="font-semibold text-sm leading-tight font-oswald tracking-wide" style={{ color: 'var(--sl-t1)' }}>{event.title}</div>

          <div className="flex items-center gap-1 text-xs mt-1 font-oswald" style={{ color: 'var(--sl-t2)' }}>
            <CalendarSvg />
            <span>{dateStr} · {timeStr}</span>
          </div>
          <div className="flex items-center gap-1 text-xs mt-0.5 font-inter" style={{ color: 'var(--sl-t2)' }}>
            <PinSvg />
            <span className="truncate">{event.venue || event.city}</span>
          </div>

          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {event.description && (
                  <p className="text-xs mt-2 leading-relaxed border-t pt-2" style={{ color: 'var(--sl-t2)', borderColor: 'var(--sl-border)' }}>
                    {event.description}
                  </p>
                )}

                <div className="mt-2 pt-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--sl-border)' }}>
                  <ShareBtn event={event} />
                </div>

                {hasStandings && (
                  <div className="mt-2 pt-2 border-t overflow-x-auto" style={{ borderColor: 'var(--sl-border)' }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--sl-t3)' }}>
                      Classement
                    </div>
                    <div className="flex items-center gap-2 text-[10px] mb-0.5 px-0.5" style={{ color: 'var(--sl-t3)' }}>
                      <span className="w-5 flex-shrink-0" />
                      <span className="flex-1">Équipe</span>
                      <span className="w-5 text-center">J</span>
                      <span className="w-5 text-center text-green-600">V</span>
                      <span className="w-5 text-center">N</span>
                      <span className="w-5 text-center text-red-500">D</span>
                      {showPoints && <span className="w-6 text-center font-bold" style={{ color: 'var(--sl-t2)' }}>Pts</span>}
                    </div>
                    <StandingsRow {...event.standings.home} />
                    <StandingsRow {...event.standings.away} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(event.id); }}
            className="p-1.5 rounded-xl transition-colors cursor-pointer flex-shrink-0 self-start mt-0.5"
            style={fav ? { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)' } : { color: 'var(--sl-t3)' }}
            title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
});

export default EventCard;
