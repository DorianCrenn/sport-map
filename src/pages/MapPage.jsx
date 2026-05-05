import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFilteredEvents } from '../hooks/useFilteredEvents.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import SportFilterBar from '../components/SportFilterBar.jsx';
import DateFilterBar from '../components/DateFilterBar.jsx';
import MapView from '../components/MapView.jsx';
import EventSidebar from '../components/EventSidebar.jsx';
import EventFormModal from '../components/EventFormModal.jsx';

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

  return (
    <div className="flex flex-col h-full">
      <SportFilterBar active={sportGroupFilter} onChange={setSportGroupFilter} />
      <DateFilterBar active={dateRangeFilter} onChange={setDateRangeFilter} />

      <div className="flex flex-1 min-h-0">
        <MapView
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={setSelectedEventId}
          activeDepartment={activeDepartment}
          userCoords={userCoords}
          onBoundsChange={handleBoundsChange}
          selectedEvent={selectedEvent}
        />
        <EventSidebar
          events={visibleEvents}
          selectedEventId={selectedEventId}
          onEventSelect={(id) => setSelectedEventId((prev) => (prev === id ? null : id))}
          onGeolocate={requestGeo}
          geoLoading={geoLoading}
          onAddEvent={() => setModalEvent(null)}
          onEditEvent={(event) => setModalEvent(event)}
          onDeleteEvent={(id) => {
            onDeleteEvent(id);
            if (selectedEventId === id) setSelectedEventId(null);
          }}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
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
