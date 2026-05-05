import { motion } from 'framer-motion';
import { SPORTS } from '../data/events.js';
import SportIcon from './SportIcon.jsx';

const LocateSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

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

      <div className="w-px bg-gray-200 self-stretch flex-shrink-0 mx-1" />

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onNearbyToggle}
        className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
        style={
          nearbyActive
            ? { backgroundColor: '#3b82f6', color: 'white' }
            : { backgroundColor: '#f1f5f9', color: '#64748b' }
        }
      >
        {geoLoading ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin" style={{ flexShrink: 0 }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <LocateSvg />
        )}
        Autour de moi
      </motion.button>
    </div>
  );
}
