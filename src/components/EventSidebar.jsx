import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
}) {
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
    <div
      className="w-96 flex flex-col flex-shrink-0"
      style={{
        backgroundColor: 'var(--sl-sidebar-bg)',
        borderLeft: '1px solid var(--sl-border-s)',
      }}
    >
      {/* Entête sidebar */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{
          backgroundColor: 'var(--sl-card)',
          borderBottom: '1px solid var(--sl-border)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-semibold text-sm" style={{ color: 'var(--sl-t1)' }}>
              {events.length} événement{events.length !== 1 ? 's' : ''}
            </span>
            <p className="text-xs" style={{ color: 'var(--sl-t2)' }}>Cliquez pour localiser</p>
          </div>
          <button
            onClick={onGeolocate}
            disabled={geoLoading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--sl-blue-dim)', color: 'var(--sl-blue)' }}
          >
            {geoLoading ? '⏳' : '📍'} Autour de moi
          </button>
        </div>

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

      {/* Liste événements */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {events.length === 0 ? (
          <div className="text-center mt-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-medium" style={{ color: 'var(--sl-t2)' }}>Aucun événement trouvé</p>
            <p className="text-xs mt-1" style={{ color: 'var(--sl-t3)' }}>Essayez d'autres filtres ou ajoutez le vôtre</p>
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
