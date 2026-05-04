import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import EventCard from './EventCard.jsx';

export default function EventSidebar({ events, selectedEventId, onEventSelect, onGeolocate, geoLoading }) {
  const cardRefs = useRef({});

  useEffect(() => {
    if (selectedEventId !== null && cardRefs.current[selectedEventId]) {
      cardRefs.current[selectedEventId].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedEventId]);

  return (
    <div className="w-96 flex flex-col bg-slate-50 border-l border-gray-200 flex-shrink-0">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-800 text-sm">
            {events.length} événement{events.length !== 1 ? 's' : ''}
          </span>
          <p className="text-xs text-gray-400">Cliquez sur un événement pour le localiser</p>
        </div>
        <button
          onClick={onGeolocate}
          disabled={geoLoading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {geoLoading ? '⏳' : '📍'} Autour de moi
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {events.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-medium text-gray-500">Aucun événement trouvé</p>
            <p className="text-xs mt-1">Essayez d'autres filtres</p>
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
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
