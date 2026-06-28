import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useFavoritesContext } from '../contexts/FavoritesContext.jsx';
import { useAttendanceContext } from '../contexts/AttendanceContext.jsx';
import MatchsTab from './favoris/MatchsTab.jsx';
import ClubsTab from './favoris/ClubsTab.jsx';
import CalendarTab from './favoris/CalendarTab.jsx';

interface TabDef {
  id: string;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'matchs',     label: 'Matchs', icon: '❤️' },
  { id: 'clubs',      label: 'Clubs',  icon: '🏆' },
  { id: 'calendrier', label: 'Agenda', icon: '📅' },
];

interface FavorisPageProps {
  allEvents: Record<string, any>[];
  allClubs?: Record<string, any>[];
  onNavigate?: (page: string) => void;
}

export default function FavorisPage({ allEvents, allClubs = [], onNavigate }: FavorisPageProps) {
  const { follows, unfollowClub, updateFollow } = useAuth() as any;
  const { favorites, toggleFavorite: onToggleFavorite } = useFavoritesContext() as any;
  const { isAttending, toggle: onToggleAttend } = useAttendanceContext() as any;
  const [activeTab, setActiveTab] = useState('matchs');

  const favoriteEvents = useMemo(
    () => allEvents.filter(e => favorites.has(String(e.id))).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [allEvents, favorites]
  );
  const upcomingFavorites = useMemo(
    () => favoriteEvents.filter((e: any) => new Date(e.date) >= new Date()),
    [favoriteEvents]
  );

  const isCompletelyEmpty = favoriteEvents.length === 0 && follows.length === 0;

  if (isCompletelyEmpty) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', backgroundColor: 'var(--sl-bg)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔖</div>
        <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 8 }}>Rien de sauvegardé</p>
        <p style={{ fontSize: 14, color: 'var(--sl-t3)', lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
          Suis des clubs pour voir leur calendrier ici. Sur la carte, tape ❤️ sur un événement pour le sauvegarder.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
          <button
            onClick={() => onNavigate?.('clubs')}
            style={{ padding: '13px 20px', borderRadius: 14, border: 'none', backgroundColor: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Découvrir les clubs
          </button>
          <button
            onClick={() => onNavigate?.('map')}
            style={{ padding: '13px 20px', borderRadius: 14, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Voir les événements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--sl-t1)', letterSpacing: '-0.01em', fontFamily: "'Barlow Condensed', sans-serif" }}>
            Favoris
          </span>
          <span style={{ fontSize: 13, color: 'var(--sl-t3)', fontWeight: 500 }}>
            {favoriteEvents.length > 0 && `${favoriteEvents.length} match${favoriteEvents.length > 1 ? 's' : ''}`}
            {follows.length > 0 && ` · ${follows.length} club${follows.length > 1 ? 's' : ''}`}
          </span>
        </div>
        <div role="tablist" aria-label="Sections sauvegardées" style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '11px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--sl-t1)' : 'var(--sl-surface)',
                  color: isActive ? 'var(--sl-bg)' : 'var(--sl-t3)',
                  transition: 'all 0.15s',
                }}
              >
                <span aria-hidden="true" style={{ marginRight: 4 }}>{tab.icon}</span>{tab.label}
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
              onGoToMap={() => onNavigate?.('map')}
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
