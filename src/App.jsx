import { useState, useEffect, useMemo } from 'react';
import { EVENTS } from './data/events.js';
import { useFilteredEvents } from './hooks/useFilteredEvents.js';
import { useGeolocation } from './hooks/useGeolocation.js';
import { useLocalEvents } from './hooks/useLocalEvents.js';
import Header from './components/Header.jsx';
import SportFilterBar from './components/SportFilterBar.jsx';
import DateFilterBar from './components/DateFilterBar.jsx';
import MapView from './components/MapView.jsx';
import EventSidebar from './components/EventSidebar.jsx';
import EventFormModal from './components/EventFormModal.jsx';

export default function App() {
  const [activeDepartment, setActiveDepartment] = useState('finistere');
  const [sportGroupFilter, setSportGroupFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [modalEvent, setModalEvent] = useState(undefined); // undefined = fermé, null = ajout, event = édition

  const { coords: userCoords, loading: geoLoading, request: requestGeo } = useGeolocation();
  const { events: userEvents, addEvent, updateEvent, deleteEvent } = useLocalEvents();

  const allEvents = useMemo(() => [...EVENTS, ...userEvents], [userEvents]);

  const filteredEvents = useFilteredEvents(allEvents, {
    sportGroup: sportGroupFilter,
    dateRange: dateRangeFilter,
    departmentId: activeDepartment,
  });

  useEffect(() => {
    if (selectedEventId !== null && !filteredEvents.find((e) => e.id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  function handleSave(formData) {
    if (modalEvent === null) {
      const created = addEvent(formData);
      setSelectedEventId(created.id);
    } else {
      updateEvent(modalEvent.id, formData);
    }
    setModalEvent(undefined);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <Header activeDepartment={activeDepartment} onDepartmentChange={setActiveDepartment} />
      <SportFilterBar active={sportGroupFilter} onChange={setSportGroupFilter} />
      <DateFilterBar active={dateRangeFilter} onChange={setDateRangeFilter} />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <MapView
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={setSelectedEventId}
          activeDepartment={activeDepartment}
          userCoords={userCoords}
        />
        <EventSidebar
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onEventSelect={(id) => setSelectedEventId((prev) => (prev === id ? null : id))}
          onGeolocate={requestGeo}
          geoLoading={geoLoading}
          onAddEvent={() => setModalEvent(null)}
          onEditEvent={(event) => setModalEvent(event)}
          onDeleteEvent={(id) => {
            deleteEvent(id);
            if (selectedEventId === id) setSelectedEventId(null);
          }}
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
