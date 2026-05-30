import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase.js';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { useToast } from './contexts/ToastContext.jsx';
import { SportsProvider } from './contexts/SportsContext.jsx';
import { useLocalEvents } from './hooks/useLocalEvents.js';
import { useBadges } from './hooks/useBadges.js';
import { FavoritesProvider, useFavoritesContext } from './contexts/FavoritesContext.jsx';
import { AttendanceProvider, useAttendanceContext } from './contexts/AttendanceContext.jsx';
import { useClubMatches } from './hooks/useClubMatches.js';
import { useClubs } from './hooks/useClubs.js';
import { useSports } from './hooks/useSports.js';
import { useUpcomingFavorites } from './hooks/useUpcomingFavorites.js';
import { useCommunes } from './hooks/useCommunes.js';
import Header from './components/Header.jsx';
import ReminderBanner from './components/ReminderBanner.jsx';
import BottomNav from './components/BottomNav.jsx';
import ClubPageView from './components/club/ClubPageView.jsx';
import HomeScreen from './pages/HomeScreen.tsx';
import MapPage from './pages/MapPage.jsx';
import FavorisPage from './pages/FavorisPage.jsx';
import ClubsPage from './pages/ClubsPage.jsx';
import ProfilPage from './pages/ProfilPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
const AdminPage          = lazy(() => import('./pages/AdminPage.jsx'));
const OnboardingPage     = lazy(() => import('./pages/OnboardingPage.jsx'));
const EventFormModal     = lazy(() => import('./components/EventFormModal.jsx'));
const CSVImportModal     = lazy(() => import('./components/CSVImportModal.jsx'));
const BadgeUnlockModal   = lazy(() => import('./components/BadgeUnlockModal.jsx'));
const MyRidesPage           = lazy(() => import('./pages/MyRidesPage.jsx'));
const TrainingManagerPage   = lazy(() => import('./pages/TrainingManagerPage.jsx'));
const AnnouncementsCenter = lazy(() => import('./components/AnnouncementsCenter.jsx'));
const PosterStudio        = lazy(() => import('./components/PosterStudio.jsx'));
import OfflineBanner from './components/OfflineBanner.jsx';
import { useRideNotifications } from './hooks/useRideNotifications.js';
import { useMyAnnouncements } from './hooks/useMyAnnouncements.js';
import { useAttendeeCountActions } from './contexts/AttendeeCountContext.jsx';

