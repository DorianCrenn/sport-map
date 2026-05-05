import { motion } from 'framer-motion';
import { SPORT_GROUPS } from '../data/events.js';

export default function MobileEventSheet({ event, onClose, onEdit, onDelete, isFavorite, onToggleFavorite }) {
  const group = SPORT_GROUPS[event.sportGroup];
  const fav = isFavorite?.(event.id) ?? false;
  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const played = (event.standings?.home?.wins ?? 0) + (event.standings?.home?.draws ?? 0) + (event.standings?.home?.losses ?? 0);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl md:hidden overflow-hidden"
      style={{ maxHeight: '65vh', zIndex: 1100, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
        <div className="w-10 h-1 bg-gray-200 rounded-full" />
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(65vh - 28px)' }}>
        <div className="px-4 pb-8">
          {/* Top row: sport badge + fav + close */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: group?.color }}>
              {group?.emoji} {event.sport}
            </span>
            <div className="flex items-center gap-1">
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(event.id)}
                  className="p-2 rounded-xl transition-colors cursor-pointer"
                  style={fav ? { color: '#ef4444', backgroundColor: '#fef2f2' } : { color: '#cbd5e1' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <h2 className="font-bold text-gray-800 text-base leading-tight mb-3">{event.title}</h2>

          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📅</span>
              <span>{dateStr} à {timeStr}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>📍</span>
              <span>{event.venue || event.city}</span>
            </div>
            {event.level && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>🏅</span>
                <span>{event.level}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 mb-3">
              {event.description}
            </p>
          )}

          {event.standings && (
            <div className="border-t border-gray-100 pt-3 mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Classement</div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1 px-1">
                <span className="w-5 flex-shrink-0" />
                <span className="flex-1">Équipe</span>
                <span className="w-6 text-center">J</span>
                <span className="w-5 text-center text-green-600">V</span>
                <span className="w-5 text-center">N</span>
                <span className="w-5 text-center text-red-500">D</span>
                {event.standings.home?.points != null && <span className="w-6 text-center font-bold text-gray-600">Pts</span>}
              </div>
              {[event.standings.home, event.standings.away].map((team) => {
                const p = (team.wins ?? 0) + (team.draws ?? 0) + (team.losses ?? 0);
                return (
                  <div key={team.team} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">{team.rank}</span>
                    <span className="flex-1 font-medium text-gray-700 text-xs truncate">{team.team}</span>
                    <span className="text-gray-400 text-xs w-6 text-center">{p || '-'}</span>
                    <span className="text-green-600 text-xs w-5 text-center font-medium">{team.wins ?? '-'}</span>
                    <span className="text-gray-400 text-xs w-5 text-center">{team.draws ?? '-'}</span>
                    <span className="text-red-500 text-xs w-5 text-center">{team.losses ?? '-'}</span>
                    {team.points != null && <span className="font-bold text-gray-800 text-xs w-6 text-center">{team.points}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {event.source === 'user' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onEdit(event)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 cursor-pointer"
              >
                Modifier
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 cursor-pointer"
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
