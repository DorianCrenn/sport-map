import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useFavoritesContext } from '../contexts/FavoritesContext.jsx';
import { useFilteredEvents } from '../hooks/useFilteredEvents.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import SportFilterBar from '../components/SportFilterBar.jsx';
import DateFilterBar from '../components/DateFilterBar.jsx';
import MapView from '../components/MapView.jsx';
import EventSidebar from '../components/EventSidebar.jsx';
import MobileEventSheet from '../components/MobileEventSheet.jsx';
import SportIcon from '../components/SportIcon.jsx';
import { useSports } from '../hooks/useSports.js';
import EmptyMapGuide from '../components/EmptyMapGuide.jsx';
import { formatDate, formatTime } from '../lib/dateUtils.js';
import { IconMap } from '../components/icons.js';
import { useDynamicMeta } from '../hooks/useDynamicMeta.js';
import { generateEventUrl } from '../lib/eventShare.js';
import type { SportLinkClub } from '../types/sportlink.js';

const EventFormModal = lazy(() => import('../components/EventFormModal.jsx'));

interface MapPageProps {
  // Tableau hétérogène par conception : événements utilisateur (SportLinkEvent)
  // + matchs de club (ClubMatchEvent, shape différent), consommés en aval par
  // des composants carte au type propre (EventItem). D'où un type large assumé.
  allEvents: any[];
  activeDepartment: any;
  canAddEvent: boolean;
  onAddEvent: (formData: Record<string, any>) => Promise<any>;
  onUpdateEvent: (id: string, formData: Record<string, any>) => Promise<any>;
  onDeleteEvent: (id: string) => void;
  onGoToFavoris: () => void;
  cityFilter: string | null;
  focusEventId: string | null;
  onFocusDone: () => void;
  eventsLoading: boolean;
  initialSportFilter?: string | null;
  onInitialFilterApplied?: () => void;
  allClubs?: SportLinkClub[];
}

