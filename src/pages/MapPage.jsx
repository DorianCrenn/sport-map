import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useFavoritesContext } from '../contexts/FavoritesContext.jsx';
import { useFilteredEvents } from '../hooks/useFilteredEvents.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import SportFilterBar from '../components/SportFilterBar.jsx';
import DateFilterBar from '../components/DateFilterBar.jsx';
import MapView from '../components/MapView.jsx';
import EventSidebar from '../components/EventSidebar.jsx';
import EventFormModal from '../components/EventFormModal.jsx';
import MobileEventSheet from '../components/MobileEventSheet.jsx';
import SportIcon from '../components/SportIcon.jsx';
import { useSports } from '../hooks/useSports.js';

export default function MapPage({
  allEvents, activeDepartment, canAddEvent,
  onAddEvent, onUpdateEvent, onDeleteEvent,
  onGoToFavoris, cityFilter,
  focusEventId, onFocusDone,
  eventsLoading,
  initialSportFilter, onInitialFilterApplied,
}) {
  const { currentUser } = useAuth();
  const { allSports: SPORTS } = useSports();
  const { favorites } = useFavoritesContext();
  const favoritesCount = favorites.size;
  const [sportFilter, setSportFilter] = useState(null);
  const [ahaSport, setAhaSport] = useState(null);

  // Applique le filtre sport venant de l'onboarding + déclenche la carte aha moment
  useEffect(() => {
    if (!initialSportFilter) return;
    setSportFilter(initialSportFilter);
    setAhaSport(initialSportFilter);
    onInitialFilterApplied?.();
  }, [initialSportFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  const [dateRangeFilter, setDateRangeFilter] = useState(null);
  const [nearbyFilter, setNearbyFilter] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [modalEvent, setModalEvent] = useState(undefined);
  const [showAllSports, setShowAllSports] = useState(false);
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [flyTarget, setFlyTarget] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const autoRequested = useRef(false);

  useEffect(() => {
    setShowAllSports(false);
    setSportFilter(null);
  }, [currentUser?.id]);

  const { coords: userCoords, loading: geoLoading, error: geoHookError, request: requestGeo } = useGeolocation();

  // Auto-request geolocation on first mount
  useEffect(() => {
    if (!autoRequested.current) {
      autoRequested.current = true;
      requestGeo();
    }
  }, [requestGeo]);

  // Sync error and auto-center on first geo fix
  const firstFix = useRef(false);
  useEffect(() => {
    if (geoHookError) {
      setGeoError(geoHookError);
    }
    if (userCoords && !firstFix.current) {
      firstFix.current = true;
      setFlyTarget({ coords: userCoords, zoom: 12 });
    }
  }, [userCoords, geoHookError]);

  function handleNearbyToggle() {
    if (!nearbyFilter) {
      requestGeo();
      setNearbyFilter(true);
    } else {
      setNearbyFilter(false);
    }
  }

  function handleRecentrer() {
    if (userCoords) {
      setFlyTarget({ coords: userCoords, zoom: 13 });
    } else {
      requestGeo();
    }
  }

  const nearbyCoords = nearbyFilter && userCoords ? userCoords : null;

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
    cityFilter,
  });

  const displayEvents = useMemo(() => {
    if (!upcomingOnly) return filteredEvents;
    const now = new Date();
    return filteredEvents.filter(e => new Date(e.date) >= now);
  }, [filteredEvents, upcomingOnly]);

  const selectedEvent = useMemo(
    () => allEvents.find((e) => e.id === selectedEventId) ?? null,
    [allEvents, selectedEventId]
  );

  const visibleEvents = useMemo(() => {
    const inBounds = mapBounds
      ? displayEvents.filter((e) => mapBounds.contains([e.lat, e.lng]))
      : displayEvents;
    // Always include the selected event even if the map hasn't finished flying yet
    if (selectedEventId && !inBounds.some(e => e.id === selectedEventId)) {
      const sel = allEvents.find(e => e.id === selectedEventId);
      if (sel) return [sel, ...inBounds];
    }
    return inBounds;
  }, [displayEvents, mapBounds, selectedEventId, allEvents]);

  const pendingScores = useMemo(() => {
    if (!canAddEvent) return 0;
    const now = new Date();
    return allEvents.filter(e =>
      (e.eventType === 'championship' || e.eventType === 'cup') &&
      new Date(e.date) < now &&
      e.score == null
    ).length;
  }, [allEvents, canAddEvent]);

  const handleBoundsChange = useCallback((bounds) => setMapBounds(bounds), []);
  const handleMarkerClick  = useCallback((id) => setSelectedEventId(prev => prev === id ? null : id), []);
  const handleMapClick     = useCallback(() => setSelectedEventId(null), []);

  useEffect(() => {
    if (selectedEventId !== null && !filteredEvents.find((e) => e.id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  useEffect(() => {
    if (focusEventId) {
      const evt = allEvents.find(e => e.id === focusEventId);
      setSportFilter(null);
      setDateRangeFilter(null);
      setNearbyFilter(false);
      setUpcomingOnly(false);
      setShowAllSports(true);
      if (evt?.lat && evt?.lng) {
        setFlyTarget({ coords: { lat: evt.lat, lng: evt.lng }, zoom: 14 });
      }
      setSelectedEventId(focusEventId);
      onFocusDone?.();
    }
  }, [focusEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async (formData) => {
    if (modalEvent?._isNew) {
      const created = await onAddEvent(formData);
      // Clear all filters so the just-created event is always visible
      setSportFilter(null);
      setDateRangeFilter(null);
      setNearbyFilter(false);
      setUpcomingOnly(false); // don't filter by date — event may be today at a past time
      setShowAllSports(true);
      // Fly to the event location then select it
      if (created.lat && created.lng) {
        setFlyTarget({ coords: { lat: created.lat, lng: created.lng }, zoom: 14 });
      }
      setSelectedEventId(created.id);
    } else {
      await onUpdateEvent(modalEvent.id, formData);
    }
    setModalEvent(undefined);
  }, [modalEvent, onAddEvent, onUpdateEvent]);

  const handleBulkSave = useCallback(async (events) => {
    for (const ev of events) await onAddEvent(ev);
    setModalEvent(undefined);
  }, [onAddEvent]);

  const handleDeleteEvent = useCallback((id) => {
    onDeleteEvent(id);
    if (selectedEventId === id) setSelectedEventId(null);
  }, [onDeleteEvent, selectedEventId]);

  return (
    <div className="flex flex-col h-full relative">
      <SportFilterBar
        active={sportFilter}
        onChange={setSportFilter}
        nearbyActive={nearbyFilter}
        onNearbyToggle={handleNearbyToggle}
        geoLoading={geoLoading}
        showAllSports={showAllSports}
        onShowAllSports={() => { setShowAllSports(true); setSportFilter(null); }}
        onHideSomeSports={() => { setShowAllSports(false); setSportFilter(null); }}
      />
      <DateFilterBar active={dateRangeFilter} onChange={setDateRangeFilter} upcomingOnly={upcomingOnly} onUpcomingOnlyChange={setUpcomingOnly} />

      {/* Aha moment banner — post-onboarding */}
      <AnimatePresence>
        {ahaSport && (() => {
          const sport = SPORTS[ahaSport];
          const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
          const count = allEvents.filter(e => e.sport === ahaSport && new Date(e.date) >= new Date() && new Date(e.date) <= weekEnd).length;
          return (
            <motion.div
              key="aha-card"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', flexShrink: 0, backgroundColor: sport ? `${sport.color}15` : 'rgba(34,217,106,0.1)', borderBottom: `1px solid ${sport ? `${sport.color}30` : 'rgba(34,217,106,0.25)'}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                {sport && <SportIcon sport={ahaSport} size={16} color={sport.color} />}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: sport?.color ?? 'var(--sl-green)' }}>
                    {count > 0
                      ? `${count} événement${count > 1 ? 's' : ''} ${ahaSport} cette semaine !`
                      : `Aucun événement ${ahaSport} cette semaine — revenez bientôt.`}
                  </span>
                  {count > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>Les événements sont filtrés pour vous</div>
                  )}
                </div>
                <button
                  onClick={() => setAhaSport(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sl-t3)', padding: 4, flexShrink: 0 }}
                  aria-label="Fermer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Geo error banner */}
      <AnimatePresence>
        {geoError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              overflow: 'hidden', flexShrink: 0,
              backgroundColor: 'rgba(245,158,11,0.08)',
              borderBottom: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ flex: 1, fontSize: 12, color: '#f59e0b' }}>Géolocalisation non disponible — activez-la dans les paramètres.</span>
              <button onClick={() => setGeoError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', opacity: 0.7, padding: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0 relative sl-map-container">
        <MapView
          events={displayEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={handleMarkerClick}
          onMapClick={handleMapClick}
          activeDepartment={activeDepartment}
          userCoords={userCoords}
          flyTarget={flyTarget}
          onBoundsChange={handleBoundsChange}
          selectedEvent={selectedEvent}
        />

        {/* Desktop sidebar */}
        <div className="hidden md:contents">
          <EventSidebar
            events={visibleEvents}
            selectedEventId={selectedEventId}
            onEventSelect={handleMarkerClick}
            loading={eventsLoading}
            onGeolocate={handleRecentrer}
            geoLoading={geoLoading}
            canAddEvent={canAddEvent}
            pendingScores={pendingScores}
            onAddEvent={() => setModalEvent({ _isNew: true })}
            onEditEvent={(event) => setModalEvent(event)}
            onDeleteEvent={handleDeleteEvent}
            onDuplicateEvent={(event) => setModalEvent({ ...event, _isNew: true, _isDuplicate: true, id: undefined, date: '', score: null })}
            onUpdateEvent={onUpdateEvent}
          />
        </div>

        {/* Mobile floating buttons */}
        <div className="md:hidden" style={{ position: 'absolute', bottom: selectedEvent ? 'calc(52dvh + 14px + env(safe-area-inset-bottom, 0px))' : 'calc(16px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, zIndex: 999, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', transition: 'bottom 0.3s ease' }}>
          {/* Favoris */}
          <button
            onClick={onGoToFavoris}
            style={{ pointerEvents: 'auto', position: 'relative', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '8px 12px', borderRadius: 12, cursor: 'pointer', backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', color: '#ef4444', border: '1px solid var(--sl-border)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Favoris
            {favoritesCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {favoritesCount > 9 ? '9+' : favoritesCount}
              </span>
            )}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {/* Recentrer */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRecentrer}
              style={{
                pointerEvents: 'auto',
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
                boxShadow: 'var(--sl-shadow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: userCoords ? 'var(--sl-blue)' : 'var(--sl-t3)',
              }}
              aria-label="Recentrer sur ma position"
              title="Recentrer"
            >
              {geoLoading
                ? <GeoLoader />
                : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>
                  </svg>
                )
              }
            </motion.button>

            {/* Ajouter */}
            {canAddEvent && (
              <button
                onClick={() => setModalEvent({ _isNew: true })}
                style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, padding: '10px 16px', borderRadius: 12, cursor: 'pointer', backgroundColor: 'var(--sl-green)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(34,217,106,0.35)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Ajouter
              </button>
            )}
          </div>
        </div>

        {/* Mobile bottom sheet */}
        <AnimatePresence>
          {selectedEvent && (
            <MobileEventSheet
              key={selectedEvent.id}
              event={selectedEvent}
              onClose={() => setSelectedEventId(null)}
              onEdit={(event) => setModalEvent(event)}
              onDelete={handleDeleteEvent}
              onUpdateEvent={onUpdateEvent}
            />
          )}
        </AnimatePresence>
      </div>

      {modalEvent !== undefined && (
        <EventFormModal
          event={modalEvent}
          onSave={handleSave}
          onBulkSave={handleBulkSave}
          onClose={() => setModalEvent(undefined)}
        />
      )}
    </div>
  );
}

function GeoLoader() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      style={{ width: 18, height: 18 }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-blue)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </motion.div>
  );
}
