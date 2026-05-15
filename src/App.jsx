import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { SportsProvider } from './contexts/SportsContext.jsx';
import { EVENTS } from './data/events.js';
import { STATIC_CLUBS } from './data/clubs.js';
import { useLocalEvents } from './hooks/useLocalEvents.js';
import { useFavorites } from './hooks/useFavorites.js';
import { useAttendees } from './hooks/useAttendees.js';
import { useClubMatches } from './hooks/useClubMatches.js';
import { useClubs } from './hooks/useClubs.js';
import { useSports } from './hooks/useSports.js';
import { useUpcomingFavorites } from './hooks/useUpcomingFavorites.js';
import { useCommunes } from './hooks/useCommunes.js';
import Header from './components/Header.jsx';
import ReminderBanner from './components/ReminderBanner.jsx';
import BottomNav from './components/BottomNav.jsx';
import ClubPageView from './components/club/ClubPageView.jsx';
import HomePage from './pages/HomePage.jsx';
import MapPage from './pages/MapPage.jsx';
import FavorisPage from './pages/FavorisPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import ClubsPage from './pages/ClubsPage.jsx';
import ProfilPage from './pages/ProfilPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import EventFormModal from './components/EventFormModal.jsx';
import CSVImportModal from './components/CSVImportModal.jsx';

function AppInner() {
  const { currentUser, isAdmin, isClubAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeDepartment, setActiveDepartment] = useState('finistere');
  const [showAuth, setShowAuth] = useState(false);
  const [pendingOnboarding, setPendingOnboarding] = useState(false);

  const { events: userEvents, loading: eventsLoading, addEvent, updateEvent, deleteEvent } = useLocalEvents();

  async function bulkAddEvents(events) {
    for (const ev of events) await addEvent(ev);
  }
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { toggle: toggleAttend, isAttending } = useAttendees();
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const clubMatchEvents = useClubMatches();
  const { userClubs } = useClubs();
  const { allSports } = useSports();
  const [cityFilter, setCityFilter] = useState(null);
  const [selectedSearchClub, setSelectedSearchClub] = useState(null);
  const [focusEventId, setFocusEventId] = useState(null);

  const allEvents = useMemo(
    () => [...EVENTS, ...userEvents, ...clubMatchEvents],
    [userEvents, clubMatchEvents]
  );

  const allClubs = useMemo(() => [...userClubs, ...STATIC_CLUBS], [userClubs]);

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
      clubs: userClubs.length + STATIC_CLUBS.length,
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

  function handleOnboardingDone() {
    setPendingOnboarding(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
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
        />
      )}

      {activeTab === 'home' && (upcomingFavorites.today.length > 0 || upcomingFavorites.tomorrow.length > 0) && (
        <ReminderBanner
          today={upcomingFavorites.today}
          tomorrow={upcomingFavorites.tomorrow}
          onNavigateToFavoris={() => setActiveTab('favoris')}
        />
      )}

      <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
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
              <HomePage onNavigate={setActiveTab} stats={homeStats} />
            )}
            {activeTab === 'map' && (
              <MapPage
                allEvents={allEvents}
                activeDepartment={activeDepartment}
                canAddEvent={isAdmin || isClubAdmin}
                onAddEvent={addEvent}
                onUpdateEvent={updateEvent}
                onDeleteEvent={deleteEvent}
                isFavorite={isFavorite}
                onToggleFavorite={toggleFavorite}
                isAttending={isAttending}
                onToggleAttend={toggleAttend}
                favoritesCount={favorites.size}
                onGoToFavoris={() => setActiveTab('favoris')}
                cityFilter={cityFilter}
                focusEventId={focusEventId}
                onFocusDone={() => setFocusEventId(null)}
                eventsLoading={eventsLoading}
              />
            )}
            {activeTab === 'favoris' && (
              <FavorisPage allEvents={allEvents} favorites={favorites} onToggleFavorite={toggleFavorite} allClubs={allClubs} />
            )}
            {activeTab === 'news' && <NewsPage />}
            {activeTab === 'clubs' && <ClubsPage allEvents={allEvents} onShowAuth={() => setShowAuth(true)} onAddEvent={addEvent} canAddEvent={isAdmin || isClubAdmin} />}
            {activeTab === 'profil' && (
              <ProfilPage
                favorites={favorites}
                userEvents={userEvents}
                onNavigate={handleTabChange}
                onShowAuth={() => setShowAuth(true)}
              />
            )}
            {activeTab === 'admin' && isAdmin && <AdminPage />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} badgeCounts={navBadges} onAddEvent={() => setShowNewEventForm(true)} onImportCSV={() => setShowCSVImport(true)} />

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
            onSave={(data) => { addEvent(data); setShowNewEventForm(false); setActiveTab('map'); }}
            onBulkSave={async (events) => { await bulkAddEvents(events); setShowNewEventForm(false); setActiveTab('map'); }}
            onClose={() => setShowNewEventForm(false)}
          />
        )}
        {showCSVImport && (
          <CSVImportModal
            key="csv-import"
            onSave={addEvent}
            onClose={() => setShowCSVImport(false)}
          />
        )}
        {selectedSearchClub && (
          <ClubPageView
            key={selectedSearchClub.id}
            club={selectedSearchClub}
            allEvents={allEvents}
            onBack={() => setSelectedSearchClub(null)}
            onAddEvent={addEvent}
            canAddEvent={isAdmin || isClubAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SportsProvider>
        <AppInner />
      </SportsProvider>
    </AuthProvider>
  );
}
