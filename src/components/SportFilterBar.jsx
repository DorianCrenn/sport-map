import { motion } from 'framer-motion';
import { SPORT_GROUPS } from '../data/events.js';

const SPORTS = [
  { key: 'Football',   emoji: '⚽', group: 'football'  },
  { key: 'Handball',   emoji: '🤾', group: 'team'      },
  { key: 'Basketball', emoji: '🏀', group: 'team'      },
  { key: 'Rugby',      emoji: '🏉', group: 'team'      },
  { key: 'Running',    emoji: '🏃', group: 'endurance' },
  { key: 'Trail',      emoji: '🚵', group: 'endurance' },
  { key: 'Cyclisme',   emoji: '🚴', group: 'endurance' },
];

export default function SportFilterBar({ active, onChange }) {
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

      {SPORTS.map((sport) => {
        const color = SPORT_GROUPS[sport.group]?.color ?? '#64748b';
        const isActive = active === sport.key;
        return (
          <motion.button
            key={sport.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(isActive ? null : sport.key)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1 cursor-pointer"
            style={
              isActive
                ? { backgroundColor: color, color: 'white' }
                : { backgroundColor: '#f1f5f9', color: '#64748b' }
            }
          >
            <span>{sport.emoji}</span>
            {sport.key}
          </motion.button>
        );
      })}
    </div>
  );
}
