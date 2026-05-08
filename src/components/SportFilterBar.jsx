import { motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import SportIcon from './SportIcon.jsx';

export default function SportFilterBar({ active, onChange, nearbyActive, onNearbyToggle, geoLoading, showAllSports, onShowAllSports, onHideSomeSports }) {
  const { allSports } = useSports();
  const { currentUser } = useAuth();

  const favoriteSports = currentUser?.favoriteSports || [];
  const hasFavorites = favoriteSports.length > 0;
  const inFavoritesMode = hasFavorites && !showAllSports;
  const inExpandedMode = hasFavorites && showAllSports;

  const allVisible = Object.values(allSports).filter(s => !s.isArchived);
  const visibleSports = inFavoritesMode
    ? allVisible.filter(s => favoriteSports.includes(s.id))
    : allVisible;
  const hiddenCount = inFavoritesMode
    ? allVisible.filter(s => !favoriteSports.includes(s.id)).length
    : 0;

  return (
    <div className="relative flex-shrink-0 bg-white border-b border-gray-100">
      <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, white 20%, transparent)' }} />
    <div className="flex gap-2 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

      {/* "← Mes sports" collapse button — only when expanded with favorites */}
      {inExpandedMode && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { onHideSomeSports(); onChange(null); }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 flex items-center gap-1 cursor-pointer"
          style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1.5px solid #86efac' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Mes sports
        </motion.button>
      )}

      {/* "Mes sports" or "Tous" */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(null)}
        className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
        style={
          active === null
            ? { backgroundColor: '#1e293b', color: 'white' }
            : { backgroundColor: '#f1f5f9', color: '#64748b' }
        }
      >
        {inFavoritesMode ? 'Mes sports' : 'Tous'}
      </motion.button>

      {visibleSports.map((sport) => {
        const isActive = active === sport.id;
        return (
          <motion.button
            key={sport.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(isActive ? null : sport.id)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
            style={
              isActive
                ? { backgroundColor: sport.color, color: 'white' }
                : { backgroundColor: '#f1f5f9', color: '#64748b' }
            }
          >
            <SportIcon sport={sport.id} size={14} color={isActive ? 'white' : sport.color} />
            {sport.label}
          </motion.button>
        );
      })}

      {/* "+ N sports" expand button */}
      {inFavoritesMode && hiddenCount > 0 && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onShowAllSports}
          className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1 cursor-pointer"
          style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1.5px dashed #86efac' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {hiddenCount} sport{hiddenCount > 1 ? 's' : ''}
        </motion.button>
      )}
    </div>
    </div>
  );
}
