import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import EventCard from './EventCard.jsx';

export default function EventSidebar({
  events,
  selectedEventId,
  onEventSelect,
  onGeolocate,
  geoLoading,
  canAddEvent,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  isFavorite,
  onToggleFavorite,
  clubs = [],
  onSelectClub,
}) {
  const { allSports } = useSports();
  const cardRefs = useRef({});
  const [clubSearch, setClubSearch] = useState('');

  useEffect(() => {
    if (selectedEventId !== null && cardRefs.current[selectedEventId]) {
      cardRefs.current[selectedEventId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedEventId]);

  const clubResults = clubSearch.trim().length >= 2
    ? clubs.filter(c =>
        c.name.toLowerCase().includes(clubSearch.toLowerCase()) ||
        c.city.toLowerCase().includes(clubSearch.toLowerCase()) ||
        c.sport.toLowerCase().includes(clubSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <div className="w-96 flex flex-col bg-slate-50 border-l border-gray-200 flex-shrink-0">
      {/* Entête sidebar */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-semibold text-gray-800 text-sm">
              {events.length} événement{events.length !== 1 ? 's' : ''}
            </span>
            <p className="text-xs text-gray-500">Cliquez pour localiser</p>
          </div>
          <button
            onClick={onGeolocate}
            disabled={geoLoading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {geoLoading ? '⏳' : '📍'} Autour de moi
          </button>
        </div>

        {/* Recherche clubs */}
        <div className="relative mb-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un club…"
            value={clubSearch}
            onChange={e => setClubSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 bg-gray-50"
          />
          {clubSearch && (
            <button onClick={() => setClubSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Bouton Ajouter — clubs et admins uniquement */}
        {canAddEvent && (
          <button
            onClick={onAddEvent}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
            style={{ backgroundColor: '#1e293b' }}
          >
            <span className="text-base">＋</span>
            Ajouter un événement
          </button>
        )}
      </div>

      {/* Résultats clubs */}
      <AnimatePresence>
        {clubSearch.trim().length >= 2 && (
          <motion.div
            key="club-results"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
            className="border-b border-gray-200 bg-white overflow-hidden"
          >
            {clubResults.length > 0 ? (
              <div className="px-3 pt-2 pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  {clubResults.length} club{clubResults.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-0.5">
                  {clubResults.map(club => {
                    const sport = allSports[club.sport];
                    return (
                      <button
                        key={club.id}
                        onClick={() => { onSelectClub?.(club); setClubSearch(''); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0 font-oswald"
                          style={{ backgroundColor: sport?.color ?? '#64748b' }}>
                          {club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-800 truncate">{club.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400">{club.city}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-[10px] font-medium" style={{ color: sport?.color ?? '#64748b' }}>{club.sport}</span>
                          </div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5">
                <p className="text-xs text-gray-400">Aucun club pour « {clubSearch} »</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste événements */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {events.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-medium text-gray-500">Aucun événement trouvé</p>
            <p className="text-xs mt-1">Essayez d'autres filtres ou ajoutez le vôtre</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {events.map((event) => (
              <EventCard
                key={event.id}
                ref={(el) => { cardRefs.current[event.id] = el; }}
                event={event}
                isSelected={event.id === selectedEventId}
                onSelect={() => onEventSelect(event.id)}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
