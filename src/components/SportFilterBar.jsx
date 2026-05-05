import { motion } from 'framer-motion';
import { SPORTS } from '../data/events.js';

export default function SportFilterBar({ active, onChange, nearbyActive, onNearbyToggle, geoLoading }) {
  return (
    <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0 overflow-x-auto">
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
        Tous
      </motion.button>

      {Object.values(SPORTS).map((sport) => {
        const isActive = active === sport.id;
        return (
          <motion.button
            key={sport.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(isActive ? null : sport.id)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1 cursor-pointer"
            style={
              isActive
                ? { backgroundColor: sport.color, color: 'white' }
                : { backgroundColor: '#f1f5f9', color: '#64748b' }
            }
          >
            <span>{sport.emoji}</span>
            {sport.label}
          </motion.button>
        );
      })}

      <div className="w-px bg-gray-200 self-stretch flex-shrink-0 mx-1" />

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onNearbyToggle}
        className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
        style={
          nearbyActive
            ? { backgroundColor: '#3b82f6', color: 'white' }
            : { backgroundColor: '#f1f5f9', color: '#64748b' }
        }
      >
        {geoLoading ? '⏳' : '📍'} Autour de moi
      </motion.button>
    </div>
  );
}