export default function MapPage({
  allEvents, activeDepartment, canAddEvent,
  onAddEvent, onUpdateEvent, onDeleteEvent,
  onGoToFavoris, cityFilter,
  focusEventId, onFocusDone,
  eventsLoading,
  initialSportFilter, onInitialFilterApplied,
  allClubs = [],
}: MapPageProps) {
  const { currentUser } = useAuth();
  const { allSports: SPORTS } = useSports();
  const { favorites } = useFavoritesContext();
  const favoritesCount = favorites.size;
  const [sportFilter, setSportFilter] = useState<any>(null);
  const [ahaSport, setAhaSport] = useState<any>(null);

  useEffect(() => {
    if (!initialSportFilter) return;
    setSportFilter(initialSportFilter);
    setAhaSport(initialSportFilter);
    onInitialFilterApplied?.();
  }, [initialSportFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  const [dateRangeFilter, setDateRangeFilter] = useState<any>(null);
  const [selectedEventId, setSelectedEventId] = useState<any>(null);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [modalEvent, setModalEvent] = useState<any>(undefined);
  const [showAllSports, setShowAllSports] = useState(false);
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [flyTarget, setFlyTarget] = useState<any>(null);
  const [geoError, setGeoError] = useState<any>(null);
  const [viewMode, setViewMode] = useState('map');

  useEffect(() => {
    setShowAllSports(false);
    setSportFilter(null);
  }, [currentUser?.id]);

  const { coords: userCoords, loading: geoLoading, error: geoHookError, request: requestGeo } = useGeolocation();

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

  useEffect(() => {
    if (!currentUser?.id) return;
    // Priorité 1 : home_city depuis la DB (profiles.home_city)
    const dbCity = currentUser.homeCity;
    if (dbCity?.lat && dbCity?.lng) {
      setFlyTarget({ coords: { lat: dbCity.lat, lng: dbCity.lng }, zoom: 12 });
      // Synchroniser le cache local
      localStorage.setItem(`sl_city_${currentUser.id}`, JSON.stringify(dbCity));
      return;
    }
    // Priorité 2 : cache localStorage (fallback si DB pas encore chargée)
    const saved = localStorage.getItem(`sl_city_${currentUser.id}`);
    if (!saved) return;
    try {
      const city = JSON.parse(saved);
      if (city?.lat && city?.lng) {
        setFlyTarget({ coords: { lat: city.lat, lng: city.lng }, zoom: 12 });
      }
    } catch { /* JSON malformé — silencieux */ }
  }, [currentUser?.id, currentUser?.homeCity]);

  function handleRecentrer() {
    if (userCoords) {
      setFlyTarget({ coords: userCoords, zoom: 13 });
    } else {
      requestGeo();
    }
  }

  const sportScope = useMemo(() => {
    const favs = currentUser?.favoriteSports || [];
    return (!showAllSports && favs.length > 0) ? favs : [];
  }, [showAllSports, currentUser]);

  const filteredEvents = useFilteredEvents(allEvents, {
    sport: sportFilter,
    dateRange: dateRangeFilter,
    departmentId: activeDepartment,
    sportScope,
    cityFilter,
  });

  const displayEvents = useMemo(() => {
    if (!upcomingOnly) return filteredEvents;
    // Comparer au jour (pas à l'instant) : un événement qui a lieu aujourd'hui
    // doit rester visible toute la journée. `new Date('YYYY-MM-DD') >= now`
    // l'excluait dès midi (date parsée à minuit UTC).
    const todayStr = new Date().toISOString().slice(0, 10);
    return filteredEvents.filter((e: any) => String(e.date ?? '').slice(0, 10) >= todayStr);
  }, [filteredEvents, upcomingOnly]);

  const selectedEvent = useMemo(
    () => allEvents.find((e: any) => e.id === selectedEventId) ?? null,
    [allEvents, selectedEventId]
  );

  const selectedClub = useMemo(
    () => selectedEvent?.clubId ? allClubs.find((c) => c.id === selectedEvent.clubId) ?? null : null,
    [allClubs, selectedEvent]
  );

  useDynamicMeta(selectedEvent ? {
    title:       selectedEvent.title ?? `${selectedEvent.homeTeam ?? selectedEvent.sport} — ${selectedEvent.awayTeam ?? selectedEvent.city}`,
    description: `${selectedEvent.sport} · ${formatDate(selectedEvent.date)}${selectedEvent.city ? ` · ${selectedEvent.city}` : ''}`,
    image:       selectedEvent.poster_url || selectedClub?.logo || undefined,
    url:         generateEventUrl(selectedEvent.id),
  } : {});

  const visibleEvents = useMemo(() => {
    const inBounds = mapBounds
      ? displayEvents.filter((e: any) => mapBounds.contains([e.lat, e.lng]))
      : displayEvents;
    if (selectedEventId && !inBounds.some((e: any) => e.id === selectedEventId)) {
      const sel = allEvents.find((e: any) => e.id === selectedEventId);
      if (sel) return [sel, ...inBounds];
    }
    return inBounds;
  }, [displayEvents, mapBounds, selectedEventId, allEvents]);

  const pendingScores = useMemo(() => {
    if (!canAddEvent) return 0;
    const now = new Date();
    return allEvents.filter((e: any) =>
      (e.eventType === 'championship' || e.eventType === 'cup') &&
      new Date(e.date) < now &&
      e.score == null
    ).length;
  }, [allEvents, canAddEvent]);

  const handleBoundsChange = useCallback((bounds: any) => setMapBounds(bounds), []);
  const handleMarkerClick  = useCallback((id: any) => setSelectedEventId((prev: any) => prev === id ? null : id), []);
  const handleMapClick     = useCallback(() => setSelectedEventId(null), []);

  useEffect(() => {
    if (selectedEventId !== null && !filteredEvents.find((e: any) => e.id === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [filteredEvents, selectedEventId]);

  useEffect(() => {
    if (focusEventId) {
      const evt = allEvents.find((e: any) => e.id === focusEventId);
      setSportFilter(null);
      setDateRangeFilter(null);
      setUpcomingOnly(false);
      setShowAllSports(true);
      if (evt?.lat && evt?.lng) {
        setFlyTarget({ coords: { lat: evt.lat, lng: evt.lng }, zoom: 14 });
      }
      setSelectedEventId(focusEventId);
      onFocusDone?.();
    }
  }, [focusEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async (formData: any) => {
    if (modalEvent?._isNew) {
      const created = await onAddEvent(formData);
      setSportFilter(null);
      setDateRangeFilter(null);
      setUpcomingOnly(false);
      setShowAllSports(true);
      if (created.lat && created.lng) {
        setFlyTarget({ coords: { lat: created.lat, lng: created.lng }, zoom: 14 });
      }
      setSelectedEventId(created.id);
    } else {
      await onUpdateEvent(modalEvent.id, formData);
    }
    setModalEvent(undefined);
  }, [modalEvent, onAddEvent, onUpdateEvent]);

  const handleBulkSave = useCallback(async (events: any[]) => {
    for (const ev of events) await onAddEvent(ev);
    setModalEvent(undefined);
  }, [onAddEvent]);

  const handleDeleteEvent = useCallback((id: any) => {
    onDeleteEvent(id);
    if (selectedEventId === id) setSelectedEventId(null);
  }, [onDeleteEvent, selectedEventId]);

  const handleOpenNewEvent   = useCallback(() => setModalEvent({ _isNew: true }), []);
  const handleEditEvent      = useCallback((event: any) => setModalEvent(event), []);
  const handleDuplicateEvent = useCallback(
    (event: any) => setModalEvent({ ...event, _isNew: true, _isDuplicate: true, id: undefined, date: '', score: null }),
    []
  );

  return (
    <div className="flex flex-col h-full relative">
      <SportFilterBar
        active={sportFilter}
        onChange={setSportFilter}
        showAllSports={showAllSports}
        onShowAllSports={() => { setShowAllSports(true); setSportFilter(null); }}
        onHideSomeSports={() => { setShowAllSports(false); setSportFilter(null); }}
      />
      <DateFilterBar active={dateRangeFilter} onChange={setDateRangeFilter} upcomingOnly={upcomingOnly} onUpcomingOnlyChange={setUpcomingOnly} />

      {/* Aha moment banner — post-onboarding */}
      <AnimatePresence>
        {ahaSport && (() => {
          const sport = SPORTS[ahaSport];
          const todayStr = new Date().toISOString().slice(0, 10);
          const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
          const count = allEvents.filter((e: any) => e.sport === ahaSport && String(e.date ?? '').slice(0, 10) >= todayStr && new Date(e.date) <= weekEnd).length;
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
              <button onClick={() => setGeoError(null)} aria-label="Fermer la bannière de géolocalisation" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', opacity: 0.7, padding: '10px 8px', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0 relative sl-map-container">

        {/* ── Vue carte (défaut) ── */}
        <div className={viewMode === 'map' ? 'contents' : 'hidden'}>
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
          {displayEvents.length === 0 && !eventsLoading && (
            <EmptyMapGuide
              canAddEvent={canAddEvent}
              onAddEvent={handleOpenNewEvent}
              onResetFilters={() => {
                setSportFilter(null);
                setDateRangeFilter(null);
                setUpcomingOnly(true);
                setShowAllSports(true);
              }}
            />
          )}
        </div>

        {/* ── Vue liste (mobile) ── */}
        <AnimatePresence>
          {viewMode === 'list' && (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="md:hidden absolute inset-0 overflow-y-auto"
              style={{
                backgroundColor: 'var(--sl-bg)',
                paddingBottom: `calc(80px + env(safe-area-inset-bottom, 0px))`,
              }}
            >
              {displayEvents.length === 0 && !eventsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '0 24px', textAlign: 'center' }}>
                  <IconMap size={36} color="var(--sl-t3)" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--sl-t2)' }}>Aucun événement avec ces filtres</p>
                </div>
              ) : (
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 4px 0' }}>
                    {displayEvents.length} événement{displayEvents.length > 1 ? 's' : ''}
                  </p>
                  {displayEvents.map((event: any) => {
                    const sportData = SPORTS[event.sport];
                    const isSelected = event.id === selectedEventId;
                    return (
                      <motion.button
                        key={event.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedEventId((prev: any) => prev === event.id ? null : event.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 'var(--sl-radius-2xl)',
                          backgroundColor: isSelected ? `${sportData?.color ?? 'var(--sl-green)'}14` : 'var(--sl-card)',
                          border: `1px solid ${isSelected ? (sportData?.color ?? 'var(--sl-green)') + '40' : 'var(--sl-border)'}`,
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.12s',
                        }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--sl-radius-lg)', flexShrink: 0,
                          backgroundColor: sportData ? `${sportData.color}18` : 'var(--sl-surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <SportIcon sport={event.sport} size={18} color={sportData?.color ?? 'var(--sl-t3)'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {event.title ?? `${event.homeTeam ?? event.sport} — ${event.awayTeam ?? event.city}`}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{formatDate(event.date)}</span>
                            {event.time && <><span style={{ opacity: 0.4 }}>·</span><span>{formatTime(event.time ?? event.date)}</span></>}
                            {event.city && <><span style={{ opacity: 0.4 }}>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{event.city}</span></>}
                          </p>
                        </div>
                        {sportData && (
                          <div style={{ width: 4, height: 28, borderRadius: 'var(--sl-radius-xs)', backgroundColor: sportData.color, flexShrink: 0, opacity: 0.7 }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
            onAddEvent={handleOpenNewEvent}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onDuplicateEvent={handleDuplicateEvent}
            onUpdateEvent={onUpdateEvent}
            clubs={allClubs}
          />
        </div>

        {/* Mobile floating buttons */}
        <div className="md:hidden" style={{ position: 'absolute', bottom: selectedEvent ? 'calc(52dvh + 14px + env(safe-area-inset-bottom, 0px))' : 'calc(16px + env(safe-area-inset-bottom, 0px))', left: 16, right: 16, zIndex: 999, pointerEvents: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', transition: 'bottom 0.3s ease' }}>
          {/* Favoris */}
          <button
            onClick={onGoToFavoris}
            style={{ pointerEvents: 'auto', position: 'relative', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '10px 12px', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer', backgroundColor: 'var(--sl-card)', boxShadow: 'var(--sl-shadow)', color: '#ef4444', border: '1px solid var(--sl-border)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Sauvegardés
            {favoritesCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {favoritesCount > 9 ? '9+' : favoritesCount}
              </span>
            )}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {/* Toggle carte/liste */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewMode(m => m === 'map' ? 'list' : 'map')}
              style={{
                pointerEvents: 'auto',
                width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)',
                backgroundColor: viewMode === 'list' ? 'var(--sl-blue)' : 'var(--sl-card)',
                border: `1px solid ${viewMode === 'list' ? 'var(--sl-blue)' : 'var(--sl-border)'}`,
                boxShadow: 'var(--sl-shadow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: viewMode === 'list' ? '#fff' : 'var(--sl-t2)',
              }}
              aria-label={viewMode === 'map' ? 'Afficher en liste' : 'Afficher sur la carte'}
              title={viewMode === 'map' ? 'Vue liste' : 'Vue carte'}
            >
              {viewMode === 'map' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                  <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                </svg>
              )}
            </motion.button>

            {/* Recentrer */}
            {viewMode === 'map' && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleRecentrer}
                style={{
                  pointerEvents: 'auto',
                  width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)',
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
            )}

            {/* Ajouter */}
            {canAddEvent && (
              <button
                onClick={() => setModalEvent({ _isNew: true })}
                style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, padding: '12px 16px', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer', backgroundColor: 'var(--sl-green)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(34,217,106,0.35)' }}
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
              club={selectedClub}
              onClose={() => setSelectedEventId(null)}
              onEdit={(event: any) => setModalEvent(event)}
              onDelete={handleDeleteEvent}
              onUpdateEvent={onUpdateEvent}
            />
          )}
        </AnimatePresence>
      </div>

      {modalEvent !== undefined && (
        <Suspense fallback={null}>
          <EventFormModal
            event={modalEvent}
            onSave={handleSave as any}
            onBulkSave={handleBulkSave}
            onClose={() => setModalEvent(undefined)}
          />
        </Suspense>
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
