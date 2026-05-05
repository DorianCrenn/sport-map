import { useState, useMemo } from 'react';
import { EVENTS } from './data/events.js';
import { useLocalEvents } from './hooks/useLocalEvents.js';
import { useFavorites } from './hooks/useFavorites.js';
import Header from './components/Header.jsx';
import BottomNav from './components/BottomNav.jsx';
import MapPage from './pages/MapPage.jsx';
import FavorisPage from './pages/FavorisPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import ClubsPage from './pages/ClubsPage.jsx';
import ProfilPage from './pages/ProfilPage.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [activeDepartment, setActiveDepartment] = useState('finistere');

  const { events: userEvents, addEvent, updateEvent, deleteEvent } = useLocalEvents();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const allEvents = useMemo(() => [...EVENTS, ...userEvents], [userEvents]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {activeTab === 'map' && <Header />}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
        {activeTab === 'clubs' && <ClubsPage />}
        {activeTab === 'profil' && <ProfilPage favorites={favorites} userEvents={userEvents} />}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
