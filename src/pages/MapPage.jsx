import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFilteredEvents } from '../hooks/useFilteredEvents.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import SportFilterBar from '../components/SportFilterBar.jsx';
import DateFilterBar from '../components/DateFilterBar.jsx';
import MapView from '../components/MapView.jsx';
import EventSidebar from '../components/EventSidebar.jsx';
import EventFormModal from '../components/EventFormModal.jsx';
import MobileEventSheet from '../components/MobileEventSheet.jsx';

export default function MapPage({ allEvents, activeDepartment, onAddEvent, onUpdateEvent, onDeleteEvent, isFavorite, onToggleFavorite }) {
  const [sportGroupFilter, setSportGroupFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [modalEvent, setModalEvent] = useState(undefined);

  const { coords: userCoords, loading: geoLoading, request: requestGeo } = useGeolocation();

  const filteredEvents = useFilteredEvents(allEvents, {
    sportGroup: sportGroupFilter,
    dateRange: dateRangeFilter,
    departmentId: activeDepartment,
  });

  const selectedEvent = useMemo(
    () => allEvents.find((e) => e.id === selectedEventId) ?? null,
    [allEvents, selectedEventId]
  );

  const visibleEvents = useMemo(() => {
    if (!mapBounds) return filteredEvents;
    return filteredEvents.filter((e) => mapBounds.contains([e.lat, e.lng]));
  }, [filteredEvents, mapBounds]);

  const handleBoundsChange = useCallback((bounds) => setMapBounds(bounds), []);

  useEffect(() => {
    if (selectedEventId !== null && !filteredEvents.find((e) => e.id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  function handleSave(formData) {
    if (modalEvent === null) {
      const created = onAddEvent(formData);
      setSelectedEventId(created.id);
    } else {
      onUpdateEvent(modalEvent.id, formData);
    }
    setModalEvent(undefined);
  }

  function handleDeleteEvent(id) {
    onDeleteEvent(id);
    if (selectedEventId === id) setSelectedEventId(null);
  }

  return (
    <div className="flex flex-col h-full">
      <SportFilterBar active={sportGroupFilter} onChange={setSportGroupFilter} />
      <DateFilterBar active={dateRangeFilter} onChange={setDateRangeFilter} />

      <div className="flex flex-1 min-h-0 relative">
        {/* Map — full width on mobile, flex-1 on desktop */}
        <MapView
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={(id) => setSelectedEventId((prev) => (prev === id ? null : id))}
          onMapClick={() => setSelectedEventId(null)}
          activeDepartment={activeDepartment}
          userCoords={userCoords}
          onBoundsChange={handleBoundsChange}
          selectedEvent={selectedEvent}
        />

        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:contents">
          <EventSidebar
            events={visibleEvents}
            selectedEventId={selectedEventId}
            onEventSelect={(id) => setSelectedEventId((prev) => (prev === id ? null : id))}
            onGeolocate={requestGeo}
            geoLoading={geoLoading}
            onAddEvent={() => setModalEvent(null)}
            onEditEvent={(event) => setModalEvent(event)}
            onDeleteEvent={handleDeleteEvent}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        </div>

        {/* Mobile: floating action buttons (always visible, covered by sheet when open) */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none" style={{ zIndex: 999 }}>
          <button
            onClick={requestGeo}
            disabled={geoLoading}
            className="pointer-events-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white text-blue-600 disabled:opacity-50 cursor-pointer"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
          >
            {geoLoading ? '⏳' : '📍'} Autour de moi
          </button>
          <button
            onClick={() => setModalEvent(null)}
            className="pointer-events-auto flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl text-white cursor-pointer"
            style={{ backgroundColor: '#1e293b', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
          >
            <span>＋</span> Ajouter
          </button>
        </div>

        {/* Mobile bottom sheet — slides up on pin click */}
        <AnimatePresence>
          {selectedEvent && (
            <MobileEventSheet
              key={selectedEvent.id}
              event={selectedEvent}
              onClose={() => setSelectedEventId(null)}
              onEdit={(event) => setModalEvent(event)}
              onDelete={handleDeleteEvent}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
            />
          )}
        </AnimatePresence>
      </div>

      {modalEvent !== undefined && (
        <EventFormModal
          event={modalEvent}
          onSave={handleSave}
          onClose={() => setModalEvent(undefined)}
        />
      )}
    </div>
  );
}
