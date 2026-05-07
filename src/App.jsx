import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { EVENTS } from './data/events.js';
import { useLocalEvents } from './hooks/useLocalEvents.js';
import { useFavorites } from './hooks/useFavorites.js';
import { useClubMatches } from './hooks/useClubMatches.js';
import Header from './components/Header.jsx';
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
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [activeDepartment, setActiveDepartment] = useState('finistere');
  const [showAuth, setShowAuth] = useState(false);

  const { events: userEvents, addEvent, updateEvent, deleteEvent } = useLocalEvents();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const clubMatchEvents = useClubMatches();

  const allEvents = useMemo(
    () => [...EVENTS, ...userEvents, ...clubMatchEvents],
    [userEvents, clubMatchEvents]
  );

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
      {activeTab === 'map' && <Header />}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'home' && (
          <HomePage onNavigate={setActiveTab} />
        )}
        {activeTab === 'map' && (
          <MapPage
            allEvents={allEvents}
            activeDepartment={activeDepartment}
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
        {activeTab === 'clubs' && <ClubsPage allEvents={allEvents} />}
        {activeTab === 'profil' && (
          <ProfilPage
            favorites={favorites}
            userEvents={userEvents}
            onNavigate={handleTabChange}
            onShowAuth={() => setShowAuth(true)}
          />
        )}
        {activeTab === 'admin' && isAdmin && <AdminPage />}
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
      <AppInner />
    </AuthProvider>
  );
}
