import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { SportsProvider } from './contexts/SportsContext.jsx';
import { EVENTS } from './data/events.js';
import { STATIC_CLUBS } from './data/clubs.js';
import { useLocalEvents } from './hooks/useLocalEvents.js';
import { useFavorites } from './hooks/useFavorites.js';
import { useClubMatches } from './hooks/useClubMatches.js';
import { useClubs } from './hooks/useClubs.js';
import { useSports } from './hooks/useSports.js';
import { useUpcomingFavorites } from './hooks/useUpcomingFavorites.js';
import Header from './components/Header.jsx';
import ReminderBanner from './components/ReminderBanner.jsx';
import BottomNav from './components/BottomNav.jsx';
import HomePage from './pages/HomePage.jsx';
import MapPage from './pages/MapPage.jsx';
import FavorisPage from './pages/FavorisPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import ClubsPage from './pages/ClubsPage.jsx';
import ProfilPage from './pages/ProfilPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';

function AppInner() {
  const { currentUser, isAdmin, isClubAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeDepartment, setActiveDepartment] = useState('finistere');
  const [showAuth, setShowAuth] = useState(false);

  const { events: userEvents, addEvent, updateEvent, deleteEvent } = useLocalEvents();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const clubMatchEvents = useClubMatches();
  const { userClubs } = useClubs();
  const { allSports } = useSports();

  const allEvents = useMemo(
    () => [...EVENTS, ...userEvents, ...clubMatchEvents],
    [userEvents, clubMatchEvents]
  );

  const upcomingFavorites = useUpcomingFavorites(allEvents, favorites);

  const homeStats = useMemo(() => ({
    clubs: userClubs.length + STATIC_CLUBS.length,
    events: allEvents.length,
    sports: Object.keys(allSports).length,
  }), [userClubs, allEvents, allSports]);

  const shouldShowOnboarding = !!currentUser && !currentUser.onboardingDone && !showAuth;

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
  }

  function handleOnboardingDone() {
    // onboardingDone is set inside OnboardingPage via updateProfile
    // shouldShowOnboarding will become false automatically
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {activeTab !== 'home' && <Header />}

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
                favoritesCount={favorites.size}
                onGoToFavoris={() => setActiveTab('favoris')}
              />
            )}
            {activeTab === 'favoris' && (
              <FavorisPage allEvents={allEvents} favorites={favorites} onToggleFavorite={toggleFavorite} />
            )}
            {activeTab === 'news' && <NewsPage />}
            {activeTab === 'clubs' && <ClubsPage allEvents={allEvents} onShowAuth={() => setShowAuth(true)} />}
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

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

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