function ModalLoader() {
  return (
    <>
      <style>{`@keyframes sl-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--sl-bg)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--sl-border)', borderTopColor: 'var(--sl-green)',
          animation: 'sl-spin 0.7s linear infinite',
        }} />
      </div>
    </>
  );
}

function AppInner() {
  const { currentUser, isAdmin, isClubAdmin, loading, followedClubs } = useAuth();
  const [activeTab, _setActiveTab] = useState(() => {
    const stored = sessionStorage.getItem('sl-tab') || 'home';
    // 'news' was a dead tab — redirect to 'home' which now shows the feed
    return stored === 'news' ? 'home' : stored;
  });
  const setActiveTab = useCallback((tab) => {
    sessionStorage.setItem('sl-tab', tab);
    _setActiveTab(tab);
  }, []);
  const [activeDepartment, setActiveDepartment] = useState('finistere');
  const [showAuth, setShowAuth] = useState(false);
  const [pendingOnboarding, setPendingOnboarding] = useState(false);

  const { toast } = useToast();
  const { events: userEvents, loading: eventsLoading, addEvent, addEventsBatch, updateEvent, deleteEvent, archiveSeason } = useLocalEvents();
  const { unreadCount: rideNotifCount } = useRideNotifications();
  const { unreadCount: announcementsUnreadCount } = useMyAnnouncements();
  const [showMyRides, setShowMyRides] = useState(false);
  const [showTrainings, setShowTrainings] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [clubOverlayOpen, setClubOverlayOpen] = useState(false);
  const [clubOverlayLoading, setClubOverlayLoading] = useState(false);

  const allClubsRef = useRef([]);

  const handleOpenPoster = useCallback((eventData) => {
    setShowNewEventForm(false);
    const club = allClubsRef.current.find(c => String(c.id) === String(eventData?.club_id || eventData?.clubId)) ?? null;
    setStudioEvent(eventData);
    setStudioClub(club);
  }, []);

  const addEventWithToast = useCallback(async (data) => {
    try {
      const result = await addEvent(data);
      toast({ message: 'Événement créé !' });
      return result;
    } catch (err) {
      toast({ message: err.message || 'Erreur lors de la création', type: 'error' });
      throw err;
    }
  }, [addEvent, toast]);

  const bulkAddEvents = useCallback(async (events) => {
    const saved = await addEventsBatch(events);
    toast({ message: `${saved.length} événement${saved.length > 1 ? 's' : ''} importé${saved.length > 1 ? 's' : ''} !` });
    return saved;
  }, [addEventsBatch, toast]);
  const { favorites } = useFavoritesContext();
  const { attending } = useAttendanceContext();
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [studioEvent, setStudioEvent] = useState(null);
  const [studioClub,  setStudioClub]  = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const hasShownBadge = useRef(false);
  const clubMatchEvents = useClubMatches();
  const { userClubs, updateClub } = useClubs();
  const { allSports } = useSports();
  const [cityFilter, setCityFilter] = useState(null);
  const [selectedSearchClub, setSelectedSearchClub] = useState(null);
  const [focusEventId, setFocusEventId] = useState(null);
  const pendingDeepLink = useRef(null);

  const allEvents = useMemo(
    () => [...userEvents, ...clubMatchEvents],
    [userEvents, clubMatchEvents]
  );

  // Push visible event IDs into AttendeeCountContext so it only fetches relevant counts
  const setKnownAttendeeIds = useAttendeeCountActions();
  useEffect(() => {
    if (allEvents.length > 0) {
      setKnownAttendeeIds(allEvents.map(e => String(e.id)));
    }
  }, [allEvents, setKnownAttendeeIds]);

  const allClubs = useMemo(() => userClubs, [userClubs]);
  allClubsRef.current = allClubs;

  const { earned: earnedBadges, newBadges, markSeen } = useBadges({ attending, allEvents });

  // ── Deep linking: #club/:id and #event/:id ───────────────────────────────
  const pendingEventDeepLink = useRef(null);

  useEffect(() => {
    const clubMatch  = window.location.hash.match(/^#club\/(.+)$/);
    const eventMatch = window.location.hash.match(/^#event\/(.+)$/);
    if (eventMatch) pendingEventDeepLink.current = eventMatch[1];

    if (clubMatch) {
      const id = clubMatch[1];
      // Fetch Supabase club directly — don't wait for allClubs
      pendingDeepLink.current = id;
      setClubOverlayLoading(true);
      supabase.from('clubs').select('*').eq('id', id).maybeSingle()
        .then(({ data }) => {
          setClubOverlayLoading(false);
          if (!data) return;
          setSelectedSearchClub({
            id: data.id, name: data.name, sport: data.sport,
            city: data.city ?? '', description: data.description ?? '',
            logoUrl: data.logo_url ?? null, logo: data.logo_url ?? null, website: data.website ?? '',
            phone: data.phone ?? '', email: data.email ?? '',
            userId: data.user_id, isUserCreated: true,
          });
          pendingDeepLink.current = null;
        });
    }
  }, []);

  // Fallback: if the club arrives via the normal useClubs sync (e.g. realtime)
  useEffect(() => {
    if (!pendingDeepLink.current || allClubs.length === 0) return;
    const club = allClubs.find(c => String(c.id) === pendingDeepLink.current);
    if (club) { setSelectedSearchClub(club); pendingDeepLink.current = null; }
  }, [allClubs]);

  useEffect(() => {
    if (!pendingEventDeepLink.current || allEvents.length === 0) return;
    const id = pendingEventDeepLink.current;
    const event = allEvents.find(e => String(e.id) === id);
    if (event) {
      setFocusEventId(event.id);
      setActiveTab('map');
      window.history.replaceState(null, '', window.location.pathname);
      pendingEventDeepLink.current = null;
    } else {
      // Events are loaded but the ID wasn't found — event deleted or invalid link
      toast({ message: 'Événement introuvable ou supprimé', type: 'error' });
      window.history.replaceState(null, '', window.location.pathname);
      pendingEventDeepLink.current = null;
    }
  }, [allEvents]);

  useEffect(() => {
    if (selectedSearchClub) {
      window.history.replaceState(null, '', `#club/${selectedSearchClub.id}`);
      document.title = `${selectedSearchClub.name} — SportLink`;
    } else {
      window.history.replaceState(null, '', window.location.pathname);
      document.title = 'SportLink — Le sport près de toi';
    }
  }, [selectedSearchClub]);

  // Badge modal — reset guard on user change, fire once when new badges are detected
  useEffect(() => { hasShownBadge.current = false; }, [currentUser?.id]);
  useEffect(() => {
    if (newBadges.length > 0 && currentUser && !hasShownBadge.current) {
      hasShownBadge.current = true;
      setShowBadgeModal(true);
    }
  }, [newBadges.length, currentUser?.id]);

  // Fetch all communes for active departments from geo.api.gouv.fr
  const { communes } = useCommunes([activeDepartment]);

  const upcomingFavorites = useUpcomingFavorites(allEvents, favorites);

  const navBadges = useMemo(() => {
    const todayCount = upcomingFavorites.today.length;
    return todayCount > 0 ? { favoris: todayCount } : {};
  }, [upcomingFavorites.today]);

  const homeStats = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
    const thisWeek = allEvents.filter(e => { const d = new Date(e.date); return d >= now && d < weekEnd; }).length;
    return {
      clubs: userClubs.length,
      events: allEvents.length,
      sports: Object.keys(allSports).length,
      thisWeek,
    };
  }, [userClubs, allEvents, allSports]);

  const shouldShowOnboarding = !!currentUser && pendingOnboarding && !currentUser.onboardingDone && !showAuth;

  function handleTabChange(tab) {
    if (tab === 'profil' && !currentUser) {
      setShowAuth(true);
      return;
    }
    if (tab === 'admin' && !isAdmin) return;
    setActiveTab(tab);
  }

  function handleAuthClose() {
    setShowAuth(false);
  }

  function handleNeedOnboarding() {
    setShowAuth(false);
    setPendingOnboarding(true);
  }

  const [onboardingSport, setOnboardingSport] = useState(null);

  function handleOnboardingDone(selectedSports) {
    setPendingOnboarding(false);
    if (selectedSports?.length > 0) {
      setOnboardingSport(selectedSports[0]);
      setActiveTab('map');
    }
  }

  if (loading) return (
    <div style={{
      display: 'flex', height: '100dvh',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--sl-bg)',
    }}>
      <div className="w-11 h-11 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <ErrorBoundary name="AppShell">
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <OfflineBanner />
      {activeTab !== 'home' && (
        <Header
          cities={communes}
          clubs={allClubs}
          allEvents={allEvents}
          cityFilter={cityFilter}
          onCityFilter={(city) => { setCityFilter(city); setActiveTab('map'); }}
          onSelectClub={(club) => setSelectedSearchClub(club)}
          onSelectEvent={(event) => { setFocusEventId(event.id); setActiveTab('map'); }}
          onClearCity={() => setCityFilter(null)}
          onTabChange={handleTabChange}
          onShowAuth={() => setShowAuth(true)}
          onMyRides={() => setShowMyRides(true)}
          rideNotifCount={rideNotifCount}
          onShowAnnouncements={() => setShowAnnouncements(true)}
          announcementsUnreadCount={announcementsUnreadCount}
        />
      )}

      {activeTab === 'home' && (upcomingFavorites.today.length > 0 || upcomingFavorites.tomorrow.length > 0) && (
        <ReminderBanner
          today={upcomingFavorites.today}
          tomorrow={upcomingFavorites.tomorrow}
          onNavigateToFavoris={() => setActiveTab('favoris')}
        />
      )}

      {/* zIndex:1 crée un stacking context explicite au-dessus du BottomNav (z:auto),
          garantissant que les overlays fixed (ClubPageView, PosterStudio…) ne passent
          pas derrière la nav bottom quand ils sont ouverts depuis une page enfant. */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {activeTab === 'home' && (
              <ErrorBoundary name="Accueil">
                <HomeScreen
                  followedClubIds={followedClubs}
                  onNavigate={setActiveTab}
                  stats={homeStats}
                  clubs={allClubs}
                  allEvents={allEvents}
                  onOpenTrainings={() => setShowTrainings(true)}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'map' && (
              <ErrorBoundary name="Carte">
                <MapPage
                  allEvents={allEvents}
                  allClubs={allClubs}
                  activeDepartment={activeDepartment}
                  canAddEvent={isAdmin || isClubAdmin}
                  onAddEvent={addEventWithToast}
                  onUpdateEvent={updateEvent}
                  onDeleteEvent={deleteEvent}
                  onGoToFavoris={() => setActiveTab('favoris')}
                  cityFilter={cityFilter}
                  focusEventId={focusEventId}
                  onFocusDone={() => setFocusEventId(null)}
                  eventsLoading={eventsLoading}
                  initialSportFilter={onboardingSport}
                  onInitialFilterApplied={() => setOnboardingSport(null)}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'favoris' && (
              <ErrorBoundary name="Favoris">
                <FavorisPage allEvents={allEvents} allClubs={allClubs} />
              </ErrorBoundary>
            )}
{activeTab === 'clubs' && (
              <ErrorBoundary name="Clubs">
                <ClubsPage allEvents={allEvents} onShowAuth={() => setShowAuth(true)} onAddEvent={addEventWithToast} canAddEvent={isAdmin || isClubAdmin} onClubOverlayChange={setClubOverlayOpen} onArchiveSeason={archiveSeason} />
              </ErrorBoundary>
            )}
            {activeTab === 'profil' && (
              <ErrorBoundary name="Profil">
                <ProfilPage
                  userEvents={userEvents}
                  earnedBadges={earnedBadges}
                  onNavigate={handleTabChange}
                  onShowAuth={() => setShowAuth(true)}
                  onMyRides={() => setShowMyRides(true)}
                  rideNotifCount={rideNotifCount}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'admin' && isAdmin && <ErrorBoundary name="Admin"><Suspense fallback={<ModalLoader />}><AdminPage /></Suspense></ErrorBoundary>}
          </motion.div>
        </AnimatePresence>

        {/* MyRidesPage lives inside the content area so BottomNav stays visible */}
        {showMyRides && (
          <Suspense fallback={<ModalLoader />}><MyRidesPage onBack={() => setShowMyRides(false)} /></Suspense>
        )}
        {showTrainings && (
          <Suspense fallback={<ModalLoader />}><TrainingManagerPage onBack={() => setShowTrainings(false)} /></Suspense>
        )}
        {/* Spinner pendant le chargement d'un club via deep link #club/:id */}
        {clubOverlayLoading && <ModalLoader />}

        {/* ClubPageView inside the content area so BottomNav stays visible (same pattern as MyRidesPage) */}
        {selectedSearchClub && (
          <ClubPageView
            key={selectedSearchClub.id}
            club={selectedSearchClub}
            allEvents={allEvents}
            onBack={() => setSelectedSearchClub(null)}
            onAddEvent={addEvent}
            canAddEvent={isAdmin || isClubAdmin}
            onArchiveSeason={archiveSeason}
            onUpdateClub={async (data) => {
              await updateClub(selectedSearchClub.id, data);
              setSelectedSearchClub(prev => ({ ...prev, ...data }));
            }}
          />
        )}
      </div>

      <ErrorBoundary name="BottomNav">
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} badgeCounts={navBadges} onAddEvent={() => setShowNewEventForm(true)} onImportCSV={() => setShowCSVImport(true)} onOpenTrainings={() => setShowTrainings(true)} overlayOpen={showAuth || showNewEventForm || showCSVImport || showAnnouncements || showTrainings || showMyRides} />
      </ErrorBoundary>

      <Suspense fallback={<ModalLoader />}>
        <AnimatePresence>
          {showAuth && (
            <AuthPage
              key="auth"
              onClose={handleAuthClose}
              onNeedOnboarding={handleNeedOnboarding}
            />
          )}
          {shouldShowOnboarding && (
            <OnboardingPage
              key="onboarding"
              onDone={handleOnboardingDone}
            />
          )}
          {showNewEventForm && (
            <EventFormModal
              key="fab-event-form"
              event={{ _isNew: true }}
              onSave={async (data) => {
                const created = await addEventWithToast(data);
                setActiveTab('map');
                if (created?.id) setFocusEventId(created.id);
                return created;
              }}
              onBulkSave={async (events) => { await bulkAddEvents(events); setShowNewEventForm(false); setActiveTab('map'); }}
              onClose={() => setShowNewEventForm(false)}
              onOpenPoster={handleOpenPoster}
            />
          )}
          {showCSVImport && (
            <CSVImportModal
              key="csv-import"
              onBulkSave={bulkAddEvents}
              onClose={() => setShowCSVImport(false)}
            />
          )}
          {showBadgeModal && newBadges.length > 0 && (
            <BadgeUnlockModal
              key="badge-modal"
              badges={newBadges}
              onDone={() => { markSeen(); setShowBadgeModal(false); }}
            />
          )}
          {showAnnouncements && (
            <AnnouncementsCenter
              key="announcements"
              onClose={() => setShowAnnouncements(false)}
            />
          )}
          {studioEvent && (
            <PosterStudio
              key="global-poster-studio"
              event={studioEvent}
              club={studioClub}
              quickMode
              onClose={() => { setStudioEvent(null); setStudioClub(null); }}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
    </ErrorBoundary>
  );
}

// Handles the OAuth callback when Google redirects back into a popup window.
// Exchanges the PKCE code and closes the popup; the main window picks up the
// new session via the Supabase storage event listener.
function OAuthPopupCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const p = code
      ? supabase.auth.exchangeCodeForSession(code)
      : Promise.resolve();
    p.finally(() => window.close());
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: '#0a1628', color: 'white', fontSize: 15, fontFamily: 'sans-serif' }}>
      Connexion Google…
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  if (window.opener && (params.has('code') || params.has('error'))) {
    return <OAuthPopupCallback />;
  }
  return (
    <AuthProvider>
      <SportsProvider>
        <FavoritesProvider>
          <AttendanceProvider>
            <AppInner />
          </AttendanceProvider>
        </FavoritesProvider>
      </SportsProvider>
    </AuthProvider>
  );
}
