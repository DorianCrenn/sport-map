import { useState, useEffect } from 'react';
import { EVENTS } from './data/events.js';
import { useFilteredEvents } from './hooks/useFilteredEvents.js';
import { useGeolocation } from './hooks/useGeolocation.js';
import Header from './components/Header.jsx';
import SportFilterBar from './components/SportFilterBar.jsx';
import DateFilterBar from './components/DateFilterBar.jsx';
import MapView from './components/MapView.jsx';
import EventSidebar from './components/EventSidebar.jsx';

export default function App() {
  const [activeDepartment, setActiveDepartment] = useState('finistere');
  const [sportGroupFilter, setSportGroupFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const { coords: userCoords, loading: geoLoading, request: requestGeo } = useGeolocation();

  const filteredEvents = useFilteredEvents(EVENTS, {
    sportGroup: sportGroupFilter,
    dateRange: dateRangeFilter,
    departmentId: activeDepartment,
  });

  // Clear selection if the selected event is no longer in filtered results
  useEffect(() => {
    if (selectedEventId !== null && !filteredEvents.find(e => e.id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  function handleMarkerClick(id) {
    setSelectedEventId(id);
  }

  function handleEventSelect(id) {
    setSelectedEventId(prev => prev === id ? null : id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <Header
        activeDepartment={activeDepartment}
        onDepartmentChange={setActiveDepartment}
      />
      <SportFilterBar active={sportGroupFilter} onChange={setSportGroupFilter} />
      <DateFilterBar active={dateRangeFilter} onChange={setDateRangeFilter} />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <MapView
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={handleMarkerClick}
          activeDepartment={activeDepartment}
          userCoords={userCoords}
        />
        <EventSidebar
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onEventSelect={handleEventSelect}
          onGeolocate={requestGeo}
          geoLoading={geoLoading}
        />
      </div>
    </div>
  );
}
