import { motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import SportIcon from './SportIcon.jsx';

export default function SportFilterBar({ active, onChange, nearbyActive, onNearbyToggle, geoLoading, showAllSports, onShowAllSports }) {
  const { allSports } = useSports();
  const { currentUser } = useAuth();

  const favoriteSports = currentUser?.favoriteSports || [];
  const hasFavorites = favoriteSports.length > 0;
  const inFavoritesMode = hasFavorites && !showAllSports;

  const allVisible = Object.values(allSports).filter(s => !s.isArchived);
  const visibleSports = inFavoritesMode
    ? allVisible.filter(s => favoriteSports.includes(s.id))
    : allVisible;
  const hiddenCount = inFavoritesMode
    ? allVisible.filter(s => !favoriteSports.includes(s.id)).length
    : 0;

  return (
    <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0 overflow-x-auto">
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
  );
}
