import { motion } from 'framer-motion';
import { SPORT_GROUPS } from '../data/events.js';

export default function SportFilterBar({ active, onChange }) {
  return (
    <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-100 flex-shrink-0 overflow-x-auto">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(null)}
        className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0"
        style={
          active === null
            ? { backgroundColor: '#1e293b', color: 'white' }
            : { backgroundColor: '#f1f5f9', color: '#64748b' }
        }
      >
        Tous
      </motion.button>

      {Object.values(SPORT_GROUPS).map((group) => (
        <motion.button
          key={group.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(active === group.id ? null : group.id)}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
          style={
            active === group.id
              ? { backgroundColor: group.color, color: 'white' }
              : { backgroundColor: '#f1f5f9', color: '#64748b' }
          }
        >
          <span>{group.emoji}</span>
          {group.label}
        </motion.button>
      ))}
    </div>
  );
}
