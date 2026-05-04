import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPORT_GROUPS } from '../data/events.js';

function StandingsRow({ team, rank, wins, draws, losses, points }) {
  const played = (wins ?? 0) + (draws ?? 0) + (losses ?? 0);
  return (
    <div className="flex items-center gap-2 text-xs py-1">
      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 flex-shrink-0 text-[10px]">
        {rank}
      </span>
      <span className="flex-1 font-medium text-gray-700 truncate">{team}</span>
      <span className="text-gray-400 w-5 text-center">{played || '-'}</span>
      <span className="text-green-600 w-5 text-center font-medium">{wins ?? '-'}</span>
      <span className="text-gray-400 w-5 text-center">{draws ?? '-'}</span>
      <span className="text-red-500 w-5 text-center">{losses ?? '-'}</span>
      {points !== null && points !== undefined && (
        <span className="font-bold text-gray-800 w-6 text-center">{points}</span>
      )}
    </div>
  );
}

const EventCard = forwardRef(function EventCard({ event, isSelected, onSelect, onEdit, onDelete }, ref) {
  const group = SPORT_GROUPS[event.sportGroup];
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isUserEvent = event.source === 'user';
  const hasStandings = !!event.standings;
  const showPoints = event.standings?.home?.points !== null && event.standings?.home?.points !== undefined;

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
      className="rounded-xl p-3 mb-2 cursor-pointer border-2 transition-all bg-white"
      style={{
        borderColor: isSelected ? group?.color : 'transparent',
        boxShadow: isSelected
          ? `0 0 0 1px ${group?.color}30, 0 4px 12px ${group?.color}20`
          : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-1 rounded-full self-stretch flex-shrink-0"
          style={{ backgroundColor: group?.color, minHeight: '40px' }}
        />
        <div className="flex-1 min-w-0">
          {/* Badges + actions */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded text-white flex-shrink-0"
              style={{ backgroundColor: group?.color }}
            >
              {group?.emoji} {event.sport}
            </span>
            <span className="text-xs text-gray-400 flex-shrink-0">{event.level}</span>
            {isUserEvent && (
              <span className="text-[10px] text-blue-400 font-medium flex-shrink-0">✦ Club</span>
            )}
            {/* Boutons edit/delete visibles au hover sur la card */}
            {isUserEvent && (
              <div className="ml-auto flex gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                  className="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Modifier"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
                  className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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

          <div className="font-semibold text-gray-800 text-sm leading-tight">{event.title}</div>

          <div className="text-xs text-gray-500 mt-1">
            📅 {dateStr} · {timeStr}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">📍 {event.venue || event.city}</div>

          {/* Description + classement — visibles quand sélectionné */}
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
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed border-t border-gray-100 pt-2">
                    {event.description}
                  </p>
                )}

                {hasStandings && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Classement
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-0.5 px-0.5">
                      <span className="w-5 flex-shrink-0" />
                      <span className="flex-1">Équipe</span>
                      <span className="w-5 text-center">J</span>
                      <span className="w-5 text-center text-green-600">V</span>
                      <span className="w-5 text-center">N</span>
                      <span className="w-5 text-center text-red-500">D</span>
                      {showPoints && <span className="w-6 text-center font-bold text-gray-600">Pts</span>}
                    </div>
                    <StandingsRow {...event.standings.home} />
                    <StandingsRow {...event.standings.away} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

export default EventCard;
