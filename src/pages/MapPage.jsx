import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useFilteredEvents } from '../hooks/useFilteredEvents.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import SportFilterBar from '../components/SportFilterBar.jsx';
import DateFilterBar from '../components/DateFilterBar.jsx';
import MapView from '../components/MapView.jsx';
import EventSidebar from '../components/EventSidebar.jsx';
import EventFormModal from '../components/EventFormModal.jsx';
import MobileEventSheet from '../components/MobileEventSheet.jsx';

export default function MapPage({ allEvents, activeDepartment, canAddEvent, onAddEvent, onUpdateEvent, onDeleteEvent, isFavorite, onToggleFavorite, favoritesCount, onGoToFavoris }) {
  const { currentUser } = useAuth();
  const [sportFilter, setSportFilter] = useState(null);
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [nearbyFilter, setNearbyFilter] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [modalEvent, setModalEvent] = useState(undefined);
  const [showAllSports, setShowAllSports] = useState(false);

  // Reset to favorites-only mode on login/logout
  useEffect(() => {
    setShowAllSports(false);
    setSportFilter(null);
  }, [currentUser?.id]);

  const { coords: userCoords, loading: geoLoading, request: requestGeo } = useGeolocation();

  function handleNearbyToggle() {
    if (!nearbyFilter) {
      requestGeo();
      setNearbyFilter(true);
    } else {
      setNearbyFilter(false);
    }
  }

  const nearbyCoords = nearbyFilter && userCoords ? userCoords : null;

  // Scope: restrict events to favorite sports unless user expanded or has no favorites
  const sportScope = useMemo(() => {
    const favs = currentUser?.favoriteSports || [];
    return (!showAllSports && favs.length > 0) ? favs : [];
  }, [showAllSports, currentUser]);

  const filteredEvents = useFilteredEvents(allEvents, {
    sport: sportFilter,
    dateRange: dateRangeFilter,
    departmentId: activeDepartment,
    nearbyCoords,
    sportScope,
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

  function handleShowAllSports() {
    setShowAllSports(true);
    setSportFilter(null);
  }

  return (
    <div className="flex flex-col h-full">
      <SportFilterBar
        active={sportFilter}
        onChange={setSportFilter}
        nearbyActive={nearbyFilter}
        onNearbyToggle={handleNearbyToggle}
        geoLoading={geoLoading}
        showAllSports={showAllSports}
        onShowAllSports={handleShowAllSports}
      />
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
          isFavorite={isFavorite}
        />

        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:contents">
          <EventSidebar
            events={visibleEvents}
            selectedEventId={selectedEventId}
            onEventSelect={(id) => setSelectedEventId((prev) => (prev === id ? null : id))}
            onGeolocate={requestGeo}
            geoLoading={geoLoading}
            canAddEvent={canAddEvent}
            onAddEvent={() => setModalEvent(null)}
            onEditEvent={(event) => setModalEvent(event)}
            onDeleteEvent={handleDeleteEvent}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        </div>

        {/* Mobile: floating action buttons */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none" style={{ zIndex: 999 }}>
          {/* Favoris FAB — bottom left */}
          <button
            onClick={onGoToFavoris}
            className="pointer-events-auto relative flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white cursor-pointer"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.15)', color: '#ef4444' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Favoris
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: '#ef4444' }}>
                {favoritesCount > 9 ? '9+' : favoritesCount}
              </span>
            )}
          </button>

          {/* Ajouter FAB — clubs et admins uniquement */}
          {canAddEvent && (
            <button
              onClick={() => setModalEvent(null)}
              className="pointer-events-auto flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl text-white cursor-pointer"
              style={{ backgroundColor: '#1e293b', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
            >
              <span>＋</span> Ajouter
            </button>
          )}
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
