import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { supabase, setDemoMode, isDemoMode } from './lib/supabase.js';
import { AnimatePresence, motion } from 'framer-motion';
const DemoApp = lazy(() => import('./demo/DemoApp.jsx'));
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
const ClubPageView   = lazy(() => import('./components/club/ClubPageView.jsx'));
const UserPublicView = lazy(() => import('./components/UserPublicView.jsx'));
import HomeScreen from './pages/HomeScreen.tsx';
import MapPage from './pages/MapPage.jsx';
const FavorisPage = lazy(() => import('./pages/FavorisPage.jsx'));
const ClubsPage   = lazy(() => import('./pages/ClubsPage.jsx'));
const ProfilPage  = lazy(() => import('./pages/ProfilPage.jsx'));
const AuthPage    = lazy(() => import('./pages/AuthPage.jsx'));
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
const LegalPage           = lazy(() => import('./pages/LegalPage.jsx'));
import OfflineBanner from './components/OfflineBanner.jsx';
import { useErrorBus } from './lib/errorBus.js';
import HelpFab from './components/HelpFab.jsx';
const HelpPage      = lazy(() => import('./pages/HelpPage.jsx'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal.jsx'));
import { useRideNotifications } from './hooks/useRideNotifications.js';
import { useMyAnnouncements } from './hooks/useMyAnnouncements.js';
import { useAttendeeCountActions } from './contexts/AttendeeCountContext.jsx';
import { useMyConvocations } from './hooks/useMyConvocations.js';

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

function UpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('sl-sw-update-ready', handler);
    return () => window.removeEventListener('sl-sw-update-ready', handler);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 10, padding: '9px 14px',
      backgroundColor: '#1a3a2a', borderBottom: '1px solid rgba(34,217,106,0.25)',
      fontSize: 13, color: '#22d96a', flexShrink: 0, zIndex: 200,
    }}>
      <span style={{ fontWeight: 600 }}>Nouvelle version disponible !</span>
      <button
        onClick={() => { if ('serviceWorker' in navigator && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' }); else window.location.reload(); }}
        style={{ padding: '5px 14px', borderRadius: 8, backgroundColor: '#22d96a', color: '#000', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0 }}
      >
        Recharger
      </button>
    </div>
  );
}

function AppInner() {
  const { currentUser, isAdmin, isClubAdmin, loading, followedClubs } = useAuth();
  const [activeTab, _setActiveTab] = useState(() => {
    const stored = sessionStorage.getItem('sl-tab') || 'home';
    // Tabs that don't survive a reload — redirect to 'home'
    if (stored === 'news' || stored === 'mon-club') return 'home';
    return stored;
  });
  const setActiveTab = useCallback((tab) => {
    sessionStorage.setItem('sl-tab', tab);
    _setActiveTab(tab);
  }, []);
  const [activeDepartment] = useState('finistere');
  const [showAuth, setShowAuth] = useState(false);
  const [pendingOnboarding, setPendingOnboarding] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [studioEvent,     setStudioEvent]     = useState(null);
  const [studioClub,      setStudioClub]      = useState(null);
  const [studioQuickMode, setStudioQuickMode] = useState(false);
  const lastDemoCreatedEventRef = useRef(null);

  const { toast } = useToast();
  useErrorBus((msg) => {
    toast({
      message: msg,
      type: 'error',
      onReport: () => {
        setErrorForReport({ type: 'bug', title: msg, category: 'crash' });
        setShowFeedback(true);
      },
    });
  });
  const { events: userEvents, loading: eventsLoading, addEvent, addEventsBatch, updateEvent, deleteEvent, archiveSeason } = useLocalEvents();
  const { unreadCount: rideNotifCount } = useRideNotifications();
  const { unreadCount: announcementsUnreadCount } = useMyAnnouncements();
  const { convocations: myConvocations, pendingCount: convocationsPending, respond: respondToConvocation } = useMyConvocations(currentUser?.id);
  const [showMyRides, setShowMyRides] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback,    setShowFeedback]    = useState(false);
  const [errorForReport,  setErrorForReport]  = useState(null);

  const handleErrorReport = useCallback((prefilled) => {
    setErrorForReport(prefilled);
    setShowFeedback(true);
  }, []);
  const [showTrainings, setShowTrainings] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [legalSection, setLegalSection] = useState(null); // null | 'mentions' | 'privacy' | 'cgu'
  const [, setClubOverlayOpen] = useState(false);
  const [clubOverlayLoading, setClubOverlayLoading] = useState(false);
  const [publicUserId, setPublicUserId] = useState(null);
  const [pendingClubAction, setPendingClubAction] = useState(null);

  const allClubsRef = useRef([]);
  const demoNavRef  = useRef({});  // stable ref for demo nav handler — always current values
  const pendingDemoTabRef = useRef(null);

  const handleOpenPoster = useCallback((eventData, opts = {}) => {
    setShowNewEventForm(false);
    const club = allClubsRef.current.find(c => String(c.id) === String(eventData?.club_id || eventData?.clubId)) ?? null;
    setStudioQuickMode(opts.quickMode ?? false);
    setStudioEvent(eventData);
    setStudioClub(club);
  }, []);

  const addEventWithToast = useCallback(async (data) => {
    try {
      const result = await addEvent(data);
      toast({ message: 'Événement créé !' });
      if (isDemoMode()) {
        lastDemoCreatedEventRef.current = result ?? null;
        window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'event-created' } }));
      }
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
    const clubMatch     = window.location.hash.match(/^#club\/(.+)$/);
    const eventMatch    = window.location.hash.match(/^#event\/(.+)$/);
    const userMatch     = window.location.hash.match(/^#user\/(.+)$/);
    const legalMatch    = window.location.hash.match(/^#legal(?:\/(\w+))?$/);
    const registerMatch = window.location.hash === '#register';
    if (eventMatch) pendingEventDeepLink.current = eventMatch[1];
    if (userMatch) setPublicUserId(userMatch[1]);
    if (legalMatch) {
      setLegalSection(legalMatch[1] || 'mentions');
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (registerMatch) {
      setShowAuth(true);
      window.history.replaceState(null, '', window.location.pathname);
    }

    if (clubMatch) {
      const id = clubMatch[1];
      // Fetch Supabase club directly — don't wait for allClubs
      pendingDeepLink.current = id;
       
      setClubOverlayLoading(true);
      supabase.from('clubs').select('*').eq('id', id).maybeSingle()
        .then(({ data }) => {
          setClubOverlayLoading(false);
          if (!data) {
            toast({ message: 'Club introuvable ou lien invalide', type: 'error' });
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
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

  // Badge API — affiche le nombre de convocations en attente sur l'icône de l'app
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return;
    if (convocationsPending > 0) {
      navigator.setAppBadge(convocationsPending).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [convocationsPending]);

  // ── Demo navigation — écoute uniquement close-overlay (la navigation est 100% manuelle) ──
  // Le DemoApp gère les clics via son propre listener sur document.
  // App.jsx ne fait plus de navigation automatique (tab, form, etc.).
  demoNavRef.current = { handleTabChange, handleOpenPoster, userEvents, handleClubAdminFabAction };

  useEffect(() => {
    if (!isDemoMode()) return;

    function onDemoNav(e) {
      const { action } = e.detail ?? {};
      // Seule action encore auto : fermer les overlays ouverts (formulaire, annonces...)
      if (action === 'close-overlay') {
        setShowNewEventForm(false);
        setShowAnnouncements(false);
        setStudioEvent(null);
        setStudioClub(null);
      }
    }

    function onCreateAccount() { setShowAuth(true); }

    window.addEventListener('sl-demo-navigate',       onDemoNav);
    window.addEventListener('sl-demo-create-account', onCreateAccount);
    return () => {
      window.removeEventListener('sl-demo-navigate',       onDemoNav);
      window.removeEventListener('sl-demo-create-account', onCreateAccount);
    };
  }, []); // stable event listeners via demoNavRef

  // Retry pending demo tab once clubs have loaded
  useEffect(() => {
    if (!isDemoMode() || !pendingDemoTabRef.current || userClubs.length === 0) return;
    const tab = pendingDemoTabRef.current;
    pendingDemoTabRef.current = null;
    handleTabChange(tab);
  }, [userClubs, handleTabChange]);

  const upcomingFavorites = useUpcomingFavorites(allEvents, favorites);

  const navBadges = useMemo(() => {
    const todayCount = upcomingFavorites.today.length;
    const badges = {};
    if (todayCount > 0) badges.favoris = todayCount;
    if (convocationsPending > 0) badges.home = convocationsPending;
    return badges;
  }, [upcomingFavorites.today, convocationsPending]);

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

  // Onboarding déclenché si : (a) juste après signup via AuthPage OU (b) profil chargé ET onboarding jamais terminé
  // Guard !loading : évite le flash pendant la résolution du profil (currentUser existe mais profile=null)
  // Guard localStorage : si updateProfile a échoué en DB, le flag local évite la boucle
  const onboardingLocalDone = currentUser ? !!localStorage.getItem(`sl_onboarded_${currentUser.id}`) : false;
  const shouldShowOnboarding = !!currentUser && !loading && (pendingOnboarding || (currentUser.onboardingDone === false && !onboardingLocalDone)) && !showAuth;

  function handleTabChange(tab) {
    if (tab === 'profil' && !currentUser) {
      setShowAuth(true);
      return;
    }
    if (tab === 'admin' && !isAdmin) return;
    if (tab === 'mon-club') {
      // Trouver le club de l'admin et l'ouvrir directement
      const myClub = userClubs.find(c =>
        c.userId === currentUser?.id ||
        String(c.id) === String(currentUser?.clubId)
      ) ?? userClubs[0] ?? null;
      if (myClub) {
        setSelectedSearchClub(myClub);
        _setActiveTab('mon-club'); // état visuel actif, sans persister en sessionStorage
      } else {
        // Pas encore de club → amener sur l'annuaire pour en créer un
        setActiveTab('clubs');
      }
      return;
    }
    setSelectedSearchClub(null);
    setActiveTab(tab);
  }

  function handleClubAdminFabAction(actionId) {
    const myClub = userClubs.find(c =>
      c.userId === currentUser?.id ||
      String(c.id) === String(currentUser?.clubId)
    ) ?? userClubs[0] ?? null;
    if (myClub) {
      setSelectedSearchClub(myClub);
      _setActiveTab('mon-club');
      setPendingClubAction(actionId);
      return true;
    }
    return false;
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
    }
    setActiveTab('home');
    if (isClubAdmin) {
      toast({ message: 'Bienvenue ! Crée ta première affiche depuis le menu ➕', type: 'info' });
    } else {
      toast({ message: 'Bienvenue sur SportLink ! Explore les clubs et événements autour de toi.', type: 'info' });
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
    <ErrorBoundary name="AppShell" onReport={handleErrorReport}>
    {/* paddingTop: demo banner height so the fixed banner doesn't cover app content */}
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', paddingTop: isDemoMode() ? 'calc(40px + env(safe-area-inset-top, 0px))' : 0 }}>
      <OfflineBanner />
      <UpdateBanner />
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
      <main id="main-content" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
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
              <ErrorBoundary name="Accueil" onReport={handleErrorReport}>
                <HomeScreen
                  followedClubIds={followedClubs}
                  onNavigate={handleTabChange}
                  stats={homeStats}
                  clubs={allClubs}
                  allEvents={allEvents}
                  onOpenTrainings={() => setShowTrainings(true)}
                  externalConvocations={myConvocations}
                  onConvocationRespond={respondToConvocation}
                  onShowLegal={(section) => setLegalSection(section || 'mentions')}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'map' && (
              <ErrorBoundary name="Carte" onReport={handleErrorReport}>
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
              <ErrorBoundary name="Favoris" onReport={handleErrorReport}>
                <FavorisPage allEvents={allEvents} allClubs={allClubs} onNavigate={setActiveTab} />
              </ErrorBoundary>
            )}
{activeTab === 'clubs' && (
              <ErrorBoundary name="Clubs" onReport={handleErrorReport}>
                <ClubsPage allEvents={allEvents} onShowAuth={() => setShowAuth(true)} onAddEvent={addEventWithToast} canAddEvent={isAdmin || isClubAdmin} onClubOverlayChange={setClubOverlayOpen} onArchiveSeason={archiveSeason} />
              </ErrorBoundary>
            )}
            {activeTab === 'profil' && (
              <ErrorBoundary name="Profil" onReport={handleErrorReport}>
                <ProfilPage
                  userEvents={userEvents}
                  earnedBadges={earnedBadges}
                  onNavigate={handleTabChange}
                  onShowAuth={() => setShowAuth(true)}
                  onMyRides={() => setShowMyRides(true)}
                  rideNotifCount={rideNotifCount}
                  onMyConvocations={currentUser ? () => setActiveTab('home') : undefined}
                  convocationsPendingCount={convocationsPending}
                  onShowLegal={(section) => setLegalSection(section || 'mentions')}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'admin' && isAdmin && <ErrorBoundary name="Admin" onReport={handleErrorReport}><Suspense fallback={<ModalLoader />}><AdminPage /></Suspense></ErrorBoundary>}
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

        {/* UserPublicView — deep link #user/:id */}
        {publicUserId && (
          <AnimatePresence>
            <Suspense fallback={<ModalLoader />}>
              <UserPublicView
                key={publicUserId}
                userId={publicUserId}
                onClose={() => {
                  setPublicUserId(null);
                  window.history.replaceState(null, '', window.location.pathname);
                }}
              />
            </Suspense>
          </AnimatePresence>
        )}

        {/* ClubPageView inside the content area so BottomNav stays visible (same pattern as MyRidesPage) */}
        {selectedSearchClub && (
          <Suspense fallback={<ModalLoader />}>
            <ClubPageView
              key={selectedSearchClub.id}
              club={selectedSearchClub}
              allEvents={allEvents}
              onBack={() => {
                setSelectedSearchClub(null);
                // Si on vient du tab "Mon Club", retourner sur Accueil
                if (activeTab === 'mon-club') setActiveTab('home');
              }}
              onAddEvent={addEvent}
              canAddEvent={isAdmin || isClubAdmin}
              onArchiveSeason={archiveSeason}
              onUpdateClub={async (data) => {
                await updateClub(selectedSearchClub.id, data);
                setSelectedSearchClub(prev => ({ ...prev, ...data }));
              }}
              initialAction={pendingClubAction}
              onInitialActionConsumed={() => setPendingClubAction(null)}
            />
          </Suspense>
        )}
      </main>

      <ErrorBoundary name="BottomNav" onReport={handleErrorReport}>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} badgeCounts={navBadges} onAddEvent={() => setShowNewEventForm(true)} onImportCSV={() => setShowCSVImport(true)} onOpenTrainings={() => setShowTrainings(true)} onClubAdminAction={handleClubAdminFabAction} overlayOpen={showAuth || showNewEventForm || showCSVImport || showAnnouncements || showTrainings || showMyRides || showHelp} />
      </ErrorBoundary>

      <Suspense fallback={<ModalLoader />}>
        <AnimatePresence>
          {showAuth && (
            <AuthPage
              key="auth"
              onClose={handleAuthClose}
              onNeedOnboarding={handleNeedOnboarding}
              onShowLegal={(section) => { setShowAuth(false); setLegalSection(section || 'mentions'); }}
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
              quickMode={studioQuickMode}
              onClose={() => { setStudioEvent(null); setStudioClub(null); setStudioQuickMode(false); }}
            />
          )}
          {legalSection && (
            <LegalPage
              key="legal"
              initialTab={legalSection}
              onClose={() => {
                setLegalSection(null);
                window.history.replaceState(null, '', window.location.pathname);
              }}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* HelpFab — visible hors overlay */}
      <HelpFab onClick={() => setShowHelp(true)} hidden={showAuth || showNewEventForm || showCSVImport || showAnnouncements || showTrainings || showMyRides || showHelp || showFeedback || !!studioEvent || !!legalSection} />

      {/* HelpPage */}
      <AnimatePresence>
        {showHelp && (
          <Suspense fallback={null}>
            <HelpPage onClose={() => setShowHelp(false)} onOpenFeedback={() => { setShowHelp(false); setShowFeedback(true); }} />
          </Suspense>
        )}
      </AnimatePresence>

      {/* FeedbackModal */}
      <AnimatePresence>
        {showFeedback && (
          <Suspense fallback={null}>
            <FeedbackModal
              onClose={() => { setShowFeedback(false); setErrorForReport(null); }}
              prefilled={errorForReport ?? {}}
            />
          </Suspense>
        )}
      </AnimatePresence>
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

  // Demo mode detection — must happen before any Supabase auth call
  const isDemo = window.location.pathname.startsWith('/demo');
  if (isDemo && !isDemoMode()) setDemoMode(true);

  return (
    <AuthProvider>
      <SportsProvider>
        <FavoritesProvider>
          <AttendanceProvider>
            {isDemo
              ? (
                <Suspense fallback={
                  <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(160deg, #0a0f1e 0%, #0f1729 50%, #0d1526 100%)',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      border: '3px solid rgba(99,102,241,0.3)',
                      borderTopColor: '#818cf8',
                      animation: 'sl-spin 0.7s linear infinite',
                    }} />
                    <style>{`@keyframes sl-spin { to { transform: rotate(360deg) } }`}</style>
                  </div>
                }>
                  <DemoApp AppInner={AppInner} />
                </Suspense>
              )
              : <AppInner />
            }
          </AttendanceProvider>
        </FavoritesProvider>
      </SportsProvider>
    </AuthProvider>
  );
}
