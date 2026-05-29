import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useFavoritesContext } from '../contexts/FavoritesContext.jsx';
import { useAttendanceContext } from '../contexts/AttendanceContext.jsx';
import MatchsTab from './favoris/MatchsTab.jsx';
import ClubsTab from './favoris/ClubsTab.jsx';
import CalendarTab from './favoris/CalendarTab.jsx';

const TABS = [
  { id: 'matchs',     label: 'Matchs', icon: '❤️' },
  { id: 'clubs',      label: 'Clubs',  icon: '🏆' },
  { id: 'calendrier', label: 'Agenda', icon: '📅' },
];

export default function FavorisPage({ allEvents, allClubs = [] }) {
  const { follows, unfollowClub, updateFollow } = useAuth();
  const { favorites, toggleFavorite: onToggleFavorite } = useFavoritesContext();
  const { isAttending, toggle: onToggleAttend } = useAttendanceContext();
  const [activeTab, setActiveTab] = useState('matchs');

  const favoriteEvents = useMemo(
    () => allEvents.filter(e => favorites.has(String(e.id))).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [allEvents, favorites]
  );
  const upcomingFavorites = useMemo(
    () => favoriteEvents.filter(e => new Date(e.date) >= new Date()),
    [favoriteEvents]
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
            Favoris
          </span>
          <span style={{ fontSize: 13, color: 'var(--sl-t3)', fontWeight: 500 }}>
            {favoriteEvents.length > 0 && `${favoriteEvents.length} match${favoriteEvents.length > 1 ? 's' : ''}`}
            {follows.length > 0 && ` · ${follows.length} club${follows.length > 1 ? 's' : ''}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '11px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--sl-t1)' : 'var(--sl-surface)',
                  color: isActive ? 'var(--sl-bg)' : 'var(--sl-t3)',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ marginRight: 4 }}>{tab.icon}</span>{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          {activeTab === 'matchs' && (
            <MatchsTab
              favoriteEvents={favoriteEvents}
              upcomingFavorites={upcomingFavorites}
              onToggleFavorite={onToggleFavorite}
              isAttending={isAttending}
              onToggleAttend={onToggleAttend}
            />
          )}
          {activeTab === 'clubs' && (
            <ClubsTab
              allEvents={allEvents}
              allClubs={allClubs}
              follows={follows}
              onUnfollowClub={unfollowClub}
              onUpdateFollow={updateFollow}
            />
          )}
          {activeTab === 'calendrier' && (
            <CalendarTab allEvents={allEvents} favorites={favorites} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
